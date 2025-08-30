import { JSX, createSignal, createEffect, Show, onCleanup } from 'solid-js';
import { BaseComponentProps } from './types';
import { colors, spacing, typography, radius, transitions } from './tokens';
import { Button } from './Button';

// Keyboard shortcut interface
export interface Shortcut {
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean; // Windows/Cmd key
  key?: string;
}

export interface KeyboardShortcutProps extends BaseComponentProps {
  value?: Shortcut | null;
  onChange?: (shortcut: Shortcut | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowSystemKeys?: boolean; // Whether to allow potentially dangerous system shortcuts
}

export function KeyboardShortcut(props: KeyboardShortcutProps) {
  const [isCapturing, setIsCapturing] = createSignal(false);
  const [capturedKeys, setCapturedKeys] = createSignal<Set<string>>(new Set());
  const [pendingShortcut, setPendingShortcut] = createSignal<Shortcut | null>(null);

  // Format shortcut for display
  const formatShortcut = (shortcut: Shortcut | null) => {
    if (!shortcut) return props.placeholder || 'No shortcut set';
    
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('Win');
    if (shortcut.key) parts.push(formatKeyName(shortcut.key));
    
    return parts.length > 0 ? parts.join(' + ') : 'No shortcut set';
  };

  // Format individual key names for better display
  const formatKeyName = (key: string) => {
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ScrollLock': 'Scroll Lock',
      'CapsLock': 'Caps Lock',
      'NumLock': 'Num Lock',
      'PrintScreen': 'Print Screen',
      'Pause': 'Pause',
      'Insert': 'Insert',
      'Delete': 'Delete',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'Page Up',
      'PageDown': 'Page Down',
      'Backspace': 'Backspace',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Escape': 'Esc'
    };
    
    // Handle function keys
    if (key.startsWith('F') && key.length <= 3) {
      return key.toUpperCase();
    }
    
    return keyMap[key] || key.toUpperCase();
  };

  // Check if shortcut is potentially dangerous
  const isDangerousShortcut = (shortcut: Shortcut) => {
    if (props.allowSystemKeys) return false;
    
    // Common dangerous system shortcuts
    const dangerous = [
      { alt: true, key: 'F4' }, // Alt+F4 (close window)
      { ctrl: true, alt: true, key: 'Delete' }, // Ctrl+Alt+Del
      { ctrl: true, shift: true, key: 'Escape' }, // Ctrl+Shift+Esc (task manager)
      { meta: true, key: 'L' }, // Win+L (lock screen)
      { meta: true, key: 'D' }, // Win+D (show desktop)
      { meta: true, key: 'R' }, // Win+R (run dialog)
    ];
    
    return dangerous.some(d => 
      d.alt === shortcut.alt &&
      d.ctrl === shortcut.ctrl &&
      d.shift === shortcut.shift &&
      d.meta === shortcut.meta &&
      d.key === shortcut.key
    );
  };

  // Handle keyboard capture
  const startCapture = () => {
    if (props.disabled) return;
    setIsCapturing(true);
    setCapturedKeys(new Set());
    setPendingShortcut(null);
  };

  const stopCapture = () => {
    setIsCapturing(false);
    setCapturedKeys(new Set());
    setPendingShortcut(null);
  };

  const confirmShortcut = () => {
    const shortcut = pendingShortcut();
    if (shortcut) {
      props.onChange?.(shortcut);
    }
    stopCapture();
  };

  const clearShortcut = () => {
    props.onChange?.(null);
  };

  // Keyboard event handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isCapturing()) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const keys = new Set(capturedKeys());
    
    // Add modifier keys
    if (e.ctrlKey) keys.add('ctrl');
    if (e.altKey) keys.add('alt');
    if (e.shiftKey) keys.add('shift');
    if (e.metaKey) keys.add('meta');
    
    // Add the actual key (ignore lone modifier keys)
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      keys.add(e.key);
      
