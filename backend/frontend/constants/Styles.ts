export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  weights: {
    normal: '400',
    medium: '500',
    bold: '700',
  },
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const COLORS = {
  primary: '#2f95dc',
  secondary: '#ccc',
  background: '#fff',
  surface: '#f8f9fa',
  border: '#e9ecef',
  text: {
    primary: '#000',
    secondary: '#6c757d',
    muted: '#adb5bd',
  },
  dark: {
    background: '#000',
    surface: '#1a1a1a',
    border: '#333',
    text: {
      primary: '#fff',
      secondary: '#adb5bd',
      muted: '#6c757d',
    },
  },
} as const;

export const BUTTON_VARIANTS = {
  primary: {
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  secondary: {
    backgroundColor: 'transparent',
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  small: {
    fontSize: TYPOGRAPHY.sizes.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
} as const;

export const CONTAINER_STYLES = {
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    backgroundColor: COLORS.background,
  },
} as const;