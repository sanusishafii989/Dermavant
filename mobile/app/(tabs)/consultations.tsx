import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { DermavantColors } from '../../constants/Colors';
import { NativeGlassCard } from '../../components/ui/NativeGlassCard';
import { NativeBadge } from '../../components/ui/NativeBadge';
import { NativeButton } from '../../components/ui/NativeButton';

const mockAppointments = [
  {
    id: 'apt_101',
    doctorName: 'Dr. Sarah Jenkins',
    specialization: 'Cardiology Specialist',
    hospital: 'Dermavant Medical Centre',
    date: 'Mon, Oct 12',
    time: '10:30 AM',
    type: 'video',
    status: 'scheduled',
  },
  {
    id: 'apt_102',
    doctorName: 'Dr. Marcus Vance',
    specialization: 'Dermatologist',
    hospital: 'St. Jude Clinical Hospital',
    date: 'Wed, Oct 14',
    time: '02:00 PM',
    type: 'voice',
    status: 'scheduled',
  },
  {
    id: 'apt_103',
    doctorName: 'Dr. Elena Rostova',
    specialization: 'General Practitioner',
    hospital: 'Dermavant Telehealth Network',
    date: 'Sep 28, 2026',
    time: '11:00 AM',
    type: 'chat',
    status: 'completed',
  },
];

export default function MobileConsultationsScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [activeCallModal, setActiveCallModal] = useState<any>(null);

  const filteredAppointments = mockAppointments.filter((apt) => {
    if (activeTab === 'all') return true;
    return apt.status === activeTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'scheduled', 'completed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.filterBtn, activeTab === tab && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, activeTab === tab && styles.filterTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Appointments List */}
        {filteredAppointments.map((item) => (
          <NativeGlassCard key={item.id} style={styles.apptCard}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{item.doctorName}</Text>
                <Text style={styles.specText}>{item.specialization}</Text>
                <Text style={styles.hospitalText}>{item.hospital}</Text>
              </View>
              <NativeBadge
                label={item.status}
                variant={item.status === 'completed' ? 'success' : 'cyan'}
              />
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>📅 {item.date}</Text>
              <Text style={styles.detailText}>⏰ {item.time}</Text>
              <Text style={styles.detailText}>📹 {item.type.toUpperCase()}</Text>
            </View>

            <View style={styles.actionRow}>
              {item.status === 'scheduled' ? (
                <NativeButton
                  title="Join Telemedicine Call"
                  onPress={() => setActiveCallModal(item)}
                  variant="primary"
                  style={{ flex: 1 }}
                />
              ) : (
                <NativeButton
                  title="View Clinical Summary"
                  onPress={() => {}}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </NativeGlassCard>
        ))}

        {/* Live Call Modal */}
        <Modal visible={!!activeCallModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Live Telemedicine Encounter</Text>
              <Text style={styles.modalSub}>{activeCallModal?.doctorName}</Text>
              
              <View style={styles.videoSimBox}>
                <Text style={styles.simText}>📹 Encrypted Video Stream Active</Text>
              </View>

              <NativeButton
                title="End Consultation"
                variant="danger"
                onPress={() => setActiveCallModal(null)}
              />
            </View>
          </View>
        </Modal>
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
    gap: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterBtnActive: {
    backgroundColor: DermavantColors.cyan,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '800',
    color: DermavantColors.textMuted,
  },
  filterTextActive: {
    color: DermavantColors.dark,
  },
  apptCard: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: DermavantColors.white,
  },
  specText: {
    fontSize: 12,
    fontWeight: '700',
    color: DermavantColors.cyan,
    marginTop: 2,
  },
  hospitalText: {
    fontSize: 11,
    color: DermavantColors.textMuted,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 12,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '700',
    color: DermavantColors.white,
  },
  actionRow: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: DermavantColors.navy,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DermavantColors.white,
  },
  modalSub: {
    fontSize: 14,
    color: DermavantColors.cyan,
  },
  videoSimBox: {
    height: 200,
    backgroundColor: DermavantColors.dark,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simText: {
    color: DermavantColors.cyan,
    fontWeight: '700',
  },
});
