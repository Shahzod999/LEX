import { apiSlice } from "../apiSlice";

interface OpenAIMessageRequest {
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  max_tokens: number;
  temperature: number;
}

interface OpenAIResponse {
  success: boolean;
  data: string;
}

export const openAIEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOpenAI: builder.query<OpenAIResponse, OpenAIMessageRequest>({
      query: (body) => ({
        url: "/openai",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetOpenAIQuery } = openAIEndpoints;
