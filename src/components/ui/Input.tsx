import { JSX, Component, Show, createSignal, createEffect } from 'solid-js';
import { cn, focusClasses, disabledClasses, withDefaults } from './utils';
import { BaseComponentProps, SizeVariant, FocusableProps } from './types';

export interface InputProps extends BaseComponentProps, FocusableProps {
  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'search';
  
  /**
   * Input value (controlled)
   */
  value?: string | number;
  
  /**
   * Default value (uncontrolled)
   */
  defaultValue?: string | number;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Input size
   */
  size?: SizeVariant;
  
  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success' | 'warning';
  
  /**
   * Label text
   */
  label?: string;
  
  /**
   * Help text below input
   */
  helpText?: string;
  
  /**
   * Error message (overrides helpText when in error state)
   */
  error?: string;
  
  /**
   * Input is required
   */
  required?: boolean;
  
  /**
   * Input is disabled
   */
  disabled?: boolean;
  
  /**
   * Input is readonly
   */
  readonly?: boolean;
  
  /**
   * Left icon element
   */
  leftIcon?: JSX.Element;
  
  /**
   * Right icon element
   */
  rightIcon?: JSX.Element;
  
  /**
   * Input event handlers
   */
  onInput?: (e: InputEvent) => void;
  onChange?: (e: Event) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  onKeyUp?: (e: KeyboardEvent) => void;
  
  /**
   * Min/max for number inputs
   */
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Input component with validation states and comprehensive form support
 * 
 * Features:
 * - Multiple input types support
 * - Validation states: default, error, success, warning
 * - Size variants: sm, md, lg, xl
 * - Label and help text support
 * - Left and right icon slots
 * - Controlled and uncontrolled modes
 * - Full accessibility support
 * - Focus management with proper styling
 * - Consistent with design system
 */
const Input: Component<InputProps> = (props) => {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = createSignal(props.defaultValue || '');
  const [isFocused, setIsFocused] = createSignal(false);
  
  // Determine if controlled
  const isControlled = () => props.value !== undefined;
  
  // Get current value
  const value = () => isControlled() ? props.value! : internalValue();
  
  // Default props
  const type = () => withDefaults(props.type, 'text');
  const size = () => withDefaults(props.size, 'md');
  const state = () => withDefaults(props.state, 'default');
  
  // Size configurations
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
    xl: 'px-6 py-4 text-xl'
  };
  
  // State color configurations
  const stateClasses = {
    default: 'border-gray-600 focus:border-blue-500',
    error: 'border-red-500 focus:border-red-400',
    success: 'border-green-500 focus:border-green-400',
    warning: 'border-orange-500 focus:border-orange-400'
  };
  
  // Input container classes
  const containerClasses = () => cn(
    'relative flex items-center',
    'bg-gray-800 border rounded-lg transition-all duration-150',
    stateClasses[state()],
    sizeClasses[size()],
    props.disabled ? disabledClasses : '',
    isFocused() ? 'ring-2 ring-blue-500/20' : '',
    props.class
  );
  
  // Input element classes
  const inputClasses = () => cn(
    'flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-400',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.leftIcon ? 'pl-2' : '',
    props.rightIcon ? 'pr-2' : ''
  );
  
  // Label classes
  const labelClasses = () => cn(
    'block text-sm font-medium mb-2',
    'text-gray-200',
    props.disabled ? 'opacity-50' : '',
    props.required ? "after:content-['*'] after:text-red-400 after:ml-1" : ''
  );
  
  // Help text classes
  const helpTextClasses = () => cn(
    'text-xs mt-2',
    {
      default: 'text-gray-400',
      error: 'text-red-400',
      success: 'text-green-400',
      warning: 'text-orange-400'
    }[state()]
  );
  
  // Handle input events
  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;
    
    // Update internal state if uncontrolled
    if (!isControlled()) {
      setInternalValue(newValue);
    }
    
    // Call prop handler
    if (props.onInput) {
      props.onInput(e);
    }
  };
  
  const handleChange = (e: Event) => {
    if (props.onChange) {
      props.onChange(e);
    }
  };
  
  const handleFocus = (e: FocusEvent) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };
  
  const handleBlur = (e: FocusEvent) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };
  
  // Generate unique ID for input
  const inputId = () => props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helpTextId = () => `${inputId()}-help`;
  
  // Determine help text to show
  const displayHelpText = () => {
    if (state() === 'error' && props.error) {
      return props.error;
    }
    return props.helpText;
  };
  
  return (
    <div class="w-full">
      {/* Label */}
      <Show when={props.label}>
        <label
          for={inputId()}
          class={labelClasses()}
        >
          {props.label}
        </label>
      </Show>
      
      {/* Input container */}
      <div class={containerClasses()}>
        {/* Left icon */}
        <Show when={props.leftIcon}>
          <div class="flex items-center justify-center w-5 h-5 text-gray-400 mr-2 flex-shrink-0">
            {props.leftIcon}
          </div>
        </Show>
        
        {/* Input element */}
        <input
          id={inputId()}
          type={type()}
          value={value()}
          placeholder={props.placeholder}
          disabled={props.disabled}
          readonly={props.readonly}
          required={props.required}
          min={props.min}
          max={props.max}
          step={props.step}
          tabindex={props.tabindex}
          class={inputClasses()}
          data-testid={props['data-testid']}
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={displayHelpText() ? helpTextId() : props['aria-describedby']}
          aria-disabled={props.disabled}
          aria-invalid={state() === 'error'}
          aria-required={props.required}
          onInput={handleInput}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={props.onKeyPress}
          onKeyUp={props.onKeyUp}
        />
        
        {/* Right icon */}
        <Show when={props.rightIcon}>
          <div class="flex items-center justify-center w-5 h-5 text-gray-400 ml-2 flex-shrink-0">
            {props.rightIcon}
          </div>
        </Show>
      </div>
      
      {/* Help text */}
      <Show when={displayHelpText()}>
        <p
          id={helpTextId()}
          class={helpTextClasses()}
        >
          {displayHelpText()}
        </p>
      </Show>
    </div>
  );
};

export default Input;