import { JSX, Component, Show, createSignal } from 'solid-js';
import { cn, buttonVariantClasses, sizeClasses, focusClasses, disabledClasses, createLoadingOverlay, handleKeyboardActivation } from './utils';
import { BaseComponentProps, ButtonVariant, SizeVariant, InteractiveProps } from './types';

export interface ButtonProps extends BaseComponentProps, InteractiveProps {
  /**
   * Button variant for different semantic styles
   */
  variant?: ButtonVariant;
  
  /**
   * Size of the button
   */
  size?: SizeVariant;
  
  /**
   * Button type for form submission
   */
  type?: 'button' | 'submit' | 'reset';
  
  /**
   * Full width button
   */
  fullWidth?: boolean;
  
  /**
   * Loading state with spinner
   */
  loading?: boolean;
  
  /**
   * Icon to display before text (JSX element)
   */
  leftIcon?: JSX.Element;
  
  /**
   * Icon to display after text (JSX element)
   */
  rightIcon?: JSX.Element;
}

/**
 * Button component with multiple variants, sizes, and states
 * 
 * Features:
 * - Multiple variants: primary, secondary, ghost, danger, outline
 * - Size variants: sm, md, lg, xl
 * - Interactive states: hover, active, focus, disabled, loading
 * - Accessibility: ARIA attributes, keyboard navigation
 * - Icons: left and right icon support
 * - Smooth transitions for micro-interactions
 */
const Button: Component<ButtonProps> = (props) => {
  const [isPressed, setIsPressed] = createSignal(false);
  
  // Destructure props with defaults
  const variant = () => props.variant || 'primary';
  const size = () => props.size || 'md';
  const type = () => props.type || 'button';
  
  // Build class names
  const classes = () => cn(
    // Base button styles from UnoCSS shortcut
    'btn',
    // Variant-specific styles
    buttonVariantClasses[variant()],
    // Size-specific styles
    sizeClasses[size()],
    // State-specific styles
    focusClasses,
    disabledClasses,
    // Full width
    props.fullWidth ? 'w-full' : '',
    // Loading state
    props.loading ? 'relative' : '',
    // Active/pressed state
    isPressed() ? 'scale-95' : '',
    // Additional custom classes
    props.class
  );
  
  // Handle click events
  const handleClick = (e: MouseEvent) => {
    if (props.disabled || props.loading) {
      e.preventDefault();
      return;
    }
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 100);
    
    if (props.onClick) {
      props.onClick(e);
    }
  };
  
  // Handle keyboard events for accessibility
  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
    
    // Handle space/enter activation
    handleKeyboardActivation(e, () => {
      if (!props.disabled && !props.loading) {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);
        
        if (props.onClick) {
          props.onClick(e as any);
        }
      }
    });
  };
  
  // Create ARIA attributes
  const ariaAttributes = () => ({
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': props['aria-describedby'],
    'aria-disabled': props.disabled || props.loading,
    'aria-pressed': props['aria-pressed'],
    role: props.role || 'button'
  });
  
  return (
    <button
      id={props.id}
      class={classes()}
      type={type()}
      disabled={props.disabled || props.loading}
      tabindex={props.tabindex || 0}
      data-testid={props['data-testid']}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      {...ariaAttributes()}
    >
      <Show when={props.loading}>
        <div class={createLoadingOverlay()}>
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </Show>
      
      <div class={cn(
        'flex items-center justify-center gap-2',
        props.loading ? 'opacity-0' : 'opacity-100'
      )}>
        <Show when={props.leftIcon}>
          <span class="w-4 h-4 flex-shrink-0">
            {props.leftIcon}
          </span>
        </Show>
        
        <Show when={props.children}>
          <span>{props.children}</span>
        </Show>
        
        <Show when={props.rightIcon}>
          <span class="w-4 h-4 flex-shrink-0">
            {props.rightIcon}
          </span>
        </Show>
      </div>
    </button>
  );
};

export default Button;