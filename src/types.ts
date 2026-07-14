/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export enum RiskLevel {
  LOW = "Low",
  MEDIUM = "Moderate",
  HIGH = "High"
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  bloodPressure: string; // e.g. "120/80"
  hasDiabetesHistory: boolean;
  smokingStatus: "never" | "former" | "active";
  alcoholConsumption: "none" | "occasional" | "frequent";
  familyHistory: string[]; // list of diseases in family
  lifestyleHabits: string[]; // e.g., ["sedentary", "active", "unhealthy_diet"]
  createdAt: string;
}

export interface ScreeningSession {
  id: string;
  userId?: string; // empty for emergency users
  isEmergency: boolean;
  currentQuestionIndex: number;
  answers: {
    name?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    bloodPressure?: string;
    diabetesHistory?: string;
    smoking?: string;
    alcohol?: string;
    familyHistory?: string[];
    lifestyleHabits?: string[];
    currentSymptoms?: string;
    physicalActivity?: string;
    diet?: string;
    sleep?: string;
    stress?: string;
    emergencySymptoms?: string[];
  };
  lastUpdated: string;
  isCompleted: boolean;
}

export interface DiseaseRisk {
  disease: string; // "Diabetes" | "Hypertension" | "Heart Disease" | "Stroke" | "Chronic Kidney Disease"
  riskPercentage: number;
  riskLevel: RiskLevel;
  explanation: string;
  factors: string[];
  explainableAI: {
    factor: string;
    impact: "positive" | "negative"; // positive means increases risk, negative means decreases
    weight: number; // 0 to 100
  }[];
  lifestyleRecommendations: string[];
  foodSuggestions: string[];
  exerciseRecommendations: string[];
  medicalAdvice: string;
}

export interface HealthReport {
  id: string;
  userId?: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientHeight: number;
  patientWeight: number;
  bloodPressure: string;
  symptoms: string;
  risks: DiseaseRisk[];
  timestamp: string;
  qrCodeValue: string;
  isSynced: boolean;
}

export interface MedicalFacility {
  name: string;
  distance: number; // in km
  address: string;
  phone: string;
  hasEmergencyUnit: boolean;
}

export type Language = "en" | "ta";
