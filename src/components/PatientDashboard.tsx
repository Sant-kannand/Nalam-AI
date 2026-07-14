/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlusCircle, Play, History, TrendingUp, AlertCircle, ShieldAlert, Wifi, WifiOff, FileText, CheckCircle, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { translations } from "../data/translations";
import { Language, UserProfile, HealthReport, ScreeningSession } from "../types";

interface PatientDashboardProps {
  lang: Language;
  profile: UserProfile;
  reports: HealthReport[];
  activeSession: ScreeningSession | null;
  onStartScreening: () => void;
  onResumeScreening: () => void;
  onSelectReport: (report: HealthReport) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export default function PatientDashboard({
  lang,
  profile,
  reports,
  activeSession,
  onStartScreening,
  onResumeScreening,
  onSelectReport,
  isOnline,
  onToggleOnline,
  isSyncing,
  onTriggerSync,
}: PatientDashboardProps) {
  const t = translations[lang];

  // Prepare chart data based on previous reports
  const chartData = [...reports]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((rep) => {
      // Extract numeric BMI or fallback to calculated one
      const bmi = parseFloat((rep.patientWeight / Math.pow(rep.patientHeight / 100, 2)).toFixed(1));
      
      // Parse systolic/diastolic from blood pressure
      let systolic = 120;
      let diastolic = 80;
      if (rep.bloodPressure) {
        const parts = rep.bloodPressure.split("/");
        if (parts.length === 2) {
          systolic = parseInt(parts[0]) || 120;
          diastolic = parseInt(parts[1]) || 80;
        }
      }

      return {
        date: new Date(rep.timestamp).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-US", { month: 'short', day: 'numeric' }),
        bmi: bmi,
        weight: rep.patientWeight,
        systolic: systolic,
        diastolic: diastolic,
      };
    });

  // Default mock trend data if there are no reports yet
  const fallbackChartData = [
    { date: "May 1", bmi: 24.2, weight: 68, systolic: 118, diastolic: 76 },
    { date: "May 15", bmi: 24.5, weight: 69, systolic: 122, diastolic: 79 },
    { date: "Jun 1", bmi: 24.8, weight: 70, systolic: 125, diastolic: 82 },
    { date: "Jun 15", bmi: 24.4, weight: 68.8, systolic: 119, diastolic: 78 },
  ];

  const displayChartData = chartData.length >= 2 ? chartData : fallbackChartData;

  const getBmiCategory = (w: number, h: number) => {
    const bmi = w / Math.pow(h / 100, 2);
    if (bmi < 18.5) return { label: lang === "ta" ? "குறைந்த எடை" : "Underweight", color: "text-blue-400 bg-blue-500/10" };
    if (bmi < 24.9) return { label: lang === "ta" ? "சாதாரண எடை" : "Healthy Weight", color: "text-emerald-400 bg-emerald-500/10" };
    if (bmi < 29.9) return { label: lang === "ta" ? "அதிக எடை" : "Overweight", color: "text-amber-400 bg-amber-500/10" };
    return { label: lang === "ta" ? "உடல் பருமன்" : "Obese", color: "text-rose-400 bg-rose-500/10" };
  };

  const bmiInfo = getBmiCategory(profile.weight, profile.height);
  const currentBmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);

  // Filter unsynced reports
  const unsyncedCount = reports.filter(r => !r.isSynced).length;

