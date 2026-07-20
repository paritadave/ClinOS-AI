# ClinOS: Family Medicine Clinic EMR & Copilot Suite

ClinOS is an intelligent, PHIPA-aligned Electronic Medical Record (EMR) co-pilot and clinic management platform designed for modern Canadian family medicine clinics. It bridges the gap between active patient care and tedious clerical documentation.

**Live Application Production URL**: [https://clin-os-ai.vercel.app/](https://clin-os-ai.vercel.app/)

---

## 🌟 Core Modules & Features

### 🎙️ Ambient Medical Scribe with DSP Filtering
- **Active DSP Noise Suppression**: Integrates a real-time Web Audio API digital signal processing pipeline. Utilizing high-pass (150Hz cutoff) and low-pass (3400Hz cutoff) Biquad filtering, it isolates human speech frequencies and actively suppresses ambient office hums, air conditioning rumble, and keyboard clicks.
- **Gemini Clinical Synthesizer**: Converts ambient physician-patient conversations into highly structured, formal EMR outputs including **SOAP Progress Notes**, **Consultation Referral Letters**, or **Discharge Summaries**.
- **Clinical Presets**: Sandbox-ready presets for quick evaluation of complex encounters (e.g., *Respiratory Cough Consultation*, *Diabetic Renal Review*).

### ✍️ Interactive Doctor Review & Editing Panel
- **Real-Time Modification**: Clinicians can toggle any generated record into **Review & Edit Mode** to directly correct, expand, or adjust subjective, objective, assessment, or plan text blocks.
- **Reactive Guideline Sync**: Saving custom edits automatically re-triggers the provincial billing code extraction and College-compliant medical safety audits to ensure updated content remains aligned.

### 🍁 Canadian Practice Suite & Billing
- **Provincial Fee Engine**: Automatically detects diagnostic indicators and counseling duration to recommend specific billing codes based on provincial frameworks (e.g., **OHIP** in Ontario, **MSP** in British Columbia).
- **Secure Telehealth Gateway**: Allows clinicians to simulate cryptographic transmission of claims directly to provincial portals with official reference tracking.

### 🛡️ Medical Council of Canada (MCC) Quality Audits
- **Allergy & Drug Safeguards**: Real-time cross-referencing of active prescriptions and allergies to warn of critical contraindications (e.g., discontinuing Metformin in cases of Stage 4 chronic kidney disease/low eGFR to prevent lactic acidosis).
- **Preventative Care Alerts**: Surfaces guidelines-backed health maintenance gap reminders (e.g., screening recommendations, immunizations, and specialist follow-ups).

### 📬 Patient Take-Home Portal & Secure Gmail
- **Layperson Translation Engine**: Demystifies dense clinical terms and medication lists into patient-friendly explanations.
- **Secure Plan Dispatch**: Enables clinicians to securely dispatch customized, mobile-optimized Patient Handouts directly to the patient's inbox via integrated secure Gmail dispatch (OAuth-ready).

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18+ with TypeScript, styled using Tailwind CSS and animated with Motion (`motion/react`).
- **Icons**: [Lucide React](https://lucide.dev/) for high-contrast vector clinical layouts.
- **Audio Processing**: Web Audio API (MediaStreamAudioSource, BiquadFilterNode, MediaStreamAudioDestination).
- **Backend API Layer**: Express.js server hosted in a containerized Cloud Run environment, routing Gemini API prompts securely on the server-side to prevent client-side API key leakage.
- **Database / Cloud Sync**: Firebase Firestore for durable data storage and audit trail integrity.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Local Development
1. Clone the repository.
2. Install the workspace dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env` (copied from `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Build the application for production:
   ```bash
   npm run build
   ```
6. Start the production build:
   ```bash
   npm run start
   ```

---

## 🔒 Compliance & Privacy

ClinOS is designed around strict privacy principles:
- **PHIPA/PIPEDA-Aligned**: Features detailed clinical audit trails logging every user and API action.
- **Server-Side API Routing**: All patient health data processing and LLM generations occur behind secure, server-side proxies, ensuring zero client-side API key exposure.
- **Cryptographic Mock Identifiers**: Patient data transmission utilizes encrypted reference numbers matching Canadian standards.
