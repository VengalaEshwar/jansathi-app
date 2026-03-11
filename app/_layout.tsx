import { useEffect, useRef } from "react";
import { LogBox, View, Platform, AppState } from "react-native";
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
import * as Notifications from "expo-notifications";
import { scheduleAllReminders } from "@/utils/notificationScheduler";
import { useToast } from "@/hooks/useToast";

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

// ── Foreground handler — show toast instead of system notification ─
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,   // suppress system banner when app is open
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const toast = useToast();
  const notifListenerRef = useRef<any>(null);

  useEffect(() => {
    // ── Request notification permissions (mobile only) ──────────
    if (Platform.OS !== "web") {
      Notifications.requestPermissionsAsync();
    }

    // ── Foreground notification → show as toast ─────────────────
    if (Platform.OS !== "web") {
      notifListenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
        const { title, body } = notification.request.content;
        toast.info(`${title}\n${body}`);
      });
    }

    return () => {
      if (notifListenerRef.current) {
        Notifications.removeNotificationSubscription(notifListenerRef.current);
      }
    };
  }, []);

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

            // ── Fetch reminders & schedule local notifications ──
            if (Platform.OS !== "web") {
              try {
                const reminderData = await apiRequest("/reminders");
                if (reminderData.success) {
                  await scheduleAllReminders(reminderData.reminders);
                }
              } catch (e) {
                console.log("Failed to schedule reminders:", e);
              }
            }
          }
        } catch (e) {
          console.log("Failed to fetch user profile:", e);
        }
      } else {
        dispatch(clearUser());
        // Cancel all notifications on logout
        if (Platform.OS !== "web") {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      }
    });

    return unsubscribe;
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