import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import ConfigPanel from "./components/ConfigPanel";
import "./App.css";
import "./components/ConfigPanel.css";

function App() {
  const [hooksInstalled, setHooksInstalled] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal("");

  async function installHooks() {
    try {
      const result = await invoke("install_hooks") as string;
      setStatusMessage(result);
      setHooksInstalled(true);
    } catch (error) {
      setStatusMessage(`Error: ${error}`);
    }
  }

  async function uninstallHooks() {
    try {
      const result = await invoke("uninstall_hooks") as string;
      setStatusMessage(result);
      setHooksInstalled(false);
    } catch (error) {
      setStatusMessage(`Error: ${error}`);
    }
  }

  return (
    <main class="container">
      <h1>Windows Events Inhibitor</h1>

      {/* Hook Control */}
      <section class="hook-controls">
        <div class="button-group">
          <button 
            onClick={installHooks}
            disabled={hooksInstalled()}
            class="install-btn"
          >
            Install Hooks
          </button>
          <button 
            onClick={uninstallHooks}
            disabled={!hooksInstalled()}
            class="uninstall-btn"
          >
            Uninstall Hooks
          </button>
        </div>
        {statusMessage() && (
          <p class="status-message">{statusMessage()}</p>
        )}
      </section>

      {/* Configuration Panel with SignalDB Integration */}
      <ConfigPanel />
    </main>
  );
}

export default App;
