import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Linking, // <-- Added Linking here
} from "react-native";
import { Mail, Phone, ChevronDown } from "lucide-react-native";

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpSupportDialog = ({
  open,
  onOpenChange,
}: HelpSupportDialogProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I scan medicines?",
      answer:
        "Go to Health section and select Medicine Scanner. Point your camera at the medicine label and our AI will extract all relevant information.",
    },
    {
      question: "How do I read prescriptions?",
      answer:
        "Navigate to Health > Prescription Reader. Upload or capture a photo of your prescription, and our system will digitize it for you.",
    },
    {
      question: "How do I fill government forms?",
      answer:
        "Use the G-Assist section and select Photo to Form. Take a photo of any document, and we'll help you auto-fill government forms.",
    },
    {
      question: "How do I change language?",
      answer:
        "Go to your Profile > Language Preferences to select your preferred language for the app interface and voice assistance.",
    },
    {
      question: "How do I enable notifications?",
      answer:
        "Visit Profile > Notifications to manage alerts for medications, appointments, and government updates.",
    },
  ];

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-light-card dark:bg-card w-[90%] max-h-[85%] rounded-2xl p-4">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold mb-4 text-light-foreground dark:text-foreground">
              Help & Support
            </Text>

            <View className="flex-row justify-between mb-6">
              {/* Changed to Pressable and added Linking for Email */}
              <Pressable 
                onPress={() => Linking.openURL('mailto:jansathi.service@gmail.com')}
                className="flex-1 mx-1 p-3 rounded-lg bg-secondary items-center border border-light-border dark:border-border active:opacity-70"
              >
                <Mail size={22} color="#8B5CF6" />
                <Text className="text-sm font-medium mt-2 text-light-foreground dark:text-foreground">
                  Email
                </Text>
                <Text className="text-xs text-muted text-center mt-1">
                  jansathi.service@gmail.com
                </Text>
              </Pressable>

              {/* Changed to Pressable and added Linking for Phone */}
              <Pressable 
                onPress={() => Linking.openURL('tel:+91 8688496180')}
                className="flex-1 mx-1 p-3 rounded-lg bg-secondary items-center border border-light-border dark:border-border active:opacity-70"
              >
                <Phone size={22} color="#8B5CF6" />
                <Text className="text-sm font-medium mt-2 text-light-foreground dark:text-foreground">
                  Phone
                </Text>
                <Text className="text-xs text-muted text-center mt-1">
                  8688496180
                </Text>
              </Pressable>
            </View>

            <Text className="text-lg font-semibold mb-3 text-light-foreground dark:text-foreground">
              Frequently Asked Questions
            </Text>

            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <View
                  key={index}
                  className="border border-light-border dark:border-border rounded-lg mb-2 bg-light-card dark:bg-card"
                >
                  <Pressable
                    onPress={() => setOpenFaq(isOpen ? null : index)}
                    className="flex-row justify-between items-center p-3"
                  >
                    <Text className="font-medium flex-1 text-light-foreground dark:text-foreground">
                      {faq.question}
                    </Text>
                    <ChevronDown
                      size={18}
                      color="#6B7280"
                      style={{
                        transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                      }}
                    />
                  </Pressable>

                  {isOpen && (
                    <View className="px-3 pb-3">
                      <Text className="text-muted text-sm">{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable
              onPress={() => onOpenChange(false)}
              className="mt-6 py-3 items-center bg-secondary rounded-xl border border-light-border dark:border-border active:opacity-70"
            >
              <Text className="text-light-foreground dark:text-foreground font-semibold">
                Close
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};