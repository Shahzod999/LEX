import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Documents from "./Documents";
import { useGetUserDocumentsQuery } from "@/redux/api/endpoints/documentApiSlice";
import { Loading } from "@/components/LoadingScreen";

// const documents = [
//   {
//     title: "Document 1",
//     documentType: "Document Type 1",
//     status: "Status 1",
//     uploadedDate: "16 days ago",
//     deadline: "15.05.2025",
//   },
//   {
//     title: "Document 2",
//     documentType: "Document Type 2",
//     status: "Status 2",
//     uploadedDate: "16 days ago",
//     deadline: "15.05.2025",
//   },
//   {
//     title: "Document 3",
//     documentType: "Document Type 3",
//     status: "Status 3",
//     uploadedDate: "16 days ago",
//     deadline: "15.05.2025",
//   },
// ];

const DocumnetsList = () => {
  const { data: documents, isLoading } = useGetUserDocumentsQuery();
  if (isLoading) return <Loading />;
  return (
    <View>
      {documents?.map((document, index) => (
        <Documents
          key={index}
          title={document.title}
          documentType={document.title}
          uploadedDate={document.updatedAt}
          deadline={document.info.deadline}
          description={document.info.description}
          expirationDate={document.info.expirationDate}
          status={document.info.status}
        />
      ))}
    </View>
  );
};

export default DocumnetsList;

const styles = StyleSheet.create({});
