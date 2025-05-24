import { StyleSheet, Text, View } from "react-native";
import React from "react";
import News from "./News";

const news = [
  {
    title: "USCIS Form I-765: Employment Authorization Document",
    description:
      "The USCIS Form I-765 is an application for Employment Authorization Document. It is used to apply for a work permit in the United States.",
    source: "USCIS",
    time: "23 minutes ago",
  },
  {
    title: "USCIS Form I-765: Employment Authorization Document",
    description:
      "The USCIS Form I-765 is an application for Employment Authorization Document. It is used to apply for a work permit in the United States.",
    source: "USCIS",
    time: "23 minutes ago",
  },
  {
    title: "USCIS Form I-765: Employment Authorization Document",
    description:
      "The USCIS Form I-765 is an application for Employment Authorization Document. It is used to apply for a work permit in the United States.",
    source: "USCIS",
    time: "23 minutes ago",
  },
];

const NewsList = () => {
  return (
    <View>
      {news.map((item, index) => (
        <News
          key={index}
          title={item.title}
          description={item.description}
          source={item.source}
          time={item.time}
        />
      ))}
    </View>
  );
};

export default NewsList;

const styles = StyleSheet.create({});
