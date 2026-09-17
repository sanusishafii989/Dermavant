import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { AetherisColors } from '../../constants/Colors';
import { NativeGlassCard } from '../../components/ui/NativeGlassCard';
import { NativeBadge } from '../../components/ui/NativeBadge';
import { NativeButton } from '../../components/ui/NativeButton';
import { getMobileSession } from '../../services/auth';

export default function MobileProfileScreen() {
  const session = getMobileSession();
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('72');
  const [bp, setBp] = useState('120/80 mmHg');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Header */}
        <NativeGlassCard style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{session.fullName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{session.fullName}</Text>
            <Text style={styles.userEmail}>{session.email}</Text>
            <View style={{ marginTop: 6 }}>
              <NativeBadge label="Verified Patient" variant="success" />
            </View>
          </View>
        </NativeGlassCard>

        {/* Vitals & Biometrics */}
        <NativeGlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>🩸 Vitals & Biometrics</Text>

          <View style={styles.grid2}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <TextInput
                style={styles.input}
                value={bloodGroup}
                onChangeText={setBloodGroup}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Pressure</Text>
              <TextInput style={styles.input} value={bp} onChangeText={setBp} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>
          </View>
        </NativeGlassCard>

        {/* Emergency Contact */}
        <NativeGlassCard style={styles.emergencyCard}>
          <Text style={styles.sectionHeader}>🚨 Emergency Contact</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Name</Text>
            <TextInput style={styles.input} value="Jane Doe (Spouse)" />
          </View>
          <View style={[styles.inputGroup, { marginTop: 8 }]}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput style={styles.input} value="+234 802 345 6789" keyboardType="phone-pad" />
          </View>
        </NativeGlassCard>

        {saved && <Text style={styles.successText}>✓ Medical Profile Saved Successfully!</Text>}

        <NativeButton
          title="Save Medical Profile"
          onPress={handleSave}
          variant="primary"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AetherisColors.dark,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(33, 158, 188, 0.2)',
    borderWidth: 2,
    borderColor: AetherisColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: AetherisColors.cyan,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: AetherisColors.white,
  },
  userEmail: {
    fontSize: 12,
    color: AetherisColors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: AetherisColors.white,
    marginBottom: 4,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputGroup: {
    width: '48%',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: AetherisColors.textMuted,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: AetherisColors.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: AetherisColors.glassBorder,
  },
  emergencyCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    gap: 4,
  },
  successText: {
    color: AetherisColors.success,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
