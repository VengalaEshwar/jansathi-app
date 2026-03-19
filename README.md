# JanSathi — Your Government & Health Assistant

> **Empowering rural Indian citizens** with accessible healthcare and government services through AI — available in English, Hindi, and Telugu.

<div align="center">
  <br />
  <a href="https://github.com/VengalaEshwar/jansathi-app/releases/latest/download/app-release.apk">
    <img src="https://img.shields.io/badge/Download-Android%20APK-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Download Android APK" />
  </a>
  <br /><br />
</div>

---

## 📸 Screenshots

| Home                                           | Health Services                                    | Government Assist                                      |
| ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| ![Home](./assets/images/screenshots/home.jpeg) | ![Health](./assets/images/screenshots/health.jpeg) | ![G-Assist](./assets/images/screenshots/g-assist.jpeg) |

| Danger Alerts                                             | Step Guides                                                  | Volunteer Network                                        |
| --------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| ![Danger Alerts](./assets/images/screenshots/danger.jpeg) | ![Step Guides](./assets/images/screenshots/steps-guide.jpeg) | ![Volunteer](./assets/images/screenshots/vlounteer.jpeg) |

| Profile                                              | Health Notifications                                             | Medicine Scanner                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| ![Profile](./assets/images/screenshots/profile.jpeg) | ![Health Notify](./assets/images/screenshots/health-notify.jpeg) | ![Medicine](./assets/images/screenshots/medicine-scanner.jpeg) |

| Near By Clinics                                      | Prescription Reader                                            | Voice Assistant                                             |
| ---------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| ![Clinics](./assets/images/screenshots/clinics.jpeg) | ![Prescription](./assets/images/screenshots/prescription.jpeg) | ![Voice Assist](./assets/images/screenshots/ai-assist.jpeg) |

| Schemes Finder                                       | Photo to Form                                             | Auth Page                                      |
| ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| ![Schemes](./assets/images/screenshots/schemes.jpeg) | ![Photo Form](./assets/images/screenshots/photoform.jpeg) | ![Auth](./assets/images/screenshots/auth.jpeg) |

---

## 📖 Table of Contents

