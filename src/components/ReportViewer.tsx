/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Download, Printer, User, Heart, ShieldCheck, Activity, ChevronLeft, AlertTriangle } from "lucide-react";
import { HealthReport, Language } from "../types";
import { translations } from "../data/translations";
import QRCode from "qrcode";

interface ReportViewerProps {
  lang: Language;
  report: HealthReport;
  onBack?: () => void;
}

// Custom highly authentic scannable QR Code generator using qrcode library
function SVGQRCode({ value }: { value: string }) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      margin: 1,
      width: 256,
      color: {
        dark: "#020617", // slate-950
        light: "#ffffff" // white
      }
    })
      .then((url) => {
        if (active) setQrSrc(url);
      })
      .catch((err) => {
        console.warn("QR code generation error:", err);
      });
    return () => {
      active = false;
    };
  }, [value]);

  if (!qrSrc) {
    return (
      <div className="w-28 h-28 bg-slate-900 animate-pulse rounded-xl border border-slate-800 flex items-center justify-center">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Loading QR</span>
      </div>
    );
  }

  return (
    <img
      src={qrSrc}
      alt="Clinical Verification QR Code"
      className="w-28 h-28 bg-white p-1.5 rounded-xl shadow-md border border-slate-200 transition-opacity duration-300"
      referrerPolicy="no-referrer"
    />
  );
}

