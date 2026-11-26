import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { DermavantColors } from '../../constants/Colors';
import { NativeGlassCard } from '../../components/ui/NativeGlassCard';
import { NativeBadge } from '../../components/ui/NativeBadge';
import { NativeButton } from '../../components/ui/NativeButton';

export default function MobileAISuiteScreen() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Dermavant Clinical AI assistant. Describe your symptoms or questions below.',
    },
  ]);
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAnalyzing(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Based on your symptoms, this matches tension headaches or mild fatigue. Ensure adequate hydration. Would you like to book a specialist for a comprehensive checkup?',
        },
      ]);
      setAnalyzing(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <NativeBadge label="Clinical AI Active" variant="gold" />
        <Text style={styles.bannerText}>Gemini Triage & Symptom Guidance Engine</Text>
      </View>

      {/* Chat Messages List */}
      <ScrollView contentContainerStyle={styles.chatContainer} showsVerticalScrollIndicator={false}>
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.msgBubble,
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={styles.msgSender}>{msg.sender === 'user' ? 'You' : 'Clinical AI'}</Text>
            <Text style={styles.msgText}>{msg.text}</Text>
          </View>
        ))}

        {analyzing && (
          <View style={styles.aiBubble}>
            <Text style={styles.msgSender}>Clinical AI</Text>
            <Text style={styles.msgText}>Analyzing symptoms against knowledge base...</Text>
          </View>
        )}
      </ScrollView>

      {/* Chat Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Describe symptoms (e.g. fever, headache)..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={input}
          onChangeText={setInput}
        />
        <NativeButton title="Send" onPress={handleSend} variant="primary" style={styles.sendBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DermavantColors.dark,
  },
  headerBanner: {
    padding: 14,
    backgroundColor: 'rgba(2, 48, 71, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: DermavantColors.glassBorder,
    gap: 4,
  },
  bannerText: {
    fontSize: 12,
    color: DermavantColors.white,
    fontWeight: '700',
  },
  chatContainer: {
    padding: 16,
    gap: 12,
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  aiBubble: {
    backgroundColor: DermavantColors.glassBg,
    borderColor: DermavantColors.glassBorder,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: DermavantColors.cyan,
    alignSelf: 'flex-end',
  },
  msgSender: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  msgText: {
    fontSize: 13,
    color: DermavantColors.white,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: DermavantColors.glassBorder,
    backgroundColor: DermavantColors.dark,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: DermavantColors.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: DermavantColors.glassBorder,
  },
  sendBtn: {
    paddingHorizontal: 16,
  },
});
