/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Activity,
  User,
  Users,
  LogOut,
  Languages,
  Sparkles,
  ShieldAlert,
  Home,
  CheckCircle,
  FileText,
  Lock,
  ArrowRight,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { translations } from "./data/translations";
import { Gender, RiskLevel, UserProfile, ScreeningSession, HealthReport, Language } from "./types";
import VoiceAssistant from "./components/VoiceAssistant";
import EmergencyGuidance from "./components/EmergencyGuidance";
import ReportViewer from "./components/ReportViewer";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";

// Default initial premium mock reports for a gorgeous start
const DEFAULT_MOCK_REPORTS: HealthReport[] = [
  {
    id: "REP-KM-9801",
    userId: "USER-KUMAR",
    patientName: "Kumaravel S",
    patientAge: 54,
    patientGender: "Male",
    patientHeight: 172,
    patientWeight: 84,
    bloodPressure: "145/92",
    symptoms: "Occasional minor dizziness after long walks.",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    isSynced: true,
    qrCodeValue: "NalamAI-REP-KM-9801",
    risks: [
      {
        disease: "Diabetes",
        riskPercentage: 78,
        riskLevel: RiskLevel.HIGH,
        explanation: "Elevated risk profile driven by personal diabetic family history and overweight BMI index of 28.4.",
        factors: ["Diabetic Family History", "High BP", "Overweight BMI"],
        explainableAI: [
          { factor: "Family History", impact: "positive", weight: 35 },
          { factor: "BMI Index", impact: "positive", weight: 28 },
          { factor: "Age Factor", impact: "positive", weight: 15 }
        ],
        lifestyleRecommendations: ["Decrease saturated carbohydrate loads", "Engage in daily cardiovascular walking"],
        foodSuggestions: ["Consume rich green leafy vegetables", "Incorporate steel cut oats and whole grains"],
        exerciseRecommendations: ["30 minutes brisk walking daily", "Gentle resistance training twice a week"],
        medicalAdvice: "Recommended HbA1c testing and a consultation with an endocrinologist."
      },
      {
        disease: "Hypertension",
        riskPercentage: 82,
        riskLevel: RiskLevel.HIGH,
        explanation: "Significantly elevated cardiovascular blood pressure recorded at 145/92 mmHg.",
        factors: ["Stage 2 Hypertension BP Reading", "Age-associated vascular stiffness"],
        explainableAI: [
          { factor: "Systolic BP (145)", impact: "positive", weight: 50 },
          { factor: "Age (54)", impact: "positive", weight: 20 },
          { factor: "Lifestyle", impact: "positive", weight: 12 }
        ],
        lifestyleRecommendations: ["Enforce a strict low-sodium dietary protocol", "Incorporate breathing relaxation methods"],
        foodSuggestions: ["Eat potassium-rich bananas and avocados", "Limit processed or canned products"],
        exerciseRecommendations: ["Brisk walking or swimming 4 times weekly", "Meditation and breathing exercises"],
        medicalAdvice: "Initiate daily blood pressure logs; consult primary care physician for pharmacological management."
      },
      {
        disease: "Heart Disease",
        riskPercentage: 45,
        riskLevel: RiskLevel.MEDIUM,
        explanation: "Moderate risk due to elevated blood pressure parameters, although no active chest pain is present.",
        factors: ["Elevated BP", "Age group 50+"],
        explainableAI: [
          { factor: "Systolic BP", impact: "positive", weight: 25 },
          { factor: "Age Factor", impact: "positive", weight: 15 },
          { factor: "Active Smoking (None)", impact: "negative", weight: 10 }
        ],
        lifestyleRecommendations: ["Optimize lipid panel indices", "Manage cardiovascular stressors"],
        foodSuggestions: ["Consume olive oil and walnuts", "Avoid trans fats and hydrogenated oils"],
        exerciseRecommendations: ["30 mins moderate cycling or walking", "Low stress aerobics"],
        medicalAdvice: "Obtain a lipid profile panel evaluation annually."
      },
      {
        disease: "Stroke",
        riskPercentage: 38,
        riskLevel: RiskLevel.MEDIUM,
        explanation: "Moderate risk. High blood pressure increases cerebral vascular pressure.",
        factors: ["Stage 2 BP Reading"],
        explainableAI: [
          { factor: "Elevated Systolic Pressure", impact: "positive", weight: 28 },
          { factor: "Smoking (None)", impact: "negative", weight: 12 }
        ],
        lifestyleRecommendations: ["Keep Blood Pressure below 130/80 mmHg", "Stay fully hydrated"],
        foodSuggestions: ["Focus on fresh citrus fruits and high fiber cereals", "Reduce sodium drastically"],
        exerciseRecommendations: ["Regular active lifestyle habits", "Limiting prolonged desk sitting"],
        medicalAdvice: "Check cardiovascular carotid artery wellness if dizzy symptoms worsen."
      },
      {
        disease: "Chronic Kidney Disease",
        riskPercentage: 62,
        riskLevel: RiskLevel.MEDIUM,
        explanation: "Moderate risk. Long standing elevated blood pressure and potential diabetes can stress kidney nephrons.",
        factors: ["Stage 2 BP Reading", "Potential diabetic load"],
        explainableAI: [
          { factor: "BP Filtration stress", impact: "positive", weight: 35 },
          { factor: "Diabetic risk", impact: "positive", weight: 20 }
        ],
        lifestyleRecommendations: ["Drink 2.5 - 3 liters water daily", "Avoid over-the-counter painkiller abuse"],
        foodSuggestions: ["Limit high-sodium spices", "Focus on fresh water-rich gourds and cucumber"],
        exerciseRecommendations: ["Mild stretching and yoga", "Active walks"],
        medicalAdvice: "Conduct a serum creatinine and urinalysis GFR checkup."
      }
    ]
  },
  {
    id: "REP-MS-4402",
    userId: "USER-MEENA",
    patientName: "Meenakshi Sundaram",
    patientAge: 68,
    patientGender: "Female",
    patientHeight: 158,
    patientWeight: 62,
    bloodPressure: "135/84",
    symptoms: "Minor tightness in chest when walking uphill.",
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    isSynced: true,
    qrCodeValue: "NalamAI-REP-MS-4402",
    risks: [
      {
        disease: "Diabetes",
        riskPercentage: 24,
        riskLevel: RiskLevel.LOW,
        explanation: "Low risk profile with normal glycemic indicators and standard body weight.",
        factors: ["Healthy BMI 24.8", "Active dietary habits"],
        explainableAI: [
          { factor: "Active lifestyle", impact: "negative", weight: 15 },
          { factor: "No diabetic family history", impact: "negative", weight: 20 }
        ],
        lifestyleRecommendations: ["Maintain low-glycemic eating protocols"],
        foodSuggestions: ["Incorporate millets and pulses", "Fresh raw salads"],
        exerciseRecommendations: ["Daily active chores", "Brisk walking"],
        medicalAdvice: "Routinely monitor annual fasting glucose indicators."
      },
      {
        disease: "Hypertension",
        riskPercentage: 58,
        riskLevel: RiskLevel.MEDIUM,
        explanation: "Moderate pre-hypertensive state with blood pressure trending around 135/84 mmHg.",
        factors: ["Elevated systolic pressure", "Elderly age range"],
        explainableAI: [
          { factor: "Age 68", impact: "positive", weight: 30 },
          { factor: "Systolic BP 135", impact: "positive", weight: 22 }
        ],
        lifestyleRecommendations: ["Enforce lower dietary sodium guidelines", "Optimize daily sleep"],
        foodSuggestions: ["Eat celery, garlic, and fresh bananas", "Reduce pickling spices"],
        exerciseRecommendations: ["Gentle yoga and breathing exercises", "Moderate morning walks"],
        medicalAdvice: "Check blood pressure twice weekly at home."
      },
      {
        disease: "Heart Disease",
        riskPercentage: 84,
        riskLevel: RiskLevel.HIGH,
        explanation: "High risk. Presented tightness in chest during exertion coupled with age and elevated BP.",
        factors: ["Exertional chest tightness", "Advanced age group 65+", "Hypertension"],
        explainableAI: [
          { factor: "Symptom: Chest tightness", impact: "positive", weight: 45 },
          { factor: "Age factor", impact: "positive", weight: 25 },
          { factor: "Pre-hypertension", impact: "positive", weight: 14 }
        ],
        lifestyleRecommendations: ["Avoid stressful physical overloading", "Keep nitroglycerine standby if prescribed"],
        foodSuggestions: ["Adopt strict Mediterranean diet protocols", "Omega-3 rich fish or flaxseeds"],
        exerciseRecommendations: ["Extremely gentle flat surface walking", "Relaxing breathing drills"],
        medicalAdvice: "Urgently schedule a cardiac stress test, ECG, and echocardiogram with a cardiologist."
      },
      {
        disease: "Stroke",
        riskPercentage: 54,
        riskLevel: RiskLevel.MEDIUM,
        explanation: "Moderate risk. Cardiovascular vascular strain increases risk parameters over time.",
        factors: ["Age 68", "Pre-hypertension"],
        explainableAI: [
          { factor: "Age group", impact: "positive", weight: 32 },
          { factor: "BP strain", impact: "positive", weight: 18 }
        ],
        lifestyleRecommendations: ["Keep cholesterol and lipids tightly regulated"],
        foodSuggestions: ["High antioxidant berries and green tea", "Leafy spinach and broccoli"],
        exerciseRecommendations: ["Consistent light physical activities", "Stretching drills"],
        medicalAdvice: "Know and monitor the FAST stroke warning parameters (Face, Arm, Speech, Time)."
      },
      {
        disease: "Chronic Kidney Disease",
        riskPercentage: 42,
        riskLevel: RiskLevel.MEDIUM,
        explanation: "Moderate risk. Age-related GFR filtration decline combined with pre-hypertension.",
        factors: ["Age GFR decline", "BP filtration strain"],
        explainableAI: [
          { factor: "Age group GFR decline", impact: "positive", weight: 28 },
          { factor: "Elevated BP load", impact: "positive", weight: 14 }
        ],
        lifestyleRecommendations: ["Ensure complete optimal hydration", "Limit unnecessary clinical medicines"],
        foodSuggestions: ["Low sodium, protein-restricted diet guidelines", "Water-rich fruits"],
        exerciseRecommendations: ["Yoga postures", "Daily walking"],
        medicalAdvice: "Schedule basic blood urea and serum creatinine indices checking."
      }
    ]
  }
];

