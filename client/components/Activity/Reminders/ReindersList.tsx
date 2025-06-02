import { StyleSheet, View } from "react-native";
import React, { useState } from "react";
import Reminders from "./Reminders";
import ThemedButton from "@/components/ThemedButton";
import { useDeleteReminderMutation, useGetRemindersQuery } from "@/redux/api/endpoints/reminderApi";
import { Loading } from "@/components/common/LoadingScreen";
import CreateReminderModal from "./CreateReminderModal";
import SwipeDelete from "@/components/common/SwipeDelete";
import { useToast } from "@/context/ToastContext";

const ReindersList = () => {
  const { data: reminders, isLoading } = useGetRemindersQuery();
  const [deleteReminder] = useDeleteReminderMutation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder(id).unwrap();
      showToast("Reminder deleted successfully", "success");
    } catch (error) {
      showToast("Error deleting reminder", "error");
    }
  };


  return (
    <View>
      <ThemedButton title="Add Reminder" onPress={() => setShowCreateModal(true)} icon="add" />

      {isLoading && <Loading />}

      {reminders?.map((reminder, index) => (
        <SwipeDelete handleDelete={() => handleDeleteReminder(reminder._id)}>
          <Reminders
            key={reminder._id}
            title={reminder.title}
            description={reminder.description}
            time={reminder.createdAt}
            scheduledDate={reminder.schedule}
            deadline={reminder.deadline}
          />
        </SwipeDelete>
      ))}

      <CreateReminderModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </View>
  );
};

export default ReindersList;

const styles = StyleSheet.create({});
