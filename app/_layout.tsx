import { useEffect } from "react";
import { LogBox, View, Platform } from "react-native";
import { Stack, usePathname } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavBar } from "@/components/NavBar";
import { GlobalChatbot } from "@/components/GlobalChatbot";
import "./global.css";
import { Provider } from "react-redux";
import { store } from "@/store";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { setUser, setDbUser, clearUser } from "@/store/slices/authSlice";
import { setAppLanguage } from "@/store/slices/appSlice";
import { apiRequest } from "@/integrations/api/client";
import { useAppDispatch } from "@/store/hooks";
import { ToastContainer } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";

// FCM only on native
let messaging: any = null;
if (Platform.OS !== "web") {
  messaging = require("@react-native-firebase/messaging").default;
}

const queryClient = new QueryClient();
LogBox.ignoreAllLogs();

if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    body, #root, html {
      height: 100%;
      overflow: hidden;
      background-color: #0F172A;
    }
  `;
  document.head.appendChild(style);
}

function AppContent() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }));

        try {
          const data = await apiRequest("/auth/profile");
          if (data.success && data.user) {
            dispatch(setDbUser(data.user));
            if (data.user.language) {
              dispatch(setAppLanguage(data.user.language));
            }
          }
        } catch (e) {
          console.log("Failed to fetch user profile:", e);
        }
      } else {
        dispatch(clearUser());
      }
    });

    return unsubscribe;
  }, []);

  // FCM setup — native only
  useEffect(() => {
    if (Platform.OS === "web" || !messaging) return;

    let unsubscribeForeground: (() => void) | null = null;

    const setupFcm = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          if (token) {
            await apiRequest("/reminders/fcm-token", "POST", { fcmToken: token });
          }
        }

        // Handle messages when app is in foreground
        unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
          console.log("FCM foreground message:", remoteMessage.notification?.title);
          // Toast is shown via the notification itself on native
        });

        // Handle token refresh
        messaging().onTokenRefresh(async (token: string) => {
          await apiRequest("/reminders/fcm-token", "POST", { fcmToken: token });
        });

      } catch (e) {
        console.log("FCM setup failed:", e);
      }
    };

    setupFcm();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar style="light" backgroundColor="#000" />
        <View className="flex-1">
          <View className="w-full h-full">
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          <NavBar />
          {pathname !== "/profile" &&
            pathname !== "/g-assist/voice-chatbot" && <GlobalChatbot />}
        </View>
      </SafeAreaView>
      {/* Global overlays — outside SafeAreaView so they cover everything */}
      <ToastContainer />
      <ConfirmModal />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </Provider>
  );
}