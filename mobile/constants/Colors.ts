export const AetherisColors = {
  navy: '#023047',
  dark: '#000814',
  cyan: '#219EBC',
  gold: '#FFB703',
  white: '#FFFFFF',
  glassBg: 'rgba(2, 48, 71, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

const tintColorDark = AetherisColors.cyan;

export default {
  light: {
    text: AetherisColors.white,
    background: AetherisColors.dark,
    tint: tintColorDark,
    tabIconDefault: 'rgba(255, 255, 255, 0.4)',
    tabIconSelected: tintColorDark,
  },
  dark: {
    text: AetherisColors.white,
    background: AetherisColors.dark,
    tint: tintColorDark,
    tabIconDefault: 'rgba(255, 255, 255, 0.4)',
    tabIconSelected: tintColorDark,
  },
};
