import { JSX, createSignal, createEffect, onMount, Show } from 'solid-js';
import { 
  SettingsSection, 
  SettingRow, 
  KeyboardShortcut,
  Button,
  type Shortcut,
  type ValidationState
} from './ui';
import { 
  useWindowsKeyEnabled, 
  useMouseButtonsEnabled, 
  useAppSettings,
  useConfig
} from '../store/hooks';
import { 
  addToWindowsStartup, 
  removeFromWindowsStartup, 
  checkStartupStatus,
  getHookStatus,
  withErrorHandling,
  type StartupStatus,
  type HookStatus
} from '../services/tauri';

export interface SettingsPanelProps {
  class?: string;
  id?: string;
}

export function SettingsPanel(props: SettingsPanelProps) {
  // Configuration hooks
  const [windowsKeyEnabled, setWindowsKeyEnabled] = useWindowsKeyEnabled();
  const { 
    mouseButton3: [mouseButton3, setMouseButton3],
    mouseButton4: [mouseButton4, setMouseButton4],
    mouseButton5: [mouseButton5, setMouseButton5]
  } = useMouseButtonsEnabled();
  const {
    startMinimized: [startMinimized, setStartMinimized],
    startWithWindows: [startWithWindows, setStartWithWindows]
  } = useAppSettings();
  const { config, resetConfig } = useConfig();

  // Backend status state
  const [hookStatus, setHookStatus] = createSignal<HookStatus>();
  const [startupStatus, setStartupStatus] = createSignal<StartupStatus>();
  const [isLoading, setIsLoading] = createSignal(false);
  
  // Error and validation state
  const [error, setError] = createSignal<string>();
  const [validationStates, setValidationStates] = createSignal<Record<string, ValidationState>>({});
  const [validationMessages, setValidationMessages] = createSignal<Record<string, string>>({});

  // Global hotkey state (Alt+ScrollLock is hardcoded in the backend)
  const [globalHotkey, setGlobalHotkey] = createSignal<Shortcut>({
    alt: true,
    key: 'ScrollLock'
  });

  // Debug mode state (for future implementation)
  const [debugMode, setDebugMode] = createSignal(false);

  // Load initial backend status
  onMount(async () => {
    await refreshBackendStatus();
  });

  // Refresh backend status
  const refreshBackendStatus = async () => {
    setIsLoading(true);
    try {
      const [hooks, startup] = await Promise.all([
        withErrorHandling('get_hook_status', () => getHookStatus()),
        withErrorHandling('check_startup_status', () => checkStartupStatus())
      ]);
      setHookStatus(hooks);
      setStartupStatus(startup);
      setError(undefined);
    } catch (err) {
      setError(`Failed to load status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle startup toggle with backend integration
  const handleStartWithWindowsChange = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        await withErrorHandling('add_to_windows_startup', () => addToWindowsStartup());
      } else {
        await withErrorHandling('remove_from_windows_startup', () => removeFromWindowsStartup());
      }
      setStartWithWindows(enabled);
      await refreshBackendStatus();
      setError(undefined);
    } catch (err) {
      setError(`Failed to update startup setting: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Don't update the UI state if backend failed
    } finally {
      setIsLoading(false);
    }
  };

  // Handle configuration validation
  const validateSetting = (key: string, value: any): { isValid: boolean; message?: string } => {
    // Basic validation examples
    switch (key) {
      case 'globalHotkey':
        if (!value) return { isValid: false, message: 'Hotkey is required' };
        if (value.alt && value.key === 'F4') {
          return { isValid: false, message: 'Alt+F4 conflicts with Windows close window shortcut' };
        }
        break;
      default:
        return { isValid: true };
    }
    return { isValid: true };
  };

  // Update validation state
  const updateValidation = (key: string, value: any) => {
    const validation = validateSetting(key, value);
    setValidationStates(prev => ({
      ...prev,
      [key]: validation.isValid ? 'default' : 'error'
    }));
    setValidationMessages(prev => ({
      ...prev,
      [key]: validation.message || ''
    }));
  };

  const handleGlobalHotkeyChange = (shortcut: Shortcut | null) => {
    if (shortcut) {
      updateValidation('globalHotkey', shortcut);
      setGlobalHotkey(shortcut);
      // TODO: Send to backend when hotkey customization is implemented
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        resetConfig();
        await refreshBackendStatus();
        setError(undefined);
      } catch (err) {
        setError(`Failed to reset settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reactive effect to sync backend status with UI
  createEffect(() => {
    const status = hookStatus();
    if (status) {
      // Sync UI state with backend if they differ
      if (windowsKeyEnabled() !== status.windows_key_hook_enabled) {
        console.warn('UI and backend Windows key hook state out of sync');
      }
      if ((mouseButton3() || mouseButton4() || mouseButton5()) !== status.mouse_button_hooks_enabled) {
        console.warn('UI and backend mouse button hook state out of sync');
      }
    }
  });

  return (
    <div
      class={`settings-panel ${props.class || ''}`}
      id={props.id}
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '24px',
        padding: '24px',
        'max-width': '800px',
        margin: '0 auto'
      }}
    >
      {/* Error Banner */}
      <Show when={error()}>
        <div
          style={{
            padding: '12px 16px',
            'background-color': '#FEE2E2',
            border: '1px solid #FECACA',
            'border-radius': '8px',
            color: '#991B1B',
            'font-size': '14px',
            display: 'flex',
            'align-items': 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.964 0L.165 13.233c-.457.778.091 1.767.982 1.767h13.706c.89 0 1.439-.99.982-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          {error()}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(undefined)}
            style={{ 'margin-left': 'auto', color: '#991B1B' }}
          >
            ✕
          </Button>
        </div>
      </Show>
      {/* Hook Configuration Section */}
      <SettingsSection
        title="Hook Configuration"
        description="Configure which Windows events to intercept and modify"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
          </svg>
        }
        collapsible={true}
        defaultExpanded={true}
      >
        <SettingRow
          label="Windows Key Hook"
          description="Replace Windows key presses with F24 key to prevent Start menu from opening"
          controlType="toggle"
          value={windowsKeyEnabled()}
          onChange={setWindowsKeyEnabled}
          disabled={isLoading()}
          tooltip="When enabled, the Windows key will be intercepted and replaced with F24"
        />
        
        <SettingRow
          label="Mouse Button 3 (Back)"
          description="Suppress extra mouse button 3 events (typically browser back button)"
          controlType="toggle"
          value={mouseButton3()}
          onChange={setMouseButton3}
          disabled={isLoading()}
          tooltip="Mouse button 3 is usually the side button used for browser navigation"
        />
        
        <SettingRow
          label="Mouse Button 4 (Forward)"
          description="Suppress extra mouse button 4 events (typically browser forward button)"
          controlType="toggle"
          value={mouseButton4()}
          onChange={setMouseButton4}
          disabled={isLoading()}
          tooltip="Mouse button 4 is usually the side button used for browser navigation"
        />
        
        <SettingRow
          label="Mouse Button 5"
          description="Suppress extra mouse button 5 events (less common, varies by mouse)"
          controlType="toggle"
          value={mouseButton5()}
          onChange={setMouseButton5}
          disabled={isLoading()}
          tooltip="Mouse button 5 functionality varies by mouse manufacturer"
        />
      </SettingsSection>

      {/* Keyboard Shortcuts Section */}
      <SettingsSection
        title="Keyboard Shortcuts"
        description="Configure global hotkeys for controlling the application"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
          </svg>
        }
        collapsible={true}
        defaultExpanded={true}
      >
        <SettingRow
          label="Global Toggle Hotkey"
          description="Keyboard shortcut to enable/disable all hooks globally"
          controlType="custom"
          tooltip="This hotkey works even when hooks are disabled"
          validationState={validationStates()['globalHotkey']}
          validationMessage={validationMessages()['globalHotkey']}
        >
          <KeyboardShortcut
            value={globalHotkey()}
            onChange={handleGlobalHotkeyChange}
            placeholder="Alt + Scroll Lock (Default)"
            disabled={isLoading() || true} // Currently hardcoded to Alt+ScrollLock
            allowSystemKeys={false}
          />
        </SettingRow>
      </SettingsSection>

      {/* System Options Section */}
      <SettingsSection
        title="System Options"
        description="Configure application startup and system integration settings"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
          </svg>
        }
        collapsible={true}
        defaultExpanded={false}
      >
        <SettingRow
          label="Start with Windows"
          description="Automatically start the application when Windows boots up"
          controlType="toggle"
          value={startupStatus()?.enabled ?? startWithWindows()}
          onChange={handleStartWithWindowsChange}
          disabled={isLoading()}
          tooltip="Requires administrator privileges to modify Windows startup registry"
          validationState={validationStates()['startWithWindows']}
          validationMessage={validationMessages()['startWithWindows']}
        />
        
        <SettingRow
          label="Start Minimized"
          description="Start the application minimized to system tray"
          controlType="toggle"
          value={startMinimized()}
          onChange={setStartMinimized}
          disabled={isLoading()}
          tooltip="Application will start hidden and only show in the system tray"
        />
        
        <SettingRow
          label="Debug Mode"
          description="Enable detailed logging and debugging information"
          controlType="toggle"
          value={debugMode()}
          onChange={setDebugMode}
          disabled={isLoading()}
          tooltip="Shows additional debugging information in the console"
        />
      </SettingsSection>

      {/* Application Info Section */}
      <SettingsSection
        title="Application Information"
        description="Version and system information"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
        }
        collapsible={true}
        defaultExpanded={false}
      >
        <SettingRow
          label="Application Version"
          description="Current version of the Windows Events Inhibitor"
          controlType="input"
          value="1.0.0"
          disabled={true}
        />
        
        <SettingRow
          label="Build Information"
          description="Build target and compilation details"
          controlType="input"
          value="Windows x86_64 (Cross-compiled from WSL2)"
          disabled={true}
        />
        
        <SettingRow
          label="Reset All Settings"
          description="Reset all configuration options to their default values"
          controlType="button"
          buttonText={isLoading() ? "Resetting..." : "Reset to Defaults"}
          onChange={handleResetToDefaults}
          disabled={isLoading()}
          tooltip="This action cannot be undone"
        />
        
        {/* Refresh Status Button */}
        <SettingRow
          label="Refresh Status"
          description="Reload hook and startup status from the backend"
          controlType="button"
          buttonText={isLoading() ? "Refreshing..." : "Refresh Status"}
          onChange={refreshBackendStatus}
          disabled={isLoading()}
          tooltip="Updates display with current backend state"
        />
      </SettingsSection>
    </div>
  );
}

export default SettingsPanel;