* [What is JanSathi?](#what-is-jansathi)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)

  * [Frontend Setup](#frontend-setup)
  * [Backend Setup](#backend-setup)
* [Environment Variables](#environment-variables)
* [Screens & Routes](#screens--routes)
* [Backend API Reference](#backend-api-reference)
* [Translation System](#translation-system)
* [Design System](#design-system)
* [Deployment](#deployment)
* [Author](#author)

---

## What is JanSathi?

JanSathi ("People's Companion" in Hindi) is a React Native mobile app — also usable on web and tablet — that helps rural Indian citizens:

* **Talk to a Global Voice Assistant**: A floating assistant available on every screen. Speak in Hindi, Telugu, or English to navigate the app or ask health/government questions.
* **Scan Medicines**: Verify authenticity, check expiry, and understand usage via AI.
* **Read Handwritten Prescriptions**: Uses high-accuracy OCR to digitize and explain doctor notes.
* **Check Drug Interactions**: Identify dangerous medication combinations instantly.
* **Find & Apply for Schemes**: An intelligent eligibility checker for 100+ government programs.
* **Fill Forms via Photo**: Snap a picture of any government form and let AI fill it using your profile data.
* **Set Reminders**: Medication alerts via Push, SMS, or Email.

The app works across **mobile (iOS/Android)**, **web**, and **tablet**, adapting its layout for each screen size with a consistent dark/light theme and full multilingual support.

---

## Features

### 🎙️ AI Voice Assistant

| Feature                  | Description                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Global Voice FAB**     | A floating microphone button accessible from anywhere. Tap-to-speak functionality.                  |
| **Smart Navigation**     | Use voice commands like "Take me to my profile" or "Check these medicines" to move through the app. |
| **Multilingual Support** | Full STT (Speech-to-Text) and TTS (Text-to-Speech) for English, Hindi, and Telugu.                  |

### 🏥 Health Services

| Feature                  | Description                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Medicine Scanner**     | Extract medicine names, check expiry dates, and verify batch numbers using Gemini Vision. |
| **Prescription Reader**  | Digitalize handwritten prescriptions and read them aloud in native languages.             |
| **Danger Alerts**        | AI-powered interaction checker (Gemini + Groq) to prevent harmful drug combinations.      |
| **Nearby Clinics**       | GPS-based clinic finder with integrated maps and directions.                              |
| **Health Notifications** | Multi-channel reminders (App, SMS, Email) with OTP verification.                          |

### 🏛️ Government Assist

| Feature               | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| **Photo-to-Form AI**  | Auto-detect form fields from an image and generate a completed PDF.             |
| **Scheme Finder**     | Dynamic filtering by state and category with a personalized eligibility engine. |
| **Step Guides**       | Visual, step-by-step checklists for IDs (Aadhaar, Voter ID, PAN).               |
| **Volunteer Network** | A community platform to connect citizens with verified helpers and NGOs.        |

---

## Tech Stack

### Frontend

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| **Framework** | React Native + **Expo SDK 52**            |
| **Routing**   | **Expo Router** (File-based)              |
| **Styling**   | **NativeWind v4** (Tailwind CSS)          |
| **State**     | **Redux Toolkit**                         |
| **Voice**     | `expo-speech-recognition` + `expo-speech` |
| **Compiler**  | **React Compiler** (Optimized build)      |

### Backend

| Layer         | Technology                                         |
| ------------- | -------------------------------------------------- |
| **Runtime**   | **Node.js** (ESModules)                            |
| **Framework** | **Express.js**                                     |
| **Database**  | **MongoDB Atlas** + Mongoose                       |
| **AI Models** | **Google Gemini 1.5 Flash** & **Groq (Llama 3.3)** |
| **Hosting**   | **Vercel** (Serverless)                            |

---

## Project Structure

### Frontend (`jansathi-app/`)

```text
.
├── app/
│   ├── _layout.tsx                 # Root layout & Providers
│   ├── index.tsx                   # Home Screen
│   ├── auth.tsx                    # Auth Screen
│   ├── g-assist/                   # Government Assist Screens
│   │   ├── photo-to-form.tsx
│   │   ├── scheme-finder.tsx
│   │   ├── voice-chatbot.tsx
│   │   └── volunteer-network.tsx
│   ├── health/                     # Health Service Screens
│   │   ├── danger-alerts.tsx
│   │   ├── medicine-scanner.tsx
│   │   └── prescription-reader.tsx
│   └── profile/                    # Profile Management
├── components/
│   ├── VoiceAssistantFAB.tsx       # Floating Voice Button
│   ├── DraggableChatbot.tsx        # Floating Text Chat
│   ├── HeroSection.tsx             # Responsive Banners
│   └── NavBar.tsx                  # Bottom Navigation
├── hooks/
│   ├── useJanSathi.ts              # Core AI Logic Hook
│   ├── useTranslation.ts           # Language Hook
│   └── useAuth.ts                  # Firebase Auth Hook
├── store/
│   └── slices/                     # Redux State Management
├── translations/
│   └── index.ts                    # Multilingual Strings
└── integrations/                   # API & Firebase Clients
```

### Backend (`jansathi-server/`)

```text
.
├── configs/                        # DB, Firebase, Cloudinary Configs
├── controllers/
│   ├── voice.controller.js         # Voice Command Processing
│   ├── ocr.controller.js           # Vision AI Logic
│   ├── chat.controller.js          # AI Chatbot Logic
│   ├── form.controller.js          # PDF Generation
│   └── volunteer.controller.js     # Networking Logic
├── models/                         # Mongoose Schemas
├── routers/                        # API Endpoints
├── utils/                          # Auth Middlewares
├── index.js                        # Server Entry
└── app.js                          # Express Setup
```

---

## Getting Started

### Prerequisites

* Node.js 18+
* Expo CLI
* MongoDB Atlas Account
* Firebase Project (Auth enabled)

### Frontend Setup

```bash
cd jansathi-app
npm install
npx expo start
```

### Backend Setup

```bash
cd jansathi-server
npm install
npm start
```

---

## Environment Variables

### Backend `.env`

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jansathi
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Services
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx
FAST2SMS_API_KEY=your_fast2sms_key
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE=+1xxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

# Firebase Admin
FIREBASE_PROJECT_ID=xxxx
FIREBASE_CLIENT_EMAIL=xxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Screens & Routes

### Main App Routes

| Route                         | Purpose                  |
| ----------------------------- | ------------------------ |
| `/`                           | Home screen              |
| `/auth`                       | Authentication screen    |
| `/profile`                    | User profile             |
| `/health/danger-alerts`       | Drug interaction checker |
| `/health/medicine-scanner`    | Medicine scanner         |
| `/health/prescription-reader` | Prescription OCR         |
| `/g-assist/photo-to-form`     | Form auto-fill           |
| `/g-assist/scheme-finder`     | Government schemes       |
| `/g-assist/voice-chatbot`     | Voice assistant chat     |
| `/g-assist/volunteer-network` | Volunteer support        |

---

## Backend API Reference

| Endpoint                | Method   | Description                                         |
| ----------------------- | -------- | --------------------------------------------------- |
| `/api/voice`            | POST     | Process voice commands and navigation intents       |
| `/api/chat`             | POST     | AI chatbot for health/government help               |
| `/api/ocr/prescription` | POST     | Extract and explain handwritten prescriptions       |
| `/api/ocr/medicine`     | POST     | Analyze medicine packaging and labels               |
| `/api/form/generate`    | POST     | Generate completed PDF forms from image + user data |
| `/api/volunteers`       | GET/POST | Fetch or create volunteer requests                  |
| `/api/notifications`    | POST     | Schedule reminders via push/SMS/email               |

---

## Translation System

JanSathi supports **English**, **Hindi**, and **Telugu** through a centralized translation layer.

### Supported Languages

* `en` — English
* `hi` — Hindi
* `te` — Telugu

### Translation Flow

* All user-facing strings are stored in `translations/index.ts`
* `useTranslation.ts` provides the active language context
* Voice assistant uses the selected language for:

  * Speech-to-Text
  * Text-to-Speech
  * Dynamic responses

---

## Design System

### UI Principles

* **Accessible for rural users**
* **Large touch targets**
* **Simple navigation**
* **Dark / Light mode support**
* **Tablet-friendly responsive layouts**
* **Multilingual-first interface**

### Core Components

* `VoiceAssistantFAB.tsx` — floating mic access on all screens
* `DraggableChatbot.tsx` — movable AI chat assistant
* `HeroSection.tsx` — adaptive banners and CTA cards
* `NavBar.tsx` — mobile bottom navigation

---

## Deployment

### Frontend — Expo / Local Android Build

```bash
# Build Android APK locally
# bash command
 cd android
./gradlew assembleRelease
```

### Backend — Vercel

```bash
# Deploy to production
vercel --prod
```

---


## 🔗 GitHub Repositories

| Repository | Description |
|---|---|
| [**jansathi-app**](https://github.com/VengalaEshwar/jansathi-app) | The React Native + Expo frontend featuring the global AI Voice Assistant, Medicine Scanner, and multilingual UI. |
| [**jansathi-server**](https://github.com/VengalaEshwar/jansathi-server) | The Node.js Express backend handling Gemini AI integration, Groq fallbacks, OCR processing, and MongoDB data management. |

---

## Author

**Eshwar Vengala**
Built with ❤️ for a better India.


--- 
<div align="center">
  <img src="./assets/images/screenshots/icon.png" alt="Home" />
</div>