import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { AiApiSlice } from "./api/AiApiSlice";
import tokenSlice from "./features/tokenSlice";

export const store = configureStore({
  reducer: {
    [AiApiSlice.reducerPath]: AiApiSlice.reducer,
    token: tokenSlice,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(AiApiSlice.middleware),
  devTools: true,
});

setupListeners(store.dispatch); //this

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
