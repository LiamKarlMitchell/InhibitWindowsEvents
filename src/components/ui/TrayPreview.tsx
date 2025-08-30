import { JSX, createSignal, createMemo, Show, For } from 'solid-js';
import { BaseComponentProps } from './types';
import { StatusIndicator } from './StatusIndicator';
import { Button } from './Button';

/**
 * Tray state interface matching the Rust backend hook states
 */
export interface TrayState {
  hooksInstalled: boolean;
  overallEnabled: boolean;
  windowsKeyEnabled: boolean;
  mouseButtonsEnabled: boolean;
  // Individual mouse button states (for future extension)
  mouseButton3Enabled?: boolean;
  mouseButton4Enabled?: boolean;
  mouseButton5Enabled?: boolean;
}

/**
 * Tray menu item definition
 */
export interface TrayMenuItem {
  id: string;
  label: string;
  enabled: boolean;
  separator?: boolean;
  action?: () => void;
}

export interface TrayPreviewProps extends BaseComponentProps {
  /**
   * Current tray state
   */
  trayState: TrayState;
  
  /**
   * Current tooltip text (dynamically generated)
   */
  tooltipText?: string;
  
  /**
   * Tray menu items
   */
  menuItems?: TrayMenuItem[];
  
  /**
   * Callback when tray icon is clicked
   */
  onTrayClick?: () => void;
  
  /**
   * Callback when menu item is clicked
   */
  onMenuItemClick?: (itemId: string) => void;
  
  /**
   * Whether to show the context menu simulation
   */
  showContextMenu?: boolean;
  
  /**
   * Whether the component is in compact mode
   */
  compact?: boolean;
}

/**
 * TrayPreview Component
 * 
 * Provides a visual representation of the system tray state including:
 * - Icon state visualization
 * - Dynamic tooltip preview
 * - Context menu simulation
 * - Hook state indicators
 */
