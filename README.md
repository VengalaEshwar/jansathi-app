# JanSathi — Your Government & Health Assistant

> **Empowering rural Indian citizens** with accessible healthcare and government services through AI — available in English, Hindi, and Telugu.

---

## 📸 Screenshots

<!-- Add your screenshots here -->
| Home | Health Services | Government Assist |
|------|----------------|-------------------|
| ![Home](./assets/images/screenshots/home.jpeg) | ![Health](./assets/images/screenshots/health.jpeg) | ![G-Assist](./assets/images/screenshots/g-assist.jpeg) |

| Danger Alerts | Step Guides | Volunteer Network |
|---------------|-------------|-------------------|
| ![Danger Alerts](./assets/images/screenshots/danger.jpeg) | ![Step Guides](./assets/images/screenshots/steps-guide.jpeg) | ![Volunteer](./assets/images/screenshots/vlounteer.jpeg) |

| Profile | Health Notifications | Medicine Scanner |
|---------|------|-----------------|
| ![Profile](./assets/images/screenshots/profile.jpeg) | ![Auth](./assets/images/screenshots/health-notify.jpeg) | ![Medicine](./assets/images/screenshots/medicine-scanner.jpeg) |
| Near By Clinics | prescription Reader | Medicine Scanner |
|---------|------|-----------------|
| ![clinics](./assets/images/screenshots/clinics.jpeg) | ![prescription](./assets/images/screenshots/prescription.jpeg) | ![Medicine](./assets/images/screenshots/ai-assist.jpeg) |
| Schemes Finder | photo to form | Auth Page |
|---------|------|-----------------|
| ![Schemes](./assets/images/screenshots/schemes.jpeg) | ![prescription](./assets/images/screenshots/photoform.jpeg) | ![Auth](./assets/images/screenshots/auth.jpeg) |

---

## 📖 Table of Contents

