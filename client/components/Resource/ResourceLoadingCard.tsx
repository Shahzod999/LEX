import React from "react";
import { StyleSheet, View, Animated } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import ThemedCard from "../ThemedCard";

const ResourceLoadingCard: React.FC = () => {
  const { colors } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmer();
  }, [animatedValue]);

  const shimmerStyle = {
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  };

  return (
    <ThemedCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.typeIndicator,
            { backgroundColor: colors.border },
            shimmerStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.verifiedBadge,
            { backgroundColor: colors.border },
            shimmerStyle,
          ]}
        />
      </View>

      {/* Title */}
      <Animated.View
        style={[
          styles.titleLine,
          { backgroundColor: colors.border },
          shimmerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.titleLineShort,
          { backgroundColor: colors.border },
          shimmerStyle,
        ]}
      />

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Animated.View
          style={[
            styles.descriptionLine,
            { backgroundColor: colors.border },
            shimmerStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.descriptionLine,
            { backgroundColor: colors.border },
            shimmerStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.descriptionLineShort,
            { backgroundColor: colors.border },
            shimmerStyle,
          ]}
        />
      </View>

      {/* Services */}
      <View style={styles.servicesContainer}>
        <Animated.View
          style={[
            styles.servicesTitle,
            { backgroundColor: colors.border },
            shimmerStyle,
          ]}
        />
        <View style={styles.servicesTags}>
          {[1, 2, 3].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.serviceTag,
                { backgroundColor: colors.border },
                shimmerStyle,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contactContainer}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.contactItem}>
            <Animated.View
              style={[
                styles.contactIcon,
                { backgroundColor: colors.border },
                shimmerStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.contactText,
                { backgroundColor: colors.border },
                shimmerStyle,
              ]}
            />
          </View>
        ))}
      </View>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeIndicator: {
    width: 80,
    height: 20,
    borderRadius: 10,
  },
  verifiedBadge: {
    width: 60,
    height: 16,
    borderRadius: 8,
  },
  titleLine: {
    height: 20,
    borderRadius: 4,
    marginBottom: 6,
  },
  titleLineShort: {
    height: 20,
    width: '60%',
    borderRadius: 4,
    marginBottom: 12,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionLine: {
    height: 14,
    borderRadius: 3,
    marginBottom: 4,
  },
  descriptionLineShort: {
    height: 14,
    width: '70%',
    borderRadius: 3,
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesTitle: {
    width: 60,
    height: 14,
    borderRadius: 3,
    marginBottom: 6,
  },
  servicesTags: {
    flexDirection: 'row',
    gap: 6,
  },
  serviceTag: {
    width: 50,
    height: 20,
    borderRadius: 10,
  },
  contactContainer: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  contactText: {
    height: 14,
    width: 120,
    borderRadius: 3,
  },
});

export default ResourceLoadingCard; 