import { ChatHistoryType, ChatResponseType } from "@/types/chat";
import { apiSlice } from "../apiSlice";

interface Message {
  chatId?: string;
  content: string;
}

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserChats: builder.query<ChatHistoryType[], void>({
      query: () => ({
        url: "/chat",
      }),
      providesTags: ["Chat"],
    }),
    getUserOneChat: builder.query<ChatHistoryType, string>({
      query: (chatId) => ({
        url: `/chat/${chatId}`,
      }),
    }),

    sendMessage: builder.mutation<ChatResponseType, Message>({
      query: (message) => ({
        url: "/chat",
        method: "POST",
        body: message,
      }),
      invalidatesTags: ["Chat"],
    }),
    deleteChat: builder.mutation({
      query: (chatId) => ({
        url: `/chat/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useGetUserChatsQuery,
  useGetUserOneChatQuery,
  useSendMessageMutation,
  useDeleteChatMutation,
} = chatApiSlice;
