import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers) => {
    headers.set("user-id", "");
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: [""],
  endpoints: () => ({}),
});
