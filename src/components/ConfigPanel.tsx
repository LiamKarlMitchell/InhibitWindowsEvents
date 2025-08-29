import { Component } from 'solid-js';
import { useConfig, useWindowsKeyEnabled, useMouseButtonsEnabled, useAppSettings } from '../store';

/**
 * Configuration panel component demonstrating SignalDB + SolidJS integration
 * Shows reactive configuration management with persistent storage
 */
const ConfigPanel: Component = () => {
  const { config } = useConfig();
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

  return (
    <div class="config-panel">
      <h2>Windows Events Configuration</h2>
      
      {/* Windows Key Configuration */}
      <section class="config-section">
        <h3>Keyboard Hooks</h3>
        <label class="config-item">
          <input
            type="checkbox"
            checked={windowsKeyEnabled() ?? false}
            onChange={(e) => setWindowsKeyEnabled(e.currentTarget.checked)}
          />
          <span>Block Windows Key (replace with F24)</span>
        </label>
      </section>

      {/* Mouse Button Configuration */}
      <section class="config-section">
        <h3>Mouse Hooks</h3>
        <label class="config-item">
          <input
            type="checkbox"
            checked={mouseButton3() ?? false}
            onChange={(e) => setMouseButton3(e.currentTarget.checked)}
          />
          <span>Block Mouse Button 3 (Back)</span>
        </label>
        
        <label class="config-item">
          <input
            type="checkbox"
            checked={mouseButton4() ?? false}
            onChange={(e) => setMouseButton4(e.currentTarget.checked)}
          />
          <span>Block Mouse Button 4 (Forward)</span>
        </label>
        
        <label class="config-item">
          <input
            type="checkbox"
            checked={mouseButton5() ?? false}
            onChange={(e) => setMouseButton5(e.currentTarget.checked)}
          />
          <span>Block Mouse Button 5</span>
        </label>
      </section>

      {/* Application Settings */}
      <section class="config-section">
        <h3>Application Settings</h3>
        <label class="config-item">
          <input
            type="checkbox"
            checked={startMinimized() ?? false}
            onChange={(e) => setStartMinimized(e.currentTarget.checked)}
          />
          <span>Start minimized to system tray</span>
        </label>
        
        <label class="config-item">
          <input
            type="checkbox"
            checked={startWithWindows() ?? false}
            onChange={(e) => setStartWithWindows(e.currentTarget.checked)}
          />
          <span>Start with Windows</span>
        </label>
      </section>

      {/* Configuration Preview */}
      <section class="config-section">
        <h3>Current Configuration</h3>
        <pre class="config-preview">
          {JSON.stringify(config(), null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default ConfigPanel;