      // Build the shortcut object
      const shortcut: Shortcut = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
        key: e.key
      };
      
      setPendingShortcut(shortcut);
    }
    
    setCapturedKeys(keys);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!isCapturing()) return;
    e.preventDefault();
    e.stopPropagation();
    
    // If we have a pending shortcut and no modifiers are held, confirm it
    const shortcut = pendingShortcut();
    if (shortcut && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
      // Small delay to allow user to see what they captured
      setTimeout(() => confirmShortcut(), 100);
    }
  };

  // Set up keyboard listeners when capturing
  createEffect(() => {
    if (isCapturing()) {
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('keyup', handleKeyUp, true);
      
      onCleanup(() => {
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('keyup', handleKeyUp, true);
      });
    }
  });

  const currentShortcut = pendingShortcut() || props.value;
  const isDangerous = currentShortcut && isDangerousShortcut(currentShortcut);

  return (
    <div
      class={`keyboard-shortcut ${props.class || ''}`}
      id={props.id}
      data-testid={props['data-testid']}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: spacing[2],
        'min-width': '200px'
      }}
    >
      {/* Shortcut Display */}
      <div
        class="keyboard-shortcut__display"
        style={{
          display: 'flex',
          'align-items': 'center',
          'flex-grow': 1,
          padding: `${spacing[2]} ${spacing[3]}`,
          border: `2px solid ${isCapturing() ? colors.primary[500] : 
                   isDangerous ? colors.danger[300] : colors.gray[300]}`,
          'border-radius': radius.md,
          'background-color': isCapturing() ? colors.primary[50] : 
                             isDangerous ? colors.danger[50] : 'white',
          'min-height': '38px',
          transition: transitions.all,
          cursor: isCapturing() ? 'text' : 'pointer'
        }}
        onClick={!isCapturing() ? startCapture : undefined}
      >
        <Show when={isCapturing()}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: spacing[2],
              width: '100%'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                'background-color': colors.primary[500],
                'border-radius': '50%',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <span
              style={{
                'font-size': typography.fontSize.sm,
                color: colors.primary[700],
                'font-weight': typography.fontWeight.medium
              }}
            >
              <Show when={pendingShortcut()} fallback="Press keys...">
                {formatShortcut(pendingShortcut())}
              </Show>
            </span>
          </div>
        </Show>
        
        <Show when={!isCapturing()}>
          <span
            style={{
              'font-size': typography.fontSize.sm,
              color: props.value ? colors.gray[900] : colors.gray[500],
              'font-weight': props.value ? typography.fontWeight.medium : typography.fontWeight.normal
            }}
          >
            {formatShortcut(props.value)}
          </span>
        </Show>
      </div>

      {/* Action Buttons */}
      <div
        class="keyboard-shortcut__actions"
        style={{
          display: 'flex',
          gap: spacing[1]
        }}
      >
        <Show when={!isCapturing()}>
          <Button
            variant="outline"
            size="sm"
            onClick={startCapture}
            disabled={props.disabled}
            aria-label="Capture keyboard shortcut"
          >
            Set
          </Button>
          
          <Show when={props.value}>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearShortcut}
              disabled={props.disabled}
              aria-label="Clear keyboard shortcut"
              style={{ color: colors.danger[600] }}
            >
              Clear
            </Button>
          </Show>
        </Show>

        <Show when={isCapturing()}>
          <Button
            variant="primary"
            size="sm"
            onClick={confirmShortcut}
            disabled={!pendingShortcut() || isDangerous}
            aria-label="Confirm keyboard shortcut"
          >
            OK
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={stopCapture}
            aria-label="Cancel shortcut capture"
          >
            Cancel
          </Button>
        </Show>
      </div>

      {/* Warning for dangerous shortcuts */}
      <Show when={isDangerous}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'margin-left': spacing[2],
            color: colors.danger[600]
          }}
          title="This shortcut may conflict with system functions"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.964 0L.165 13.233c-.457.778.091 1.767.982 1.767h13.706c.89 0 1.439-.99.982-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
        </div>
      </Show>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

export default KeyboardShortcut;