export function TrayPreview(props: TrayPreviewProps) {
  const [showTooltip, setShowTooltip] = createSignal(false);
  const [showMenu, setShowMenu] = createSignal(props.showContextMenu ?? false);
  
  // Generate dynamic tooltip based on tray state (matching Rust implementation)
  const dynamicTooltip = createMemo(() => {
    if (props.tooltipText) return props.tooltipText;
    
    const { hooksInstalled, overallEnabled, windowsKeyEnabled, mouseButtonsEnabled } = props.trayState;
    
    if (!hooksInstalled) {
      return "Windows Event Inhibitor - No hooks installed";
    }
    
    if (!overallEnabled) {
      return "Windows Event Inhibitor - All hooks disabled (Alt+ScrollLock to enable)";
    }
    
    const statusParts = [];
    statusParts.push(windowsKeyEnabled ? "Win Key: ON" : "Win Key: OFF");
    statusParts.push(mouseButtonsEnabled ? "Mouse Btns: ON" : "Mouse Btns: OFF");
    
    return `Windows Event Inhibitor - ${statusParts.join(", ")}`;
  });
  
  // Get tray icon appearance based on state (enhanced)
  const getIconAppearance = createMemo(() => {
    const { hooksInstalled, overallEnabled, windowsKeyEnabled, mouseButtonsEnabled } = props.trayState;
    
    if (!hooksInstalled) {
      return { 
        color: '#6B7280', 
        status: 'inactive' as const,
        borderColor: '#D1D5DB',
        glowIntensity: '0px'
      };
    }
    
    if (!overallEnabled) {
      return { 
        color: '#F59E0B', 
        status: 'warning' as const,
        borderColor: '#FCD34D',
        glowIntensity: '4px'
      };
    }
    
    // Mixed state - some hooks enabled, some disabled
    const activeHooks = [windowsKeyEnabled, mouseButtonsEnabled].filter(Boolean).length;
    const totalHooks = 2;
    
    if (activeHooks === 0) {
      return { 
        color: '#EF4444', 
        status: 'error' as const,
        borderColor: '#FCA5A5',
        glowIntensity: '6px'
      };
    }
    
    if (activeHooks < totalHooks) {
      return { 
        color: '#F59E0B', 
        status: 'warning' as const,
        borderColor: '#FCD34D',
        glowIntensity: '4px'
      };
    }
    
    return { 
      color: '#10B981', 
      status: 'active' as const,
      borderColor: '#6EE7B7',
      glowIntensity: '6px'
    };
  });
  
  // Get detailed state description for enhanced tooltips
  const getStateDescription = createMemo(() => {
    const { hooksInstalled, overallEnabled, windowsKeyEnabled, mouseButtonsEnabled } = props.trayState;
    
    if (!hooksInstalled) {
      return "Hooks not installed - Click to install";
    }
    
    if (!overallEnabled) {
      return "All hooks disabled - Press Alt+ScrollLock to enable";
    }
    
    const enabledHooks = [];
    const disabledHooks = [];
    
    if (windowsKeyEnabled) enabledHooks.push("Windows Key");
    else disabledHooks.push("Windows Key");
    
    if (mouseButtonsEnabled) enabledHooks.push("Mouse Buttons");  
    else disabledHooks.push("Mouse Buttons");
    
    if (enabledHooks.length === 2) {
      return "All hooks active and monitoring";
    }
    
    if (enabledHooks.length === 0) {
      return "No hooks active";
    }
    
    return `Active: ${enabledHooks.join(", ")} | Inactive: ${disabledHooks.join(", ")}`;
  });
  
  // Default menu items matching Rust implementation
  const defaultMenuItems: TrayMenuItem[] = [
    {
      id: 'show_hide',
      label: 'Show/Hide',
      enabled: true,
      action: () => props.onMenuItemClick?.('show_hide')
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
      enabled: props.trayState.hooksInstalled,
      action: () => props.onMenuItemClick?.('toggle_windows_key')
    },
    {
      id: 'toggle_mouse_buttons', 
      label: 'Toggle Mouse Button Hooks',
      enabled: props.trayState.hooksInstalled,
      action: () => props.onMenuItemClick?.('toggle_mouse_buttons')
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
      action: () => props.onMenuItemClick?.('exit')
    }
  ];
  
  const menuItems = props.menuItems ?? defaultMenuItems;
  
  const handleTrayClick = () => {
    props.onTrayClick?.();
  };
  
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu());
  };
  
  const handleMenuItemClick = (item: TrayMenuItem) => {
    if (item.enabled && !item.separator) {
      item.action?.();
      setShowMenu(false);
    }
  };

  return (
    <>
      {/* Keyframe animations */}
      <style>
        {`
          @keyframes icon-pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 0.3; }
          }
          
          @keyframes icon-flash {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 0.2; }
          }
          
          @keyframes hook-state-change {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          @keyframes tooltip-appear {
            0% { 
              opacity: 0; 
              transform: translateX(-50%) translateY(4px); 
              scale: 0.95;
            }
            100% { 
              opacity: 1; 
              transform: translateX(-50%) translateY(0); 
              scale: 1;
            }
          }
        `}
      </style>
      
      <div
        class={`tray-preview ${props.class || ''}`}
        id={props.id}
        data-testid={props['data-testid']}
        style={{
          position: 'relative',
          border: '1px solid var(--border-color, #E5E7EB)',
          'border-radius': '12px',
          padding: props.compact ? '16px' : '24px',
          'background-color': 'var(--card-bg, #FFFFFF)',
          'box-shadow': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          'min-height': props.compact ? '120px' : '160px'
        }}
      >
      {/* Header */}
      <div style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        'margin-bottom': '16px'
      }}>
        <h3 style={{
          margin: '0',
          'font-size': props.compact ? '14px' : '16px',
          'font-weight': '600',
          color: 'var(--text-primary, #111827)'
        }}>
          System Tray Preview
        </h3>
        
        <StatusIndicator 
          status={getIconAppearance().status}
          size="sm"
          showLabel={true}
          showIcon={false}
        />
      </div>
      
      {/* Tray Icon Simulation */}
      <div style={{
        display: 'flex',
        'align-items': 'flex-start',
        gap: '16px',
        'margin-bottom': showMenu() ? '16px' : '0'
      }}>
        {/* Tray Icon */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '8px',
              'border-radius': '4px',
              'background-color': '#F3F4F6',
              transition: 'all 0.2s ease'
            }}
            onClick={handleTrayClick}
            onContextMenu={handleRightClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            title="Simulated tray icon - Left click to show/hide, right click for menu"
          >
            {/* Enhanced app icon representation */}
            <div
              style={{
                width: '24px',
                height: '24px',
                'border-radius': '4px',
                'background-color': getIconAppearance().color,
                border: `1px solid ${getIconAppearance().borderColor}`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                color: 'white',
                'font-size': '12px',
                'font-weight': 'bold',
                'box-shadow': `0 0 ${getIconAppearance().glowIntensity} ${getIconAppearance().color}66, 0 2px 4px rgba(0, 0, 0, 0.2)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              W
              
              {/* Pulse animation for active state */}
              <Show when={getIconAppearance().status === 'active'}>
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    'border-radius': '4px',
                    'background-color': 'rgba(255, 255, 255, 0.3)',
                    animation: 'icon-pulse 2s ease-in-out infinite'
                  }}
                />
              </Show>
              
              {/* Warning flash animation */}
              <Show when={getIconAppearance().status === 'warning'}>
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    'border-radius': '4px',
                    'background-color': 'rgba(255, 255, 255, 0.4)',
                    animation: 'icon-flash 1.5s ease-in-out infinite'
                  }}
                />
              </Show>
            </div>
            
            {/* Enhanced status indicator overlay with multiple states */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                'border-radius': '50%',
                'background-color': getIconAppearance().color,
                border: '1px solid white',
                'box-shadow': `0 0 4px ${getIconAppearance().color}88, 0 1px 3px rgba(0, 0, 0, 0.2)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
            
            {/* State-specific overlay indicators */}
            <Show when={getIconAppearance().status === 'error'}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '16px',
                  height: '16px',
                  'border-radius': '50%',
                  border: '2px solid #EF4444',
                  'background-color': 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: '#EF4444',
                  'font-size': '8px',
                  'font-weight': 'bold'
                }}
              >
                !
              </div>
            </Show>
            
            {/* Enhanced Dynamic Tooltip */}
            <Show when={showTooltip()}>
              <div
                style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  'background-color': 'rgba(0, 0, 0, 0.92)',
                  color: 'white',
                  padding: '8px 10px',
                  'border-radius': '6px',
                  'font-size': '11px',
                  'white-space': 'nowrap',
                  'z-index': '20',
                  'max-width': '280px',
                  'line-height': '1.4',
                  'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  animation: 'tooltip-appear 0.2s ease-out',
                  'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {/* Main tooltip text matching Rust implementation */}
                <div style={{ 'font-weight': '500' }}>
                  {dynamicTooltip()}
                </div>
                
                {/* Additional state info for better user understanding */}
                <Show when={props.trayState.hooksInstalled && props.trayState.overallEnabled}>
                  <div style={{
                    'margin-top': '4px',
                    'font-size': '9px',
                    opacity: '0.8',
                    'font-weight': '400',
                    'border-top': '1px solid rgba(255, 255, 255, 0.2)',
                    'padding-top': '4px'
                  }}>
                    {getStateDescription()}
                  </div>
                </Show>
                
                {/* Tooltip arrow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    'border-left': '6px solid transparent',
                    'border-right': '6px solid transparent',
                    'border-top': '6px solid rgba(0, 0, 0, 0.92)'
                  }}
                />
                
                {/* Tooltip border arrow */}
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 1px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    'border-left': '7px solid transparent',
                    'border-right': '7px solid transparent',
                    'border-top': '7px solid rgba(255, 255, 255, 0.1)',
                    'z-index': '-1'
                  }}
                />
              </div>
            </Show>
          </div>
          
          <span style={{
            'font-size': '10px',
            color: 'var(--text-tertiary, #9CA3AF)',
            'text-align': 'center'
          }}>
            Tray Icon
          </span>
        </div>
        
        {/* Enhanced Hook State Summary with Individual Indicators */}
        <div style={{
          flex: '1',
          display: 'grid',
          'grid-template-columns': props.compact ? '1fr' : 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {/* Windows Key Hook State */}
          <div 
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '6px 8px',
              'background-color': props.trayState.windowsKeyEnabled 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'var(--gray-50, #F9FAFB)',
              border: props.trayState.windowsKeyEnabled 
                ? '1px solid rgba(16, 185, 129, 0.3)' 
                : '1px solid transparent',
              'border-radius': '6px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)'
            }}
          >
            <StatusIndicator 
              status={props.trayState.windowsKeyEnabled ? 'active' : 'inactive'}
              size="sm"
              showLabel={false}
              pulse={props.trayState.windowsKeyEnabled && props.trayState.overallEnabled}
            />
            <span style={{
              'font-size': '12px',
              color: props.trayState.windowsKeyEnabled 
                ? 'var(--green-700, #047857)' 
                : 'var(--text-secondary, #6B7280)',
              'font-weight': props.trayState.windowsKeyEnabled ? '600' : '500',
              transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              Win Key
            </span>
            
            {/* Activity indicator */}
            <Show when={props.trayState.windowsKeyEnabled && props.trayState.overallEnabled}>
              <div style={{
                width: '4px',
                height: '4px',
                'border-radius': '50%',
                'background-color': '#10B981',
                animation: 'icon-pulse 2s ease-in-out infinite'
              }} />
            </Show>
          </div>
          
          {/* Mouse Buttons Hook State */}
          <div 
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '6px 8px',
              'background-color': props.trayState.mouseButtonsEnabled 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'var(--gray-50, #F9FAFB)',
              border: props.trayState.mouseButtonsEnabled 
                ? '1px solid rgba(16, 185, 129, 0.3)' 
                : '1px solid transparent',
              'border-radius': '6px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)'
            }}
          >
            <StatusIndicator 
              status={props.trayState.mouseButtonsEnabled ? 'active' : 'inactive'}
              size="sm"
              showLabel={false}
              pulse={props.trayState.mouseButtonsEnabled && props.trayState.overallEnabled}
            />
            <span style={{
              'font-size': '12px',
              color: props.trayState.mouseButtonsEnabled 
                ? 'var(--green-700, #047857)' 
                : 'var(--text-secondary, #6B7280)',
              'font-weight': props.trayState.mouseButtonsEnabled ? '600' : '500',
              transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              Mouse Btns
            </span>
            
            {/* Activity indicator */}
            <Show when={props.trayState.mouseButtonsEnabled && props.trayState.overallEnabled}>
              <div style={{
                width: '4px',
                height: '4px',
                'border-radius': '50%',
                'background-color': '#10B981',
                animation: 'icon-pulse 2s ease-in-out infinite'
              }} />
            </Show>
          </div>
        </div>
      </div>
      
      {/* Context Menu Simulation */}
      <Show when={showMenu()}>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '20px',
            'margin-top': '8px',
            'background-color': 'white',
            border: '1px solid var(--border-color, #E5E7EB)',
            'border-radius': '8px',
            'box-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            'z-index': '20',
            'min-width': '200px',
            'max-width': '250px',
            overflow: 'hidden'
          }}
        >
          <div style={{
            padding: '4px 0'
          }}>
            <For each={menuItems}>
              {(item) => (
                <Show 
                  when={!item.separator}
                  fallback={
                    <div style={{
                      height: '1px',
                      'background-color': 'var(--border-color, #E5E7EB)',
                      margin: '4px 8px'
                    }} />
                  }
                >
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    disabled={!item.enabled}
                    style={{
                      width: '100%',
                      'text-align': 'left',
                      padding: '8px 16px',
                      border: 'none',
                      background: 'transparent',
                      'font-size': '13px',
                      color: item.enabled ? 'var(--text-primary, #111827)' : 'var(--text-tertiary, #9CA3AF)',
                      cursor: item.enabled ? 'pointer' : 'not-allowed',
                      transition: 'background-color 0.15s ease',
                      ':hover': item.enabled ? {
                        'background-color': 'var(--gray-50, #F9FAFB)'
                      } : {}
                    }}
                  >
                    {item.label}
                  </button>
                </Show>
              )}
            </For>
          </div>
        </div>
      </Show>
      </div>
    </>
  );
}

export default TrayPreview;