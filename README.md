# 🩺 Nalam AI

**Nalam AI** is an AI-powered, offline-first healthcare screening platform designed to support the early detection of **Non-Communicable Diseases (NCDs)** in rural and underserved communities.

The application provides an intuitive, voice-enabled screening experience in **English** and **Tamil**, helping users assess their health risks through conversational interactions and receive personalized recommendations.

---

## 🚀 Features

- 🗣️ AI-powered conversational health screening
- 🌐 Bilingual support (English & Tamil)
- 👤 Normal Patient and Emergency Patient workflows
- 🧠 AI-based risk assessment for major NCDs
- 📊 Explainable AI insights with risk visualization
- 📄 QR-enabled digital health reports
- 👨‍⚕️ Doctor dashboard for patient monitoring
- 💾 Offline-first architecture with local data persistence
- 📱 Responsive and accessible user interface
- ♻️ Resume incomplete health screenings

---

## 🩺 Diseases Covered

- Diabetes Mellitus
- Hypertension
- Heart Disease
- Stroke
- Chronic Kidney Disease (CKD)

---

## 🔄 User Workflow

### Normal Patient

```text
Landing Page
      │
      ▼
Login / Register
      │
      ▼
Language Selection
      │
      ▼
Voice-Based Health Screening
      │
      ▼
AI Risk Analysis
      │
      ▼
Health Report
      │
      ▼
Patient Dashboard
```

### Emergency Patient

```text
Landing Page
      │
      ▼
Emergency Screening
      │
      ▼
Critical Symptom Detection
      │
      ▼
Emergency Guidance
      │
      ▼
AI Health Analysis
      │
      ▼
Temporary Report / Save Report
```

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express

### AI & Voice

- Google Gemini API
- Web Speech API (Speech Recognition)
- Web Speech API (Speech Synthesis)

### Storage

- Browser Local Storage (Offline Support)

---

## 📂 Project Structure

```text
Nalam-AI/
│
├── src/
│   ├── components/
│   ├── data/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── assets/
├── server.ts
├── package.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Sant-kannand/Nalam-AI.git
```

Navigate to the project

```bash
cd Nalam-AI
```

Install dependencies

```bash
npm install
```

Create a `.env.local` file and add your Gemini API key

```env
GEMINI_API_KEY=YOUR_API_KEY
```

Start the development server

```bash
npm run dev
```

Open your browser

```text
http://localhost:3000
```

---

## 🎯 Target Users

- Rural communities
- Elderly individuals
- Primary Health Centres (PHCs)
- Community Health Workers
- Healthcare Professionals

---

## 🔒 Key Highlights

- Offline-first healthcare screening
- Voice-assisted interaction
- Explainable AI predictions
- Emergency-first screening pathway
- Bilingual accessibility
- QR-based health report generation

---

## 🌟 Future Enhancements

- Electronic Health Record (EHR) integration
- Wearable device connectivity
- Cloud synchronization
- Appointment booking
- Telemedicine integration
- Multi-language expansion
- Advanced predictive analytics

---

## 📜 License

This project is developed for educational and hackathon purposes.
