import { DraggableChatbot } from "@/components/DraggableChatbot";
import { apiRequest } from "@/integrations/api/client";
import { useTranslation } from "@/hooks/useTranslation";

export const ProfileChatbot = () => {
  const { t, language } = useTranslation();

  const handleSend = async (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) => {
    const data = await apiRequest("/chat", "POST", {
      message,
      conversationHistory: history,
      language,
    });
    return data.reply as string;
  };

  return (
    <DraggableChatbot
      title={t.profileChat.title}
      welcomeMessage={t.profileChat.welcome}
      placeholder={t.profileChat.placeholder}
      sendFailedMessage={t.profileChat.sendFailed}
      onSendMessage={handleSend}
    />
  );
};