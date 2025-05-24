import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  height?: number | string;
}

const BottomModal: React.FC<BottomModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  confirmText = "Done",
  cancelText = "Cancel",
  children,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.darkBackground },
              ]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.modalButton, { color: colors.hint }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
                {title && (
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {title}
                  </Text>
                )}
                {onConfirm && (
                  <TouchableOpacity onPress={onConfirm}>
                    <Text
                      style={[styles.modalButton, { color: colors.accent }]}>
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.modalBody}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButton: {
    fontSize: 16,
    fontWeight: "500",
    padding: 5,
  },
  modalBody: {
    padding: 15,
  },
});

export default BottomModal;
