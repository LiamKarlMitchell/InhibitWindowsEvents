import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  persistent?: boolean;
  count?: number;
}

interface ToastStoreState {
  toasts: Toast[];
}

export class ToastStore {
  private static instance: ToastStore;
  
  private storeResult = createStore<ToastStoreState>({
    toasts: []
  });
  
  private get state() { return this.storeResult[0]; }
  private get setState() { return this.storeResult[1]; }
  
  static getInstance(): ToastStore {
    if (!ToastStore.instance) {
      ToastStore.instance = new ToastStore();
    }
    return ToastStore.instance;
  }
  
  addToast(toast: Omit<Toast, 'id'>): string {
    // Check for duplicate toasts (same type, title, and message)
    const existingToastIndex = this.state.toasts.findIndex(
      existingToast => 
        existingToast.type === toast.type && 
        existingToast.title === toast.title && 
        existingToast.message === toast.message
    );

    if (existingToastIndex !== -1) {
      // Update existing toast count
      const existingToast = this.state.toasts[existingToastIndex];
      const updatedCount = (existingToast.count || 1) + 1;
      
      this.setState('toasts', existingToastIndex, 'count', updatedCount);
      
      // Reset timeout for the existing toast if it's not persistent
      if (!existingToast.persistent && existingToast.duration && existingToast.duration > 0) {
        setTimeout(() => {
          this.removeToast(existingToast.id);
        }, existingToast.duration);
      }
      
      return existingToast.id;
    }

    // Create new toast if no duplicate found
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      count: 1,
      ...toast
    };
    
    this.setState('toasts', prev => [...prev, newToast]);
    
    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  }
  
  removeToast(id: string): void {
    this.setState('toasts', prev => prev.filter(toast => toast.id !== id));
  }
  
  clearAll(): void {
    this.setState('toasts', []);
  }
  
  getToasts = () => this.state.toasts;
}

const toastStore = ToastStore.getInstance();

// Toast component
interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem(props: ToastItemProps) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isRemoving, setIsRemoving] = createSignal(false);
  
  // Animate in on mount
  createEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  });
  
  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      props.onClose(props.toast.id);
    }, 300);
  };
  
  const getTypeStyles = () => {
    switch (props.toast.type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/50 text-green-300';
      case 'error':
        return 'bg-red-900/20 border-red-500/50 text-red-300';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300';
      case 'info':
        return 'bg-blue-900/20 border-blue-500/50 text-blue-300';
      default:
        return 'bg-gray-900/20 border-gray-500/50 text-gray-300';
    }
  };
  
  const getIcon = () => {
    switch (props.toast.type) {
      case 'success':
        return 'i-lucide-check-circle';
      case 'error':
        return 'i-lucide-alert-triangle';
      case 'warning':
        return 'i-lucide-alert-circle';
      case 'info':
        return 'i-lucide-info';
      default:
        return 'i-lucide-info';
    }
  };
  
  return (
    <div
      class={`
        toast-item relative p-4 border rounded-lg shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        ${getTypeStyles()}
        ${isVisible() && !isRemoving() ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start gap-3">
        <div class={`${getIcon()} text-lg mt-0.5 flex-shrink-0`}></div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-medium">{props.toast.title}</h4>
                <Show when={props.toast.count && props.toast.count > 1}>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                    {props.toast.count}
                  </span>
                </Show>
              </div>
              <Show when={props.toast.message}>
                <p class="text-sm opacity-90 mt-1">{props.toast.message}</p>
              </Show>
            </div>
            
            <button
              onClick={handleClose}
              class="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <div class="i-lucide-x text-sm"></div>
            </button>
          </div>
          
          {/* Action buttons */}
          <Show when={props.toast.actions && props.toast.actions.length > 0}>
            <div class="flex gap-2 mt-3">
              <For each={props.toast.actions}>
                {(action) => (
                  <button
                    onClick={() => {
                      action.action();
                      if (!props.toast.persistent) {
                        handleClose();
                      }
                    }}
                    class={`
                      text-xs px-3 py-1.5 rounded font-medium transition-colors
                      ${action.variant === 'primary' ? 
                        'bg-blue-600 hover:bg-blue-700 text-white' : 
                        'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

// Toast container component
export function ToastContainer() {
  const toasts = () => toastStore.getToasts();
  
  return (
    <div
      class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <For each={toasts()}>
        {(toast) => (
          <div class="pointer-events-auto">
            <ToastItem
              toast={toast}
              onClose={(id) => toastStore.removeToast(id)}
            />
          </div>
        )}
      </For>
    </div>
  );
}

// Toast service for easy usage
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => 
    toastStore.addToast({ type: 'success', title, message, ...options }),
    
  error: (title: string, message?: string, options?: Partial<Toast>) => 
    toastStore.addToast({ type: 'error', title, message, ...options }),
    
  warning: (title: string, message?: string, options?: Partial<Toast>) => 
    toastStore.addToast({ type: 'warning', title, message, ...options }),
    
  info: (title: string, message?: string, options?: Partial<Toast>) => 
    toastStore.addToast({ type: 'info', title, message, ...options }),
    
  custom: (toast: Omit<Toast, 'id'>) => toastStore.addToast(toast),
  
  remove: (id: string) => toastStore.removeToast(id),
  clear: () => toastStore.clearAll()
};

export default toast;