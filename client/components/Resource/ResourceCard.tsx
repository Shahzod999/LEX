import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedCard from "../ThemedCard";
import { useTheme } from "@/context/ThemeContext";
import { Resource } from "@/types/resource";

interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { colors } = useTheme();

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsitePress = (website: string) => {
    Linking.openURL(website);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'legal':
        return 'hammer-outline';
      case 'immigration':
        return 'globe-outline';
      case 'housing':
        return 'home-outline';
      case 'hotlines':
        return 'call-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'legal':
        return '#3B82F6';
      case 'immigration':
        return '#10B981';
      case 'housing':
        return '#8B5CF6';
      case 'hotlines':
        return '#EF4444';
      default:
        return colors.accent;
    }
  };

  return (
    <ThemedCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Ionicons 
            name={getTypeIcon(resource.type)} 
            size={20} 
            color={getTypeColor(resource.type)} 
          />
          <Text style={[styles.typeText, { color: getTypeColor(resource.type) }]}>
            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
          </Text>
        </View>
        
        {resource.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        
      
      </View>

      {/* Title and Description */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {resource.title}
      </Text>
      
      <Text style={[styles.description, { color: colors.hint }]} numberOfLines={3}>
        {resource.description}
      </Text>

      {/* Services */}
      {resource.services.length > 0 && (
        <View style={styles.servicesContainer}>
          <Text style={[styles.servicesTitle, { color: colors.text }]}>Services:</Text>
          <View style={styles.servicesTags}>
            {resource.services.slice(0, 3).map((service, index) => (
              <View key={index} style={[styles.serviceTag, { backgroundColor: colors.darkBackground }]}>
                <Text style={[styles.serviceText, { color: colors.text }]} numberOfLines={1}>
                  {service}
                </Text>
              </View>
            ))}
            {resource.services.length > 3 && (
              <Text style={[styles.moreServices, { color: colors.hint }]}>
                +{resource.services.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Languages */}
      {resource.languages.length > 0 && (
        <View style={styles.languagesContainer}>
          <Ionicons name="language-outline" size={16} color={colors.hint} />
          <Text style={[styles.languagesText, { color: colors.hint }]}>
            Languages: {resource.languages.slice(0, 3).join(', ')}
            {resource.languages.length > 3 && ` +${resource.languages.length - 3} more`}
          </Text>
        </View>
      )}

      {/* Hours */}
      {resource.hours && (
        <View style={styles.hoursContainer}>
          <Ionicons name="time-outline" size={16} color={colors.hint} />
          <Text style={[styles.hoursText, { color: colors.hint }]}>
            {resource.hours}
          </Text>
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.contactContainer}>
        {resource.contactInfo.phone && (
          <TouchableOpacity 
            style={styles.contactItem} 
            onPress={() => handlePhonePress(resource.contactInfo.phone!)}
          >
            <Ionicons name="call-outline" size={18} color={colors.accent} />
            <Text style={[styles.contactText, { color: colors.accent }]}>
              {resource.contactInfo.phone}
            </Text>
          </TouchableOpacity>
        )}

        {resource.contactInfo.email && (
          <TouchableOpacity 
            style={styles.contactItem} 
            onPress={() => handleEmailPress(resource.contactInfo.email!)}
          >
            <Ionicons name="mail-outline" size={18} color={colors.accent} />
            <Text style={[styles.contactText, { color: colors.accent }]}>
              {resource.contactInfo.email}
            </Text>
          </TouchableOpacity>
        )}

        {resource.contactInfo.website && (
          <TouchableOpacity 
            style={styles.contactItem} 
            onPress={() => handleWebsitePress(resource.contactInfo.website!)}
          >
            <Ionicons name="globe-outline" size={18} color={colors.accent} />
            <Text style={[styles.contactText, { color: colors.accent }]} numberOfLines={1}>
              Visit Website
            </Text>
          </TouchableOpacity>
        )}

        {resource.contactInfo.address && (
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={18} color={colors.hint} />
            <Text style={[styles.addressText, { color: colors.hint }]} numberOfLines={2}>
              {resource.contactInfo.address}
            </Text>
          </View>
        )}
      </View>

      {/* Rating */}
      {resource.rating && (
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[...Array(5)].map((_, index) => (
              <Ionicons
                key={index}
                name={index < Math.floor(resource.rating!) ? "star" : "star-outline"}
                size={14}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={[styles.ratingText, { color: colors.hint }]}>
            {resource.rating.toFixed(1)}
          </Text>
        </View>
      )}
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
    flexWrap: 'wrap',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreServices: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  languagesText: {
    fontSize: 13,
    flex: 1,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  hoursText: {
    fontSize: 13,
  },
  contactContainer: {
    gap: 8,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 13,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ResourceCard; 