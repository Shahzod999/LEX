import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMenu } from "../context/MenuContext";
import { useTheme } from "../context/ThemeContext";
import { router } from "expo-router";
import { removeTokenFromSecureStore } from "@/utils/secureStore";
import { clearToken } from "@/redux/features/tokenSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { apiSlice } from "@/redux/api/apiSlice";
import { getValidatedUrl } from "@/utils/ValidateImg";
import { selectUser } from "@/redux/features/userSlice";

export default function SlideMenu() {
  const profile = useAppSelector(selectUser);

  const dispatch = useAppDispatch();
  const { menuVisible, hideMenu } = useMenu();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("🇬🇧 English");
  const [isVisible, setIsVisible] = useState(menuVisible);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const languages = [
    "🇬🇧 English",
    "🇩🇪 German",
    "🇪🇸 Spanish",
    "🇫🇷 French",
    "🇸🇦 Arabic",
    "🇹🇷 Turkish",
    "🇷🇺 Russian",
  ];

  const legalItems = [
    { title: "Privacy Policy", route: "privacy-policy" },
    { title: "Terms of Use", route: "terms-of-use" },
  ];

  useEffect(() => {
    if (menuVisible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only hide the component after animation completes
        setIsVisible(false);
      });
    }
  }, [menuVisible, slideAnim, fadeAnim]);

  const handleLogout = async () => {
    hideMenu();
    try {
      await removeTokenFromSecureStore();
      dispatch(clearToken());
      router.replace("/login");
      dispatch(apiSlice.util.resetApiState());
    } catch (error) {
      console.error(error);
    }
  };

  const navigateTo = (route: string) => {
    hideMenu();
    router.push(route as any);
  };

  // Use the internal visibility state instead of menuVisible for rendering
  if (!menuVisible && !isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={hideMenu}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={hideMenu}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: colors.card,
            },
          ]}>
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.scrollContent}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={hideMenu}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* User Profile Header */}
              <View style={styles.profileHeader}>
                <Image
                  source={{
                    uri: getValidatedUrl(profile?._id, profile?.profilePicture),
                  }}
                  style={styles.avatar}
                />
                <View style={styles.profileInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    Hi {profile?.name}
                  </Text>
                  <Text style={[styles.welcomeText, { color: colors.hint }]}>
                    Welcome Back!
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.accent + "20" },
                    ]}>
                    <Text style={[styles.badgeText, { color: colors.accent }]}>
                      Free User
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              {/* Profile Section */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("account-settings")}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Account Settings
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("subscription")}>
                  <Ionicons name="card-outline" size={22} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Subscription
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Preferences Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.hint }]}>
                  PREFERENCES
                </Text>

                <View style={styles.menuItem}>
                  <Ionicons name="moon-outline" size={22} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Dark Mode
                  </Text>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    style={styles.switch}
                    trackColor={{
                      false: "#767577",
                      true: colors.accent + "80",
                    }}
                    thumbColor={isDarkMode ? colors.accent : "white"}
                  />
                </View>

                <View style={styles.menuItem}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Notifications
                  </Text>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    style={styles.switch}
                    trackColor={{
                      false: "#767577",
                      true: colors.accent + "80",
                    }}
                    thumbColor={notifications ? colors.accent : "white"}
                  />
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() =>
                    setLanguageDropdownOpen(!languageDropdownOpen)
                  }>
                  <Ionicons
                    name="language-outline"
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Language
                  </Text>
                  <Ionicons
                    name={languageDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.text}
                    style={styles.chevron}
                  />
                </TouchableOpacity>

                {languageDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownContainer,
                      { backgroundColor: colors.darkBackground },
                    ]}>
                    {languages.map((language, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropdownItem,
                          selectedLanguage === language && {
                            backgroundColor: colors.accent + "30",
                          },
                        ]}
                        onPress={() => {
                          setSelectedLanguage(language);
                          setLanguageDropdownOpen(false);
                        }}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: colors.text },
                            selectedLanguage === language && {
                              color: colors.accent,
                              fontWeight: "500",
                            },
                          ]}>
                          {language}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Support Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.hint }]}>
                  SUPPORT
                </Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("help-center")}>
                  <Ionicons
                    name="help-circle-outline"
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Help Center
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("resources")}>
                  <Ionicons name="book-outline" size={22} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Find Resources
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setLegalDropdownOpen(!legalDropdownOpen)}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    Legal
                  </Text>
                  <Ionicons
                    name={legalDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.text}
                    style={styles.chevron}
                  />
                </TouchableOpacity>

                {legalDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownContainer,
                      { backgroundColor: colors.darkBackground },
                    ]}>
                    {legalItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => navigateTo(item.route)}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: colors.text },
                          ]}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: "#F44336" }]}
                onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="white" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 15,
    position: "absolute",
    top: 0,
    right: 0,
  },
  sidebar: {
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    height: "100%",
    position: "absolute",
    right: 0,
    zIndex: 1000,
  },
  scrollContent: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  badge: {
    backgroundColor: "#E0F7FA",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#00838F",
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#999",
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  chevron: {
    marginLeft: 5,
  },
  dropdownContainer: {
    backgroundColor: "#f5f5f5",
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  selectedItem: {
    backgroundColor: "#E3F2FD",
  },
  dropdownItemText: {
    fontSize: 14,
  },
  selectedItemText: {
    color: "#1976D2",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "#F44336",
    margin: 20,
    marginTop: 10,
    marginBottom: 30,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 10,
  },
});
