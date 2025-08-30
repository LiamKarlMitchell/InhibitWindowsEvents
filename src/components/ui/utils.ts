import { SizeVariant, ButtonVariant } from './types';

/**
 * Utility to concatenate class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates variant-specific class names for components
 */
export function createVariantClasses<T extends string>(
  baseClasses: string,
  variants: Record<T, string>,
  selectedVariant: T,
  additionalClasses?: string
): string {
  return cn(baseClasses, variants[selectedVariant], additionalClasses);
}

/**
 * Size variant class mappings
 */
export const sizeClasses: Record<SizeVariant, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
  xl: 'text-xl px-8 py-4'
};

/**
 * Button variant class mappings that work with UnoCSS shortcuts
 */
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary', 
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'btn border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
};

/**
 * Focus ring classes for accessibility
 */
export const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900';

/**
 * Disabled state classes
 */
export const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

/**
 * Loading state classes
 */
export const loadingClasses = 'relative overflow-hidden';

/**
 * Creates a loading spinner overlay
 */
export function createLoadingOverlay(): string {
  return cn(
    'absolute inset-0 flex items-center justify-center',
    'bg-gray-900/50 backdrop-blur-sm',
    'transition-opacity duration-150'
  );
}

/**
 * Animation utility classes
 */
export const animationClasses = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-150',
  slideIn: 'animate-in slide-in-from-top-2 duration-200',
  slideOut: 'animate-out slide-out-to-top-2 duration-150',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-150',
  spin: 'animate-spin',
  pulse: 'animate-pulse'
} as const;

/**
 * Screen reader only utility (for accessibility)
 */
export const srOnly = 'sr-only';

/**
 * Creates consistent card styling
 */
export function createCardClasses(hover?: boolean, interactive?: boolean): string {
  const base = 'card';
  const hoverEffect = hover ? 'card-hover' : '';
  const interactiveEffect = interactive ? 'cursor-pointer' : '';
  
  return cn(base, hoverEffect, interactiveEffect);
}

/**
 * Creates status indicator classes
 */
export const statusClasses = {
  active: 'status-active',
  inactive: 'status-inactive', 
  error: 'status-error'
} as const;

/**
 * Validates and provides fallback for component props
 */
export function withDefaults<T>(value: T | undefined, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

/**
 * Creates ARIA attributes object from props
 */
export function createAriaAttributes(props: Record<string, any>) {
  const ariaAttributes: Record<string, any> = {};
  
  Object.keys(props).forEach(key => {
    if (key.startsWith('aria-') && props[key] !== undefined) {
      ariaAttributes[key] = props[key];
    }
  });
  
  return ariaAttributes;
}

/**
 * Keyboard event handler for accessibility (Space and Enter)
 */
export function handleKeyboardActivation(
  event: KeyboardEvent, 
  callback: (e: KeyboardEvent) => void
): void {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    callback(event);
  }
}