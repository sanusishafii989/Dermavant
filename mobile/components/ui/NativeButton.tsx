import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { AetherisColors } from '../../constants/Colors';

export interface NativeButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function NativeButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: NativeButtonProps) {
  const isPrimary = variant === 'primary';
  const isGold = variant === 'gold';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isPrimary && styles.primaryBg,
        isGold && styles.goldBg,
        isDanger && styles.dangerBg,
        isGhost && styles.ghostBg,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || isGold ? AetherisColors.dark : AetherisColors.cyan} />
      ) : (
        <>
          {icon ? icon : null}
          <Text
            style={[
              styles.text,
              isPrimary && styles.darkText,
              isGold && styles.darkText,
              isDanger && styles.whiteText,
              isGhost && styles.cyanText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 8,
  },
  primaryBg: {
    backgroundColor: AetherisColors.cyan,
  },
  goldBg: {
    backgroundColor: AetherisColors.gold,
  },
  dangerBg: {
    backgroundColor: AetherisColors.danger,
  },
  ghostBg: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AetherisColors.cyan,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: AetherisColors.white,
  },
  darkText: {
    color: AetherisColors.dark,
  },
  whiteText: {
    color: AetherisColors.white,
  },
  cyanText: {
    color: AetherisColors.cyan,
  },
});
