import { useEffect, useRef } from "react";
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
import { setAppLanguage, setAppTheme } from "@/store/slices/appSlice";
import { apiRequest } from "@/integrations/api/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ToastContainer } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import * as Notifications from "expo-notifications";
import { scheduleAllReminders } from "@/utils/notificationScheduler";
import { useToast } from "@/hooks/useToast";
import { useColorScheme } from "nativewind";

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const toast = useToast();
  const notifListenerRef = useRef<any>(null);

  const theme = useAppSelector((state) => state.app.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(theme);
  }, [theme]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Notifications.requestPermissionsAsync();
    }

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
            if (data.user.theme === "dark" || data.user.theme === "light") {
              dispatch(setAppTheme(data.user.theme));
            }

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
        if (Platform.OS !== "web") {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
        <StatusBar
          style={theme === "dark" ? "light" : "dark"}
          backgroundColor={theme === "dark" ? "#000" : "#F8FAFC"}
        />
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