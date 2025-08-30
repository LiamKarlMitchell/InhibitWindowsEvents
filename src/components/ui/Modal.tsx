import { JSX, Component, Show, createSignal, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import { cn, animationClasses, handleKeyboardActivation } from './utils';
import { BaseComponentProps } from './types';

export interface ModalProps extends BaseComponentProps {
  /**
   * Controls modal visibility
   */
  open?: boolean;
  
  /**
   * Callback when modal should close
   */
  onClose?: () => void;
  
  /**
   * Modal title
   */
  title?: string;
  
  /**
   * Modal size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /**
   * Allow closing by clicking backdrop
   */
  closeOnBackdrop?: boolean;
  
  /**
   * Allow closing with Escape key
   */
  closeOnEscape?: boolean;
  
  /**
   * Show close button
   */
  showCloseButton?: boolean;
  
  /**
   * Custom header content (overrides title)
   */
  header?: JSX.Element;
  
  /**
   * Footer content slot
   */
  footer?: JSX.Element;
  
  /**
   * Disable focus trapping
   */
  disableFocusTrap?: boolean;
  
  /**
   * Z-index for the modal
   */
  zIndex?: number;
}

/**
 * Modal component with proper accessibility and overlay management
 * 
 * Features:
 * - Backdrop overlay with smooth transitions
 * - Focus management and trapping
 * - Escape key handling
 * - Body scroll locking
 * - Multiple size variants
 * - Portal rendering for proper z-index stacking
 * - Full accessibility support (ARIA attributes, focus restoration)
 * - Smooth enter/exit animations (300ms)
 */
const Modal: Component<ModalProps> = (props) => {
  let modalRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;
  
  const [isVisible, setIsVisible] = createSignal(false);
  const [shouldRender, setShouldRender] = createSignal(false);
  
  // Default props
  const size = () => props.size || 'md';
  const zIndex = () => props.zIndex || 1400;
  const closeOnBackdrop = () => props.closeOnBackdrop ?? true;
  const closeOnEscape = () => props.closeOnEscape ?? true;
  const showCloseButton = () => props.showCloseButton ?? true;
  
  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4'
  };
  
  // Handle open/close animations
  createEffect(() => {
    if (props.open) {
      // Store current focus
      previousFocus = document.activeElement as HTMLElement;
      
      // Render modal
      setShouldRender(true);
      
      // Show modal with animation after render
      requestAnimationFrame(() => {
        setIsVisible(true);
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus modal after animation
        setTimeout(() => {
          if (modalRef && !props.disableFocusTrap) {
            modalRef.focus();
          }
        }, 100);
      });
    } else {
      // Hide modal
      setIsVisible(false);
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Remove from DOM after animation
      setTimeout(() => {
        setShouldRender(false);
        
        // Restore focus
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus();
        }
      }, 300);
    }
  });
  
  // Cleanup on unmount
  onCleanup(() => {
    document.body.style.overflow = '';
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  });
  
  // Handle close
  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    }
  };
  
  // Handle backdrop click
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop()) {
      handleClose();
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape' && closeOnEscape()) {
      e.preventDefault();
      handleClose();
      return;
    }
    
    // Focus trapping
    if (!props.disableFocusTrap && e.key === 'Tab') {
      const focusableElements = modalRef?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  // Backdrop classes
  const backdropClasses = () => cn(
    'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out',
    isVisible() ? 'opacity-100' : 'opacity-0'
  );
  
  // Modal container classes
  const modalClasses = () => cn(
    'relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700',
    'transition-all duration-300 ease-out transform',
    sizeClasses[size()],
    isVisible() 
      ? 'opacity-100 scale-100 translate-y-0' 
      : 'opacity-0 scale-95 translate-y-4',
    props.class
  );
  
  // Close button element
  const CloseButton = () => (
    <button
      type="button"
      class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 transition-colors duration-150 rounded-lg hover:bg-gray-700"
      onClick={handleClose}
      aria-label="Close modal"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
  
  return (
    <Show when={shouldRender()}>
      <Portal>
        <div
          class="fixed inset-0 flex items-center justify-center p-4"
          style={{ 'z-index': zIndex() }}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <div class={backdropClasses()} />
          
          {/* Modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={props.title}
            aria-labelledby={props.title ? undefined : 'modal-title'}
            tabindex="-1"
            class={modalClasses()}
            data-testid={props['data-testid']}
          >
            {/* Close button */}
            <Show when={showCloseButton()}>
              <CloseButton />
            </Show>
            
            {/* Header */}
            <Show
              when={props.header}
              fallback={
                <Show when={props.title}>
                  <div class="px-6 py-4 border-b border-gray-700">
                    <h2
                      id="modal-title"
                      class="text-lg font-semibold text-gray-100"
                    >
                      {props.title}
                    </h2>
                  </div>
                </Show>
              }
            >
              <div class="px-6 py-4 border-b border-gray-700">
                {props.header}
              </div>
            </Show>
            
            {/* Content */}
            <div class="px-6 py-4 text-gray-200">
              {props.children}
            </div>
            
            {/* Footer */}
            <Show when={props.footer}>
              <div class="px-6 py-4 border-t border-gray-700">
                {props.footer}
              </div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

// Convenience Dialog component for simple confirmations
export interface DialogProps extends Omit<ModalProps, 'size'> {
  /**
   * Primary action button text
   */
  confirmText?: string;
  
  /**
   * Cancel button text
   */
  cancelText?: string;
  
  /**
   * Primary action callback
   */
  onConfirm?: () => void;
  
  /**
   * Cancel action callback
   */
  onCancel?: () => void;
  
  /**
   * Button variant for confirm button
   */
  confirmVariant?: 'primary' | 'danger';
}

/**
 * Dialog component for confirmations and simple interactions
 * Built on top of Modal with predefined footer actions
 */
export const Dialog: Component<DialogProps> = (props) => {
  const confirmText = () => props.confirmText || 'Confirm';
  const cancelText = () => props.cancelText || 'Cancel';
  const confirmVariant = () => props.confirmVariant || 'primary';
  
  const handleConfirm = () => {
    if (props.onConfirm) {
      props.onConfirm();
    }
  };
  
  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    }
    if (props.onClose) {
      props.onClose();
    }
  };
  
  const footer = () => (
    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="btn-secondary"
        onClick={handleCancel}
      >
        {cancelText()}
      </button>
      <button
        type="button"
        class={confirmVariant() === 'danger' ? 'btn-danger' : 'btn-primary'}
        onClick={handleConfirm}
      >
        {confirmText()}
      </button>
    </div>
  );
  
  return (
    <Modal
      {...props}
      size="sm"
      footer={props.footer || footer()}
    >
      {props.children}
    </Modal>
  );
};

export default Modal;