import { AiApiSlice } from "../AiApiSlice";

export const openAIEndpoints = AiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOpenAI: builder.mutation({
      query: (body) => ({
        url: "/chat/completions",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetOpenAIMutation } = openAIEndpoints;
