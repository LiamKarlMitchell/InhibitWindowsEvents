import { Component, Show } from 'solid-js';
import { useConfig, useWindowsKeyEnabled, useMouseButtonsEnabled, useAppSettings } from '../store';
import Checkbox from './ui/Checkbox';

/**
 * Configuration panel component demonstrating SignalDB + SolidJS integration
 * Shows reactive configuration management with persistent storage
 */
const ConfigPanel: Component = () => {
  const { config, isLoading, error } = useConfig();
  const [windowsKeyEnabled, setWindowsKeyEnabled, windowsKeyMeta] = useWindowsKeyEnabled();
  const { 
    mouseButton3: [mouseButton3, setMouseButton3],
    mouseButton4: [mouseButton4, setMouseButton4],
    mouseButton5: [mouseButton5, setMouseButton5],
    isLoading: mouseButtonsLoading
  } = useMouseButtonsEnabled();
  const {
    startMinimized: [startMinimized, setStartMinimized],
    startWithWindows: [startWithWindows, setStartWithWindows],
    isLoading: appSettingsLoading
  } = useAppSettings();

  return (
    <div class="config-panel">
      <h2>Windows Events Configuration</h2>
      
      {/* Error Display */}
      <Show when={error()}>
        <div class="p-3 bg-red-900/20 border border-red-500/50 rounded-lg mb-4">
          <div class="flex items-center gap-2">
            <div class="i-lucide-alert-circle text-red-500"></div>
            <span class="text-sm text-red-300">Configuration Error: {error()}</span>
          </div>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={isLoading()}>
        <div class="p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg mb-4">
          <div class="flex items-center gap-2">
            <div class="i-lucide-loader-2 animate-spin text-blue-500"></div>
            <span class="text-sm text-blue-300">Loading configuration...</span>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && config()}>
        {/* Windows Key Configuration */}
        <section class="config-section">
          <h3>Keyboard Hooks</h3>
          <Checkbox
            checked={windowsKeyEnabled() ?? false}
            onChange={setWindowsKeyEnabled}
            disabled={windowsKeyMeta.isLoading()}
            label="Block Left Windows Key"
            description="Replaces the Left Windows key with F24 to prevent accidental Start menu activation"
          />
        </section>

        {/* Mouse Button Configuration */}
        <section class="config-section">
          <h3>Mouse Hooks</h3>
          <Checkbox
            checked={mouseButton3() ?? false}
            onChange={setMouseButton3}
            disabled={mouseButtonsLoading()}
            label="Block Mouse Button 3 (Back)"
            description="Suppress the back navigation button on the mouse"
          />
          
          <Checkbox
            checked={mouseButton4() ?? false}
            onChange={setMouseButton4}
            disabled={mouseButtonsLoading()}
            label="Block Mouse Button 4 (Forward)"
            description="Suppress the forward navigation button on the mouse"
          />
          
          <Checkbox
            checked={mouseButton5() ?? false}
            onChange={setMouseButton5}
            disabled={mouseButtonsLoading()}
            label="Block Mouse Button 5"
            description="Suppress additional mouse button functionality"
          />
        </section>

        {/* Application Settings */}
        <section class="config-section">
          <h3>Application Settings</h3>
          <Checkbox
            checked={startMinimized() ?? false}
            onChange={setStartMinimized}
            disabled={appSettingsLoading()}
            label="Start minimized to system tray"
            description="Launch the application minimized to the system tray instead of showing the window"
          />
          
          <Checkbox
            checked={startWithWindows() ?? false}
            onChange={setStartWithWindows}
            disabled={appSettingsLoading()}
            label="Start with Windows"
            description="Automatically start the application when Windows boots up"
          />
        </section>

        {/* Configuration Preview */}
        <section class="config-section">
          <h3>Current Configuration</h3>
            <pre
              class="config-preview rounded-lg bg-gray-900 text-gray-100 font-mono text-sm p-4 shadow-inner border border-gray-700 max-h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
            >
              {JSON.stringify(config(), null, 2)}
            </pre>
        </section>
      </Show>
    </div>
  );
};

export default ConfigPanel;