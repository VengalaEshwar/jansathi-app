import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // string for Redux serialization
}

interface ChatState {
  messages: Message[];
  isThinking: boolean;
  language: "en" | "hi";
}

const initialState: ChatState = {
  messages: [
    {
      role: "assistant",
      content:
        "नमस्ते! Hello! I am JanSathi AI. How can I help you today? आप हिंदी या English में बात कर सकते हैं।",
      timestamp: new Date().toISOString(),
    },
  ],
  isThinking: false,
  language: "en",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    setThinking(state, action: PayloadAction<boolean>) {
      state.isThinking = action.payload;
    },
    setLanguage(state, action: PayloadAction<"en" | "hi">) {
      state.language = action.payload;
    },
    clearMessages(state) {
      state.messages = [
        {
          role: "assistant",
          content: "नमस्ते! Hello! I am JanSathi AI. How can I help you today?",
          timestamp: new Date().toISOString(),
        },
      ];
    },
  },
});

export const { addMessage, setThinking, setLanguage, clearMessages } =
  chatSlice.actions;
export default chatSlice.reducer;