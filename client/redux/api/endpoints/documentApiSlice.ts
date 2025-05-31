import {
  CurrentDocumentResponseType,
  DocumentTypes,
  DocumentUploadResponseTypes,
  Info,
  UpdateDocumentType,
} from "@/types/scan";
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
    getUserCurrentDocument: builder.query<CurrentDocumentResponseType, string>({
      query: (documentId) => ({
        url: `/documents/${documentId}`,
      }),
      providesTags: ["Document"],
    }),
    deleteDocument: builder.mutation<{ message: string }, string>({
      query: (documentId) => ({
        url: `/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document", "Chat"],
    }),

    updateDocument: builder.mutation<
      { message: string },
      { id: string; body: UpdateDocumentType }
    >({
      query: ({ id, body }) => ({
        url: `/documents/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Document", "Chat"],
    }),
  }),
});

export const {
  useUploadDocumentMutation,
  useGetUserDocumentsQuery,
  useGetUserCurrentDocumentQuery,
  useDeleteDocumentMutation,
  useUpdateDocumentMutation,
} = documentApiSlice;
