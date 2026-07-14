/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, ArrowRight, Save, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { translations } from "../data/translations";
import { Language, ScreeningSession } from "../types";

// Extracted emergency keywords for English and Tamil
const EMERGENCY_KEYWORDS_EN = [
  "chest pain", "chest tightness", "angina", "shortness of breath", "breathing difficulty", 
  "difficulty breathing", "suffocating", "stroke", "numbness", "paralysis", "slurred speech", 
  "vision loss", "severe headache", "heart attack", "choking", "gasping"
];

const EMERGENCY_KEYWORDS_TA = [
  "நெஞ்சு வலி", "நெஞ்சடைப்பு", "மூச்சுத் திணறல்", "மூச்சு முட்டல்", "பக்கவாதம்", "பேச்சு தடுமாற்றம்", 
  "கை கால் செயலிழப்பு", "வாய் கோணுதல்", "நெஞ்சு பாரம்", "மூச்சு விட முடியவில்லை"
];

interface VoiceAssistantProps {
  lang: Language;
  session: ScreeningSession;
  onUpdateSession: (updated: ScreeningSession) => void;
  onComplete: (answers: ScreeningSession["answers"]) => void;
  onEmergencyTriggered: (triggered: boolean) => void;
  onQuit: () => void;
}

export default function VoiceAssistant({
  lang,
  session,
  onUpdateSession,
  onComplete,
  onEmergencyTriggered,
  onQuit,
}: VoiceAssistantProps) {
  const t = translations[lang];

  // Map indexes to answer keys
  const questionKeys: (keyof ScreeningSession["answers"])[] = [
    "age",
    "gender",
    "height",
    "weight",
    "bloodPressure",
    "diabetesHistory",
    "familyHistory",
    "smoking",
    "alcohol",
    "physicalActivity",
    "currentSymptoms",
    "diet",
    "sleep",
    "stress",
    "emergencySymptoms",
  ];

  const currentKey = questionKeys[session.currentQuestionIndex];

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [micBlocked, setMicBlocked] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOptions([]);
  }, [session.currentQuestionIndex]);

  const optionTranslations: Record<string, { en: string; ta: string }> = {
    // Gender
    "Male": { en: "Male", ta: "ஆண்" },
    "Female": { en: "Female", ta: "பெண்" },
    "Other": { en: "Other", ta: "இதர" },
    
    // Diagnosed Yes/No/Don't Know
    "Yes": { en: "Yes", ta: "ஆம்" },
    "No": { en: "No", ta: "இல்லை" },
    "Don't Know": { en: "Don't Know", ta: "தெரியாது" },

    // Family History
    "Diabetes": { en: "Diabetes", ta: "நீரிழிவு நோய்" },
    "High Blood Pressure": { en: "High Blood Pressure", ta: "உயர் இரத்த அழுத்தம்" },
    "Heart Disease": { en: "Heart Disease", ta: "இதய நோய்" },
    "Stroke": { en: "Stroke", ta: "பக்கவாதம்" },
    "Kidney Disease": { en: "Kidney Disease", ta: "சிறுநீரக நோய்" },
    "None": { en: "None", ta: "யாருக்கும் இல்லை" },

    // Smoking
    "Never": { en: "Never", ta: "ஒருபோதும் இல்லை" },
    "Former Smoker": { en: "Former Smoker", ta: "முன்பு புகைபிடித்தவர்" },
    "Occasionally": { en: "Occasionally", ta: "எப்போதாவது" },
    "Daily": { en: "Daily", ta: "தினமும்" },

    // Alcohol
    "Weekly": { en: "Weekly", ta: "வாரம் ஒருமுறை" },

    // Physical Activity
    "3–5 days/week": { en: "3–5 days/week", ta: "வாரம் 3-5 நாட்கள்" },
    "1–2 days/week": { en: "1–2 days/week", ta: "வாரம் 1-2 நாட்கள்" },
    "Rarely": { en: "Rarely", ta: "அரிதாக" },

    // Symptoms
    "Chest Pain": { en: "Chest Pain", ta: "நெஞ்சு வலி" },
    "Shortness of Breath": { en: "Shortness of Breath", ta: "மூச்சுத் திணறல்" },
    "Frequent Urination": { en: "Frequent Urination", ta: "அடிக்கடி சிறுநீர் கழித்தல்" },
    "Excessive Thirst": { en: "Excessive Thirst", ta: "அதிக தாகம்" },
    "Frequent Headache": { en: "Frequent Headache", ta: "அடிக்கடி தலைவலி" },
    "Blurred Vision": { en: "Blurred Vision", ta: "மங்கலான பார்வை" },
    "Swelling in Feet": { en: "Swelling in Feet", ta: "பாதங்களில் வீக்கம்" },
    "Fatigue": { en: "Fatigue", ta: "சோர்வு" },
    "Numbness in Hands or Feet": { en: "Numbness in Hands or Feet", ta: "கை அல்லது காலல்களில் மரத்துப்போதல்" },

    // Diet
    "Healthy": { en: "Healthy", ta: "ஆரோக்கியமானது" },
    "Average": { en: "Average", ta: "சாதாரணமானது" },
    "Mostly Processed/Junk Food": { en: "Mostly Processed/Junk Food", ta: "பெரும்பாலும் பதப்படுத்தப்பட்ட/ஜங்க் உணவுகள்" },

    // Sleep
    "Less than 5": { en: "Less than 5", ta: "5 மணி நேரத்திற்கும் குறைவாக" },
    "5–6": { en: "5–6", ta: "5-6 மணி நேரம்" },
    "7–8": { en: "7–8", ta: "7-8 மணி நேரம்" },
    "More than 8": { en: "More than 8", ta: "8 மணி நேரத்திற்கும் அதிகமாக" },

    // Stress
    "Low": { en: "Low", ta: "குறைவு" },
    "Moderate": { en: "Moderate", ta: "மிதமானது" },
    "High": { en: "High", ta: "அதிகம்" },

    // Emergency Symptoms
    "Severe Chest Pain": { en: "Severe Chest Pain", ta: "கடுமையான நெஞ்சு வலி" },
    "Difficulty Breathing": { en: "Difficulty Breathing", ta: "மூச்சு விடுவதில் சிரமம்" },
    "Sudden Weakness on one side": { en: "Sudden Weakness on one side", ta: "ஒரு பக்கத்தில் திடீர் பலவீனம்/முடக்கம்" },
    "Loss of Speech": { en: "Loss of Speech", ta: "பேச முடியாமல் போதல்" },
    "Loss of Consciousness": { en: "Loss of Consciousness", ta: "மயக்கம் / சுயநினைவு இழப்பு" }
  };

  const getOptionLabel = (option: string) => {
    return optionTranslations[option]?.[lang] || option;
  };

  const getQuestionOptions = (key: string): string[] => {
    switch (key) {
      case "age":
        return ["25", "35", "45", "55", "65"];
      case "gender":
        return ["Male", "Female", "Other"];
      case "height":
        return ["150", "160", "170", "180"];
      case "weight":
        return ["50", "60", "70", "80", "90"];
      case "bloodPressure":
      case "diabetesHistory":
        return ["Yes", "No", "Don't Know"];
      case "familyHistory":
        return ["Diabetes", "High Blood Pressure", "Heart Disease", "Stroke", "Kidney Disease", "None"];
      case "smoking":
        return ["Never", "Former Smoker", "Occasionally", "Daily"];
      case "alcohol":
        return ["Never", "Occasionally", "Weekly", "Daily"];
      case "physicalActivity":
        return ["Daily", "3–5 days/week", "1–2 days/week", "Rarely", "Never"];
      case "currentSymptoms":
        return ["Chest Pain", "Shortness of Breath", "Frequent Urination", "Excessive Thirst", "Frequent Headache", "Blurred Vision", "Swelling in Feet", "Fatigue", "Numbness in Hands or Feet", "None"];
      case "diet":
        return ["Healthy", "Average", "Mostly Processed/Junk Food"];
      case "sleep":
        return ["Less than 5", "5–6", "7–8", "More than 8"];
      case "stress":
        return ["Low", "Moderate", "High"];
      case "emergencySymptoms":
        return ["Severe Chest Pain", "Difficulty Breathing", "Sudden Weakness on one side", "Loss of Speech", "Loss of Consciousness", "None"];
      default:
        return [];
    }
  };

  const isMultipleSelection = ["familyHistory", "currentSymptoms", "emergencySymptoms"].includes(currentKey);

  const handleOptionClick = (option: string, isMultiple: boolean) => {
    if (!isMultiple) {
      handleAnswerSubmit(option);
      return;
    }

    setSelectedOptions((prev) => {
      if (option === "None") {
        return ["None"];
      }
      
      const newSelections = prev.filter((o) => o !== "None");
      if (newSelections.includes(option)) {
        return newSelections.filter((o) => o !== option);
      } else {
        return [...newSelections, option];
      }
    });
  };

  // Recognition reference
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== "undefined" ? window.speechSynthesis : null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Keep track of states for event listener callbacks without stale closure issues
  const isSpeakingRef = useRef(isSpeaking);
  const voiceMutedRef = useRef(voiceMuted);
  const micBlockedRef = useRef(micBlocked);
  const isListeningRef = useRef(isListening);
  const isCompletedRef = useRef(session.isCompleted);
  const manuallyStoppedRef = useRef(false);

  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { voiceMutedRef.current = voiceMuted; }, [voiceMuted]);
  useEffect(() => { micBlockedRef.current = micBlocked; }, [micBlocked]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isCompletedRef.current = session.isCompleted; }, [session.isCompleted]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === "ta" ? "ta-IN" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTextInputValue(resultText);
        // Reset manual stop on getting an answer
        manuallyStoppedRef.current = false;
        handleAnswerSubmit(resultText);
      };

      rec.onerror = (event: any) => {
        console.warn("Speech Recognition Warning:", event.error);
        setIsListening(false);
        if (event.error === "no-speech") {
          // Silent warning, no-speech is expected when user waits
        } else if (event.error === "not-allowed" || event.error === "permission-denied" || event.error === "service-not-allowed") {
          setMicBlocked(true);
          setRecognitionError(
            lang === "ta"
              ? "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் அனுமதியை வழங்கவும், அல்லது கீழே உள்ள தட்டச்சுப் பெட்டி மூலம் நேரடியாகப் பதிலளிக்கவும்."
              : "Microphone permission is blocked or not allowed. Please allow microphone access in your browser settings, or use the text backup box below to type your answer directly."
          );
        } else {
          setRecognitionError(event.error);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Keep microphone permanently enabled: auto-restart if we should be listening,
        // assistant is not speaking, microphone is allowed, and session is not completed.
        setTimeout(() => {
          if (
            !manuallyStoppedRef.current &&
            !isSpeakingRef.current &&
            !micBlockedRef.current &&
            !isCompletedRef.current &&
            recognitionRef.current
          ) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              // already active or failed silently
            }
          }
        }, 150);
      };

      recognitionRef.current = rec;
    } else {
      setRecognitionError(lang === "ta" ? "உங்கள் உலாவி பேச்சு அங்கீகாரத்தை ஆதரிக்கவில்லை." : "Speech recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang]);

  // Read current question when index or language changes, or voice muted status toggles
  useEffect(() => {
    // Reset manual stop when the question changes so listening starts automatically
    manuallyStoppedRef.current = false;

    if (voiceMuted) {
      // If voice is muted, we skip speaking and immediately start the permanently enabled microphone
      stopSpeaking();
      setTimeout(() => {
        if (!isListeningRef.current && !micBlockedRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // already started
          }
        }
      }, 300);
    } else {
      speakQuestion();
    }

    return () => {
      stopSpeaking();
    };
  }, [session.currentQuestionIndex, lang, voiceMuted]);

  const getQuestionText = (): string => {
    const key = `q_${currentKey}` as keyof typeof t;
    return (t[key] as string) || "";
  };

  const speakQuestion = () => {
    if (voiceMuted || !synthRef.current) return;

    stopSpeaking();

    const text = getQuestionText();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ta" ? "ta-IN" : "en-US";

    // Attempt to locate a native or high quality voice for the selected language
    if (synthRef.current.getVoices) {
      const voices = synthRef.current.getVoices();
      const targetVoice = voices.find(
        (v) => v.lang.startsWith(lang === "ta" ? "ta" : "en")
      );
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Automatically start listening after the question is asked, if speech recognition is available and not blocked
      setTimeout(() => {
        if (!manuallyStoppedRef.current && !isListeningRef.current && !micBlockedRef.current && !isCompletedRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // already listening or failed
          }
        }
      }, 150);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleListening = async () => {
    if (isListening) {
      manuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      manuallyStoppedRef.current = false;
      stopSpeaking();
      setMicBlocked(false);
      setRecognitionError(null);
      if (recognitionRef.current) {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(track => track.stop());
            } catch (mediaError: any) {
              console.warn("Microphone media device permission denied:", mediaError);
              setMicBlocked(true);
              setRecognitionError(
                lang === "ta"
                  ? "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் அனுமதியை வழங்கவும், அல்லது கீழே உள்ள தட்டச்சுப் பெட்டி மூலம் நேரடியாகப் பதிலளிக்கவும்."
                  : "Microphone permission is blocked or not allowed. Please allow microphone access in your browser settings, or use the text backup box below to type your answer directly."
              );
              return;
            }
          }
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition start failed gracefully:", e);
        }
      } else {
        setRecognitionError(lang === "ta" ? "குரல் தட்டச்சு கிடைக்கவில்லை" : "Voice input is unavailable");
      }
    }
  };

  const toggleMute = () => {
    if (!voiceMuted) {
      stopSpeaking();
      setVoiceMuted(true);
    } else {
      setVoiceMuted(false);
      // Wait a little bit then speak
      setTimeout(() => {
        speakQuestion();
      }, 100);
    }
  };

  // Process the user's input, check for emergency, save progress
  const handleAnswerSubmit = (value: string) => {
    if (!value.trim()) return;

    const text = value.trim();
    setTextInputValue("");

    // Check emergency triggers immediately
    checkEmergencySymptom(text);

    // Parse the value into appropriate fields
    const updatedAnswers = { ...session.answers };

    if (currentKey === "age") {
      const parsedAge = parseInt(text.replace(/\D/g, ""));
      updatedAnswers.age = isNaN(parsedAge) ? 45 : parsedAge; // fallback to 45 if invalid
    } else if (currentKey === "gender") {
      updatedAnswers.gender = text;
    } else if (currentKey === "height") {
      const parsedHeight = parseFloat(text.replace(/[^\d.]/g, ""));
      updatedAnswers.height = isNaN(parsedHeight) ? 165 : parsedHeight;
    } else if (currentKey === "weight") {
      const parsedWeight = parseFloat(text.replace(/[^\d.]/g, ""));
      updatedAnswers.weight = isNaN(parsedWeight) ? 70 : parsedWeight;
    } else if (currentKey === "bloodPressure") {
      updatedAnswers.bloodPressure = text;
    } else if (currentKey === "diabetesHistory") {
      updatedAnswers.diabetesHistory = text;
    } else if (currentKey === "smoking") {
      updatedAnswers.smoking = text;
    } else if (currentKey === "alcohol") {
      updatedAnswers.alcohol = text;
    } else if (currentKey === "physicalActivity") {
      updatedAnswers.physicalActivity = text;
    } else if (currentKey === "currentSymptoms") {
      updatedAnswers.currentSymptoms = text;
    } else if (currentKey === "diet") {
      updatedAnswers.diet = text;
    } else if (currentKey === "sleep") {
      updatedAnswers.sleep = text;
    } else if (currentKey === "stress") {
      updatedAnswers.stress = text;
    } else if (currentKey === "familyHistory") {
      updatedAnswers.familyHistory = text.split(/[,orமற்றும்]/).map((s) => s.trim()).filter(Boolean);
    } else if (currentKey === "emergencySymptoms") {
      updatedAnswers.emergencySymptoms = text.split(/[,orமற்றும்]/).map((s) => s.trim()).filter(Boolean);
    }

    const nextIndex = session.currentQuestionIndex + 1;
    const isCompleted = nextIndex >= questionKeys.length;

    const updatedSession: ScreeningSession = {
      ...session,
      currentQuestionIndex: isCompleted ? session.currentQuestionIndex : nextIndex,
      answers: updatedAnswers,
      lastUpdated: new Date().toISOString(),
      isCompleted: isCompleted,
    };

    onUpdateSession(updatedSession);

    if (isCompleted) {
      stopSpeaking();
      onComplete(updatedAnswers);
    }
  };

  const checkEmergencySymptom = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check English triggers
    const hasEnEmergency = EMERGENCY_KEYWORDS_EN.some(keyword => lowerText.includes(keyword));
    // Check Tamil triggers
    const hasTaEmergency = EMERGENCY_KEYWORDS_TA.some(keyword => lowerText.includes(keyword));

    if (hasEnEmergency || hasTaEmergency) {
      onEmergencyTriggered(true);
    }
  };

  const handleStepBack = () => {
    if (session.currentQuestionIndex > 0) {
      const updatedSession: ScreeningSession = {
        ...session,
        currentQuestionIndex: session.currentQuestionIndex - 1,
        lastUpdated: new Date().toISOString(),
      };
      onUpdateSession(updatedSession);
    }
  };

  const skipQuestion = () => {
    handleAnswerSubmit(lang === "ta" ? "தெரியாது / இல்லை" : "Not applicable / No");
  };

  return (
    <div id="voice-assistant-panel" className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-[32px] border border-indigo-500/20 p-10 flex flex-col items-center justify-center relative overflow-hidden max-w-2xl mx-auto shadow-2xl">
      {/* Decorative pulse blur in background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px]" />

      {/* Header controls */}
      <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs tracking-wider text-slate-400 uppercase">
            {t.voiceAssistantTitle} ({session.currentQuestionIndex + 1}/{questionKeys.length})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-xl border transition duration-200 ${
              voiceMuted
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
            id="btn-voice-mute"
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onQuit}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition duration-200"
            id="btn-voice-save-quit"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.quitScreening}</span>
          </button>
        </div>
      </div>

      {/* Main Voice Hub Visualizer */}
      <div className="flex flex-col items-center justify-center my-8 py-4 relative z-10">
        <div className="relative flex items-center justify-center mb-6">
          {/* Pulsing ring 1 */}
          <div
            className={`absolute w-32 h-32 rounded-full border transition-all duration-1000 ${
              isListening
                ? "border-cyan-400/40 animate-ping scale-150"
                : isSpeaking
                ? "border-emerald-400/40 animate-pulse scale-125"
                : "border-slate-800"
            }`}
          />
          {/* Pulsing ring 2 */}
          <div
            className={`absolute w-24 h-24 rounded-full border transition-all duration-700 ${
              isListening
                ? "border-cyan-400/20 animate-pulse scale-110"
                : isSpeaking
                ? "border-emerald-400/20 animate-ping scale-110"
                : "border-slate-800"
            }`}
          />

          {/* Interactive Core Orb */}
          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 relative z-10 ${
              isListening
                ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-cyan-500/35"
                : isSpeaking
                ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-emerald-500/35 animate-pulse"
                : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-indigo-600/30"
            }`}
            id="voice-assistant-orb"
          >
            {isListening ? (
              <Mic className="w-8 h-8 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-8 h-8 animate-bounce" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Dynamic status texts */}
        <span className="font-mono text-xs tracking-wide uppercase text-slate-500 mb-2">
          {isListening ? t.listening : isSpeaking ? t.speaking : t.assistantIdle}
        </span>

        {recognitionError && (
          <div className="text-rose-400 text-xs px-4 py-1.5 bg-rose-950/20 border border-rose-900/30 rounded-lg text-center max-w-md animate-fade-in mt-1 mb-3">
            {recognitionError}
          </div>
        )}
      </div>

      {/* Question Text Box */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 mb-6 relative z-10">
        <p className="text-lg md:text-xl font-sans font-medium text-slate-100 leading-relaxed text-center">
          {getQuestionText()}
        </p>
      </div>

      {/* Answer Inputs (Text Backup + Manual Override) */}
      <div className="space-y-4 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnswerSubmit(textInputValue);
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            placeholder={t.textModePlaceholder}
            className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200"
            id="input-voice-manual"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition duration-200 flex items-center justify-center space-x-1 hover:shadow-lg active:scale-95"
            id="btn-voice-send"
          >
            <span>{t.sendText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Helper suggestions based on question */}
        <div className="flex flex-col items-center w-full py-1">
          <div className="flex flex-wrap gap-2 justify-center w-full">
            {getQuestionOptions(currentKey).map((opt) => {
              const isSelected = isMultipleSelection
                ? selectedOptions.includes(opt)
                : false;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionClick(opt, isMultipleSelection)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition duration-150 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-md"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  }`}
                >
                  {getOptionLabel(opt)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={skipQuestion}
              className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-300 rounded-lg border border-dashed border-slate-700/80 transition duration-150"
            >
              {lang === "ta" ? "தவிர்" : "Skip"}
            </button>
          </div>

          {isMultipleSelection && (
            <button
              type="button"
              onClick={() => {
                const answerStr = selectedOptions.length > 0 ? selectedOptions.join(", ") : "None";
                handleAnswerSubmit(answerStr);
              }}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center space-x-1"
            >
              <span>{lang === "ta" ? "பதிலை உறுதிசெய்" : "Confirm Answer"}</span>
              {selectedOptions.length > 0 && (
                <span className="bg-emerald-800 text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1 font-bold">
                  {selectedOptions.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Navigation Back */}
        <div className="flex justify-between items-center pt-2 text-slate-400">
          <button
            onClick={handleStepBack}
            disabled={session.currentQuestionIndex === 0}
            className={`flex items-center space-x-1.5 text-xs font-medium transition duration-200 ${
              session.currentQuestionIndex === 0
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-400 hover:text-indigo-400"
            }`}
            id="btn-voice-back"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === "ta" ? "முந்தைய கேள்வி" : "Previous Question"}</span>
          </button>
          
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === "ta" ? "குரல் தரவு குறியாக்கம் செய்யப்பட்டுள்ளது" : "Voice and health metrics securely processed"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
