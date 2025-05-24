import { StyleSheet, View } from "react-native";
import React from "react";
import Reminders from "./Reminders";
import ThemedButton from "@/components/ThemedButton";
const reminders = [
  {
    title: "Get lisen from the doctor",
    description: "pain in the left leg",
    time: "23 minutes ago",
  },
  {
    title: "Pay bills",
    description: "electricity, water, internet",
    time: "23 minutes ago",
    deadline: "15.05.2025",
  },
  {
    title: "Buy groceries",
    description: "milk, bread, eggs",
    time: "23 minutes ago",
    scheduledDate: "15.05.2025",
  },
  {
    title: "Buy groceries",
    description: "milk, bread, eggs",
    time: "23 minutes ago",
    scheduledDate: "15.05.2025",
    deadline: "15.05.2025",
  },
];
const ReindersList = () => {
  return (
    <View>
      <ThemedButton title="Add Reminder" onPress={() => {}} />

      {reminders.map((reminder, index) => (
        <Reminders
          key={index}
          title={reminder.title}
          description={reminder.description}
          time={reminder.time}
          scheduledDate={reminder.scheduledDate}
          deadline={reminder.deadline}
        />
      ))}
    </View>
  );
};

export default ReindersList;

const styles = StyleSheet.create({});
