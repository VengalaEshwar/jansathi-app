import { LogBox, View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavBar } from "@/components/NavBar";
import { GlobalChatbot } from "@/components/GlobalChatbot";
import "./global.css";

const queryClient = new QueryClient();

LogBox.ignoreAllLogs();

export default function RootLayout() {
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
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
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}