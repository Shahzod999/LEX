import { saveTokenToSecureStore } from "@/utils/secureStore";
import { apiSlice } from "../apiSlice";
import { setToken } from "@/redux/features/tokenSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await saveTokenToSecureStore(data.token);
          dispatch(setToken(data.token));
        } catch (error) {
          console.error("Error saving token:", error);
        }
      },
    }),

    register: builder.mutation({
      query: (credentials) => ({
        url: "/users/register",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await saveTokenToSecureStore(data.token);
          dispatch(setToken(data.token));
        } catch (error) {
          console.error("Error saving token:", error);
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApiSlice;
