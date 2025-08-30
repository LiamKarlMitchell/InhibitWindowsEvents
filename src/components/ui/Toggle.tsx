import { JSX, Component, createSignal, createEffect } from 'solid-js';
import { cn, focusClasses, disabledClasses, handleKeyboardActivation, withDefaults } from './utils';
import { BaseComponentProps, SizeVariant, FocusableProps } from './types';

export interface ToggleProps extends BaseComponentProps, FocusableProps {
  /**
   * Controlled checked state
   */
  checked?: boolean;
  
  /**
   * Default checked state for uncontrolled component
   */
  defaultChecked?: boolean;
  
  /**
   * Callback when toggle state changes
   */
  onChange?: (checked: boolean) => void;
  
  /**
   * Size of the toggle
   */
  size?: SizeVariant;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Label text for the toggle
   */
  label?: string;
  
  /**
   * Description text below the label
   */
  description?: string;
  
  /**
   * Position of label relative to toggle
   */
  labelPosition?: 'left' | 'right';
  
  /**
   * Color scheme for the toggle
   */
  color?: 'blue' | 'green' | 'red' | 'orange';
}

/**
 * Toggle component with animated state transitions
 * 
 * Features:
 * - Smooth animations with 300ms transitions
 * - Size variants: sm, md, lg, xl
 * - Multiple color schemes
 * - Controlled and uncontrolled modes
 * - Full accessibility support
 * - Keyboard navigation (Space to toggle)
 * - Visual feedback for hover/focus states
 */
const Toggle: Component<ToggleProps> = (props) => {
  // Internal state for uncontrolled mode
  const [internalChecked, setInternalChecked] = createSignal(
    props.defaultChecked ?? false
  );
  
  // Determine if we're in controlled mode
  const isControlled = () => props.checked !== undefined;
  
  // Get current checked state
  const checked = () => isControlled() ? props.checked! : internalChecked();
  
  // Size configuration
  const sizeConfig = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    },
    xl: {
      track: 'w-16 h-8',
      thumb: 'w-7 h-7',
      translate: 'translate-x-8'
    }
  };
  
  const size = () => withDefaults(props.size, 'md');
  const color = () => withDefaults(props.color, 'blue');
  const labelPosition = () => withDefaults(props.labelPosition, 'right');
  
  // Color scheme configuration
  const colorClasses = () => {
    const colors = {
      blue: checked() ? 'bg-blue-600' : 'bg-gray-700',
      green: checked() ? 'bg-green-600' : 'bg-gray-700',
      red: checked() ? 'bg-red-600' : 'bg-gray-700',
      orange: checked() ? 'bg-orange-600' : 'bg-gray-700'
    };
    return colors[color()];
  };
  
  // Handle toggle state change
  const handleToggle = () => {
    if (props.disabled) return;
    
    const newChecked = !checked();
    
    // Update internal state if uncontrolled
    if (!isControlled()) {
      setInternalChecked(newChecked);
    }
    
    // Call onChange callback
    if (props.onChange) {
      props.onChange(newChecked);
    }
  };
  
  // Handle click events
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    handleToggle();
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
    
    handleKeyboardActivation(e, handleToggle);
  };
  
  // Track element classes
  const trackClasses = () => cn(
    'relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out cursor-pointer',
    sizeConfig[size()].track,
    colorClasses(),
    props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90',
    focusClasses,
    'border-2 border-transparent focus-within:border-blue-500'
  );
  
  // Thumb element classes
  const thumbClasses = () => cn(
    'absolute left-0.5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out transform',
    sizeConfig[size()].thumb,
    checked() ? sizeConfig[size()].translate : 'translate-x-0',
    props.disabled ? '' : 'hover:shadow-md'
  );
  
  // Container classes for label positioning
  const containerClasses = () => cn(
    'flex items-center gap-3',
    labelPosition() === 'left' ? 'flex-row-reverse' : 'flex-row',
    props.class
  );
  
  // Label content
  const labelContent = () => (
    <>
      {props.label && (
        <span class={cn(
          'text-sm font-medium text-gray-200',
          props.disabled ? 'opacity-50' : ''
        )}>
          {props.label}
        </span>
      )}
      {props.description && (
        <span class={cn(
          'text-xs text-gray-400 mt-0.5 block',
          props.disabled ? 'opacity-50' : ''
        )}>
          {props.description}
        </span>
      )}
    </>
  );
  
  return (
    <div class={containerClasses()}>
      <button
        id={props.id}
        type="button"
        role="switch"
        aria-checked={checked()}
        aria-label={props['aria-label'] || props.label}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        aria-disabled={props.disabled}
        disabled={props.disabled}
        tabindex={props.disabled ? -1 : (props.tabindex ?? 0)}
        data-testid={props['data-testid']}
        class={trackClasses()}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      >
        <span class={thumbClasses()} />
        
        {/* Screen reader text for state */}
        <span class="sr-only">
          {checked() ? 'On' : 'Off'}
        </span>
      </button>
      
      {/* Label and description */}
      {(props.label || props.description) && (
        <div class="flex flex-col">
          {labelContent()}
        </div>
      )}
    </div>
  );
};

export default Toggle;