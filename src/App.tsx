import { createSignal } from "solid-js";
import ConfigPanel from "./components/ConfigPanel";
import { HeaderBar, Sidebar, MainContent, Footer } from "./components/layout";
import { useHookStore } from "./store/hook-store";
import { ToastContainer } from "./components/ui/Toast";

function App() {
  const [isDarkMode, setIsDarkMode] = createSignal(true);
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  const [activeSection, setActiveSection] = createSignal("dashboard");
  const [sidebarOverlayVisible, setSidebarOverlayVisible] = createSignal(false);

  // Use hook store for all hook-related state and operations
  const hookStore = useHookStore();

  async function installHooks() {
    try {
      await hookStore.installHooks();
    } catch (error) {
      // Error handling is now done in the hook store with toast notifications
      console.error('Failed to install hooks:', error);
    }
  }

  async function uninstallHooks() {
    try {
      await hookStore.uninstallHooks();
    } catch (error) {
      // Error handling is now done in the hook store with toast notifications
      console.error('Failed to uninstall hooks:', error);
    }
  }

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode());
    // TODO: Implement actual theme switching
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed());
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // On mobile, close sidebar after navigation
    if (window.innerWidth < 1024) {
      setSidebarOverlayVisible(false);
    }
  };

  const renderMainContent = () => {
    switch (activeSection()) {
      case "hooks":
        return (
          <div class="space-y-6">
            {/* Status Card */}
            <div class="card animate-slide-in-down">
              <div class="flex-between mb-4">
                <div>
                  <h2 class="text-lg font-medium text-gray-100 mb-1">Hook Status</h2>
                  <p class="text-sm text-gray-300">Control Windows event hooks</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class={hookStore.hookStatus?.hooks_installed ? "status-active" : "status-inactive"}></div>
                  <span class="text-sm text-gray-300">
                    {hookStore.hookStatus?.hooks_installed ? "Active" : "Inactive"}
                  </span>
                  {hookStore.isLoading && (
                    <div class="i-lucide-loader-2 animate-spin text-blue-500"></div>
                  )}
                </div>
              </div>

              {/* Hook Control Buttons */}
              <div class="flex gap-3 mb-4" role="group" aria-label="Hook management controls">
                <button 
                  onClick={installHooks}
                  disabled={hookStore.hookStatus?.hooks_installed || hookStore.state.isInstalling}
                  class={`btn-primary focus-ring ${(hookStore.hookStatus?.hooks_installed || hookStore.state.isInstalling) ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label={hookStore.state.isInstalling ? "Installing Windows hooks" : "Install Windows hooks to begin blocking events"}
                  aria-describedby="install-hooks-description"
                >
                  {hookStore.state.isInstalling ? (
                    <div class="i-lucide-loader-2 animate-spin mr-2" aria-hidden="true"></div>
                  ) : (
                    <div class="i-lucide-power mr-2" aria-hidden="true"></div>
                  )}
                  {hookStore.state.isInstalling ? "Installing..." : "Install Hooks"}
                </button>
                <button 
                  onClick={uninstallHooks}
                  disabled={!hookStore.hookStatus?.hooks_installed || hookStore.state.isUninstalling}
                  class={`btn-secondary focus-ring ${(!hookStore.hookStatus?.hooks_installed || hookStore.state.isUninstalling) ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label={hookStore.state.isUninstalling ? "Uninstalling Windows hooks" : "Uninstall Windows hooks to stop blocking events"}
                  aria-describedby="uninstall-hooks-description"
                >
                  {hookStore.state.isUninstalling ? (
                    <div class="i-lucide-loader-2 animate-spin mr-2" aria-hidden="true"></div>
                  ) : (
                    <div class="i-lucide-power-off mr-2" aria-hidden="true"></div>
                  )}
                  {hookStore.state.isUninstalling ? "Uninstalling..." : "Uninstall Hooks"}
                </button>
              </div>
              
              {/* Screen reader descriptions */}
              <div class="sr-only">
                <div id="install-hooks-description">
                  Installs Windows low-level hooks to suppress Windows key and mouse button events
                </div>
                <div id="uninstall-hooks-description">
                  Removes Windows hooks and restores normal keyboard and mouse functionality
                </div>
              </div>

              {/* Connection Status - Keep minimal display */}
              {!hookStore.isConnected && (
                <div class="p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg animate-fade-in">
                  <div class="flex items-center gap-2">
                    <div class="i-lucide-wifi-off text-yellow-500"></div>
                    <p class="text-sm text-yellow-300">Disconnected from backend</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case "keyboard":
        return (
          <div class="space-y-6">
            <div class="card">
              <h2 class="text-lg font-medium text-gray-100 mb-3">Keyboard Settings</h2>
              <p class="text-sm text-gray-400 mb-4">Configure keyboard hook behavior</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <div class="i-lucide-keyboard text-lg text-blue-500"></div>
                      <h3 class="font-medium text-gray-100">Windows Key</h3>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class={hookStore.hookStatus?.windows_key_hook_enabled ? "status-active" : "status-inactive"}></div>
                      <button
                        onClick={async () => {
                          try {
                            await hookStore.toggleWindowsKeyHook();
                          } catch (error) {
                            // Error handling is now done in the hook store with toast notifications
                            console.error('Failed to toggle Windows key hook:', error);
                          }
                        }}
                        disabled={hookStore.state.isToggling || !hookStore.isConnected}
                        class={`text-xs px-2 py-1 rounded border focus-ring ${
                          hookStore.hookStatus?.windows_key_hook_enabled ? 
                          "border-green-500 text-green-400 bg-green-500/10" : 
                          "border-gray-500 text-gray-400 bg-gray-500/10"
                        } ${(hookStore.state.isToggling || !hookStore.isConnected) ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                        aria-label={`Windows key hook is currently ${hookStore.hookStatus?.windows_key_hook_enabled ? "enabled" : "disabled"}. Click to ${hookStore.hookStatus?.windows_key_hook_enabled ? "disable" : "enable"}.`}
                        aria-describedby="windows-key-description"
                        role="switch"
                        aria-checked={hookStore.hookStatus?.windows_key_hook_enabled || false}
                      >
                        {hookStore.state.isToggling ? "..." : (
                          hookStore.hookStatus?.windows_key_hook_enabled ? "Enabled" : "Disabled"
                        )}
                      </button>
                    </div>
                  </div>
                  <p class="text-sm text-gray-400" id="windows-key-description">Replace Windows key with F24</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "mouse":
        return (
          <div class="space-y-6">
            <div class="card">
              <h2 class="text-lg font-medium text-gray-100 mb-3">Mouse Settings</h2>
              <p class="text-sm text-gray-400 mb-4">Configure mouse button behavior</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <div class="i-lucide-mouse text-lg text-purple-500"></div>
                      <h3 class="font-medium text-gray-100">Extra Buttons</h3>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class={hookStore.hookStatus?.mouse_button_hooks_enabled ? "status-active" : "status-inactive"}></div>
                      <button
                        onClick={async () => {
                          try {
                            await hookStore.toggleMouseButtonHooks();
                          } catch (error) {
                            // Error handling is now done in the hook store with toast notifications
                            console.error('Failed to toggle mouse button hooks:', error);
                          }
                        }}
                        disabled={hookStore.state.isToggling || !hookStore.isConnected}
                        class={`text-xs px-2 py-1 rounded border focus-ring ${
                          hookStore.hookStatus?.mouse_button_hooks_enabled ? 
                          "border-green-500 text-green-400 bg-green-500/10" : 
                          "border-gray-500 text-gray-400 bg-gray-500/10"
                        } ${(hookStore.state.isToggling || !hookStore.isConnected) ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                        aria-label={`Mouse button hooks are currently ${hookStore.hookStatus?.mouse_button_hooks_enabled ? "enabled" : "disabled"}. Click to ${hookStore.hookStatus?.mouse_button_hooks_enabled ? "disable" : "enable"}.`}
                        aria-describedby="mouse-buttons-description"
                        role="switch"
                        aria-checked={hookStore.hookStatus?.mouse_button_hooks_enabled || false}
                      >
                        {hookStore.state.isToggling ? "..." : (
                          hookStore.hookStatus?.mouse_button_hooks_enabled ? "Enabled" : "Disabled"
                        )}
                      </button>
                    </div>
                  </div>
                  <p class="text-sm text-gray-400" id="mouse-buttons-description">Block mouse buttons 3 & 4</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "hotkeys":
        return (
          <div class="space-y-6">
            <div class="card">
              <h2 class="text-lg font-medium text-gray-100 mb-3">Hotkeys</h2>
              <p class="text-sm text-gray-400 mb-4">Configure system hotkeys</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="i-lucide-zap text-lg text-yellow-500"></div>
                    <h3 class="font-medium text-gray-100">Toggle Hooks</h3>
                  </div>
                  <p class="text-sm text-gray-400">Alt + Scroll Lock</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "settings":
        return (
          <div class="space-y-6">
            <div class="card">
              <h2 class="text-lg font-medium text-gray-100 mb-3">Settings</h2>
              <ConfigPanel />
            </div>
          </div>
        );
      
      default:
        return (
          <div class="space-y-6">
            {/* Dashboard Overview */}
            <div class="card animate-slide-in-down">
              <h2 class="text-lg font-medium text-gray-100 mb-3">Dashboard</h2>
              <p class="text-sm text-gray-400 mb-6">Windows Events Inhibitor Overview</p>
              
              {/* Real-time Monitoring Status */}
              <div class="flex items-center gap-2 mb-4 text-sm">
                <div class={`w-2 h-2 rounded-full ${
                  hookStore.monitoring.isMonitoring() ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <span class="text-gray-300">
                  {hookStore.monitoring.isMonitoring() ? 'Real-time monitoring active' : 'Monitoring inactive'}
                </span>
                <span class="text-gray-500 text-xs">
                  {hookStore.monitoring.isMonitoring() && 
                    `(${hookStore.monitoring.currentPollInterval()}ms interval)`
                  }
                </span>
              </div>

              {/* Statistics */}
              {hookStore.statistics && (
                <section 
                  class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                  aria-label="Application statistics"
                  aria-live="polite"
                  aria-atomic="false"
                >
                  <div class="p-3 bg-gray-800 rounded-lg" role="status" aria-label="Events blocked counter">
                    <div class="text-xs text-gray-400 mb-1">Events Blocked</div>
                    <div class="text-lg font-semibold text-gray-100" aria-label={`${hookStore.formattedEventCount()} events blocked`}>{hookStore.formattedEventCount()}</div>
                  </div>
                  <div class="p-3 bg-gray-800 rounded-lg" role="status" aria-label="Application uptime">
                    <div class="text-xs text-gray-400 mb-1">Uptime</div>
                    <div class="text-lg font-semibold text-gray-100" aria-label={`Uptime: ${hookStore.formattedUptime()}`}>{hookStore.formattedUptime()}</div>
                  </div>
                  <div class="p-3 bg-gray-800 rounded-lg" role="status" aria-label="System health status">
                    <div class="text-xs text-gray-400 mb-1">Health</div>
                    <div class={`text-lg font-semibold ${
                      hookStore.getHookHealth() === 'healthy' ? 'text-green-400' :
                      hookStore.getHookHealth() === 'degraded' ? 'text-yellow-400' :
                      hookStore.getHookHealth() === 'critical' ? 'text-red-400' : 'text-gray-400'
                    }`} aria-label={`System health: ${hookStore.getHookHealth()}`}>
                      {hookStore.getHookHealth().charAt(0).toUpperCase() + hookStore.getHookHealth().slice(1)}
                    </div>
                  </div>
                  <div class="p-3 bg-gray-800 rounded-lg" role="status" aria-label="Error count">
                    <div class="text-xs text-gray-400 mb-1">Errors</div>
                    <div class="text-lg font-semibold text-gray-100" aria-label={`${hookStore.statistics.errorCount} errors occurred`}>{hookStore.statistics.errorCount}</div>
                  </div>
                </section>
              )}

              {/* Quick Status */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class={hookStore.hookStatus?.hooks_installed ? "status-active" : "status-inactive"}></div>
                    <div>
                      <p class="text-sm font-medium text-gray-100">
                        {hookStore.hookStatus?.hooks_installed ? "Hooks Active" : "Hooks Inactive"}
                      </p>
                      <p class="text-xs text-gray-400">
                        {hookStore.getHookHealth() === 'healthy' ? 'System Status' : 
                         hookStore.getHookHealth() === 'degraded' ? 'Degraded Performance' :
                         hookStore.getHookHealth() === 'critical' ? 'Critical Issues' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="i-lucide-keyboard text-lg text-blue-500"></div>
                    <div>
                      <p class="text-sm font-medium text-gray-100">Windows Key</p>
                      <p class="text-xs text-gray-400">
                        {hookStore.hookStatus?.windows_key_hook_enabled ? 'Replacement Active' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div class="p-4 bg-gray-700 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="i-lucide-mouse text-lg text-purple-500"></div>
                    <div>
                      <p class="text-sm font-medium text-gray-100">Mouse Buttons</p>
                      <p class="text-xs text-gray-400">
                        {hookStore.hookStatus?.mouse_button_hooks_enabled ? 'Blocked' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <section aria-label="Quick navigation actions">
                <h3 class="sr-only">Quick navigation to configuration sections</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3" role="group">
                  <button 
                    class="btn-ghost text-left p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 focus-ring"
                    onClick={() => handleSectionChange("keyboard")}
                    aria-label="Navigate to keyboard settings to configure Windows key replacement"
                  >
                    <div class="i-lucide-keyboard text-lg text-blue-500 mb-2" aria-hidden="true"></div>
                    <div class="text-sm font-medium text-gray-100">Windows Key</div>
                    <div class="text-xs text-gray-400">Replace with F24</div>
                  </button>
                  <button 
                    class="btn-ghost text-left p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 focus-ring"
                    onClick={() => handleSectionChange("mouse")}
                    aria-label="Navigate to mouse settings to configure extra button blocking"
                  >
                    <div class="i-lucide-mouse text-lg text-purple-500 mb-2" aria-hidden="true"></div>
                    <div class="text-sm font-medium text-gray-100">Mouse Buttons</div>
                    <div class="text-xs text-gray-400">Block extra buttons</div>
                  </button>
                  <button 
                    class="btn-ghost text-left p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 focus-ring"
                    onClick={() => handleSectionChange("hotkeys")}
                    aria-label="Navigate to hotkey settings to configure toggle shortcuts"
                  >
                    <div class="i-lucide-settings text-lg text-yellow-500 mb-2" aria-hidden="true"></div>
                    <div class="text-sm font-medium text-gray-100">Toggle Hotkey</div>
                    <div class="text-xs text-gray-400">Alt + Scroll Lock</div>
                  </button>
                </div>
              </section>
            </div>
          </div>
        );
    }
  };

  return (
    <div class="app-layout font-sans">
      {/* Skip navigation links */}
      <div>
        <a 
          href="#main-content" 
          class="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus-ring"
          onClick={(e) => {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
              mainContent.focus();
              mainContent.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          class="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-40 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus-ring"
          onClick={(e) => {
            e.preventDefault();
            const navigation = document.getElementById('navigation');
            if (navigation) {
              navigation.focus();
              navigation.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Skip to navigation
        </a>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <div 
        class={`sidebar-overlay transition-opacity duration-300 ${
          sidebarOverlayVisible() ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOverlayVisible(false)}
        aria-hidden="true"
      />

      {/* Header */}
      <HeaderBar 
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode()}
      />

      {/* Main Layout */}
      <div class="main-layout">
        {/* Sidebar */}
        <Sidebar 
          isCollapsed={sidebarCollapsed()}
          onToggle={handleSidebarToggle}
          activeSection={activeSection()}
          onSectionChange={handleSectionChange}
        />

        {/* Main Content */}
        <MainContent 
          activeSection={activeSection()}
          title={activeSection() === "dashboard" ? "Dashboard" : 
                 activeSection() === "hooks" ? "Hook Controls" :
                 activeSection() === "keyboard" ? "Keyboard Settings" :
                 activeSection() === "mouse" ? "Mouse Settings" :
                 activeSection() === "hotkeys" ? "Hotkeys" :
                 activeSection() === "settings" ? "Settings" : "Dashboard"}
          subtitle={activeSection() === "dashboard" ? "Windows Events Inhibitor Overview" :
                   activeSection() === "hooks" ? "Control Windows event hooks" :
                   activeSection() === "keyboard" ? "Configure keyboard hook behavior" :
                   activeSection() === "mouse" ? "Configure mouse button behavior" :
                   activeSection() === "hotkeys" ? "Configure system hotkeys" :
                   activeSection() === "settings" ? "Application settings and configuration" : ""}
        >
          {renderMainContent()}
        </MainContent>
      </div>

      {/* Footer */}
      <Footer 
        hooksInstalled={hookStore.hookStatus?.hooks_installed || false}
        connectionStatus={hookStore.isConnected ? "connected" : "disconnected"}
        version="0.1.0"
      />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
