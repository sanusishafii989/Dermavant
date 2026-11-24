import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { DermavantColors } from '../../constants/Colors';
import { NativeGlassCard } from '../../components/ui/NativeGlassCard';
import { NativeBadge } from '../../components/ui/NativeBadge';
import { NativeButton } from '../../components/ui/NativeButton';

const mockMedicines = [
  { id: 'm1', name: 'Paracetamol Extra 500mg', price: 1500, category: 'Painkillers', stock: 45 },
  { id: 'm2', name: 'Amoxicillin Antibiotic 250mg', price: 3200, category: 'Antibiotics', stock: 18 },
  { id: 'm3', name: 'Vitamin C 1000mg Chewable', price: 2100, category: 'Vitamins', stock: 60 },
  { id: 'm4', name: 'Lisinopril Blood Pressure 10mg', price: 4500, category: 'Cardiac', stock: 12 },
];

export default function MobilePharmacyScreen() {
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const filteredMedicines = mockMedicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search essential medicines or categories..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Cart Quick Bar */}
        <NativeGlassCard style={styles.cartBar}>
          <View style={styles.cartRow}>
            <Text style={styles.cartTitle}>🛒 Cart Items: {cartCount}</Text>
            <NativeButton
              title="Checkout"
              onPress={() => {}}
              variant="gold"
              disabled={cartCount === 0}
            />
          </View>
        </NativeGlassCard>

        {/* Medicine Grid */}
        <Text style={styles.sectionTitle}>Catalogue Items</Text>

        <View style={styles.grid}>
          {filteredMedicines.map((item) => (
            <NativeGlassCard key={item.id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <NativeBadge label={item.category} variant="cyan" />
                <Text style={styles.priceText}>₦{item.price.toLocaleString()}</Text>
              </View>

              <Text style={styles.medName}>{item.name}</Text>
              <Text style={styles.stockText}>In Stock: {item.stock} units</Text>

              <NativeButton
                title="+ Add to Cart"
                onPress={() => setCartCount((prev) => prev + 1)}
                variant="primary"
                style={{ marginTop: 8 }}
              />
            </NativeGlassCard>
          ))}
        </View>
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
  searchBox: {
    marginBottom: 4,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: DermavantColors.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: DermavantColors.glassBorder,
  },
  cartBar: {
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
    borderColor: 'rgba(255, 183, 3, 0.3)',
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DermavantColors.gold,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DermavantColors.white,
  },
  grid: {
    gap: 12,
  },
  medCard: {
    gap: 6,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: DermavantColors.gold,
  },
  medName: {
    fontSize: 15,
    fontWeight: '800',
    color: DermavantColors.white,
    marginTop: 4,
  },
  stockText: {
    fontSize: 11,
    color: DermavantColors.textMuted,
  },
});
