import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://api.openai.com/v1",
  prepareHeaders: (headers) => {
    headers.set("Authorization", `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const AiApiSlice = createApi({
  baseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});