  return (
    <div className="space-y-8">
      {/* Top Banner and Online/Offline controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div>
          <span className="font-mono text-2xs uppercase tracking-widest text-indigo-400">
            {t.welcomeBack}
          </span>
          <h2 className="text-2xl font-bold text-slate-100 font-sans tracking-tight mt-1">
            {profile.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.dashboardSubtitle}
          </p>
        </div>

        {/* Connection status control */}
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={onToggleOnline}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition duration-200 ${
              isOnline
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
            }`}
            id="btn-connection-toggle"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? t.onlineStatus : t.offlineStatus}</span>
          </button>

          {!isOnline && unsyncedCount > 0 && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition duration-150 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
              id="btn-trigger-sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>
                {isSyncing ? t.syncPending : `${lang === "ta" ? "ஒத்திசை" : "Sync Reports"} (${unsyncedCount})`}
              </span>
            </button>
          )}

          {isOnline && unsyncedCount > 0 && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition duration-150 animate-bounce"
              id="btn-trigger-sync-online"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{lang === "ta" ? "ஒத்திசை" : "Sync Now"} ({unsyncedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Action cards - Resume / Start screening */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start New Screening */}
        <div
          onClick={onStartScreening}
          className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-3xl transition duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          id="btn-start-screening-dashboard"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition duration-300" />
          <div className="p-3.5 bg-indigo-600 text-white rounded-2xl w-fit mb-5 shadow-lg shadow-indigo-600/30">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition duration-200">
            {t.startNewScreening}
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {lang === "ta"
              ? "புதிய குரல்வழி பரிசோதனையைத் தொடங்கி, உடலியல் அளவுருக்கள் மற்றும் தற்போதைய அறிகுறிகளின் அடிப்படையில் நோய் ஆபத்து மதிப்பீடுகளைப் பெறுங்கள்."
              : "Initiate a comprehensive voice-guided clinical assessment of vital indicators, symptoms, and family history with Nalam AI."}
          </p>
        </div>

        {/* Resume Incomplete Screening */}
        {activeSession ? (
          <div
            onClick={onResumeScreening}
            className="group cursor-pointer bg-slate-900 border border-amber-600 p-6 rounded-3xl transition duration-300 transform hover:-translate-y-1 relative overflow-hidden"
            id="btn-resume-screening-dashboard"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition duration-300" />
            <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl w-fit mb-5 shadow-lg shadow-amber-500/30 animate-pulse">
              <Play className="w-6 h-6 fill-slate-950" />
            </div>
            <div className="flex items-center space-x-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-lg font-bold text-slate-200 group-hover:text-amber-400 transition duration-200">
                {t.resumeScreening}
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === "ta"
                ? `முந்தைய அமர்வு கேள்வி ${activeSession.currentQuestionIndex + 1}-ல் நிறுத்தப்பட்டது. அங்கிருந்து உடனே தொடரவும்.`
                : `Pick up exactly where you paused. Last active at question ${activeSession.currentQuestionIndex + 1} on ${new Date(activeSession.lastUpdated).toLocaleDateString()}.`}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 border-dashed p-6 rounded-3xl flex flex-col justify-center items-center text-center">
            <CheckCircle className="w-8 h-8 text-slate-600 mb-3" />
            <span className="text-xs font-semibold text-slate-500">
              {lang === "ta" ? "அரைகுறை பரிசோதனைகள் ஏதுமில்லை" : "No Pending Screenings"}
            </span>
            <p className="text-2xs text-slate-600 mt-1 max-w-xs">
              {lang === "ta" ? "உங்கள் அனைத்து பரிசோதனை அமர்வுகளும் வெற்றிகரமாக முடிக்கப்பட்டு அறிக்கைகளாக சேமிக்கப்பட்டுள்ளன." : "All your screening sessions have been successfully evaluated and archived."}
            </p>
          </div>
        )}
      </div>

      {/* Vital signs cards (BMI etc) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">{t.bmiLabel}</span>
          <span className="text-lg font-bold text-slate-200 block mt-1">{currentBmi} kg/m²</span>
          <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${bmiInfo.color}`}>
            {bmiInfo.label}
          </span>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">{lang === "ta" ? "உயரம்" : "Height"}</span>
          <span className="text-lg font-bold text-slate-200 block mt-1">{profile.height} cm</span>
          <span className="text-[9px] text-slate-500 block mt-1">{(profile.height / 30.48).toFixed(1)} feet</span>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">{lang === "ta" ? "எடை" : "Weight"}</span>
          <span className="text-lg font-bold text-slate-200 block mt-1">{profile.weight} kg</span>
          <span className="text-[9px] text-slate-500 block mt-1">{(profile.weight * 2.204).toFixed(0)} lbs</span>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">{t.bpLabel}</span>
          <span className="text-lg font-bold text-slate-200 block mt-1">{profile.bloodPressure || "120/80"}</span>
          <span className="text-[9px] text-slate-500 block mt-1">mmHg (Systolic/Diastolic)</span>
        </div>
      </div>

      {/* Visual health trends using recharts */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-200 font-sans">
            {t.healthTrends}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* BP trend */}
          <div className="space-y-3">
            <span className="text-xs text-slate-400 font-semibold block">{t.bpText} (mmHg)</span>
            <div className="h-64 bg-slate-950 p-2 rounded-2xl border border-slate-850">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[60, 160]} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#f8fafc", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#f43f5e" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BMI Trend */}
          <div className="space-y-3">
            <span className="text-xs text-slate-400 font-semibold block">{t.bmiText} & Weight Trend</span>
            <div className="h-64 bg-slate-950 p-2 rounded-2xl border border-slate-850">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#f8fafc", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="bmi" name="BMI Score" stroke="#10b981" fillOpacity={1} fill="url(#colorBmi)" strokeWidth={2} />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Screenings history list */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center space-x-2 mb-4">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-200 font-sans">
            {t.screeningHistory}
          </h3>
        </div>

        <div className="space-y-3">
          {reports.length > 0 ? (
            reports.map((rep) => {
              // Get max risk
              const maxRisk = rep.risks && rep.risks.length > 0
                ? rep.risks.reduce((prev, current) => {
                    const getWeight = (lvl: string) => (lvl === "High" ? 3 : lvl === "Moderate" ? 2 : 1);
                    return getWeight(current?.riskLevel || "Low") > getWeight(prev?.riskLevel || "Low") ? current : prev;
                  }, rep.risks[0])
                : { disease: "None", riskPercentage: 0, riskLevel: "Low" };

              return (
                <div
                  key={rep.id}
                  onClick={() => onSelectReport(rep)}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950 border border-slate-850 hover:border-indigo-500/40 rounded-2xl transition duration-150 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-900 text-indigo-400 rounded-xl group-hover:bg-indigo-500/10 transition duration-150">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition duration-150">
                        NCD Assessment - {new Date(rep.timestamp).toLocaleDateString()}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {lang === "ta" ? "பாதிக்கப்பட்ட நோய் ஆபத்து" : "Peak Risk State"}: <span className="text-slate-300">{maxRisk.disease} ({maxRisk.riskPercentage}%)</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                      maxRisk.riskLevel === "High"
                        ? "text-rose-400 bg-rose-500/10"
                        : maxRisk.riskLevel === "Moderate"
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-emerald-400 bg-emerald-500/10"
                    }`}>
                      {maxRisk.riskLevel === "High" ? (lang === "ta" ? "அதிவேகம்" : "High Risk") : maxRisk.riskLevel === "Moderate" ? (lang === "ta" ? "மிதமான" : "Moderate Risk") : (lang === "ta" ? "குறைந்த" : "Low Risk")}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rep.isSynced
                        ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/20"
                        : "text-amber-400 bg-amber-500/5 border border-amber-500/20 animate-pulse"
                    }`}>
                      {rep.isSynced ? (lang === "ta" ? "ஒத்திசைக்கப்பட்டது" : "Synced") : (lang === "ta" ? "ஆஃப்லைன்" : "Offline Pending")}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-850 border-dashed">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">{t.noHistory}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
