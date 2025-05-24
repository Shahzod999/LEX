import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import ImmigrationCard from "@/components/Card/ImmigrationCard";
import ThemedScreen from "@/components/ThemedScreen";
import Header from "@/components/Card/Header";
import InfoCard from "@/components/Info/InfoCard";

const immigration = () => {
  const cardData = {
    student: {
      title: "Student Visa",
      subtitle: "For academic studies and educational exchange",
      quote: '"Begin your future through education"',
      legalRef: "Legal Reference: §16 Residence Permit - Germany",
      agencies: ["USCIS", "Department of Education", "Embassy"],
    },
    work: {
      title: "Work Visa",
      subtitle: "For employment and professional opportunities",
      quote: '"Build your career and your dreams"',
      legalRef: "Legal Reference: §18 Employment Visa - EU Blue Card",
      agencies: ["Labor Department", "Immigration Office", "USCIS"],
    },
    family: {
      title: "Family Reunification",
      subtitle: "For joining family members across borders",
      quote: '"Reunite with loved ones safely"',
      legalRef: "Legal Reference: §28-30 Family Residence - Family Act",
      agencies: ["USCIS", "Family Court", "Border Agency"],
    },
    asylum: {
      title: "Asylum / Refugee",
      subtitle: "For those seeking protection and safety",
      quote: '"Find safety and rebuild your life"',
      legalRef:
        "Legal Reference: §25 Humanitarian Protection - Geneva Convention",
      agencies: ["UNHCR", "Asylum Office", "Immigration Court"],
    },
  };

  return (
    <ThemedScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header
          title="Immigration Pathways"
          subtitle="Select the option that best matches your situation"
        />
        {Object.keys(cardData).map((key) => (
          <ImmigrationCard
            key={key}
            data={cardData[key as keyof typeof cardData]}
            onPress={() => {}}
          />
        ))}

        <InfoCard
          title="Personalized Assistance"
          content="Lex creates a personalized immigration timeline based on your specific situation. Select a pathway above to begin or use the chat for customized guidance."
          icon="information-circle-outline"
        />
      </ScrollView>
    </ThemedScreen>
  );
};

export default immigration;

const styles = StyleSheet.create({});
