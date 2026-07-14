/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Phone, HeartHandshake, MapPin, AlertCircle, Sparkles, Navigation } from "lucide-react";
import { MedicalFacility, Language } from "../types";
import { translations } from "../data/translations";

// Base emergency facilities in Tamil Nadu/India (flexible mock coordinates)
const HOSPITALS_TAMIL_NADU = [
  { name: "Government General Hospital, Central", latOffset: 0.012, lngOffset: -0.008, phone: "044-25305000" },
  { name: "Nalam Multi-Specialty Health Hub", latOffset: -0.005, lngOffset: 0.015, phone: "044-48901234" },
  { name: "Apollo Emergency Center", latOffset: 0.021, lngOffset: 0.019, phone: "1066" },
  { name: "Fortis Malar Emergency Unit", latOffset: -0.018, lngOffset: -0.022, phone: "044-42892222" },
];

interface EmergencyGuidanceProps {
  lang: Language;
}

export default function EmergencyGuidance({ lang }: EmergencyGuidanceProps) {
  const t = translations[lang];
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [gpsActive, setGpsActive] = useState(false);
  const [activeNavigationMsg, setActiveNavigationMsg] = useState<string | null>(null);

  // Load facilities with dynamic coordinates (using Geolocation if approved)
  useEffect(() => {
    const calculateDistances = (userLat: number, userLng: number) => {
      // Create hospital entries relative to user coordinates or fallback
      const list: MedicalFacility[] = HOSPITALS_TAMIL_NADU.map((h, index) => {
        // Calculate a simulated distance in KM
        const baseDistance = Math.sqrt(Math.pow(h.latOffset * 111, 2) + Math.pow(h.lngOffset * 111, 2));
        const distanceVal = parseFloat(baseDistance.toFixed(1));
        
        return {
          name: h.name,
          distance: distanceVal === 0 ? 0.8 : distanceVal,
          address: `${lang === "ta" ? "வளாக வீதி" : "Main Campus Rd"}, Chennai, TN`,
          phone: h.phone,
          hasEmergencyUnit: true,
        };
      }).sort((a, b) => a.distance - b.distance);

      setFacilities(list);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsActive(true);
          calculateDistances(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setGpsActive(false);
          // Fallback calculations
          calculateDistances(13.0827, 80.2707); // Chennai Center coords
        }
      );
    } else {
      calculateDistances(13.0827, 80.2707);
    }
  }, [lang]);

  return (
    <div id="emergency-guidance-container" className="bg-gradient-to-br from-rose-950/90 to-slate-950/95 border-2 border-rose-600 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-pulse-slow">
      {/* Visual background distress gradient */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
      <div className="absolute top-2 right-2 flex space-x-1.5">
        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
      </div>

      <div className="flex items-start space-x-4 mb-6 relative z-10">
        <div className="p-3.5 bg-rose-500 text-slate-950 rounded-2xl animate-bounce">
          <AlertCircle className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-xl font-sans font-bold text-rose-400 uppercase tracking-wide">
            {t.emergencyDetected}
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {t.emergencySubtext}
          </p>
        </div>
      </div>

      {/* Grid of Helpline and First Aid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 relative z-10">
        {/* Ambulance card */}
        <div className="bg-slate-900/90 border border-rose-900/40 hover:border-rose-500/50 rounded-2xl p-5 flex flex-col justify-between transition duration-200">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 mb-2">
              <Phone className="w-4 h-4 animate-bounce" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                {lang === "ta" ? "அவசர உதவி" : "Ambulance Helpline"}
              </span>
            </div>
            <h4 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
              {lang === "ta" ? "108 ஐ அழைக்கவும்" : "Call 108 Immediately"}
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t.cprInstructions}
            </p>
          </div>
          <a
            href="tel:108"
            className="mt-4 w-full bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold text-center py-2.5 rounded-xl text-sm tracking-wide transition duration-150 shadow-lg shadow-rose-600/20 active:scale-95"
          >
            {lang === "ta" ? "இப்போது அழைக்கவும்" : "Place Hotline Call"}
          </a>
        </div>

        {/* First Aid / CPR Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <HeartHandshake className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              {lang === "ta" ? "முதல் உதவி வழிகாட்டி" : "CPR Action Steps"}
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start space-x-1.5">
              <span className="text-rose-400 font-bold">1.</span>
              <span>{lang === "ta" ? "நோயாளிக்கு கடினமான தட்டையான பரப்பில் படுக்க வைக்கவும்." : "Lay the patient flat on a hard, level surface."}</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-rose-400 font-bold">2.</span>
              <span>{lang === "ta" ? "மார்பின் நடுவில் இரு கைகளையும் வைத்து வேகமாக அழுத்தவும்." : "Push hard and fast in the center of the chest."}</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-rose-400 font-bold">3.</span>
              <span>{lang === "ta" ? "மூச்சுவிட கடினமாக இருந்தால் வாய் வழி செயற்கை சுவாசம் தரவும்." : "Provide rescue breaths if breathing slows completely."}</span>
            </li>
          </ul>
          <div className="mt-3 text-2xs text-indigo-400/80 italic font-medium flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{lang === "ta" ? "உதவியாளர் உங்களுடன் தொடர்ந்து பேசுகிறார்" : "Voice assistant will stay online to capture stats"}</span>
          </div>
        </div>
      </div>

      {/* Facilities locator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <MapPin className="w-4 h-4" />
            <h4 className="text-sm font-bold tracking-tight text-slate-200">
              {t.emergencyFacility}
            </h4>
          </div>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            {gpsActive ? (lang === "ta" ? "ஜிபிஎஸ் செயலில் உள்ளது" : "GPS Live") : (lang === "ta" ? "நிலையான ஜிபிஎஸ்" : "Fallback GPS")}
          </span>
        </div>

        {activeNavigationMsg && (
          <div className="mb-3 px-3.5 py-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-2xs font-semibold animate-pulse flex items-center space-x-2">
            <Navigation className="w-3.5 h-3.5" />
            <span>{activeNavigationMsg}</span>
          </div>
        )}

        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {facilities.length > 0 ? (
            facilities.map((fac, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 hover:border-slate-700/60 rounded-xl transition duration-150"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-200">{fac.name}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fac.address}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right pr-2 border-r border-slate-800">
                    <span className="block text-xs font-mono font-bold text-indigo-400">
                      {fac.distance} km
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      {t.facilityDistance}
                    </span>
                  </div>
                  <a
                    href={`tel:${fac.phone}`}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg hover:text-emerald-400 transition duration-150"
                    title={fac.phone}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => {
                      const msg = lang === "ta" 
                        ? `வழிசெலுத்தல் தொடங்கப்பட்டது: ${fac.name}` 
                        : `Navigation started to: ${fac.name}`;
                      setActiveNavigationMsg(msg);
                      setTimeout(() => {
                        setActiveNavigationMsg(null);
                      }, 4000);
                    }}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition duration-150"
                    title="Navigate"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">
              {lang === "ta" ? "மருத்துவமனைகளைத் தேடுகிறது..." : "Locating emergency triage centers..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
