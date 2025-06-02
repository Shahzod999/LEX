import { ReminderActionResponseType, ReminderRequestType, ReminderResponseType } from "@/types/reminder";
import { apiSlice } from "../apiSlice";

const reminderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createReminder: builder.mutation<ReminderActionResponseType, ReminderRequestType>({
      query: (reminder) => ({
        url: "/reminder",
        method: "POST",
        body: reminder,
      }),
      invalidatesTags: ["Reminder"],
    }),
    getReminders: builder.query<ReminderResponseType[], void>({
      query: () => ({
        url: "/reminder",
      }),
      providesTags: ["Reminder"],
    }),
    updateReminder: builder.mutation<ReminderActionResponseType, ReminderResponseType>({
      query: (reminder) => ({
        url: `/reminder/${reminder._id}`,
        method: "PUT",
        body: reminder,
      }),
      invalidatesTags: ["Reminder"],
    }),
    deleteReminder: builder.mutation<ReminderActionResponseType, string>({
      query: (id) => ({
        url: `/reminder/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reminder"],
    }),
  }),
});

export const { useCreateReminderMutation, useGetRemindersQuery, useUpdateReminderMutation, useDeleteReminderMutation } = reminderApi;
