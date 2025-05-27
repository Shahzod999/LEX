import { apiSlice } from "../apiSlice";

interface Message {
  chatId?: string;
  content: string;
}

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserChats: builder.query({
      query: () => ({
        url: "/chat",
      }),
    }),
    getUserOneChat: builder.query({
      query: (chatId) => ({
        url: `/chat/${chatId}`,
      }),
    }),

    sendMessage: builder.mutation<{}, Message>({
      query: (message) => ({
        url: "/chat",
        method: "POST",
        body: message,
      }),
    }),
    deleteChat: builder.mutation({
      query: (chatId) => ({
        url: `/chat/${chatId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetUserChatsQuery,
  useGetUserOneChatQuery,
  useSendMessageMutation,
  useDeleteChatMutation,
} = chatApiSlice;
