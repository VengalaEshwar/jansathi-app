import { LogBox, View ,Platform } from "react-native";
import { Stack, usePathname } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavBar } from "@/components/NavBar";
import { GlobalChatbot } from "@/components/GlobalChatbot";
import "./global.css";
import { Provider } from "react-redux";
import { store } from "@/store";
const queryClient = new QueryClient();

LogBox.ignoreAllLogs();



export default function RootLayout() {
  const pathname = usePathname();
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
  return (
    <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-black" >
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
      </SafeAreaProvider>
    </QueryClientProvider>
    </Provider>
  );
}