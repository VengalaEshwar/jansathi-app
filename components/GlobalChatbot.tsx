// components/GlobalChatbot.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Wraps DraggableChatbot with useJanSathi() so every message goes through
// the unified voice/command endpoint — enabling navigation from text chat.
//
// Smart navigation ALWAYS works here regardless of voiceAssistantEnabled toggle.
// TTS only fires if voiceAssistantEnabled is true.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from "react";
import { DraggableChatbot }  from "@/components/DraggableChatbot";
import { useTranslation }    from "@/hooks/useTranslation";
import { useJanSathi }       from "@/hooks/useJanSathi";

export function GlobalChatbot() {
  const { t } = useTranslation();

  // forceTTS: false → TTS fires only when voiceAssistantEnabled (from appSlice)
  // Navigation always works — the hook handles navigateTo regardless of TTS
  const { processCommand } = useJanSathi({ forceTTS: false });

  const handleSend = useCallback(async (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<string> => {
    // processCommand sends to /voice/command, speaks if enabled, navigates if needed
    const response = await processCommand(message, history);
    // Return the display message back to DraggableChatbot to show as chat bubble
    return response.message;
  }, [processCommand]);

  return (
    <DraggableChatbot
      title={t.globalChat.title}
      welcomeMessage={t.globalChat.welcome}
      placeholder={t.globalChat.placeholder}
      sendFailedMessage={t.globalChat.sendFailed}
      onSendMessage={handleSend}
    />
  );
}