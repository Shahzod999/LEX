import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Documents from "./Documents";

const documents = [
  {
    title: "Document 1",
    documentType: "Document Type 1",
    status: "Status 1",
    uploadedDate: "16 days ago",
    deadline: "15.05.2025",
  },
  {
    title: "Document 2",
    documentType: "Document Type 2",
    status: "Status 2",
    uploadedDate: "16 days ago",
    deadline: "15.05.2025",
  },
  {
    title: "Document 3",
    documentType: "Document Type 3",
    status: "Status 3",
    uploadedDate: "16 days ago",
    deadline: "15.05.2025",
  },
];

const DocumnetsList = () => {
  return (
    <View>
      {documents.map((document, index) => (
        <Documents
          key={index}
          title={document.title}
          documentType={document.documentType}
          status={document.status}
          uploadedDate={document.uploadedDate}
          deadline={document.deadline}
        />
      ))}
    </View>
  );
};

export default DocumnetsList;

const styles = StyleSheet.create({});
