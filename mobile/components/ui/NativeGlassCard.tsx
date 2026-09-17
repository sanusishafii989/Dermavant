import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { AetherisColors } from '../../constants/Colors';

export interface NativeGlassCardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  accentBorder?: string;
}

export function NativeGlassCard({ children, style, accentBorder }: NativeGlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        accentBorder ? { borderColor: accentBorder } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AetherisColors.glassBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AetherisColors.glassBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
});
