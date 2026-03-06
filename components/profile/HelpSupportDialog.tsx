import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Mail, Phone, MessageSquare, ChevronDown } from "lucide-react-native";

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpSupportDialog = ({
  open,
  onOpenChange,
}: HelpSupportDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = () => {
    Alert.alert("Success", "Support request submitted successfully!");
    setName("");
    setEmail("");
    setMessage("");
    onOpenChange(false);
  };

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
        <View className="bg-card w-[90%] max-h-[85%] rounded-2xl p-4">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-2xl font-bold mb-4">Help & Support</Text>

            {/* Contact Methods */}
            <View className="flex-row justify-between mb-6">
              <View className="flex-1 mx-1 p-3 rounded-lg bg-secondary items-center">
                <Mail size={22} color="#5B21B6" />
                <Text className="text-sm font-medium mt-2">Email</Text>
                <Text className="text-xs text-muted">support@app.com</Text>
              </View>

              <View className="flex-1 mx-1 p-3 rounded-lg bg-secondary items-center">
                <Phone size={22} color="#5B21B6" />
                <Text className="text-sm font-medium mt-2">Phone</Text>
                <Text className="text-xs text-muted">1800-123-4567</Text>
              </View>

              <View className="flex-1 mx-1 p-3 rounded-lg bg-secondary items-center">
                <MessageSquare size={22} color="#5B21B6" />
                <Text className="text-sm font-medium mt-2">Live Chat</Text>
                <Text className="text-xs text-muted">9 AM - 6 PM IST</Text>
              </View>
            </View>

            {/* FAQs */}
            <Text className="text-lg font-semibold mb-3">
              Frequently Asked Questions
            </Text>

            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <View
                  key={index}
                  className="border border-border rounded-lg mb-2"
                >
                  <Pressable
                    onPress={() =>
                      setOpenFaq(isOpen ? null : index)
                    }
                    className="flex-row justify-between items-center p-3"
                  >
                    <Text className="font-medium flex-1">
                      {faq.question}
                    </Text>
                    <ChevronDown
                      size={18}
                      color="#6B7280"
                      style={{
                        transform: [
                          { rotate: isOpen ? "180deg" : "0deg" },
                        ],
                      }}
                    />
                  </Pressable>

                  {isOpen && (
                    <View className="px-3 pb-3">
                      <Text className="text-muted text-sm">
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Contact Form */}
            <Text className="text-lg font-semibold mt-6 mb-3">
              Contact Support
            </Text>

            <TextInput
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              className="border border-border rounded-lg px-3 py-2 mb-3"
            />

            <TextInput
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              className="border border-border rounded-lg px-3 py-2 mb-3"
            />

            <TextInput
              placeholder="How can we help you?"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              className="border border-border rounded-lg px-3 py-2 mb-4"
              style={{ textAlignVertical: "top" }}
            />

            <Pressable
              onPress={handleSubmit}
              className="bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">
                Submit Request
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onOpenChange(false)}
              className="mt-3 py-2 items-center"
            >
              <Text className="text-muted">Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
