import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import appReducer from "./slices/appSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;