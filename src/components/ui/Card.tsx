import { JSX, Component, Show } from 'solid-js';
import { cn, createCardClasses } from './utils';
import { BaseComponentProps, InteractiveProps } from './types';

export interface CardProps extends BaseComponentProps, Pick<InteractiveProps, 'onClick'> {
  /**
   * Enable hover effects with enhanced shadows
   */
  hover?: boolean;
  
  /**
   * Make card interactive/clickable
   */
  interactive?: boolean;
  
  /**
   * Card padding variant
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Header content slot
   */
  header?: JSX.Element;
  
  /**
   * Footer content slot  
   */
  footer?: JSX.Element;
  
  /**
   * Card border variant
   */
  border?: 'none' | 'subtle' | 'solid';
  
  /**
   * Background variant
   */
  background?: 'default' | 'subtle' | 'transparent';
}

/**
 * Card component with hover effects and content slots
 * 
 * Features:
 * - Subtle shadow effects that enhance on hover
 * - Header, content, and footer slots with proper spacing
 * - Multiple padding variants
 * - Border and background options
 * - Interactive/clickable mode
 * - Smooth shadow transitions (150ms)
 * - Consistent with design system tokens
 */
const Card: Component<CardProps> = (props) => {
  // Default values
  const padding = () => props.padding || 'md';
  const border = () => props.border || 'subtle';
  const background = () => props.background || 'default';
  
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  // Border classes
  const borderClasses = {
    none: 'border-0',
    subtle: 'border border-gray-700',
    solid: 'border-2 border-gray-600'
  };
  
  // Background classes
  const backgroundClasses = {
    default: 'bg-gray-800',
    subtle: 'bg-gray-850',
    transparent: 'bg-transparent'
  };
  
  // Build card classes
  const cardClasses = () => cn(
    // Base card styles
    'rounded-xl shadow-sm transition-all duration-150 ease-out',
    // Background
    backgroundClasses[background()],
    // Border
    borderClasses[border()],
    // Padding
    paddingClasses[padding()],
    // Hover effects
    props.hover ? 'hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5' : '',
    // Interactive styling
    props.interactive || props.onClick ? 'cursor-pointer hover:bg-gray-750' : '',
    // Custom classes
    props.class
  );
  
  // Handle click events
  const handleClick = (e: MouseEvent) => {
    if (props.onClick) {
      props.onClick(e);
    }
  };
  
  // Handle keyboard events for accessibility
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((props.interactive || props.onClick) && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (props.onClick) {
        props.onClick(e as any);
      }
    }
  };
  
  // Determine if card should be interactive
  const isInteractive = () => props.interactive || !!props.onClick;
  
  return (
    <div
      id={props.id}
      class={cardClasses()}
      data-testid={props['data-testid']}
      onClick={isInteractive() ? handleClick : undefined}
      onKeyDown={isInteractive() ? handleKeyDown : undefined}
      tabindex={isInteractive() ? 0 : undefined}
      role={isInteractive() ? 'button' : undefined}
    >
      {/* Header slot */}
      <Show when={props.header}>
        <div class="mb-4 pb-4 border-b border-gray-700">
          {props.header}
        </div>
      </Show>
      
      {/* Main content */}
      <Show when={props.children}>
        <div class={cn(
          props.header && props.footer ? 'py-2' : '',
          !props.header && props.footer ? 'pb-2' : '',
          props.header && !props.footer ? 'pt-2' : ''
        )}>
          {props.children}
        </div>
      </Show>
      
      {/* Footer slot */}
      <Show when={props.footer}>
        <div class="mt-4 pt-4 border-t border-gray-700">
          {props.footer}
        </div>
      </Show>
    </div>
  );
};

export default Card;