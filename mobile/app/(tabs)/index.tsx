import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { DermavantColors } from '../../constants/Colors';
import { NativeGlassCard } from '../../components/ui/NativeGlassCard';
import { NativeBadge } from '../../components/ui/NativeBadge';
import { getMobileSession } from '../../services/auth';

const serviceCards = [
  {
    title: 'Start AI Triage',
    desc: 'Guided clinical symptom assessment & precautions.',
    icon: '🤖',
    accent: DermavantColors.cyan,
    route: 'ai-suite',
  },
  {
    title: 'Book Specialist',
    desc: 'Choose doctor specialty and reserve appointment slot.',
    icon: '🩺',
    accent: DermavantColors.gold,
    route: 'consultations',
  },
  {
    title: 'Global E-Pharmacy',
    desc: 'Browse prescription medicines and nearby fulfillment.',
    icon: '💊',
    accent: DermavantColors.cyan,
    route: 'pharmacy',
  },
  {
    title: 'Medical Profile',
    desc: 'Manage biometrics, vitals, allergies & emergency info.',
    icon: '👤',
    accent: DermavantColors.gold,
    route: 'profile',
  },
];

export default function MobileDashboardScreen() {
  const session = getMobileSession();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Banner */}
        <NativeGlassCard style={styles.welcomeCard}>
          <View style={styles.badgeRow}>
            <NativeBadge label="Patient Portal" variant="cyan" />
            <NativeBadge label="AI Care Active" variant="gold" />
          </View>
          <Text style={styles.welcomeSub}>WELCOME BACK</Text>
          <Text style={styles.welcomeName}>{session.fullName}</Text>
          <Text style={styles.welcomeDesc}>
            Your digital health portal is connected and ready for care encounters.
          </Text>
        </NativeGlassCard>

        {/* Quick Wallet Snapshot */}
        <NativeGlassCard style={styles.snapshotCard}>
          <View style={styles.snapshotRow}>
            <View>
              <Text style={styles.snapshotLabel}>HEALTH WALLET BALANCE</Text>
              <Text style={styles.snapshotBalance}>₦45,000.00</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.topupBtn}
            >
              <Text style={styles.topupBtnText}>+ Top Up</Text>
            </TouchableOpacity>
          </View>
        </NativeGlassCard>

        {/* Services Grid Title */}
        <Text style={styles.sectionTitle}>Ecosystem Services</Text>

        {/* Service Cards Grid */}
        <View style={styles.grid}>
          {serviceCards.map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.8}
              onPress={() => router.push(`/(tabs)/${item.route}` as any)}
              style={styles.gridItem}
            >
              <NativeGlassCard accentBorder={item.accent} style={styles.serviceCard}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.openText, { color: item.accent }]}>Open Portal →</Text>
                </View>
              </NativeGlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency SOS Banner */}
        <NativeGlassCard style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>Emergency Services</Text>
              <Text style={styles.emergencyDesc}>
                Instant dispatch trigger for urgent medical response & hotline.
              </Text>
            </View>
          </View>
        </NativeGlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DermavantColors.dark,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  welcomeCard: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 10,
    fontWeight: '800',
    color: DermavantColors.cyan,
    letterSpacing: 1.5,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '800',
    color: DermavantColors.white,
  },
  welcomeDesc: {
    fontSize: 13,
    color: DermavantColors.textMuted,
    lineHeight: 18,
  },
  snapshotCard: {
    backgroundColor: 'rgba(33, 158, 188, 0.1)',
    borderColor: 'rgba(33, 158, 188, 0.3)',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: DermavantColors.cyan,
    letterSpacing: 1,
  },
  snapshotBalance: {
    fontSize: 22,
    fontWeight: '800',
    color: DermavantColors.white,
    marginTop: 2,
  },
  topupBtn: {
    backgroundColor: DermavantColors.cyan,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  topupBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: DermavantColors.dark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DermavantColors.white,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  serviceCard: {
    height: 170,
    justifyContent: 'space-between',
  },
  cardIcon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DermavantColors.white,
  },
  cardDesc: {
    fontSize: 11,
    color: DermavantColors.textMuted,
    lineHeight: 15,
  },
  cardFooter: {
    marginTop: 4,
  },
  openText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emergencyCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emergencyHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emergencyIcon: {
    fontSize: 28,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DermavantColors.white,
  },
  emergencyDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});
