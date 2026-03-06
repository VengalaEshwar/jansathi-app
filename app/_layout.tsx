import { Stack ,usePathname} from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { NavBar } from "@/components/NavBar";
import { GlobalChatbot } from "@/components/GlobalChatbot";
import "./global.css"
const queryClient = new QueryClient();

export default function RootLayout() {
  const pathname = usePathname();
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View className="flex-1">
          <View className="w-full h-full">
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          
          <NavBar />
         { pathname!=="/profile" && <GlobalChatbot />}
          
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