// Generates an incredibly beautiful, responsive, print-optimized self-contained HTML medical report
function generateBeautifulReportHTML(report: HealthReport, qrDataUrl: string, lang: Language): string {
  const isTa = lang === "ta";
  const dateStr = new Date(report.timestamp).toLocaleDateString(isTa ? "ta-IN" : "en-US", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getRiskLevelColorClass = (level: string) => {
    switch (level) {
      case "High":
        return "bg-rose-50 border-rose-200 text-rose-800";
      case "Moderate":
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
    }
  };

  const getRiskBadgeText = (level: string) => {
    if (level === "High") return isTa ? "அதிக ஆபத்து" : "High Risk";
    if (level === "Moderate") return isTa ? "மிதமான ஆபத்து" : "Moderate Risk";
    return isTa ? "குறைந்த ஆபத்து" : "Low Risk";
  };

  // Generate disease risk items HTML
  const risksHtml = (report.risks || []).map((risk) => {
    const factorsHtml = risk.factors.map((fac) => `
      <span class="inline-block px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs mr-1.5 mb-1.5">
        ${fac}
      </span>
    `).join("");

    const xaiRows = risk.explainableAI.map((xai) => {
      const isPositive = xai.impact === "positive";
      const impactText = isPositive 
        ? (isTa ? "ஆபத்தை அதிகரிக்கிறது" : "Increases Risk")
        : (isTa ? "ஆபத்தை குறைக்கிறது" : "Decreases Risk");
      const impactColor = isPositive ? "text-rose-600" : "text-emerald-600";
      const barColor = isPositive ? "bg-rose-500" : "bg-emerald-500";
      const percentWidth = Math.min(100, xai.weight * 2.5);

      return `
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-slate-700 font-medium">${xai.factor}</span>
            <span class="${impactColor} font-semibold">
              ${isPositive ? "+" : "-"}${xai.weight}% (${impactText})
            </span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full ${barColor}" style="width: ${percentWidth}%"></div>
          </div>
        </div>
      `;
    }).join("");

    const foodHtml = risk.foodSuggestions.slice(0, 3).map((food) => `
      <li class="text-slate-600 text-xs mb-1">${food}</li>
    `).join("");

    const exerciseHtml = risk.exerciseRecommendations.slice(0, 3).map((ex) => `
      <li class="text-slate-600 text-xs mb-1">${ex}</li>
    `).join("");

    return `
      <div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm break-inside-avoid" style="page-break-inside: avoid;">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <h4 class="text-lg font-bold text-slate-900">${risk.disease}</h4>
            <span class="text-xs text-slate-400">${isTa ? "பரிசோதனை வகை" : "Evaluated Indication Type"}</span>
          </div>
          <div class="flex items-center space-x-3 mt-2 sm:mt-0">
            <span class="text-2xl font-mono font-extrabold text-slate-800">${risk.riskPercentage}%</span>
            <span class="px-3 py-1 text-xs font-bold rounded-full border ${getRiskLevelColorClass(risk.riskLevel)}">
              ${getRiskBadgeText(risk.riskLevel)}
            </span>
          </div>
        </div>

        <p class="text-slate-700 text-sm mb-4 leading-relaxed">${risk.explanation}</p>

        <!-- Key Risk Drivers -->
        <div class="mb-4">
          <span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            ${isTa ? "முக்கிய ஆபத்து காரணிகள்" : "Key Risk Drivers"}
          </span>
          <div class="flex flex-wrap">${factorsHtml}</div>
        </div>

        <!-- Explainable AI -->
        <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4">
          <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            ${isTa ? "விளக்கக்கூடிய AI (XAI) அளவுரு எடைகள்" : "Explainable AI (XAI) Parameter Weights"}
          </span>
          <div class="space-y-3">${xaiRows}</div>
        </div>

        <!-- Recommendations Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <span class="font-bold text-slate-800 text-xs block mb-2">🥗 ${isTa ? "பரிந்துரைக்கப்பட்ட உணவு முறை" : "Recommended Diet Plan"}</span>
            <ul class="list-disc pl-4 space-y-0.5">${foodHtml}</ul>
          </div>
          <div>
            <span class="font-bold text-slate-800 text-xs block mb-2">🏃‍♂️ ${isTa ? "உடற்பயிற்சி நெறிமுறை" : "Physical Exercise Protocol"}</span>
            <ul class="list-disc pl-4 space-y-0.5">${exerciseHtml}</ul>
          </div>
          <div>
            <span class="font-bold text-slate-800 text-xs block mb-2">🩺 ${isTa ? "மருத்துவரின் ஆலோசனை குறிப்பு" : "Physician Advisory Note"}</span>
            <p class="text-slate-600 text-xs leading-relaxed italic">${risk.medicalAdvice}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isTa ? "நலம் AI நோய் பரிசோதனை அறிக்கை" : "Nalam AI NCD Screening Report"} - ${report.patientName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Space Grotesk', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background-color: #ffffff !important; color: #000000 !important; }
      .page-break { page-break-before: always; }
      .break-inside-avoid { break-inside: avoid; }
    }
    body {
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen py-8 px-4 sm:px-6 lg:px-8">

  <!-- Interactive top status and print utility bar (no-print) -->
  <div class="max-w-4xl mx-auto mb-6 bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 no-print">
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
      <span class="text-xs font-mono text-slate-300">
        ${isTa ? "அறிக்கை ஆஃப்லைன் நகல் வெற்றிகரமாக பதிவிறக்கம் செய்யப்பட்டது" : "Self-Contained Report Copy Successfully Downloaded"}
      </span>
    </div>
    <button onclick="window.print()" class="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs tracking-wider uppercase transition duration-150 shadow">
      <span>🖨️ ${isTa ? "அறிக்கையை அச்சிடுக / PDF ஆகச் சேமி" : "Print Report / Save as PDF"}</span>
    </button>
  </div>

  <!-- Medical Report Container -->
  <div class="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden break-inside-avoid">
    
    <!-- Report Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-8">
      <div>
        <div class="flex items-center space-x-2 text-indigo-600">
          <span class="text-3xl">❤️</span>
          <h1 class="text-2xl font-bold font-display tracking-tight text-slate-900">
            ${isTa ? "நலம் AI நோய் பரிசோதனை அறிக்கை" : "Nalam AI NCD Screening Report"}
          </h1>
        </div>
        <p class="text-xs text-slate-500 mt-1.5 font-medium">
          ${isTa ? "தொழில்முறை ஆரம்பகட்ட தொற்றா நோய்ப் பரிசோதனை அறிக்கை" : "Professional Early Non-Communicable Disease Screening evaluation"}
        </p>
      </div>
      <div class="mt-4 sm:mt-0 text-left sm:text-right flex flex-col sm:items-end">
        <span class="text-xs font-semibold text-slate-500 block">
          ${isTa ? "தேதி" : "Date"}: ${dateStr}
        </span>
        <span class="inline-flex items-center space-x-1 text-xs text-emerald-600 font-bold mt-1.5">
          ✓ ${isTa ? "நலம் AI ஆரம்பகட்ட பரிசோதனை சான்றிதழ்" : "Nalam AI Automated Screening Certificate"}
        </span>
      </div>
    </div>

    <!-- Patient Demographics Info -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
        <span>👤</span>
        <span>${isTa ? "நோயாளியின் சுயவிவர விவரங்கள்" : "Patient Demographic Profile"}</span>
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <span class="text-slate-400 text-xs block mb-0.5">${isTa ? "பெயர்" : "Full Name"}</span>
          <span class="text-slate-900 font-bold text-base">${report.patientName}</span>
        </div>
        <div>
          <span class="text-slate-400 text-xs block mb-0.5">${isTa ? "வயது / பாலினம்" : "Age / Gender"}</span>
          <span class="text-slate-900 font-bold text-base">
            ${report.patientAge} ${isTa ? "வயது" : "yrs"} / ${isTa ? (report.patientGender === "Male" ? "ஆண்" : report.patientGender === "Female" ? "பெண்" : "வேறு") : report.patientGender}
          </span>
        </div>
        <div>
          <span class="text-slate-400 text-xs block mb-0.5">${isTa ? "உயரம் / எடை" : "Height / Weight"}</span>
          <span class="text-slate-900 font-bold text-base">${report.patientHeight} cm / ${report.patientWeight} kg</span>
        </div>
        <div>
          <span class="text-slate-400 text-xs block mb-0.5">${isTa ? "இரத்த அழுத்தம்" : "Blood Pressure"}</span>
          <span class="text-slate-900 font-bold text-base">${report.bloodPressure || "120/80 mmHg"}</span>
        </div>
      </div>
    </div>

    <!-- Symptoms Section -->
    ${report.symptoms ? `
    <div class="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mb-8">
      <span class="text-xs font-bold text-indigo-500 block uppercase tracking-wider mb-2">
        ${isTa ? "அறிகுறிகள் அறிக்கை" : "Symptoms Reported"}
      </span>
      <p class="text-slate-700 text-sm leading-relaxed italic font-serif">
        "${report.symptoms}"
      </p>
    </div>
    ` : ""}

    <!-- Computed Disease Risks Section -->
    <div class="mb-10">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center space-x-2">
        <span>📊</span>
        <span>${isTa ? "நோய் அபாய மதிப்பீடுகள்" : "Computed Disease Risk Evaluations"}</span>
      </h3>
      
      ${risksHtml}
    </div>

    <!-- Footer Verification section -->
    <div class="border-t border-slate-200 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 break-inside-avoid" style="page-break-inside: avoid;">
      <div class="flex items-center space-x-6 max-w-lg">
        <!-- Interactive and scannable QR Code -->
        <img src="${qrDataUrl}" alt="QR code" class="w-28 h-28 border border-slate-200 rounded-xl p-1 bg-white shadow-sm" />
        <div>
          <span class="text-sm font-bold text-slate-900 block">
            ${isTa ? "மருத்துவ சரிபார்ப்பு QR குறியீடு" : "Digital Clinical Verification Index"}
          </span>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            ${isTa 
              ? "மருத்துவர்கள் தங்கள் நலம் AI டேஷ்போர்டில் இந்த QR குறியீட்டை ஸ்கேன் செய்து மருத்துவ அளவீடுகளைப் பாதுகாப்பாக ஆராயலாம்." 
              : "Doctors can scan this QR code to securely inspect dynamic clinical metrics on their dashboard."}
          </p>
        </div>
      </div>

      <div class="text-center md:text-right flex flex-col items-center md:items-end">
        <div class="border-b border-slate-200 w-48 pb-1 mb-2"></div>
        <span class="text-xs font-bold text-slate-900">Dr. Nalam AI Expert System</span>
        <span class="text-[10px] text-slate-400 uppercase tracking-widest block mt-1">
          ${isTa ? "தொழில்நுட்ப மதிப்பாய்வு செய்யப்பட்டது" : "Automated Clinical Review Hub"}
        </span>
      </div>
    </div>

  </div>

</body>
</html>`;
}

export default function ReportViewer({ lang, report, onBack }: ReportViewerProps) {
  const t = translations[lang];
  const reportRef = useRef<HTMLDivElement>(null);


  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Generates and downloads a beautifully formatted, offline-readable, print-to-PDF ready HTML file
  const handleDownloadPDF = async () => {
    try {
      // Determine the URL for the QR code
      const qrUrl = typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}?reportId=${report.id}`
        : report.qrCodeValue;

      // Generate the base64 QR code image
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 1,
        width: 256,
        color: {
          dark: "#020617",
          light: "#ffffff"
        }
      });

      // Generate the gorgeous, self-contained HTML document
      const htmlContent = generateBeautifulReportHTML(report, qrDataUrl, lang);

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", downloadUrl);
      downloadAnchor.setAttribute("download", `Nalam_AI_Report_${report.patientName.replace(/\s+/g, "_")}.html`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.warn("Failed to generate HTML report:", err);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "Moderate":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-slate-400 hover:text-indigo-400 font-medium transition duration-200"
          id="btn-report-back"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === "ta" ? "டேஷ்போர்டுக்குத் திரும்பு" : "Return to Dashboard"}</span>
        </button>
      )}

      {/* Action Buttons Panel */}
      <div className="flex flex-wrap gap-3 justify-end items-center bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative z-10 print:hidden">
        <span className="text-xs text-slate-400 mr-auto font-mono">
          ID: {report.id}
        </span>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition duration-200"
          id="btn-report-download"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.downloadPDF}</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition duration-200"
          id="btn-report-print"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{t.printReport}</span>
        </button>
      </div>

      {/* Report Document Frame */}
      <div
        ref={reportRef}
        className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none"
        id="report-printable-area"
      >
        {/* Background ambient lighting - hidden on print */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl print:hidden" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl print:hidden" />

        {/* Report Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-6 print:border-slate-300">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 print:text-slate-800">
              <Heart className="w-6 h-6 fill-indigo-500 print:fill-slate-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 print:text-slate-900">
                {t.reportDocTitle}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
              {lang === "ta" ? "தொழில்முறை ஆரம்பகட்ட தொற்றா நோய்ப் பரிசோதனை அறிக்கை" : "Professional Early Non-Communicable Disease Screening evaluation"}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right md:text-right flex flex-col md:items-end">
            <span className="font-mono text-xs text-slate-400 block print:text-slate-700">
              {lang === "ta" ? "தேதி" : "Date"}: {new Date(report.timestamp).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 mt-1 print:text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.verifiedSign}</span>
            </div>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 mb-6 print:bg-slate-100 print:border-slate-300">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center space-x-1.5 print:text-slate-800">
            <User className="w-4 h-4 text-slate-400" />
            <span>{t.patientDetails}</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">{lang === "ta" ? "பெயர்" : "Full Name"}</span>
              <span className="text-slate-200 font-semibold text-sm print:text-slate-950">{report.patientName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.ageLabel} / {t.genderLabel}</span>
              <span className="text-slate-200 font-semibold text-sm print:text-slate-950">
                {report.patientAge} yrs / {lang === "ta" ? (report.patientGender === "Male" ? "ஆண்" : report.patientGender === "Female" ? "பெண்" : "வேறு") : report.patientGender}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.heightLabel} / {t.weightLabel}</span>
              <span className="text-slate-200 font-semibold text-sm print:text-slate-950">
                {report.patientHeight} cm / {report.patientWeight} kg
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t.bpLabel}</span>
              <span className="text-slate-200 font-semibold text-sm print:text-slate-950">
                {report.bloodPressure || "120/80 mmHg"}
              </span>
            </div>
          </div>
        </div>

        {/* Symptoms Section */}
        {report.symptoms && (
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-5 mb-6 print:border-slate-300">
            <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1 print:text-slate-700">{t.symptomsLabel}</span>
            <p className="text-sm text-slate-300 leading-relaxed print:text-slate-900 font-sans italic">
              "{report.symptoms}"
            </p>
          </div>
        )}

        {/* NCD Risk Predicitions Grid */}
        <div className="space-y-6 mb-8">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5 print:text-slate-800">
            <Activity className="w-4 h-4 text-slate-400" />
            <span>{lang === "ta" ? "எதிர்பார்க்கப்படும் நோய் அபாய மதிப்பீடுகள்" : "Computed Disease Risk Evaluations"}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {(report.risks || []).map((risk, index) => (
              <div
                key={index}
                className="bg-slate-900/40 border border-slate-800 hover:border-slate-700/60 rounded-2xl p-5 transition duration-200 print:bg-white print:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-200 print:text-slate-950">{risk.disease}</h4>
                    <span className="text-2xs text-slate-500 font-mono mt-0.5 block">{t.diseaseLabel}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <span className="text-lg font-bold text-slate-100 font-mono print:text-slate-900">
                      {risk.riskPercentage}%
                    </span>
                    <span className={`px-2.5 py-0.5 text-2xs font-bold rounded-full border ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel === "High" ? (lang === "ta" ? "அதிக ஆபத்து" : "High") : risk.riskLevel === "Moderate" ? (lang === "ta" ? "மிதமான ஆபத்து" : "Moderate") : (lang === "ta" ? "குறைந்த ஆபத்து" : "Low")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed print:text-slate-800">
                  {risk.explanation}
                </p>

                {/* Factors Tag list */}
                <div className="mb-4">
                  <span className="text-2xs text-slate-500 block uppercase tracking-wider mb-2 print:text-slate-700">
                    {t.riskFactorLabel}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.factors.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded-md print:bg-slate-100 print:text-slate-800 print:border-slate-300"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Explainable AI Visualization */}
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl print:bg-slate-50 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-3 print:text-slate-700">
                    {t.explainableAITitle}
                  </span>
                  <div className="space-y-2.5">
                    {risk.explainableAI.map((xai, xIdx) => (
                      <div key={xIdx} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-300 print:text-slate-800 font-medium">{xai.factor}</span>
                          <span className={`${xai.impact === "positive" ? "text-rose-400 print:text-rose-600" : "text-emerald-400 print:text-emerald-600"}`}>
                            {xai.impact === "positive" ? `+${xai.weight}%` : `-${xai.weight}%`} ({xai.impact === "positive" ? t.positiveImpact : t.negativeImpact})
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 print:bg-slate-200 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${xai.impact === "positive" ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, xai.weight * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Recommendations Accordion */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-850 print:border-slate-300 text-[11px] leading-relaxed">
                  <div>
                    <span className="text-indigo-400 font-semibold block mb-1 print:text-slate-800 uppercase tracking-wide">
                      🥗 {t.foodSuggestionsLabel}
                    </span>
                    <ul className="list-disc pl-3 text-slate-400 print:text-slate-800 space-y-0.5">
                      {risk.foodSuggestions.slice(0, 3).map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold block mb-1 print:text-slate-800 uppercase tracking-wide">
                      🏃‍♂️ {t.exerciseRecs}
                    </span>
                    <ul className="list-disc pl-3 text-slate-400 print:text-slate-800 space-y-0.5">
                      {risk.exerciseRecommendations.slice(0, 3).map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-amber-400 font-semibold block mb-1 print:text-slate-800 uppercase tracking-wide">
                      🩺 {t.medicalAdviceLabel}
                    </span>
                    <p className="text-slate-400 print:text-slate-800 italic">
                      {risk.medicalAdvice}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code and Medical Sign-off Section */}
        <div className="border-t border-slate-800 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center md:items-start space-y-4 md:space-y-0 print:border-slate-300">
          <div className="flex items-center space-x-4 md:max-w-md">
            <SVGQRCode value={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?reportId=${report.id}` : report.qrCodeValue} />
            <div>
              <span className="text-xs font-bold text-slate-300 block print:text-slate-900">
                {lang === "ta" ? "மருத்துவ சரிபார்ப்பு QR குறியீடு" : "Digital Clinical Verification Index"}
              </span>
              <p className="text-3xs text-slate-500 mt-1 leading-relaxed print:text-slate-700">
                {t.qrInstructions}
              </p>
            </div>
          </div>

          <div className="text-center md:text-right flex flex-col items-center md:items-end">
            <div className="border-b border-slate-800 w-44 pb-1 mb-2 print:border-slate-400" />
            <span className="text-xs font-mono font-bold text-slate-300 print:text-slate-900">
              Dr. Nalam AI Expert System
            </span>
            <span className="text-4xs text-slate-600 uppercase tracking-widest block mt-0.5">
              {lang === "ta" ? "தொழில்நுட்ப மதிப்பாய்வு செய்யப்பட்டது" : "Automated Clinical Review Hub"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
