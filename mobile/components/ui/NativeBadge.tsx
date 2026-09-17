import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AetherisColors } from '../../constants/Colors';

export interface NativeBadgeProps {
  label: string;
  variant?: 'cyan' | 'gold' | 'success' | 'danger' | 'warning';
}

export function NativeBadge({ label, variant = 'cyan' }: NativeBadgeProps) {
  let bg = 'rgba(33, 158, 188, 0.15)';
  let border = 'rgba(33, 158, 188, 0.4)';
  let text = AetherisColors.cyan;

  if (variant === 'gold') {
    bg = 'rgba(255, 183, 3, 0.15)';
    border = 'rgba(255, 183, 3, 0.4)';
    text = AetherisColors.gold;
  } else if (variant === 'success') {
    bg = 'rgba(16, 185, 129, 0.15)';
    border = 'rgba(16, 185, 129, 0.4)';
    text = AetherisColors.success;
  } else if (variant === 'danger') {
    bg = 'rgba(239, 68, 68, 0.15)';
    border = 'rgba(239, 68, 68, 0.4)';
    text = AetherisColors.danger;
  } else if (variant === 'warning') {
    bg = 'rgba(245, 158, 11, 0.15)';
    border = 'rgba(245, 158, 11, 0.4)';
    text = AetherisColors.warning;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
