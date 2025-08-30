import { JSX, createMemo, Show } from 'solid-js';
import { TrayPreview, TrayPreviewProps, TrayState, TrayMenuItem } from './TrayPreview';
import { useHookStore } from '../../store/hook-store';
import { useConfig } from '../../store/hooks';
import { BaseComponentProps } from './types';

export interface ConnectedTrayPreviewProps extends BaseComponentProps {
  /**
   * Whether to show the context menu simulation
   */
  showContextMenu?: boolean;
  
  /**
   * Whether the component is in compact mode
   */
  compact?: boolean;
  
  /**
   * Callback when tray icon is clicked (for simulation)
   */
  onTrayClick?: () => void;
  
  /**
   * Custom menu items (optional - uses defaults if not provided)
   */
  menuItems?: TrayMenuItem[];
}

/**
 * ConnectedTrayPreview Component
 * 
 * A wrapper around TrayPreview that automatically connects to the existing
 * hook state management system to provide real-time tray state synchronization.
 * 
 * This component:
 * - Automatically syncs with hook store state
 * - Provides real hook toggle functionality for simulation
 * - Matches actual tray behavior from the Rust backend
 * - Updates tooltip text based on real state
 */
export function ConnectedTrayPreview(props: ConnectedTrayPreviewProps) {
  // Get hook store state
  const hookStore = useHookStore();
  const { config } = useConfig();
  
  // Convert hook store state to TrayState format
  const trayState = createMemo((): TrayState => {
    const hookStatus = hookStore.hookStatus;
    
    return {
      hooksInstalled: hookStatus?.hooks_installed ?? false,
      overallEnabled: hookStatus?.overall_enabled ?? false,
      windowsKeyEnabled: hookStatus?.windows_key_enabled ?? false,
      mouseButtonsEnabled: hookStatus?.mouse_buttons_enabled ?? false,
      // Extended mouse button states from config if available
      mouseButton3Enabled: config()?.enableMouseButton3 ?? false,
      mouseButton4Enabled: config()?.enableMouseButton4 ?? true,
      mouseButton5Enabled: config()?.enableMouseButton5 ?? false,
    };
  });
  
  // Generate dynamic tooltip text matching Rust implementation
  const dynamicTooltipText = createMemo(() => {
    const state = trayState();
    
    if (!state.hooksInstalled) {
      return "Windows Event Inhibitor - No hooks installed";
    }
    
    if (!state.overallEnabled) {
      return "Windows Event Inhibitor - All hooks disabled (Alt+ScrollLock to enable)";
    }
    
    const statusParts = [];
    statusParts.push(state.windowsKeyEnabled ? "Win Key: ON" : "Win Key: OFF");
    statusParts.push(state.mouseButtonsEnabled ? "Mouse Btns: ON" : "Mouse Btns: OFF");
    
    return `Windows Event Inhibitor - ${statusParts.join(", ")}`;
  });
  
  // Handle menu item actions with real hook store integration
  const handleMenuItemClick = async (itemId: string) => {
    console.log(`[TrayPreview] Menu item clicked: ${itemId}`);
    
    try {
      switch (itemId) {
        case 'show_hide':
          // Simulate show/hide functionality
          props.onTrayClick?.();
          break;
          
        case 'toggle_windows_key':
          console.log('[TrayPreview] Toggling Windows Key hook...');
          await hookStore.toggleWindowsKeyHook();
          break;
          
        case 'toggle_mouse_buttons':
          console.log('[TrayPreview] Toggling Mouse Button hooks...');
          await hookStore.toggleMouseButtonHooks();
          break;
          
        case 'exit':
          console.log('[TrayPreview] Exit clicked (simulation only)');
          // In a real app, this would close the application
          // For preview purposes, we'll just log it
          break;
          
        default:
          console.log(`[TrayPreview] Unknown menu item: ${itemId}`);
      }
    } catch (error) {
      console.error(`[TrayPreview] Error handling menu item ${itemId}:`, error);
    }
  };
  
  // Handle tray icon click (show/hide simulation)
  const handleTrayClick = () => {
    console.log('[TrayPreview] Tray icon clicked');
    props.onTrayClick?.();
  };
  
  // Default menu items with real functionality integration
  const defaultMenuItems: TrayMenuItem[] = [
    {
      id: 'show_hide',
      label: 'Show/Hide',
      enabled: true,
      action: () => handleMenuItemClick('show_hide')
    },
    {
      id: 'separator1',
      label: '',
      enabled: true,
      separator: true
    },
    {
      id: 'toggle_windows_key',
      label: 'Toggle Windows Key Hook',
      enabled: trayState().hooksInstalled && !hookStore.state.isToggling,
      action: () => handleMenuItemClick('toggle_windows_key')
    },
    {
      id: 'toggle_mouse_buttons', 
      label: 'Toggle Mouse Button Hooks',
      enabled: trayState().hooksInstalled && !hookStore.state.isToggling,
      action: () => handleMenuItemClick('toggle_mouse_buttons')
    },
    {
      id: 'separator2',
      label: '',
      enabled: true,
      separator: true
    },
    {
      id: 'exit',
      label: 'Exit',
      enabled: true,
      action: () => handleMenuItemClick('exit')
    }
  ];
  
  return (
    <div class={`connected-tray-preview ${props.class || ''}`}>
      {/* Loading state overlay when hooks are being toggled */}
      <Show when={hookStore.state.isToggling || hookStore.state.isLoading}>
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          'background-color': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(2px)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': '30',
          'border-radius': '12px'
        }}>
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            padding: '8px 12px',
            'background-color': 'white',
            'border-radius': '6px',
            'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color, #E5E7EB)'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--gray-300, #D1D5DB)',
              'border-top-color': 'var(--blue-500, #3B82F6)',
              'border-radius': '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{
              'font-size': '13px',
              color: 'var(--text-secondary, #6B7280)',
              'font-weight': '500'
            }}>
              {hookStore.state.isToggling ? 'Toggling hooks...' : 'Loading...'}
            </span>
          </div>
        </div>
      </Show>
      
      {/* Error state display */}
      <Show when={hookStore.state.lastError}>
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '4px 8px',
          'background-color': '#FEE2E2',
          color: '#B91C1C',
          'font-size': '11px',
          'border-radius': '4px',
          'z-index': '25',
          border: '1px solid #FECACA'
        }}>
          Error: {hookStore.state.lastError?.message}
        </div>
      </Show>
      
      {/* Main TrayPreview Component */}
      <TrayPreview
        trayState={trayState()}
        tooltipText={dynamicTooltipText()}
        menuItems={props.menuItems || defaultMenuItems}
        onTrayClick={handleTrayClick}
        onMenuItemClick={handleMenuItemClick}
        showContextMenu={props.showContextMenu}
        compact={props.compact}
        id={props.id}
        data-testid={props['data-testid']}
      />
      
      {/* Spinner animation for loading overlay */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default ConnectedTrayPreview;