- [What is JanSathi?](#what-is-jansathi)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Frontend](#frontend-setup)
  - [Backend](#backend-setup)
- [Environment Variables](#environment-variables)
- [Screens & Routes](#screens--routes)
- [Backend API Reference](#backend-api-reference)
- [Translation System](#translation-system)
- [Design System](#design-system)
- [Deployment](#deployment)

---

## What is JanSathi?

JanSathi ("People's Companion" in Hindi) is a React Native mobile app — also usable on web and tablet — that helps rural Indian citizens:

- **Scan medicines** to verify authenticity and check expiry
- **Read handwritten prescriptions** using OCR
- **Check drug interactions** for dangerous medication combinations
- **Find government schemes** they're eligible for
- **Fill government forms** from a photo using AI
- **Get step-by-step guides** for government procedures (birth certificate, voter ID, etc.)
- **Connect with volunteers** for in-person help with government services
- **Talk to an AI assistant** in their own language (Hindi, Telugu, English)
- **Set medication reminders** via app, SMS, or email


The app works across **mobile (iOS/Android)**, **web**, and **tablet**, adapting its layout for each screen size with a consistent dark/light theme and full multilingual support.

---

## Features

### 🏥 Health Services

| Feature | Description |
|---|---|
| **Medicine Scanner** | Upload a photo of a medicine strip or bottle. AI extracts medicine names, checks expiry date, batch number, and authenticity. Results stored for drug interaction history. |
| **Prescription Reader** | Upload a handwritten prescription. OCR extracts the text and reads it aloud using Text-to-Speech in the user's language. |
| **Danger Alerts** | Three tabs: (1) Static database of 10+ known dangerous drug combinations with risk levels; (2) AI-powered interaction checker — enter any medicines; (3) History tab pulls medicines from past scans and auto-checks for interactions using Gemini + Groq. |
| **Nearby Clinics** | Finds healthcare centers near the user using GPS and displays them on a map with call/directions links. |
| **Health Notifications** | Set medication reminders delivered via app notification, SMS (Twilio/Fast2SMS), or email (Nodemailer). Supports OTP verification for SMS and email. |

### 🏛️ Government Assist

| Feature | Description |
|---|---|
| **Voice Chatbot** | Speak or type in Hindi, Telugu, or English. AI responds in the user's language with both display text and Roman-transliterated speech (so TTS works correctly for all Indian languages using `en-IN` voice). |
| **Photo-to-Form AI** | Upload a photo of any government form. AI detects all fillable fields, lets you fill them in, then generates a completed PDF for download. |
| **Scheme Finder** | Browse 100+ government schemes. Filter by state, category, eligibility. Built-in eligibility checker — enter your age, gender, state, occupation, income to find matching schemes. |
| **Step Guides** | Pre-built visual guides for common procedures (Aadhaar, voter ID, ration card, PAN card, etc.) with step-by-step checklists. AI guide generator for any procedure not in the list. |
| **Volunteer Network** | Find verified volunteers and NGOs. Submit help requests. Register as a volunteer. Contact details (phone) only visible to registered volunteers — gated server-side. |

### 👤 Profile & Accessibility

- **Multilingual** — English, Hindi, Telugu. Language persists across sessions via Redux + AsyncStorage.
- **Dark / Light theme** — Toggle from Profile or Auth screen.
- **Click sounds** — Optional UI sound feedback.
- **Personal Information** — Save name, age, DOB, gender, address, blood group, custom fields.
- **Auth-aware home** — Logged-in users see "Hello, [Name]!" greeting; logged-out users see a Get Started button.
- **Volunteer badge** — Profile shows your volunteer registration status and helpedCount.

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React Native + **Expo SDK 52** |
| Routing | **Expo Router** (file-based, typed) |
| Styling | **NativeWind v4** (Tailwind CSS for React Native) |
| State | **Redux Toolkit** + `useAppSelector` / `useAppDispatch` |
| Auth | **Firebase Auth** (email/password + Google Sign-In) |
| HTTP | Custom `apiRequest` wrapper with `Authorization: Bearer` |
| Animations | React Native `Animated` API (no Reanimated dependency) |
| Icons | `lucide-react-native` |
| Compiler | **React Compiler** (`transform.reactCompiler: true`) |
| Storage | `AsyncStorage` (theme, language persistence) |

### Backend

| Layer | Technology |
|---|---|
| Runtime | **Node.js** (ESModules) |
| Framework | **Express.js** |
| Database | **MongoDB Atlas** + Mongoose |
| Hosting | **Vercel** (Hobby plan, serverless) |
| AI (primary) | **Google Gemini** (`gemini-1.5-flash`) |
| AI (fallback) | **Groq** (`llama-3.3-70b-versatile`) |
| OCR | `tesseract.js` + Gemini Vision |
| Email | **Nodemailer** + Gmail App Password |
| SMS | **Twilio** (verified numbers) + **Fast2SMS** (fallback) |
| Cron | cron-job.org (every 15 min) → hits Vercel endpoint |
| Auth | Firebase Admin SDK (token verification) |

---

## Project Structure

```
jansathi-app/                    # Frontend (Expo)
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home screen
│   ├── auth.tsx                 # Authentication screen
│   ├── about.tsx                # About screen
│   ├── global.css               # Global styling (NativeWind)
│   ├── g-assist/
│   │   ├── index.tsx            # G-Assist hub
│   │   ├── photo-to-form.tsx    # OCR form filler
│   │   ├── scheme-finder.tsx    # Government scheme search
│   │   ├── step-guides.tsx      # Step-by-step procedure guides
│   │   ├── voice-chatbot.tsx    # Multilingual AI chat
│   │   └── volunteer-network.tsx
│   ├── health/
│   │   ├── index.tsx            # Health services hub
│   │   ├── danger-alerts.tsx    # Drug interaction checker
│   │   ├── health-notifications.tsx
│   │   ├── medicine-scanner.tsx
│   │   ├── nearby-clinics.tsx
│   │   └── prescription-reader.tsx
│   └── profile/
│       ├── _layout.tsx
│       ├── index.tsx            # Profile + settings
│       └── personal-info.tsx
├── assets/
│   ├── images/                  # App icons, splashes, and generated images
│   └── svgs/                    # SVG assets (Gemini, health icons, etc.)
├── components/
│   ├── AnimatedPressable.tsx    # Spring-animated pressable
│   ├── Card.tsx
│   ├── ConfirmModal.tsx         # Confirm dialog wrapper
│   ├── DraggableChatbot.tsx     # Floating chatbot FAB
│   ├── FeatureSlideshow.tsx
│   ├── GlobalChatbot.tsx        # Global chatbot overlay
│   ├── HeroSection.tsx          # Full-width gradient hero banner
│   ├── HeroSlideshow.tsx
│   ├── ImageUpload.tsx
│   ├── NavBar.tsx               # Bottom/Top navigation bar
│   ├── ScreenHeader.tsx
│   ├── TabButton.tsx
│   ├── ThemeToggle.tsx          # Dark/light toggle
│   ├── Toast.tsx                # Toast notifications
│   ├── VoiceInput.tsx
│   └── profile/
│       ├── AccessibilityDialog.tsx
│       ├── HelpSupportDialog.tsx
│       ├── LanguageDialog.tsx
│       ├── NotificationsDialog.tsx
│       ├── PersonalInfoDialog.tsx
│       └── ProfileChatbot.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useConfirm.ts
│   ├── useSound.ts
│   ├── useTheme.ts
│   ├── useToast.ts
│   └── useTranslation.ts        # Language-aware translation hook
├── integrations/
│   ├── api/
│   │   └── client.ts            # API request wrapper
│   ├── firebase/
│   │   └── client.ts            # Firebase initialization
│   └── supabase/
│       ├── client.ts
│       └── types.ts             # Supabase database types
├── .gitignore
├── app.config.js                # Expo configuration
├── babel.config.js
├── eas.json                     # EAS Build configuration
├── eslint.config.js
├── expo-env.d.ts
├── google-services.json         # Firebase Android config
├── metro.config.js
└── nativewind-env.d.ts

jansathi-server/                 # Backend (Express on Vercel)
├── configs/                     # Configuration and setup
│   ├── cloudinary.config.js
│   ├── db.config.js             # MongoDB Atlas connection
│   ├── env.config.js
│   ├── firebase.config.js
│   ├── multer.config.js         # File upload handling
│   └── nodemailer.config.js
├── routers/                     # Express routes (API endpoints)
│   ├── auth.router.js
│   ├── chat.router.js
│   ├── cron.router.js           # Scheduled jobs endpoint
│   ├── form.router.js
│   ├── guide.router.js          # /guide/generate
│   ├── ocr.router.js            # /ocr/scan, /ocr/my-medicines, /ocr/check-interactions
│   ├── reminder.router.js       # Notification/reminder routes
│   ├── scheme.router.js
│   └── volunteer.router.js      # Full volunteer CRUD
├── controllers/                 # Business logic
│   ├── chat.controller.js       # Gemini primary, Groq fallback, Roman transliteration
│   ├── cron.controller.js
│   ├── form.controller.js
│   ├── guide.controller.js      # AI step guide generator
│   ├── ocr.controller.js        # Tesseract + Gemini + Groq medicine extraction
│   ├── reminder.controller.js
│   ├── scheme.controller.js
│   ├── user.controller.js       # Auth and user profile logic
│   └── volunteer.controller.js  # No-verification instant registration
├── models/                      # Mongoose schemas
│   ├── scheme.model.js
│   ├── user.model.js            # Includes medicines[], preferences, prescription/form history
│   └── volunteer.model.js       # userId, coordinates, languages[], available, bio
├── data/
│   └── schemes.js               # Static scheme data/seed file
├── utils/                       # Helpers & Middlewares
│   ├── firebaseAuth.js          # Firebase token verification
│   └── loader.js
├── temp/                        # Temporary uploaded images and generated PDFs
├── .env
├── .gitignore
├── app.js                       # Express app setup and middleware registration
├── index.js                     # Server entry point
├── package.json
├── package-lock.json
├── README.md
└── vercel.json                  # Vercel deployment configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account
- Firebase project (Auth enabled)
- Google Gemini API key
- Groq API key

### Frontend Setup

```bash
# Clone the app
git clone https://github.com/VengalaEshwar/jansathi-app
cd jansathi-app

# Install dependencies
npm install

# Start with increased memory (React Compiler needs it)
NODE_OPTIONS=--max-old-space-size=8192 npx expo start --clear

# simple start
npm start

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Backend Setup

```bash
# Clone the server
git clone https://github.com/VengalaEshwar/jansathi-server
cd jansathi-server

# Install dependencies
npm install

# Start locally
node index.js
# or with nodemon
npx nodemon index.js
#  simple start
npm start
```

---

## Environment Variables

### Backend `.env`

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jansathi

# Auth
JWT_SECRET=your_jwt_secret

# Environment
NODE_ENV=development
PORT=5000

# AI
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Email (Nodemailer)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# SMS
FAST2SMS_API_KEY=your_fast2sms_key
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=+1xxxxxxxxxx
TWILIO_VERIFIED_NUMBERS=+91xxxxxxxxxx,+91xxxxxxxxxx

# Cloudinary (avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase
FIREBASE_PROJECT_ID=xxxxxx
FIREBASE_CLIENT_EMAIL=xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n=xxxxx==\n-----END PRIVATE KEY-----\n" 
```

### Frontend — `app.config.js` / `app.json`

```json
{
  "extra": {
    "apiUrl": "https://your-vercel-deployment.vercel.app/api",
    "firebaseApiKey": "...",
    "firebaseAuthDomain": "...",
    "firebaseProjectId": "..."
  }
}
```

---

## Screens & Routes

### App Routes (Expo Router)

| Route | Screen | Auth Required |
|---|---|---|
| `/` | Home — greeting, service cards | No (shows different UI) |
| `/auth` | Sign In / Sign Up / Google OAuth | No |
| `/health` | Health Services hub | No |
| `/health/medicine-scanner` | Medicine Scanner | Yes |
| `/health/prescription-reader` | Prescription Reader | Yes |
| `/health/danger-alerts` | Drug Interaction Checker | Yes |
| `/health/nearby-clinics` | Nearby Clinics (GPS) | No |
| `/health/health-notifications` | Medication Reminders | Yes |
| `/g-assist` | Government Assist hub | No |
| `/g-assist/voice-chatbot` | Multilingual AI Chat | Yes |
| `/g-assist/photo-to-form` | Photo-to-Form AI | Yes |
| `/g-assist/scheme-finder` | Scheme Finder | No |
| `/g-assist/step-guides` | Step-by-Step Guides | No |
| `/g-assist/volunteer-network` | Volunteer Network | Yes (partial) |
| `/profile` | Profile & Settings | Yes |
| `/profile/personal-info` | Edit Personal Info | Yes |
| `/about` | About JanSathi | No |

---

## Backend API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/sync` | Sync Firebase user to MongoDB, returns dbUser |
| `POST` | `/auth/upload-avatar` | Upload profile photo to Cloudinary |
| `DELETE` | `/auth/delete-avatar` | Remove profile photo |
| `PATCH` | `/auth/update-profile` | Update name, age, phone, location, etc. |

### OCR — `/api/ocr`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ocr/scan` | OCR scan (prescription or medicine). Tesseract + Gemini. Returns text + extracted medicine names. Saves to user history. |
| `GET` | `/ocr/my-medicines` | Returns all medicine names extracted from user's scan history |
| `POST` | `/ocr/check-interactions` | Checks drug interactions for a list of medicines using Gemini + Groq |

### Chat — `/api/chat`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/message` | Send message. Returns `displayText` (user's language) + `speakText` (Roman transliteration for TTS). Gemini primary, Groq fallback. |

### Guide — `/api/guide`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/guide/generate` | Generate a step-by-step procedure guide using AI. Body: `{ query, language }` |

### Volunteer — `/api/volunteer`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/volunteer` | List all active volunteers (supports `?speciality=&search=`) |
| `POST` | `/volunteer/register` | Register as a volunteer (instant activation, no verification queue) |
| `GET` | `/volunteer/my-registration` | Get the current user's volunteer registration |
| `PATCH` | `/volunteer/edit/:id` | Update volunteer profile |
| `DELETE` | `/volunteer/delete/:id` | Remove volunteer registration |
| `POST` | `/volunteer/request` | Submit a help request |
| `GET` | `/volunteer/open-requests` | List open help requests. Phone number only returned if user is a registered volunteer. |
| `GET` | `/volunteer/my-requests` | Get current user's submitted requests |
| `DELETE` | `/volunteer/request/:id` | Delete own help request |

### Scheme — `/api/scheme`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/scheme` | List all schemes (supports `?search=&state=&category=`) |
| `POST` | `/scheme/eligibility` | Check eligibility. Body: `{ age, gender, state, occupation, incomeLevel, ... }` |

### Notification — `/api/notification`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/notification/reminder` | Create/update a medication reminder |
| `GET` | `/notification/reminders` | Get all reminders for current user |
| `DELETE` | `/notification/reminder/:id` | Delete a reminder |
| `POST` | `/notification/send-otp` | Send OTP to phone or email for verification |
| `POST` | `/notification/verify-otp` | Verify OTP |
| `POST` | `/notification/trigger` | Cron endpoint — checks due reminders and sends notifications |

---

## Translation System

JanSathi supports **English, Hindi, and Telugu** across every screen and sub-component.

### How it works

```
translations/index.ts         ← All strings for all 3 languages
     ↓
useTranslation() hook         ← Returns t object for current language
     ↓
t.profile.darkMode            ← Used directly in components
t.volunteer.becomeVolunteer
t.dangerAlerts.highRisk
```

### Language switching

Language is stored in Redux (`s.app.language`) and persisted to `AsyncStorage`. Changing language on the Profile screen or Auth screen instantly re-renders all text across the app.

### Sub-component pattern

For sub-components inside a screen that can't easily receive `t` as a prop, the **module-level ref pattern** is used:

```ts
// Module level
let _t: any = null;
const getT = () => _t;

// Inside main component (runs on every render, updating the ref)
_t = t;

// Inside sub-components
const label = getT()?.volunteer?.available ?? "Available";
```

### Adding a new language

1. Add the new language code to `type Language` in `translations/index.ts`
2. Add a new top-level key in the `t` object with all strings translated
3. Add a new pill in `LANGUAGES` array in `auth.tsx` and `profile/index.tsx`

---

## Design System

### Responsive Layout Formula

Every screen uses the same container formula — **do not deviate from this**:

```ts
const { width }      = useWindowDimensions();
const isWide         = width >= 700;
const isLarge        = width >= 1100;
const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
const sidePad        = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;
```

- `ScrollView` gets **no** `paddingHorizontal` — the inner `View` handles it
- All `ScrollView`/`FlatList` get `paddingBottom: 100` in `contentContainerStyle`
- `HeroSection` always goes **outside** the centered container (full-width)

### Color Palette

| Token | Dark | Light |
|---|---|---|
| Background | `#0F172A` | `#F8FAFC` |
| Card | `#1E293B` | `white` |
| Border | `#334155` | `#E2E8F0` |
| Text Primary | `#F1F5F9` | `#0F172A` |
| Text Muted | `#94A3B8` | `#64748B` |
| Primary (Purple) | `#8B5CF6` | `#8B5CF6` |
| Success | `#10B981` | `#10B981` |
| Warning | `#F59E0B` | `#F59E0B` |
| Danger | `#EF4444` | `#EF4444` |

### React Compiler Rules

The app uses **React Compiler** (`transform.reactCompiler: true`). This has one critical constraint:

> ❌ **Never use `memo()` on exported components** — causes "Component is not a function" crash at runtime.

```ts
// ✅ Correct — plain export
export default function MyScreen() { ... }

// ✅ Correct — memo on internal non-exported sub-components only
const MyCard = memo(({ ... }) => { ... });

// ❌ Wrong — memo on exported component
export default memo(function MyScreen() { ... });
```

### Redux Store Keys

```ts
// appSlice — correct action names:
setAppTheme(theme)        // NOT setColorScheme
setAppLanguage(lang)
setSoundEnabled(bool)

// Correct state selectors:
s.app.theme               // NOT s.app.colorScheme — default: "dark"
s.app.language            // "en" | "hi" | "te"
s.app.soundEnabled        // boolean
```

---

## Deployment

### Frontend — Expo

```bash
# Build for web (static export)
npx expo export --platform web

# Build for Android (EAS)
eas build --platform android --profile preview

# Build for iOS (EAS)
eas build --platform ios --profile preview
```

### Backend — Vercel

The backend is a standard Express app deployed to Vercel. Ensure `vercel.json` is configured:

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

```bash
# Deploy
vercel --prod
```

### Required route registrations in `index.js`

```js
// example
import guideRoutes     from "./routes/guide.routes.js";
import volunteerRoutes from "./routes/volunteer.routes.js";

app.use("/api/guide",     guideRoutes);
app.use("/api/volunteer", volunteerRoutes);
```

---

## GitHub Repositories

| Repo | Description |
|---|---|
| [`jansathi-app`](https://github.com/VengalaEshwar/jansathi-app) | React Native + Expo frontend |
| [`jansathi-server`](https://github.com/VengalaEshwar/jansathi-server) | Express.js backend |

---

## Author

**Eshwar Vengala**  
Built with ❤️.

