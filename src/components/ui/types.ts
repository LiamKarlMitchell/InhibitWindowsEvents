import { JSX } from 'solid-js';

// Base component props that all UI components extend
export interface BaseComponentProps {
  class?: string;
  children?: JSX.Element;
  id?: string;
  'data-testid'?: string;
}

// Size variants available across components
export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl';

// Color variants for semantic styling
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

// Button specific variants
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

// Component state for interactive elements
export interface ComponentState {
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
}

// Animation presets for consistent transitions
export interface AnimationConfig {
  duration: 'fast' | 'normal' | 'slow';
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Standard animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  fast: 150,    // micro-interactions
  normal: 300,  // larger changes
  slow: 500     // major transitions
} as const;

// Common accessibility props
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-disabled'?: boolean;
  'aria-pressed'?: boolean;
  role?: string;
  tabindex?: number;
}

// Focus management utilities
export interface FocusableProps extends AccessibilityProps {
  autoFocus?: boolean;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
}

// Interactive element props combining state and accessibility
export interface InteractiveProps extends ComponentState, FocusableProps {
  onClick?: (e: MouseEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
}