import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Documents from "./Documents";
import {
  useDeleteDocumentMutation,
  useGetUserDocumentsQuery,
} from "@/redux/api/endpoints/documentApiSlice";
import { Loading } from "@/components/LoadingScreen";
import SwipeDelete from "@/components/common/SwipeDelete";

const DocumnetsList = () => {
  const { data: documents, isLoading } = useGetUserDocumentsQuery();
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId).unwrap();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    <View>
      {(isLoading || isDeleting) && <Loading />}
      {documents?.map((document, index) => (
        <SwipeDelete
          handleDelete={() => handleDelete(document._id)}
          key={document._id}>
          <Documents
            _id={document._id}
            title={document.title}
            documentType={document.title}
            uploadedDate={document.updatedAt}
            deadline={document.info.deadline}
            description={document.info.description}
            expirationDate={document.info.expirationDate}
            status={document.info.status}
          />
        </SwipeDelete>
      ))}
    </View>
  );
};

export default DocumnetsList;

const styles = StyleSheet.create({});
