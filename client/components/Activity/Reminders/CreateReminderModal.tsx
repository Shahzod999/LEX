import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import BottomModal from "@/components/Modal/BottomModal";
import ThemedButton from "@/components/ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import { useCreateReminderMutation } from "@/redux/api/endpoints/reminderApi";
import { useToast } from "@/context/ToastContext";

interface CreateReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

const CreateReminderModal: React.FC<CreateReminderModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const [createReminder, { isLoading }] = useCreateReminderMutation();
  const descriptionRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: new Date(),
    schedule: new Date(),
  });

  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [tempDeadline, setTempDeadline] = useState(new Date());
  const [tempSchedule, setTempSchedule] = useState(new Date());

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      deadline: new Date(),
      schedule: new Date(),
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      showError("Пожалуйста, заполните все поля");
      return;
    }

    try {
      await createReminder({
        title: formData.title.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline.toISOString(),
        schedule: formData.schedule.toISOString(),
      }).unwrap();

      showSuccess("Напоминание успешно создано");
      handleClose();
    } catch (error) {
      showError("Ошибка при создании напоминания");
    }
  };

  const handleDeadlineChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDeadlinePicker(false);
      if (selectedDate) {
        setFormData((prev) => ({ ...prev, deadline: selectedDate }));
      }
    } else {
      if (selectedDate) {
        setTempDeadline(selectedDate);
      }
    }
  };

  const handleScheduleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowSchedulePicker(false);
      if (selectedDate) {
        setFormData((prev) => ({ ...prev, schedule: selectedDate }));
      }
    } else {
      if (selectedDate) {
        setTempSchedule(selectedDate);
      }
    }
  };

  const confirmDeadline = () => {
    setFormData((prev) => ({ ...prev, deadline: tempDeadline }));
    setShowDeadlinePicker(false);
  };

  const confirmSchedule = () => {
    setFormData((prev) => ({ ...prev, schedule: tempSchedule }));
    setShowSchedulePicker(false);
  };

  const isFormValid = formData.title.trim() && formData.description.trim();

  return (
    <BottomModal
      visible={visible}
      onClose={handleClose}
      title="Новое напоминание"
      onConfirm={isFormValid && !isLoading ? handleSubmit : undefined}
      confirmText={isLoading ? "Создание..." : "Создать"}
      cancelText="Отмена"
    >
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Название</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Введите название напоминания"
            placeholderTextColor={colors.hint}
            value={formData.title}
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Описание</Text>
          <TextInput
            ref={descriptionRef}
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Введите описание"
            placeholderTextColor={colors.hint}
            value={formData.description}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Дата выполнения</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateButton, { backgroundColor: colors.card }]}
            onPress={() => {
              setTempDeadline(formData.deadline);
              setShowDeadlinePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.hint} />
            <Text style={{ color: colors.text, marginLeft: 10 }}>{formData.deadline.toLocaleDateString("ru-RU")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Запланировано на</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateButton, { backgroundColor: colors.card }]}
            onPress={() => {
              setTempSchedule(formData.schedule);
              setShowSchedulePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color={colors.hint} />
            <Text style={{ color: colors.text, marginLeft: 10 }}>
              {formData.schedule.toLocaleDateString("ru-RU")} в{" "}
              {formData.schedule.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Deadline Date Picker */}
      {Platform.OS === "ios" ? (
        <BottomModal visible={showDeadlinePicker} onClose={() => setShowDeadlinePicker(false)} onConfirm={confirmDeadline} title="Выберите дату">
          <DateTimePicker value={tempDeadline} mode="date" display="spinner" onChange={handleDeadlineChange} style={styles.datePicker} />
        </BottomModal>
      ) : (
        showDeadlinePicker && <DateTimePicker value={formData.deadline} mode="date" display="default" onChange={handleDeadlineChange} />
      )}

      {/* Schedule Date Picker */}
      {Platform.OS === "ios" ? (
        <BottomModal
          visible={showSchedulePicker}
          onClose={() => setShowSchedulePicker(false)}
          onConfirm={confirmSchedule}
          title="Выберите дату и время"
        >
          <DateTimePicker value={tempSchedule} mode="datetime" display="spinner" onChange={handleScheduleChange} style={styles.datePicker} />
        </BottomModal>
      ) : (
        showSchedulePicker && <DateTimePicker value={formData.schedule} mode="datetime" display="default" onChange={handleScheduleChange} />
      )}
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  form: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  datePicker: {
    height: 200,
  },
});

export default CreateReminderModal;
