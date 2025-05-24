import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
  Modal,
  FlatList,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
interface TabsTypes {
  id: string;
  label: string;
  type: string;
}

interface TabsProps {
  tabs: TabsTypes[];
  onTabChange?: (tabId: string) => void;
  setOrderType?: (tabId: TabsTypes) => void;
  activeTab?: string;
}

const ToggleTabsRN: React.FC<TabsProps> = ({
  tabs,
  onTabChange,
  setOrderType,
  activeTab: externalActiveTab,
}) => {
  const { colors } = useTheme();
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0].id);
  const activeTab =
    externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const visibleTabs = tabs.slice(0, 3);
  const dropdownTabs = tabs.slice(3);

  const handleTabChange = (tab: TabsTypes) => {
    if (externalActiveTab === undefined) {
      setInternalActiveTab(tab.id);
    }
    setOrderType?.(tab);
    onTabChange?.(tab.id);
    setShowDropdown(false);
  };

  useEffect(() => {
    const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);
    let offset = 0;

    for (let i = 0; i < activeIndex; i++) {
      offset += tabWidths[visibleTabs[i].id] || 0;
    }

    Animated.timing(slideAnim, {
      toValue: offset,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeTab, tabWidths, visibleTabs]);

  const onTabLayout = (event: LayoutChangeEvent, tabId: string) => {
    const { width } = event.nativeEvent.layout;
    setTabWidths((prev) => ({
      ...prev,
      [tabId]: width,
    }));
  };

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const getIndicatorWidth = () => {
    const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);
    return tabWidths[visibleTabs[activeIndex]?.id] || 0;
  };

  const renderDropdownItem = ({ item }: { item: TabsTypes }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
      onPress={() => handleTabChange(item)}>
      <Text
        style={[
          styles.dropdownItemText,
          { color: colors.text },
          activeTab === item.id && [
            styles.activeDropdownItemText,
            { color: colors.accent },
          ],
        ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabsWrapper} onLayout={onContainerLayout}>
      <View style={styles.tabs}>
        {visibleTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onLayout={(e) => onTabLayout(e, tab.id)}
            onPress={() => handleTabChange(tab)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}

        {dropdownTabs.length > 0 && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowDropdown(true)}>
            <Text style={styles.moreButtonText}>•••</Text>
          </TouchableOpacity>
        )}

        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: getIndicatorWidth(),
              transform: [{ translateX: slideAnim }],
            },
          ]}
        />
      </View>

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}>
          <View
            style={[
              styles.dropdownContainer,
              { backgroundColor: colors.darkBackground },
            ]}>
            <FlatList
              data={dropdownTabs}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.id}
              style={styles.dropdownList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsWrapper: {
    backgroundColor: "rgba(120, 120, 120, 0.2)",
    padding: 2,
    borderRadius: 10,
    width: "100%",
  },
  tabs: {
    flexDirection: "row",
    position: "relative",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    zIndex: 1,
  },
  tabText: {
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
    textAlign: "center",
    color: "#777777",
  },
  activeTabText: {
    color: "#000000",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    top: 0,
    backgroundColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: 7,
  },
  moreButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 7,
    zIndex: 1,
  },
  moreButtonText: {
    fontSize: 16,
    color: "#777777",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    borderRadius: 10,
    width: "80%",
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownList: {
    padding: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  activeDropdownItemText: {
    fontWeight: "600",
  },
});

export default ToggleTabsRN;
