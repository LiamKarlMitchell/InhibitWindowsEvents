// Design system tokens for consistent styling across components

// Color palette tokens
export const colors = {
  // Primary brand colors
  primary: {
    50: 'rgb(239 246 255)',
    100: 'rgb(219 234 254)', 
    500: 'rgb(59 130 246)',
    600: 'rgb(37 99 235)',
    700: 'rgb(29 78 216)',
    900: 'rgb(30 58 138)'
  },

  // Gray scale
  gray: {
    50: 'rgb(249 250 251)',
    100: 'rgb(243 244 246)',
    200: 'rgb(229 231 235)',
    300: 'rgb(209 213 219)',
    400: 'rgb(156 163 175)',
    500: 'rgb(107 114 128)',
    600: 'rgb(75 85 99)',
    700: 'rgb(55 65 81)',
    800: 'rgb(31 41 55)',
    900: 'rgb(17 24 39)'
  },

  // Semantic colors
  success: {
    500: 'rgb(34 197 94)',
    600: 'rgb(22 163 74)',
    700: 'rgb(21 128 61)'
  },

  warning: {
    500: 'rgb(245 158 11)',
    600: 'rgb(217 119 6)',
    700: 'rgb(180 83 9)'
  },

  danger: {
    500: 'rgb(239 68 68)',
    600: 'rgb(220 38 38)',
    700: 'rgb(185 28 28)'
  },

  info: {
    500: 'rgb(59 130 246)',
    600: 'rgb(37 99 235)',
    700: 'rgb(29 78 216)'
  }
} as const;

// Spacing tokens (in rem units)
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const;

// Border radius tokens
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px'
} as const;

// Typography tokens
export const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem' // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625'
  }
} as const;

// Shadow tokens for depth
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
} as const;

// Transition tokens
export const transitions = {
  // Duration tokens
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',   // micro-interactions
    200: '200ms',
    300: '300ms',   // larger changes
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  
  // Timing functions
  timing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Common transition combinations
  all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
} as const;

// Z-index tokens for layering
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const;