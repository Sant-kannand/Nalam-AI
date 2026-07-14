/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY environment variable is missing or empty. Using offline clinical rules fallback.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// Clinical Offline Rules Engine (Robust Fallback)
// ----------------------------------------------------
function calculateFallbackRisks(data: any, lang: "en" | "ta") {
  const age = parseInt(data.age) || 45;
  const isMale = String(data.gender).toLowerCase().includes("m") || String(data.gender).toLowerCase().includes("ஆ");
  const height = parseFloat(data.height) || 165;
  const weight = parseFloat(data.weight) || 70;
  
  const bpDiag = String(data.bloodPressure || "").toLowerCase();
  const bpYes = bpDiag.includes("yes") || bpDiag.includes("ஆம்");
  
  const systolic = bpYes ? 145 : 118;
  const diastolic = bpYes ? 92 : 75;
  const bp = bpYes ? "145/92" : "118/75";

  const diabetesHist = String(data.diabetesHistory).toLowerCase().includes("ye") || String(data.diabetesHistory).toLowerCase().includes("ஆம்") || String(data.diabetesHistory).toLowerCase().includes("y");
  const smoking = String(data.smoking || "").toLowerCase();
  const alcohol = String(data.alcohol || "").toLowerCase();
  const symptoms = String(data.currentSymptoms || "").toLowerCase();
  const emergency = String(data.emergencySymptoms ? (Array.isArray(data.emergencySymptoms) ? data.emergencySymptoms.join(", ") : data.emergencySymptoms) : "").toLowerCase();

  // Calculate BMI
  const bmi = weight / Math.pow(height / 100, 2);

  // Symptom Flags
  const chestPain = symptoms.includes("chest") || symptoms.includes("நெஞ்சு") || symptoms.includes("வலி") || emergency.includes("chest") || emergency.includes("நெஞ்சு") || emergency.includes("வலி");
  const breathing = symptoms.includes("breath") || symptoms.includes("மூச்சு") || symptoms.includes("திணறல்") || emergency.includes("breath") || emergency.includes("மூச்சு") || emergency.includes("திணறல்");
  const weakness = symptoms.includes("weak") || symptoms.includes("பக்கவாதம்") || symptoms.includes("முடக்கம்") || emergency.includes("weak") || emergency.includes("பக்கவாதம்") || emergency.includes("முடக்கம்");

  // 1. Diabetes Risk
  let diabPct = 15;
  if (bmi > 25) diabPct += 25;
  if (diabetesHist) diabPct += 40;
  if (age > 45) diabPct += 15;
  diabPct = Math.min(95, diabPct);
  const diabLvl = diabPct > 70 ? "High" : diabPct > 35 ? "Moderate" : "Low";

  // 2. Hypertension Risk
  let hyperPct = 20;
  if (bpYes) hyperPct += 45;
  if (bmi > 25) hyperPct += 15;
  if (smoking.includes("daily") || smoking.includes("active") || smoking.includes("occasionally") || smoking.includes("எப்போதாவது") || smoking.includes("ஆம்")) hyperPct += 15;
  hyperPct = Math.min(95, hyperPct);
  const hyperLvl = hyperPct > 70 ? "High" : hyperPct > 35 ? "Moderate" : "Low";

  // 3. Heart Disease Risk
  let heartPct = 15;
  if (bpYes) heartPct += 20;
  if (smoking.includes("daily") || smoking.includes("active") || smoking.includes("occasionally")) heartPct += 15;
  if (chestPain) heartPct += 35;
  if (age > 55) heartPct += 10;
  heartPct = Math.min(95, heartPct);
  const heartLvl = heartPct > 70 ? "High" : heartPct > 35 ? "Moderate" : "Low";

  // 4. Stroke Risk
  let strokePct = 10;
  if (bpYes) strokePct += 25;
  if (weakness) strokePct += 40;
  if (smoking.includes("daily") || smoking.includes("active") || smoking.includes("occasionally")) strokePct += 15;
  strokePct = Math.min(95, strokePct);
  const strokeLvl = strokePct > 70 ? "High" : strokePct > 35 ? "Moderate" : "Low";

  // 5. CKD Risk
  let ckdPct = 10;
  if (diabetesHist) ckdPct += 25;
  if (bpYes) ckdPct += 20;
  if (age > 60) ckdPct += 15;
  ckdPct = Math.min(95, ckdPct);
  const ckdLvl = ckdPct > 70 ? "High" : ckdPct > 35 ? "Moderate" : "Low";

  const buildRiskObj = (disease: string, pct: number, lvl: "High" | "Moderate" | "Low", explanation: string, factors: string[], explainableAI: any[], lifestyle: string[], food: string[], exercise: string[], advice: string) => ({
    disease,
    riskPercentage: pct,
    riskLevel: lvl,
    explanation,
    factors,
    explainableAI,
    lifestyleRecommendations: lifestyle,
    foodSuggestions: food,
    exerciseRecommendations: exercise,
    medicalAdvice: advice
  });

  if (lang === "ta") {
    return [
      buildRiskObj(
        "Diabetes",
        diabPct,
        diabLvl,
        diabetesHist 
          ? "உங்களுக்கு நீரிழிவு நோய் வரலாறு இருப்பதால் ஆபத்து அதிகமாக உள்ளது. ஆரோக்கியமான உணவு வழிகள் அவசியம்."
          : `உங்கள் உடல் நிறை குறியீட்டெண் ${bmi.toFixed(1)} ஆக உள்ளது, இது நீரிழிவு நோய்க்கான வாய்ப்பை ஓரளவு மாற்றியமைக்கிறது.`,
        [diabetesHist ? "குடும்ப நீரிழிவு வரலாறு" : "BMI காரணி", "வயது வரம்பு"],
        [
          { factor: "நீரிழிவு குடும்ப பின்னணி", impact: diabetesHist ? "positive" : "negative", weight: diabetesHist ? 40 : 5 },
          { factor: "உடல் நிறை குறியீடு (BMI)", impact: bmi > 25 ? "positive" : "negative", weight: bmi > 25 ? 25 : 10 }
        ],
        ["தினமும் 30 நிமிடங்கள் வேகமாக நடக்கவும்", "மன அழுத்தத்தைக் குறைக்கவும்"],
        ["சர்க்கரை கலந்த உணவுகள் மற்றும் சுத்திகரிக்கப்பட்ட மாவுச்சத்தை தவிர்க்கவும்", "நார்ச்சத்து நிறைந்த கீரைகளை உட்கொள்ளுங்கள்"],
        ["வழக்கமான நடைப்பயிற்சி மற்றும் யோகா", "மிதமான கார்டியோ பயிற்சிகள்"],
        "வழக்கமான இரத்த சர்க்கரை அளவைச் சரிபார்த்து மருத்துவரை அணுகவும்."
      ),
      buildRiskObj(
        "Hypertension",
        hyperPct,
        hyperLvl,
        `உங்களின் இரத்த அழுத்தம் ${bp} mmHg ஆக உள்ளதால் உயர் இரத்த அழுத்த அபாயம் உள்ளது.`,
        [systolic > 130 ? "அதிக இரத்த அழுத்தம்" : "இயல்பான இரத்த அழுத்தம்", "உப்பு நுகர்வு"],
        [
          { factor: "இரத்த அழுத்த அளவீடுகள்", impact: systolic > 130 ? "positive" : "negative", weight: systolic > 130 ? 45 : 10 },
          { factor: "புகைபிடித்தல் தாக்கம்", impact: smoking.includes("active") ? "positive" : "negative", weight: smoking.includes("active") ? 15 : 5 }
        ],
        ["உப்பு நுகர்வை குறைக்கவும்", "போதுமான தூக்கம் மற்றும் தியானம்"],
        ["பொட்டாசியம் நிறைந்த வாழைப்பழங்கள்", "எண்ணெய் மற்றும் கொழுப்பு உணவுகளை குறைக்கவும்"],
        ["மிதமான யோகா பயிற்சிகள்", "தினசரி நடைப்பயிற்சி"],
        "இரத்த அழுத்தத்தை வாரம் ஒருமுறை பரிசோதித்து, உப்பை வெகுவாக குறைக்கவும்."
      ),
      buildRiskObj(
        "Heart Disease",
        heartPct,
        heartLvl,
        chestPain 
          ? "நெஞ்சு வலி அறிகுறிகள் இருப்பதால் தீவிர இதய நோய் ஆபத்து. உடனடியாக மருத்துவரை அணுக வேண்டும்."
          : "தற்போது இதயம் தொடர்பான தீவிர அறிகுறிகள் ஏதுமில்லை, எனினும் ஆரோக்கியமான வாழ்க்கை முறை தொடர வேண்டும்.",
        [chestPain ? "நெஞ்சு வலி அறிகுறி" : "நெஞ்சு வலி இல்லை", "இருதய இரத்த ஓட்டம்"],
        [
          { factor: "அனுபவித்த அறிகுறிகள்", impact: chestPain ? "positive" : "negative", weight: chestPain ? 35 : 0 },
          { factor: "இரத்த அழுத்தம் தாக்கம்", impact: systolic > 140 ? "positive" : "negative", weight: systolic > 140 ? 20 : 10 }
        ],
        ["புகைபிடித்தலை நிறுத்துங்கள்", "எண்ணெய் பலகாரங்களைத் தவிர்க்கவும்"],
        ["பூண்டு மற்றும் ஒமேகா-3 நிறைந்த மீன்கள்", "பச்சை இலை காய்கறிகள்"],
        ["வழக்கமான கார்டியோ பயிற்சிகள்", "இயல்பான நடை பயிற்சி"],
        chestPain ? "அவசரமாக இதய மருத்துவரை அணுகி ECG மற்றும் Troponin பரிசோதனை செய்யவும்." : "ஆரோக்கியமான கொழுப்பு உணவுகளை உட்கொண்டு இதயத்தைப் பாதுகாக்கவும்."
      ),
      buildRiskObj(
        "Stroke",
        strokePct,
        strokeLvl,
        weakness 
          ? "கை கால் செயலிழப்பு அல்லது தசை பலவீனம் இருப்பதால் பக்கவாத ஆபத்து அதிகமாக உள்ளது. அவசர சிகிச்சை தேவை."
          : "தற்போது பக்கவாதத்திற்கான நரம்பியல் அறிகுறிகள் ஏதுமில்லை.",
        [weakness ? "நரம்பியல் தசை பலவீனம்" : "நரம்பியல் அறிகுறிகள் இல்லை", "மூளை இரத்த ஓட்டம்"],
        [
          { factor: "தசை பலவீனம் / பேச்சு தடுமாற்றம்", impact: weakness ? "positive" : "negative", weight: weakness ? 40 : 0 },
          { factor: "இரத்த அழுத்தம் குறியீடு", impact: systolic > 140 ? "positive" : "negative", weight: systolic > 140 ? 25 : 10 }
        ],
        ["இரத்த அழுத்தத்தை எப்போதும் கட்டுப்பாட்டில் வைக்கவும்", "மது அருந்துவதை முழுமையாக தவிர்க்கவும்"],
        ["முழு தானியங்கள் மற்றும் நட்ஸ் வகைகள்", "உப்பு மற்றும் காரத்தை குறைக்கவும்"],
        ["கை மற்றும் கால்களுக்கான எளிய உடற்பயிற்சிகள்", "சுறுசுறுப்பான செயல்பாடுகள்"],
        weakness ? "நரம்பியல் மருத்துவரை உடனடியாக அணுகவும். பக்கவாதத்தின் முதல் சில மணிநேரங்கள் மிக முக்கியமானவை." : "இரத்த அழுத்தத்தை சீராக வைத்திருப்பதன் மூலம் பக்கவாதத்தை முழுமையாக தடுக்கலாம்."
      ),
      buildRiskObj(
        "Chronic Kidney Disease",
        ckdPct,
        ckdLvl,
        diabetesHist 
          ? "நீரிழிவு நோய் சிறுநீரகங்களை பாதிக்க அதிக வாய்ப்புள்ளது, எனவே சிறுநீரகப் பாதுகாப்பு மிகவும் முக்கியம்."
          : "சிறுநீரகச் செயல்பாடுகள் சீராக இருக்க நிறைய தண்ணீர் குடிப்பது அவசியம்.",
        [diabetesHist ? "நீரிழிவு நோய் பாதிப்பு" : "நீரிழிவு இல்லை", "சிறுநீரக வடிகட்டுதல் விகிதம்"],
        [
          { factor: "நீரிழிவு வரலாறு", impact: diabetesHist ? "positive" : "negative", weight: diabetesHist ? 25 : 5 },
          { factor: "உயர் இரத்த அழுத்தம் குறியீடு", impact: systolic > 140 ? "positive" : "negative", weight: systolic > 140 ? 20 : 10 }
        ],
        ["தினமும் குறைந்தது 3 லிட்டர் தண்ணீர் குடிக்கவும்", "வலி நிவாரணி மாத்திரைகளை மருத்துவர் அனுமதியின்றி எடுக்க வேண்டாம்"],
        ["குறைந்த சோடியம் உணவுகள்", "நீர்ச்சத்து நிறைந்த வெள்ளரிக்காய், தர்பூசணி"],
        ["யோகாசனம் மற்றும் பிராணாயாமம்", "மிதமான உடற்பயிற்சிகள்"],
        "சிறுநீரகச் செயல்பாட்டைக் கண்காணிக்க சீரம் கிரியேட்டினின் மற்றும் சிறுநீர் பரிசோதனை செய்யவும்."
      )
    ];
  } else {
    return [
      buildRiskObj(
        "Diabetes",
        diabPct,
        diabLvl,
        diabetesHist
          ? "Higher risk profile due to a noted clinical history of Diabetes. Active monitoring of HbA1c is strongly advised."
          : `BMI of ${bmi.toFixed(1)} and present physiological features present a normal risk profile for Diabetes.`,
        [diabetesHist ? "Diabetes History" : "BMI Indicator", "Age Bracket"],
        [
          { factor: "Family/Personal Diabetes History", impact: diabetesHist ? "positive" : "negative", weight: diabetesHist ? 40 : 5 },
          { factor: "Body Mass Index (BMI)", impact: bmi > 25 ? "positive" : "negative", weight: bmi > 25 ? 25 : 10 }
        ],
        ["Walk for at least 30 minutes daily after meals", "Manage high mental stress levels"],
        ["Avoid sugary drinks, processed carbs, and refined flour", "Incorporate fiber-rich green vegetables"],
        ["Regular brisk walking or cycling", "Moderate yoga or aerobics"],
        "Check fasting blood glucose levels and consult a clinician."
      ),
      buildRiskObj(
        "Hypertension",
        hyperPct,
        hyperLvl,
        `Your Blood Pressure of ${bp} mmHg indicates cardiovascular load that may lead to High Blood Pressure.`,
        [systolic > 130 ? "Elevated Blood Pressure" : "Healthy Blood Pressure Range", "Sodium Intake"],
        [
          { factor: "Blood Pressure Reading", impact: systolic > 130 ? "positive" : "negative", weight: systolic > 130 ? 45 : 10 },
          { factor: "Smoking Impact", impact: smoking.includes("active") ? "positive" : "negative", weight: smoking.includes("active") ? 15 : 5 }
        ],
        ["Restrict raw dietary sodium intake", "Ensure 7-8 hours of quality sleep"],
        ["Consume potassium-rich foods like bananas", "Reduce saturated fats and fried snacks"],
        ["Deep breathing exercises (Pranayama)", "Moderate aerobic activities"],
        "Track blood pressure weekly and keep a salt-restricted dietary protocol."
      ),
      buildRiskObj(
        "Heart Disease",
        heartPct,
        heartLvl,
        chestPain
          ? "Chest discomfort or pain presents a high risk of coronary event. Immediate clinical checkup is mandatory."
          : "No active cardiovascular symptoms detected currently, but preventive parameters remain relevant.",
        [chestPain ? "Presented Chest Pain" : "No Chest Pain", "Cardio Circulation"],
        [
          { factor: "Symptom Presentation", impact: chestPain ? "positive" : "negative", weight: chestPain ? 35 : 0 },
          { factor: "Elevated BP Influence", impact: systolic > 140 ? "positive" : "negative", weight: systolic > 140 ? 20 : 10 }
        ],
        ["Stop active smoking immediately", "Adopt a low-fat diet plan"],
        ["Incorporate garlic, oats, and omega-3 sources", "Fresh green leafy salads"],
        ["Brisk cardiovascular exercises", "Regular walking or light jogging"],
        chestPain ? "Urgent cardiology consult. Perform an ECG and Cardiac Troponin test immediately." : "Adopt heart-healthy fat alternatives like olive oil."
      ),
      buildRiskObj(
        "Stroke",
        strokePct,
        strokeLvl,
        weakness
          ? "Reported motor weakness or slurred speech represents high risk of transient ischemic attack or stroke. Act fast."
          : "No active neurological symptoms or localized motor weakness presented.",
        [weakness ? "Localized Muscle Weakness" : "Normal Motor Function", "Cerebral Blood Flow"],
        [
          { factor: "Neurological Muscle Weakness", impact: weakness ? "positive" : "negative", weight: weakness ? 40 : 0 },
          { factor: "Vascular Blood Pressure", impact: systolic > 140 ? "positive" : "negative", weight: systolic > 140 ? 25 : 10 }
        ],
        ["Keep blood pressure highly controlled", "Limit or eliminate alcohol intake"],
        ["Whole grains, nuts, and seeds", "Low salt, balanced electrolyte intake"],
        ["Simple limb mobility and flexibility stretching", "Daily active lifestyle"],
        weakness ? "Immediate neurological emergency referral. TIME IS BRAIN - Seek nearest stroke triage center." : "Managing BP is the single most effective stroke prevention protocol."
      ),
      buildRiskObj(
        "Chronic Kidney Disease",
        ckdPct,
        ckdLvl,
        diabetesHist
          ? "Diabetes is a leading driver of nephropathy. Regular kidney filtration checks are vital."
          : "Optimal hydration is vital to assist glomerular filtration.",
        [diabetesHist ? "Diabetes Influence" : "Normal Glucose", "Glomerular Filtration Index"],
        [
          { factor: "Diabetes History", impact: diabetesHist ? "positive" : "negative", weight: diabetesHist ? 25 : 5 },
          { factor: "Hypertensive Nephric Load", impact: systolic > 140 ? "positive" : "negative", weight: systolic > 140 ? 20 : 10 }
        ],
        ["Maintain daily hydration of 2.5 - 3 Liters", "Avoid self-prescribed NSAID pain relievers"],
        ["Low-sodium diet", "Hydrating foods like cucumbers and watermelon"],
        ["Light yoga postures and stretching", "Gentle physical activity"],
        "Schedule a serum creatinine and urine microalbuminuria test annually."
      )
    ];
  }
}

