// constants/routeMap.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all app screens.
// Sent to the backend on every voice/command request.
//
// Structure: alias/name → route
// Multiple aliases per route are intentional — the AI fuzzy-matches any of them.
// De-duplication is NOT needed; more aliases = better matching.
// ─────────────────────────────────────────────────────────────────────────────

// All spoken/typed phrases the user might say → the correct route
export const ROUTE_ALIASES: Record<string, string> = {
  // ── Home ───────────────────────────────────────────────────────────────
  "home":                       "/",
  "home page":                  "/",
  "main screen":                "/",
  "start":                      "/",

  // ── Health Services ────────────────────────────────────────────────────
  "health":                     "/health",
  "health services":            "/health",
  "health screen":              "/health",
  "health page":                "/health",

  // ── Medicine Scanner ───────────────────────────────────────────────────
  "medicine scanner":           "/health/medicine-scanner",
  "scan medicine":              "/health/medicine-scanner",
  "medicine":                   "/health/medicine-scanner",
  "scan medicines":             "/health/medicine-scanner",
  "medicine scan":              "/health/medicine-scanner",

  // ── Prescription Reader ────────────────────────────────────────────────
  "prescription reader":        "/health/prescription-reader",
  "prescription scanner":       "/health/prescription-reader",
  "read prescription":          "/health/prescription-reader",
  "prescription":               "/health/prescription-reader",
  "prescriptions":              "/health/prescription-reader",
  "scan prescription":          "/health/prescription-reader",

  // ── Danger Alerts ──────────────────────────────────────────────────────
  "danger alerts":              "/health/danger-alerts",
  "drug interactions":          "/health/danger-alerts",
  "medicine interactions":      "/health/danger-alerts",
  "drug warnings":              "/health/danger-alerts",
  "medicine warnings":          "/health/danger-alerts",

  // ── Nearby Clinics ─────────────────────────────────────────────────────
  "nearby clinics":             "/health/nearby-clinics",
  "find clinics":               "/health/nearby-clinics",
  "clinics":                    "/health/nearby-clinics",
  "hospitals":                  "/health/nearby-clinics",
  "doctors":                    "/health/nearby-clinics",
  "doctors near me":            "/health/nearby-clinics",

  // ── Health Notifications ───────────────────────────────────────────────
  "health notifications":       "/health/health-notifications",
  "medicine reminders":         "/health/health-notifications",
  "reminders":                  "/health/health-notifications",
  "medication reminders":       "/health/health-notifications",

  // ── Government Assist ──────────────────────────────────────────────────
  "government assist":          "/g-assist",
  "g assist":                   "/g-assist",
  "government":                 "/g-assist",
  "government help":            "/g-assist",

  // ── Voice Chatbot ──────────────────────────────────────────────────────
  "voice chatbot":              "/g-assist/voice-chatbot",
  "chatbot":                    "/g-assist/voice-chatbot",
  "ai chat":                    "/g-assist/voice-chatbot",
  "voice assistant screen":     "/g-assist/voice-chatbot",

  // ── Photo to Form ──────────────────────────────────────────────────────
  "photo to form":              "/g-assist/photo-to-form",
  "form filler":                "/g-assist/photo-to-form",
  "fill form":                  "/g-assist/photo-to-form",
  "photo form":                 "/g-assist/photo-to-form",
  "document scanner":           "/g-assist/photo-to-form",

  // ── Scheme Finder ──────────────────────────────────────────────────────
  "scheme finder":              "/g-assist/scheme-finder",
  "government schemes":         "/g-assist/scheme-finder",
  "schemes":                    "/g-assist/scheme-finder",
  "find schemes":               "/g-assist/scheme-finder",
  "welfare schemes":            "/g-assist/scheme-finder",

  // ── Step Guides ────────────────────────────────────────────────────────
  "step guides":                "/g-assist/step-guides",
  "guides":                     "/g-assist/step-guides",
  "government guides":          "/g-assist/step-guides",
  "how to guides":              "/g-assist/step-guides",
  "procedures":                 "/g-assist/step-guides",

  // ── Volunteer Network ──────────────────────────────────────────────────
  "volunteer network":          "/g-assist/volunteer-network",
  "volunteers":                 "/g-assist/volunteer-network",
  "volunteer":                  "/g-assist/volunteer-network",
  "volunteer page":             "/g-assist/volunteer-network",
  "volunteering":               "/g-assist/volunteer-network",
  "get help from volunteers":   "/g-assist/volunteer-network",
  "ngo":                        "/g-assist/volunteer-network",
  "ngos":                       "/g-assist/volunteer-network",
  "volunteer networks":         "/g-assist/volunteer-network",

  // ── Profile ────────────────────────────────────────────────────────────
  "profile":                    "/profile",
  "settings":                   "/profile",
  "my profile":                 "/profile",
  "account":                    "/profile",

  // ── Personal Information ───────────────────────────────────────────────
  "personal information":       "/profile/personal-info",
  "edit profile":               "/profile/personal-info",
  "personal info":              "/profile/personal-info",

  // ── About ──────────────────────────────────────────────────────────────
  "about":                      "/about",
  "about jansathi":             "/about",
};

// Canonical name for each route (used in "already here" messages)
export const ROUTE_NAMES: Record<string, string> = {
  "/":                           "Home",
  "/health":                     "Health Services",
  "/health/medicine-scanner":    "Medicine Scanner",
  "/health/prescription-reader": "Prescription Reader",
  "/health/danger-alerts":       "Danger Alerts",
  "/health/nearby-clinics":      "Nearby Clinics",
  "/health/health-notifications":"Health Notifications",
  "/g-assist":                   "Government Assist",
  "/g-assist/voice-chatbot":     "Voice Chatbot",
  "/g-assist/photo-to-form":     "Photo to Form",
  "/g-assist/scheme-finder":     "Scheme Finder",
  "/g-assist/step-guides":       "Step Guides",
  "/g-assist/volunteer-network": "Volunteer Network",
  "/profile":                    "Profile",
  "/profile/personal-info":      "Personal Information",
  "/about":                      "About JanSathi",
};

// Sent to backend — alias → route only (clean, no mixed types)
export function buildRouteMapForAPI(): Record<string, string> {
  return { ...ROUTE_ALIASES };
}

// Get the friendly name of the current screen
export function getScreenName(route: string): string {
  return ROUTE_NAMES[route] ?? route;
}