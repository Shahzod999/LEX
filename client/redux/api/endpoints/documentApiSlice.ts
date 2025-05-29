import { DocumentTypes, DocumentUploadResponseTypes } from "@/types/scan";
import { apiSlice } from "../apiSlice";

export const documentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadDocument: builder.mutation<DocumentUploadResponseTypes, FormData>({
      query: (formData) => ({
        url: "/documents",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Document", "Chat"],
    }),
    getUserDocuments: builder.query<DocumentTypes[], void>({
      query: () => ({
        url: "/documents",
      }),
      providesTags: ["Document"],
    }),
    getUserDocument: builder.query<DocumentTypes, string>({
      query: (documentId) => ({
        url: `/documents/${documentId}`,
      }),
    }),
    deleteDocument: builder.mutation<{ message: string }, string>({
      query: (documentId) => ({
        url: `/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document", "Chat"],
    }),
  }),
});

export const {
  useUploadDocumentMutation,
  useGetUserDocumentsQuery,
  useGetUserDocumentQuery,
  useDeleteDocumentMutation,
} = documentApiSlice;
