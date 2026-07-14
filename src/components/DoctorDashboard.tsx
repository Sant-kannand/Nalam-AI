/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Camera, Users, AlertTriangle, ShieldCheck, Heart, User, Sparkles, Filter, CheckCircle2, TrendingUp, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { translations } from "../data/translations";
import { Language, HealthReport } from "../types";

interface DoctorDashboardProps {
  lang: Language;
  allReports: HealthReport[];
  onSelectReport: (report: HealthReport) => void;
}

export default function DoctorDashboard({ lang, allReports, onSelectReport }: DoctorDashboardProps) {
  const t = translations[lang];

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "High" | "Moderate" | "Low">("all");
  const [qrScanning, setQrScanning] = useState(false);
  const [scanResultMsg, setScanResultMsg] = useState<string | null>(null);

  // Calculate Doctor Statistics
  const totalScreened = allReports.length;
  
  const highRiskPatientsList = allReports.filter((rep) =>
    (rep.risks || []).some((risk) => risk && risk.riskLevel === "High")
  );
  const totalHighRiskCount = highRiskPatientsList.length;

  const averageAge = totalScreened > 0
    ? Math.round(allReports.reduce((sum, r) => sum + r.patientAge, 0) / totalScreened)
    : 48;

  // Filter Reports List based on Search & Risk filter
  const filteredReports = allReports.filter((rep) => {
    const matchesSearch = rep.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || rep.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (riskFilter === "all") return matchesSearch;
    
    const hasMatchingRisk = (rep.risks || []).some((risk) => {
      if (!risk) return false;
      if (riskFilter === "High") return risk.riskLevel === "High";
      if (riskFilter === "Moderate") return risk.riskLevel === "Moderate";
      if (riskFilter === "Low") return risk.riskLevel === "Low";
      return true;
    });

    return matchesSearch && hasMatchingRisk;
  });

  // Calculate epidemiological aggregation data for Recharts
  // 1. Prevalence of NCDs (Average risk percentage for each disease)
  const diseases = ["Diabetes", "Hypertension", "Heart Disease", "Stroke", "Chronic Kidney Disease"];
  const translatedDiseases = lang === "ta" 
    ? ["நீரிழிவு நோய்", "உயர் இரத்த அழுத்தம்", "இதய நோய்", "பக்கவாதம்", "சிறுநீரக நோய்"]
    : ["Diabetes", "Hypertension", "Heart Disease", "Stroke", "Chronic Kidney Disease"];

  const riskPrevalenceData = diseases.map((disease, idx) => {
    const matchingRisks = allReports.map((r) => (r.risks || []).find((risk) => risk && risk.disease === disease)).filter(Boolean);
    const averageRisk = matchingRisks.length > 0
      ? Math.round(matchingRisks.reduce((sum, r: any) => sum + (r?.riskPercentage || 0), 0) / matchingRisks.length)
      : 25; // default mock fallback

    return {
      name: translatedDiseases[idx],
      avgRisk: averageRisk,
    };
  });

  // 2. Risk Level Distribution count
  let highCount = 0;
  let modCount = 0;
  let lowCount = 0;

  allReports.forEach((rep) => {
    if (!rep.risks || rep.risks.length === 0) {
      lowCount++;
      return;
    }
    const maxLevel = rep.risks.reduce((prev, curr) => {
      const getWeight = (l: string) => (l === "High" ? 3 : l === "Moderate" ? 2 : 1);
      return getWeight(curr?.riskLevel || "Low") > getWeight(prev?.riskLevel || "Low") ? curr : prev;
    }, rep.risks[0]);

    if (maxLevel) {
      if (maxLevel.riskLevel === "High") highCount++;
      else if (maxLevel.riskLevel === "Moderate") modCount++;
      else lowCount++;
    }
  });

  // Fallback if 0 reports
  if (totalScreened === 0) {
    highCount = 3;
    modCount = 7;
    lowCount = 12;
  }

  const distributionData = [
    { name: lang === "ta" ? "அதிவேக ஆபத்து" : "High Risk", value: highCount, color: "#f43f5e" },
    { name: lang === "ta" ? "மிதமான ஆபத்து" : "Moderate Risk", value: modCount, color: "#f59e0b" },
    { name: lang === "ta" ? "குறைந்த ஆபத்து" : "Low Risk", value: lowCount, color: "#10b981" },
  ];

  // Simulator: QR Code Scan
  const triggerMockQRScan = () => {
    if (allReports.length === 0) {
      setScanResultMsg(lang === "ta" ? "வடிவமைக்க அறிக்கைகள் ஏதுமில்லை!" : "No clinical reports in database to scan!");
      return;
    }
    
    setQrScanning(true);
    setScanResultMsg(null);

    // Simulate viewfinder scanning delay
    setTimeout(() => {
      setQrScanning(false);
      // Pick a random report
      const randomIndex = Math.floor(Math.random() * allReports.length);
      const selectedReport = allReports[randomIndex];
      
      setScanResultMsg(lang === "ta" ? `வெற்றிகரமாக ஸ்கேன் செய்யப்பட்டது! நோயாளி: ${selectedReport.patientName}` : `QR Decoded Successfully! Patient: ${selectedReport.patientName}`);
      
      // Load report after brief celebration
      setTimeout(() => {
        onSelectReport(selectedReport);
        setScanResultMsg(null);
      }, 1200);
    }, 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header and Portal Branding */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <BarChart2 className="w-5 h-5" />
              <span className="font-mono text-2xs uppercase tracking-widest font-semibold">
                Nalam Clinical Portal
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 font-sans mt-1">
              {t.doctorPortal}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {t.doctorSubtitle}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2 text-2xs font-mono bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Authorized Personnel: Dr. Nalam Specialist</span>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xs text-slate-500 block uppercase font-mono tracking-wider">{t.totalScreenings}</span>
            <span className="text-xl font-bold text-slate-100 font-mono">{totalScreened}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-3xs text-slate-500 block uppercase font-mono tracking-wider">{t.highRiskCount}</span>
            <span className="text-xl font-bold text-rose-400 font-mono">{totalHighRiskCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xs text-slate-500 block uppercase font-mono tracking-wider">{t.avgAge}</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{averageAge} yrs</span>
          </div>
        </div>
      </div>

      {/* Interactive QR code Camera Viewfinder and Epidemiological graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Scanner view */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
          
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-4">
              <Camera className="w-4 h-4" />
              <h3 className="text-sm font-bold text-slate-200">
                {t.scanQR}
              </h3>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed mb-6">
              {lang === "ta" ? "நோயாளியின் அச்சிடப்பட்ட நோய் பரிசோதனை அறிக்கையின் QR குறியீட்டை உடனடியாக ஸ்கேன் செய்து விவரங்களை மீட்டெடுக்கவும்." : "Instantly decode encrypted clinical metrics from a patient's printed health report via QR image decoding."}
            </p>
          </div>

          {/* Simulated Viewfinder */}
          <div className="border border-slate-800 bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center h-48 relative overflow-hidden mb-6">
            {qrScanning ? (
              <>
                {/* Simulated Scanner Laser line */}
                <div className="absolute left-0 w-full h-0.5 bg-rose-500 animate-scanner-laser top-0 z-10" />
                <div className="w-24 h-24 border-2 border-dashed border-rose-500 rounded-lg flex items-center justify-center animate-pulse">
                  <Camera className="w-8 h-8 text-rose-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-4 animate-pulse uppercase tracking-widest">
                  {t.scanningView}
                </span>
              </>
            ) : scanResultMsg ? (
              <div className="text-center space-y-2.5 animate-fade-in p-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                  {scanResultMsg}
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-16 h-16 border border-slate-800 rounded-xl flex items-center justify-center bg-slate-900 text-slate-500 mx-auto mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-3xs text-slate-500 uppercase tracking-widest block font-mono">
                  Viewfinder Standby
                </span>
              </div>
            )}
          </div>

          <button
            onClick={triggerMockQRScan}
            disabled={qrScanning}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition duration-150 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            id="btn-scan-qr-sim"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.scanMockBtn}</span>
          </button>
        </div>

        {/* Charts epidemiology block */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-200">
              {t.analyticsOverview}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk prevalence bar chart */}
            <div className="space-y-2">
              <span className="text-2xs text-slate-400 block font-mono uppercase tracking-wider">{t.riskDistribution} (Mean %)</span>
              <div className="h-48 bg-slate-950 p-2 rounded-2xl border border-slate-855">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskPrevalenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                    <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#f8fafc", fontSize: 10 }} />
                    <Bar dataKey="avgRisk" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={lang === "ta" ? "சராசரி ஆபத்து" : "Avg Risk %"} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution pie chart */}
            <div className="space-y-2">
              <span className="text-2xs text-slate-400 block font-mono uppercase tracking-wider">{lang === "ta" ? "நோயாளிகளின் ஆபத்து நிலை பரவல்" : "Patient Risk Classification Ratio"}</span>
              <div className="h-48 bg-slate-950 p-2 rounded-2xl border border-slate-855 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#f8fafc", fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients management tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-200">
              {t.activeReportsList} ({filteredReports.length})
            </h3>
          </div>

          {/* Search bar and Risk filters */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full sm:w-60 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-200 placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200"
                id="doctor-patient-search"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              {(["all", "High", "Moderate", "Low"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition duration-150 ${
                    riskFilter === r
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {r === "all" ? (lang === "ta" ? "அனைத்தும்" : "All") : r === "High" ? (lang === "ta" ? "உயர்" : "High") : r === "Moderate" ? (lang === "ta" ? "மிதமான" : "Moderate") : (lang === "ta" ? "குறைந்த" : "Low")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((rep) => {
              // Peak Risk
              const peakRisk = rep.risks && rep.risks.length > 0
                ? rep.risks.reduce((p, c) => ((c?.riskPercentage || 0) > (p?.riskPercentage || 0) ? c : p), rep.risks[0])
                : { disease: "None", riskPercentage: 0, riskLevel: "Low" };

              return (
                <div
                  key={rep.id}
                  onClick={() => onSelectReport(rep)}
                  className="bg-slate-950 border border-slate-850 hover:border-indigo-500/40 p-4 rounded-2xl transition duration-150 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-slate-900 text-slate-400 rounded-lg">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition duration-150">
                          {rep.patientName}
                        </h4>
                      </div>
                      <span className="font-mono text-[9px] text-slate-500">ID: {rep.id.slice(0, 8)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] border-b border-slate-900 pb-2.5 mb-2.5 text-slate-400">
                      <div>
                        <span className="text-slate-500 block">{lang === "ta" ? "வயது/பாலினம்" : "Age/Sex"}</span>
                        <span className="font-semibold text-slate-300">{rep.patientAge}y / {rep.patientGender.slice(0, 1)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{lang === "ta" ? "உடல் நிறை குறியீடு" : "BMI"}</span>
                        <span className="font-semibold text-slate-300">
                          {(rep.patientWeight / Math.pow(rep.patientHeight / 100, 2)).toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{lang === "ta" ? "இரத்த அழுத்தம்" : "BP"}</span>
                        <span className="font-semibold text-slate-300">{rep.bloodPressure || "120/80"}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[10px] font-semibold text-slate-300">
                          {peakRisk.disease} ({peakRisk.riskPercentage}%)
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        peakRisk.riskLevel === "High"
                          ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                          : peakRisk.riskLevel === "Moderate"
                          ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                          : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      }`}>
                        {peakRisk.riskLevel === "High" ? (lang === "ta" ? "அதிவேக ஆபத்து" : "High Risk") : peakRisk.riskLevel === "Moderate" ? (lang === "ta" ? "மிதமான ஆபத்து" : "Moderate") : (lang === "ta" ? "குறைந்த ஆபத்து" : "Low")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-850 border-dashed">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">
              {lang === "ta" ? "நோயாளிகள் யாரும் கண்டறியப்படவில்லை." : "No patient files matched filters."}
            </p>
          </div>
        )}
      </div>

      {/* Clinical High Risk Watchlist alerts */}
      <div className="bg-rose-950/20 border border-rose-900/30 rounded-3xl p-6">
        <div className="flex items-center space-x-2 text-rose-400 mb-4">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200">
            {t.highRiskPatients} ({highRiskPatientsList.length})
          </h3>
        </div>

        <div className="space-y-3">
          {highRiskPatientsList.length > 0 ? (
            highRiskPatientsList.slice(0, 3).map((rep) => {
              const maxRisks = (rep.risks || []).filter(r => r && r.riskLevel === "High").map(r => r?.disease || "Unknown");

              return (
                <div
                  key={rep.id}
                  onClick={() => onSelectReport(rep)}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950 border border-rose-950/40 hover:border-rose-500/40 rounded-2xl cursor-pointer transition duration-150 group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 group-hover:text-rose-300 transition duration-150">
                      {rep.patientName} (Age: {rep.patientAge})
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      {lang === "ta" ? "தீவிர தொற்றா நோய் ஆபத்துக்கள்" : "High Risk Flags"}: <span className="text-slate-300 font-semibold">{maxRisks.join(", ")}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 mt-2 sm:mt-0">
                    {lang === "ta" ? "கவனம் தேவை" : "Urgent Triage Required"}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 py-2">
              {lang === "ta" ? "உயர் ஆபத்து நோயாளிகள் யாரும் இல்லை." : "No patients flagged with high risk alerts currently."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
