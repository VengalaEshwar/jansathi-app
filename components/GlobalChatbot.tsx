// components/GlobalChatbot.tsx
import { memo, useCallback } from "react";
import { DraggableChatbot } from "@/components/DraggableChatbot";
import { apiRequest } from "@/integrations/api/client";
import { useTranslation } from "@/hooks/useTranslation";

export const GlobalChatbot = memo(() => {
  const { t, language } = useTranslation();

  const handleSend = useCallback(async (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) => {
    const data = await apiRequest("/chat", "POST", {
      message,
      conversationHistory: history,
      language,
    });
    return data.reply as string;
  }, [language]);

  return (
    <DraggableChatbot
      title={t.globalChat.title}
      welcomeMessage={t.globalChat.welcome}
      placeholder={t.globalChat.placeholder}
      sendFailedMessage={t.globalChat.sendFailed}
      onSendMessage={handleSend}
    />
  );
});