// Helper function to handle calling Gemini with automatic retries and multi-model failover
async function generateContentWithRetry(ai: GoogleGenAI, options: any, maxRetries = 2, initialDelay = 1000): Promise<any> {
  const originalModel = options.model || "gemini-3.5-flash";
  // Fallback chain of alternative models if the primary model is unavailable
  const modelsToTry = [originalModel, "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const currentOptions = { ...options, model };
        return await ai.models.generateContent(currentOptions);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = String(error.message || error.status || "").toLowerCase();
        console.warn(`Gemini generateContent with model ${model} attempt ${attempt} failed: ${errorMessage}`);
        
        const isRetryable = 
          errorMessage.includes("503") || 
          errorMessage.includes("unavailable") || 
          errorMessage.includes("timeout") || 
          errorMessage.includes("fetch failed") || 
          errorMessage.includes("rate limit") || 
          errorMessage.includes("429");
          
        if (!isRetryable || attempt >= maxRetries) {
          // If not retryable or max retries exceeded, proceed to next model in chain
          break;
        }
        
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying Gemini request with model ${model} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("All Gemini models in failover chain returned errors.");
}

// ----------------------------------------------------
// AI SCREENING API ENDPOINT (Using Gemini 3.5 Flash)
// ----------------------------------------------------
app.post("/api/analyze-symptoms", async (req, res) => {
  const { data, lang = "en" } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: "Missing clinical patient screening data parameters." });
  }

  const ai = getGeminiClient();
  
  // If no Gemini client, run fallback rules immediately for seamless offline/local demo support
  if (!ai) {
    const fallbackData = calculateFallbackRisks(data, lang);
    return res.json({ risks: fallbackData, isFallback: true });
  }

  try {
    const prompt = `
      You are an expert clinical diagnostician analyzing early screening parameters for Non-Communicable Diseases (NCDs):
      - Diabetes
      - Hypertension
      - Heart Disease
      - Stroke
      - Chronic Kidney Disease

      Patient Demographic Profile:
      - Name: ${data.name || "Emergency / Screening Patient"}
      - Age: ${data.age}
      - Gender: ${data.gender}
      - Height: ${data.height} cm
      - Weight: ${data.weight} kg
      - High Blood Pressure History: ${data.bloodPressure || "Don't Know"}
      - Diabetes History: ${data.diabetesHistory || "Don't Know"}
      - Family Medical History: ${JSON.stringify(data.familyHistory || [])}
      - Smoking: ${data.smoking || "Never"}
      - Alcohol: ${data.alcohol || "Never"}
      - Physical Activity: ${data.physicalActivity || "Unknown"}
      - Presented Symptoms: ${data.currentSymptoms || "None"}
      - Daily Diet: ${data.diet || "Unknown"}
      - Average Sleep: ${data.sleep || "Unknown"}
      - Stress Level: ${data.stress || "Unknown"}
      - Emergency Symptoms: ${JSON.stringify(data.emergencySymptoms || [])}

      Your task: Evaluate the risk percentage (0 to 100) and risk level (Low, Moderate, High) for EACH of the five diseases listed above.
      
      Generate all explanations, factor descriptions, recommendations, diet plans, exercise plans, and medical advice strictly in the requested language: "${lang === "ta" ? "Tamil" : "English"}".
      
      You must respond with valid JSON that matches this schema format:
      {
        "risks": [
          {
            "disease": "Diabetes",
            "riskPercentage": 45,
            "riskLevel": "Moderate",
            "explanation": "High quality medical explanation here in requested language",
            "factors": ["Age", "Overweight"],
            "explainableAI": [
              { "factor": "BMI", "impact": "positive", "weight": 25 },
              { "factor": "Age", "impact": "positive", "weight": 15 }
            ],
            "lifestyleRecommendations": ["Recommendation 1", "Recommendation 2"],
            "foodSuggestions": ["Diet Suggestion 1", "Diet Suggestion 2"],
            "exerciseRecommendations": ["Exercise 1", "Exercise 2"],
            "medicalAdvice": "Clinical physician advice here in requested language"
          },
          ... (and so on for all 5 NCDs listed: Diabetes, Hypertension, Heart Disease, Stroke, Chronic Kidney Disease)
        ]
      }
    `;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risks: {
              type: Type.ARRAY,
              description: "Array of calculated risks for the 5 NCDs",
              items: {
                type: Type.OBJECT,
                properties: {
                  disease: { type: Type.STRING },
                  riskPercentage: { type: Type.INTEGER },
                  riskLevel: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  factors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  explainableAI: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        factor: { type: Type.STRING },
                        impact: { type: Type.STRING },
                        weight: { type: Type.INTEGER }
                      },
                      required: ["factor", "impact", "weight"]
                    }
                  },
                  lifestyleRecommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  foodSuggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  exerciseRecommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  medicalAdvice: { type: Type.STRING }
                },
                required: [
                  "disease",
                  "riskPercentage",
                  "riskLevel",
                  "explanation",
                  "factors",
                  "explainableAI",
                  "lifestyleRecommendations",
                  "foodSuggestions",
                  "exerciseRecommendations",
                  "medicalAdvice"
                ]
              }
            }
          },
          required: ["risks"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text.trim());
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    // If API call throws or times out, immediately fall back to the offline clinical rules engine
    // to provide an uninterrupted mock experience with zero user friction
    const fallbackData = calculateFallbackRisks(data, lang);
    res.json({ risks: fallbackData, isFallback: true, apiError: error.message });
  }
});

// ----------------------------------------------------
// DEV / PROD SERVER AND VITE MIDDLEWARE CONFIGURATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nalam AI Server booted successfully at http://localhost:${PORT}`);
  });
}

startServer();
export default app;
