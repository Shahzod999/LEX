import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import tokenSlice from "./features/tokenSlice";
import { apiSlice } from "./api/apiSlice";
import userSlice from "./features/userSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    token: tokenSlice,
    user: userSlice,
  },

  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

setupListeners(store.dispatch); //this

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