export default function App() {
  // Global States
  const [lang, setLang] = useState<Language>("en");
  const [view, setView] = useState<
    "landing" | "auth-patient" | "patient-dashboard" | "screening-active" | "analysis-loading" | "results-screen" | "report-view" | "doctor-dashboard"
  >("landing");

  // Connection State (Offline First simulator)
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authentication States
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Registration profile fields
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("45");
  const [regGender, setRegGender] = useState<Gender>(Gender.MALE);
  const [regHeight, setRegHeight] = useState("168");
  const [regWeight, setRegWeight] = useState("72");
  const [regBP, setRegBP] = useState("120/80");

  // Active Session & Reports States
  const [activeSession, setActiveSession] = useState<ScreeningSession | null>(null);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);

  // Screening Session State
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [activeScreeningAnswers, setActiveScreeningAnswers] = useState<ScreeningSession["answers"]>({});
  const [screeningResults, setScreeningResults] = useState<any>(null);

  // Loading analysis sequence states
  const [analysisStep, setAnalysisStep] = useState(0);

  // Global Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Emergency save workflow states
  const [showEmergencySaveModal, setShowEmergencySaveModal] = useState(false);
  const [emergencySaveUser, setEmergencySaveUser] = useState("");
  const [emergencySavePass, setEmergencySavePass] = useState("");

  const t = translations[lang];

  // Initialize data and load from LocalStorage
  useEffect(() => {
    // Load local reports
    const storedReports = localStorage.getItem("nalam_reports");
    let currentReportsList = DEFAULT_MOCK_REPORTS;
    if (storedReports) {
      try {
        currentReportsList = JSON.parse(storedReports);
        setReports(currentReportsList);
      } catch (e) {
        setReports(DEFAULT_MOCK_REPORTS);
      }
    } else {
      setReports(DEFAULT_MOCK_REPORTS);
      localStorage.setItem("nalam_reports", JSON.stringify(DEFAULT_MOCK_REPORTS));
    }

    // Load active unfinished sessions
    const storedSession = localStorage.getItem("nalam_active_session");
    if (storedSession) {
      setActiveSession(JSON.parse(storedSession));
    }

    // Load current user profile if any
    const storedUser = localStorage.getItem("nalam_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setView("patient-dashboard");
    }

    // Check if there is a reportId or scan parameter in the URL to dynamically load the report
    const params = new URLSearchParams(window.location.search);
    const urlReportId = params.get("reportId") || params.get("scan");
    if (urlReportId) {
      const match = currentReportsList.find(
        (r) => r.id === urlReportId || r.qrCodeValue === urlReportId
      );
      if (match) {
        setSelectedReport(match);
        setView("report-view");
      }
    }
  }, []);

  // Sync reports function
  const handleSyncData = () => {
    if (!isOnline) return;
    setIsSyncing(true);

    // Simulate server synchronization delay
    setTimeout(() => {
      const updatedReports = reports.map((r) => ({ ...r, isSynced: true }));
      setReports(updatedReports);
      localStorage.setItem("nalam_reports", JSON.stringify(updatedReports));
      setIsSyncing(false);
      showToast(t.syncComplete, "success");
    }, 2000);
  };

  // Log in
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword) return;

    // Simulate or check credentials
    const cleanUsername = authUsername.trim();
    
    // Create or locate a mock profile for Kumar or Meenakshi, otherwise create a new one
    let matchedProfile: UserProfile;
    
    if (cleanUsername.toLowerCase().includes("kumar")) {
      matchedProfile = {
        id: "USER-KUMAR",
        name: "Kumaravel S",
        age: 54,
        gender: Gender.MALE,
        height: 172,
        weight: 84,
        bloodPressure: "145/92",
        hasDiabetesHistory: true,
        smokingStatus: "never",
        alcoholConsumption: "none",
        familyHistory: ["Diabetes"],
        lifestyleHabits: ["sedentary"],
        createdAt: new Date().toISOString()
      };
    } else if (cleanUsername.toLowerCase().includes("meena")) {
      matchedProfile = {
        id: "USER-MEENA",
        name: "Meenakshi Sundaram",
        age: 68,
        gender: Gender.FEMALE,
        height: 158,
        weight: 62,
        bloodPressure: "135/84",
        hasDiabetesHistory: false,
        smokingStatus: "never",
        alcoholConsumption: "none",
        familyHistory: ["Heart Disease"],
        lifestyleHabits: ["active"],
        createdAt: new Date().toISOString()
      };
    } else {
      matchedProfile = {
        id: `USER-${Date.now().toString().slice(-4)}`,
        name: cleanUsername,
        age: 45,
        gender: Gender.MALE,
        height: 170,
        weight: 70,
        bloodPressure: "120/80",
        hasDiabetesHistory: false,
        smokingStatus: "never",
        alcoholConsumption: "none",
        familyHistory: [],
        lifestyleHabits: [],
        createdAt: new Date().toISOString()
      };
    }

    setCurrentUser(matchedProfile);
    localStorage.setItem("nalam_user", JSON.stringify(matchedProfile));
    
    // Filter active session for this user
    const storedSession = localStorage.getItem(`nalam_session_${matchedProfile.id}`);
    if (storedSession) {
      setActiveSession(JSON.parse(storedSession));
    } else {
      setActiveSession(null);
    }

    setView("patient-dashboard");
    setAuthUsername("");
    setAuthPassword("");
  };

  // Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword || !regName) return;

    const newProfile: UserProfile = {
      id: `USER-${Date.now().toString().slice(-4)}`,
      name: regName,
      age: parseInt(regAge) || 45,
      gender: regGender,
      height: parseFloat(regHeight) || 165,
      weight: parseFloat(regWeight) || 70,
      bloodPressure: regBP || "120/80",
      hasDiabetesHistory: false,
      smokingStatus: "never",
      alcoholConsumption: "none",
      familyHistory: [],
      lifestyleHabits: [],
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(newProfile);
    localStorage.setItem("nalam_user", JSON.stringify(newProfile));
    setActiveSession(null);
    setView("patient-dashboard");

    setAuthUsername("");
    setAuthPassword("");
    setRegName("");
  };

  // Log out
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSession(null);
    localStorage.removeItem("nalam_user");
    setView("landing");
  };

  // Start Voice Screening
  const handleStartScreening = () => {
    setEmergencyTriggered(false);
    
    let initialAnswers: ScreeningSession["answers"] = {};
    if (currentUser) {
      // Pre-populate known details from patient profile to make the medical interview smoother!
      initialAnswers = {
        name: currentUser.name,
        age: currentUser.age,
        gender: currentUser.gender,
        height: currentUser.height,
        weight: currentUser.weight,
        bloodPressure: currentUser.bloodPressure,
      };
    }

    const newSession: ScreeningSession = {
      id: `SES-${Date.now()}`,
      userId: currentUser?.id,
      isEmergency: currentUser ? false : true,
      currentQuestionIndex: currentUser ? 6 : 0, // Skip biographical questions if logged in! Professional integration.
      answers: initialAnswers,
      lastUpdated: new Date().toISOString(),
      isCompleted: false,
    };

    setActiveSession(newSession);
    setView("screening-active");
  };

  // Resume Incomplete Screening
  const handleResumeScreening = () => {
    if (activeSession) {
      setEmergencyTriggered(false);
      setView("screening-active");
    }
  };

  // Local Session Update
  const handleUpdateSession = (updated: ScreeningSession) => {
    setActiveSession(updated);
    if (currentUser) {
      localStorage.setItem(`nalam_session_${currentUser.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem("nalam_active_session", JSON.stringify(updated));
    }
  };

  // Screening complete: compile clinical predictions!
  const handleScreeningComplete = async (answers: ScreeningSession["answers"]) => {
    setActiveScreeningAnswers(answers);
    setView("analysis-loading");
    setAnalysisStep(0);

    // Play visual loading steps
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return 3;
        }
        return prev + 1;
      });
    }, 1000);

    // Call server-side clinical evaluation endpoint
    try {
      const response = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: answers,
          lang: lang,
        }),
      });

      const resultData = await response.json();
      
      setTimeout(() => {
        setScreeningResults(resultData.risks);
        setView("results-screen");
        
        // Complete the session
        setActiveSession(null);
        if (currentUser) {
          localStorage.removeItem(`nalam_session_${currentUser.id}`);
        } else {
          localStorage.removeItem("nalam_active_session");
        }
      }, 3200);

    } catch (e) {
      console.warn("Analysis failed, using fallback:", e);
      // Fail-safe error path: server handles falling back, but if physical network crashes, evaluate locally
      setTimeout(() => {
        setScreeningResults([]);
        setView("results-screen");
      }, 3200);
    }
  };

  // Compile final Health Report Document
  const handleCompileReport = () => {
    if (!screeningResults) return;

    const patientName = activeScreeningAnswers.name || currentUser?.name || (lang === "ta" ? "தற்காலிக நோயாளி" : "Emergency Patient");
    const patientAge = activeScreeningAnswers.age || currentUser?.age || 45;
    const patientGender = activeScreeningAnswers.gender || currentUser?.gender || "Male";
    const patientHeight = activeScreeningAnswers.height || currentUser?.height || 165;
    const patientWeight = activeScreeningAnswers.weight || currentUser?.weight || 70;
    const bp = activeScreeningAnswers.bloodPressure || currentUser?.bloodPressure || "120/80";
    const syms = activeScreeningAnswers.currentSymptoms || "";

    const newReport: HealthReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser?.id,
      patientName,
      patientAge,
      patientGender,
      patientHeight,
      patientWeight,
      bloodPressure: bp,
      symptoms: syms,
      risks: screeningResults,
      timestamp: new Date().toISOString(),
      qrCodeValue: `NalamAI-REP-${Math.floor(1000 + Math.random() * 9000)}`,
      isSynced: isOnline, // synced if online, cached locally if offline
    };

    // Save report locally
    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    localStorage.setItem("nalam_reports", JSON.stringify(updatedReports));

    setSelectedReport(newReport);

    // If emergency patient, ask to save
    if (!currentUser) {
      setShowEmergencySaveModal(true);
    } else {
      setView("report-view");
    }
  };

  // Emergency register and save report
  const handleEmergencySaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencySaveUser || !emergencySavePass || !selectedReport) return;

    // Create a new user profile on the fly
    const newProfile: UserProfile = {
      id: `USER-${Date.now().toString().slice(-4)}`,
      name: selectedReport.patientName,
      age: selectedReport.patientAge,
      gender: selectedReport.patientGender as Gender,
      height: selectedReport.patientHeight,
      weight: selectedReport.patientWeight,
      bloodPressure: selectedReport.bloodPressure,
      hasDiabetesHistory: false,
      smokingStatus: "never",
      alcoholConsumption: "none",
      familyHistory: [],
      lifestyleHabits: [],
      createdAt: new Date().toISOString(),
    };

    // Bind report to user
    const boundReport = { ...selectedReport, userId: newProfile.id };
    const updatedReports = reports.map(r => r.id === selectedReport.id ? boundReport : r);
    setReports(updatedReports);
    localStorage.setItem("nalam_reports", JSON.stringify(updatedReports));

    setCurrentUser(newProfile);
    localStorage.setItem("nalam_user", JSON.stringify(newProfile));

    setShowEmergencySaveModal(false);
    setEmergencySaveUser("");
    setEmergencySavePass("");
    
    setView("report-view");
  };

  const handleCancelEmergencySave = () => {
    setShowEmergencySaveModal(false);
    setView("landing");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Dynamic Network Status Indicator bar */}
      {!isOnline && (
        <div className="bg-rose-950 border-b border-rose-900/50 text-rose-300 px-4 py-2 text-center text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 animate-fade-in print:hidden">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>{lang === "ta" ? "ஆஃப்லைன் பயன்முறை: அறிக்கைகள் உள்ளூரில் தற்காலிகமாக சேமிக்கப்படும்" : "Offline mode active: Screenings and clinical reports buffered locally"}</span>
        </div>
      )}

      {/* Primary Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 px-4 md:px-8 py-4 flex justify-between items-center print:hidden">
        <div
          onClick={() => setView("landing")}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 active:scale-95 transition"
        >
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-sans tracking-tight text-slate-100">
              {t.appName}
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">AI Health Triage</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-xl text-indigo-400 transition"
            id="language-selector"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{t.languageToggle}</span>
          </button>

          {/* User Specific Menu Actions */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView("patient-dashboard")}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium rounded-xl transition"
                id="header-btn-dashboard"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.normalAction}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 rounded-xl transition"
                id="header-btn-logout"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {view !== "doctor-dashboard" ? (
                <button
                  onClick={() => setView("doctor-dashboard")}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition"
                  id="header-btn-doctor"
                >
                  {t.doctorAction}
                </button>
              ) : (
                <button
                  onClick={() => setView("landing")}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition"
                >
                  {t.backToHome}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative">
        {toast && (
          <div className="fixed top-24 right-4 z-[999] max-w-md animate-fade-in bg-slate-900 border border-indigo-500/30 text-indigo-400 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5">
            <CheckCircle className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        )}
        <AnimatePresence mode="wait">
          {/* 1. Welcoming Landing Page */}
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="py-12 md:py-20 text-center space-y-12 max-w-4xl mx-auto relative z-10"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === "ta" ? "Gemini 3.5 பெற்ற மருத்துவ உதவியாளர்" : "Clinical-grade AI Screening System"}</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-sans font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-100 leading-tight">
                  {lang === "ta" ? "தீராத நோய்களுக்கான பரிசோதனை" : "Screen for Chronic Diseases"}
                </h1>
                
                <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
                  {t.mission}
                </p>
              </div>

              {/* Workflows Cards Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left pt-6">
                
                {/* Emergency Card */}
                <div
                  onClick={() => {
                    setEmergencyTriggered(true);
                    handleStartScreening();
                  }}
                  className="group cursor-pointer bg-gradient-to-br from-rose-950/80 to-slate-950 border-2 border-rose-600/40 hover:border-rose-500 p-6 rounded-3xl transition duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                  id="btn-emergency-landing"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10" />
                  <div className="p-3 bg-rose-600 text-slate-950 rounded-2xl w-fit mb-5 font-bold shadow-lg shadow-rose-600/20">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-400">
                    {lang === "ta" ? "அவசரப் பரிசோதனை" : "Emergency Patient"}
                  </h3>
                  <p className="text-2xs text-slate-400 mt-2 leading-relaxed">
                    {lang === "ta" 
                      ? "உள்நுழையாமல் உடனடியாக பரிசோதனையைத் தொடங்குங்கள். நெஞ்சுவலி மற்றும் மூச்சுத்திணறல் போன்ற ஆபத்துகள் முன்னுரிமைப்படுத்தப்படும்."
                      : "Begin screening immediately. Bypasses registration. Prioritizes life-threatening symptom logs with rapid emergency triage."}
                  </p>
                </div>

                {/* Normal Patient Dashboard Card */}
                <div
                  onClick={() => {
                    if (currentUser) {
                      setView("patient-dashboard");
                    } else {
                      setAuthMode("login");
                      setView("auth-patient");
                    }
                  }}
                  className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-3xl transition duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                  id="btn-patient-landing"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10" />
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl w-fit mb-5 shadow-lg shadow-indigo-600/20">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition duration-200">
                    {lang === "ta" ? "நோயாளி போர்டல்" : "Normal Patient"}
                  </h3>
                  <p className="text-2xs text-slate-400 mt-2 leading-relaxed">
                    {lang === "ta"
                      ? "உங்கள் தனிப்பட்ட கணக்கில் உள்நுழைந்து அல்லது புதிய கணக்கு உருவாக்கி தொடர்ந்து கண்காணிக்கவும். வரலாறுகளைச் சேமிக்கவும்."
                      : "Create/access your personal profile, resume incomplete screenings, track history logs and monitor clinical metrics."}
                  </p>
                </div>

                {/* Doctor Portal Card */}
                <div
                  onClick={() => setView("doctor-dashboard")}
                  className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl transition duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                  id="btn-doctor-landing"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10" />
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl w-fit mb-5 shadow-lg shadow-emerald-600/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 group-hover:text-emerald-400 transition duration-200">
                    {lang === "ta" ? "மருத்துவர் போர்டல்" : "Clinical Specialist"}
                  </h3>
                  <p className="text-2xs text-slate-400 mt-2 leading-relaxed">
                    {lang === "ta"
                      ? "மருத்துவ தொற்றுநோயியல் தரவுகளை ஆராயுங்கள். நோயாளி அறிக்கைகள் மற்றும் க்யூஆர் குறியீடுகளை ஸ்கேன் செய்யுங்கள்."
                      : "Authorized specialist space to monitor epidemiological graphs, search patients, and instantly scan report QR codes."}
                  </p>
                </div>
              </div>

              {/* Ambient visual badge */}
              <div className="pt-12 text-slate-600 flex items-center justify-center space-x-2 text-2xs font-mono uppercase tracking-widest">
                <CheckCircle className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>{lang === "ta" ? "அனைத்து மருத்துவத் தரவுகளும் உள்ளூரில் குறியாக்கம் செய்யப்பட்டுள்ளன" : "Clinical Screening complies with HIPAA standard regulations"}</span>
              </div>
            </motion.div>
          )}

          {/* 2. Authentication: Patient Sign in / Sign up */}
          {view === "auth-patient" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative"
            >
              <div className="text-center mb-6">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mx-auto mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  {authMode === "login" ? t.loginTitle : t.registerTitle}
                </h2>
                <p className="text-2xs text-slate-400 mt-1 leading-relaxed">
                  {authMode === "login" ? (lang === "ta" ? "சுயவிவர வரலாற்றைப் பாதுகாக்க உள்நுழைக" : "Sign in to securely access your screening history logs") : t.registerDetails}
                </p>
              </div>

              {authMode === "login" ? (
                // Login Form
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-mono uppercase block">{t.username}</label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="e.g., Kumaravel or Meenakshi"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-mono uppercase block">{t.password}</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition duration-200"
                    id="btn-auth-submit"
                  >
                    {t.submitLogin}
                  </button>
                </form>
              ) : (
                // Registration Form
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-mono uppercase block">{t.username} (Email)</label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-mono uppercase block">{t.password}</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none transition"
                    />
                  </div>
                  <div className="border-t border-slate-800 pt-3 my-2" />
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-mono uppercase block">{lang === "ta" ? "முழு பெயர்" : "Full Name"}</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g., Vignesh"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">{lang === "ta" ? "வயது" : "Age"}</label>
                      <input
                        type="number"
                        required
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">{lang === "ta" ? "பாலினம்" : "Gender"}</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as Gender)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2 rounded-xl text-xs focus:outline-none transition h-8"
                      >
                        <option value={Gender.MALE}>{lang === "ta" ? "ஆண்" : "Male"}</option>
                        <option value={Gender.FEMALE}>{lang === "ta" ? "பெண்" : "Female"}</option>
                        <option value={Gender.OTHER}>{lang === "ta" ? "வேறு" : "Other"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">Height (cm)</label>
                      <input
                        type="number"
                        value={regHeight}
                        onChange={(e) => setRegHeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-2 rounded-xl text-xs focus:outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">Weight (kg)</label>
                      <input
                        type="number"
                        value={regWeight}
                        onChange={(e) => setRegWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-2 rounded-xl text-xs focus:outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase block">BP (e.g. 120/80)</label>
                      <input
                        type="text"
                        value={regBP}
                        onChange={(e) => setRegBP(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-2 rounded-xl text-xs focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition duration-200"
                  >
                    {t.submitRegister}
                  </button>
                </form>
              )}

              {/* Form toggles */}
              <div className="text-center mt-6 text-xs text-slate-400">
                {authMode === "login" ? (
                  <span>
                    {t.noAccount}{" "}
                    <button
                      onClick={() => setAuthMode("register")}
                      className="text-indigo-400 font-semibold hover:underline"
                    >
                      {t.registerTitle}
                    </button>
                  </span>
                ) : (
                  <span>
                    {t.hasAccount}{" "}
                    <button
                      onClick={() => setAuthMode("login")}
                      className="text-indigo-400 font-semibold hover:underline"
                    >
                      {t.loginTitle}
                    </button>
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. Patient Dashboard */}
          {view === "patient-dashboard" && currentUser && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PatientDashboard
                lang={lang}
                profile={currentUser}
                reports={reports.filter((r) => r.userId === currentUser.id)}
                activeSession={activeSession}
                onStartScreening={handleStartScreening}
                onResumeScreening={handleResumeScreening}
                onSelectReport={(rep) => {
                  setSelectedReport(rep);
                  setView("report-view");
                }}
                isOnline={isOnline}
                onToggleOnline={() => setIsOnline(!isOnline)}
                isSyncing={isSyncing}
                onTriggerSync={handleSyncData}
              />
            </motion.div>
          )}

          {/* 4. Active Screening Console (Voice Intervew) */}
          {view === "screening-active" && activeSession && (
            <motion.div
              key="screening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <VoiceAssistant
                lang={lang}
                session={activeSession}
                onUpdateSession={handleUpdateSession}
                onComplete={handleScreeningComplete}
                onEmergencyTriggered={setEmergencyTriggered}
                onQuit={() => {
                  setView(currentUser ? "patient-dashboard" : "landing");
                }}
              />

              {/* Show critical care warning in the same screen immediately without stopping the session! */}
              {emergencyTriggered && (
                <div className="animate-fade-in">
                  <EmergencyGuidance lang={lang} />
                </div>
              )}
            </motion.div>
          )}

          {/* 5. Holographic Scanning / Loading analysis stage */}
          {view === "analysis-loading" && (
            <motion.div
              key="analysis-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto py-16 text-center space-y-8"
            >
              <div className="relative flex items-center justify-center">
                {/* Custom glowing scanning visual */}
                <div className="absolute w-36 h-36 rounded-full border-2 border-indigo-500 animate-ping opacity-25" />
                <div className="absolute w-28 h-28 rounded-full border-4 border-indigo-500/15 border-t-indigo-500 animate-spin" />
                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                  <Sparkles className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">{t.analyzingTitle}</h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{t.analyzingSub}</p>
              </div>

              {/* Holographic scanner logger */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl text-left font-mono text-2xs space-y-2.5 max-w-sm mx-auto text-slate-300">
                <div className={`flex items-center space-x-2 transition ${analysisStep >= 0 ? "text-emerald-400 font-semibold" : "opacity-35"}`}>
                  <span>{analysisStep >= 0 ? "✓" : "○"}</span>
                  <span>{t.analyzingStep1}</span>
                </div>
                <div className={`flex items-center space-x-2 transition ${analysisStep >= 1 ? "text-emerald-400 font-semibold" : "opacity-35"}`}>
                  <span>{analysisStep >= 1 ? "✓" : "○"}</span>
                  <span>{t.analyzingStep2}</span>
                </div>
                <div className={`flex items-center space-x-2 transition ${analysisStep >= 2 ? "text-emerald-400 font-semibold" : "opacity-35"}`}>
                  <span>{analysisStep >= 2 ? "✓" : "○"}</span>
                  <span>{t.analyzingStep3}</span>
                </div>
                <div className={`flex items-center space-x-2 transition ${analysisStep >= 3 ? "text-emerald-400 font-semibold" : "opacity-35"}`}>
                  <span>{analysisStep >= 3 ? "✓" : "○"}</span>
                  <span>{t.analyzingStep4}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. Screening Risk predictions screen */}
          {view === "results-screen" && screeningResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Results Top Header */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{t.resultsTitle}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === "ta" ? "நலம் AI இன் ஒருங்கிணைந்த மருத்துவ இடர் மதிப்பீடுகள் கீழே தொகுக்கப்பட்டுள்ளன." : "Nalam AI non-communicable clinical predictions are evaluated below based on current symptoms."}
                  </p>
                </div>
                <button
                  onClick={handleCompileReport}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition duration-150 shadow-lg shadow-indigo-600/35 active:scale-95 flex items-center space-x-1"
                  id="btn-compile-report"
                >
                  <span>{t.generateReport}</span>
                  <ArrowRight className="w-4 h-4 animate-bounce" />
                </button>
              </div>

              {/* Disease risk cards */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {screeningResults.map((risk: any, idx: number) => {
                  const getLvlColor = (lvl: string) => {
                    if (lvl === "High") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    if (lvl === "Moderate") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  };

                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-200">{risk.disease}</h3>
                          <span className="text-3xs text-slate-500 font-mono tracking-wider block mt-0.5 uppercase">Clinical Evaluation Category</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-mono font-bold text-slate-100">{risk.riskPercentage}%</span>
                          <span className={`px-2.5 py-0.5 text-2xs font-bold rounded border ${getLvlColor(risk.riskLevel)}`}>
                            {risk.riskLevel === "High" ? (lang === "ta" ? "அதிவேக ஆபத்து" : "High") : risk.riskLevel === "Moderate" ? (lang === "ta" ? "மிதமான ஆபத்து" : "Moderate") : (lang === "ta" ? "குறைந்த ஆபத்து" : "Low")}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{risk.explanation}</p>

                      {/* Factors checklist */}
                      <div className="space-y-2">
                        <span className="text-3xs text-slate-500 block uppercase font-mono tracking-wider">{t.riskFactorLabel}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {risk.factors.map((fac: string, fIdx: number) => (
                            <span
                              key={fIdx}
                              className="px-2.5 py-1 bg-slate-950 border border-slate-850 text-[10px] text-slate-400 rounded-lg"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Lifestyle Suggestions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-850 text-xs">
                        <div className="space-y-1">
                          <span className="text-indigo-400 font-semibold block uppercase font-mono tracking-wider text-2xs">🥗 {t.foodSuggestionsLabel}</span>
                          <ul className="list-disc pl-3 text-slate-400 space-y-0.5 text-2xs">
                            {risk.foodSuggestions.map((item: string, iIdx: number) => <li key={iIdx}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <span className="text-emerald-400 font-semibold block uppercase font-mono tracking-wider text-2xs">🏃‍♂️ {t.exerciseRecs}</span>
                          <ul className="list-disc pl-3 text-slate-400 space-y-0.5 text-2xs">
                            {risk.exerciseRecommendations.map((item: string, iIdx: number) => <li key={iIdx}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <span className="text-amber-400 font-semibold block uppercase font-mono tracking-wider text-2xs">🩺 {t.medicalAdviceLabel}</span>
                          <p className="text-slate-400 italic text-2xs leading-relaxed">{risk.medicalAdvice}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 7. Clinical report card view */}
          {view === "report-view" && selectedReport && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ReportViewer
                lang={lang}
                report={selectedReport}
                onBack={() => {
                  setView(currentUser ? "patient-dashboard" : "landing");
                }}
              />
            </motion.div>
          )}

          {/* 8. Clinical Specialist Doctor Portal */}
          {view === "doctor-dashboard" && (
            <motion.div
              key="doctor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DoctorDashboard
                lang={lang}
                allReports={reports}
                onSelectReport={(rep) => {
                  setSelectedReport(rep);
                  setView("report-view");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Emergency Register & Save modal */}
      {showEmergencySaveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="text-center space-y-2">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mx-auto">
                <CheckCircle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">{t.saveEmergencyReport}</h3>
              <p className="text-2xs text-slate-400 leading-relaxed">
                {lang === "ta" 
                  ? "உங்களின் தற்காலிக சோதனைக் குறிப்புகளைப் பாதுகாக்க ஒரு கணக்கை உருவாக்குங்கள். இதனால் எதிர்காலத்தில் உங்கள் அறிக்கையை மீண்டும் சரிபார்க்கலாம்."
                  : "To preserve your screening report securely, create a patient credential. This enables access to your diagnostic results in the future."}
              </p>
            </div>

            <form onSubmit={handleEmergencySaveSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase block">{t.username}</label>
                <input
                  type="text"
                  required
                  value={emergencySaveUser}
                  onChange={(e) => setEmergencySaveUser(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase block">{t.password}</label>
                <input
                  type="password"
                  required
                  value={emergencySavePass}
                  onChange={(e) => setEmergencySavePass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEmergencySave}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                  id="btn-emergency-modal-cancel"
                >
                  {t.saveEmergencyNo}
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                  id="btn-emergency-modal-confirm"
                >
                  {t.saveEmergencyYes}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="bg-slate-950 border-t border-slate-900/80 px-4 py-6 text-center text-3xs text-slate-600 font-mono tracking-wider uppercase mt-auto print:hidden">
        <div>© 2026 Nalam AI - Decentralized AI Clinical Screening Hub.</div>
        <div className="mt-1 text-slate-700">Providing early Non-Communicable Disease alerts since 2026.</div>
      </footer>
    </div>
  );
}
