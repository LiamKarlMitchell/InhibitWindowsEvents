import { createSignal, onMount } from "solid-js";

interface FooterProps {
  hooksInstalled?: boolean;
  connectionStatus?: "connected" | "disconnected" | "connecting";
  version?: string;
}

function Footer(props: FooterProps) {
  const [currentTime, setCurrentTime] = createSignal(new Date());
  const [systemLoad, setSystemLoad] = createSignal(0);

  onMount(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate system load (replace with actual system metrics)
    const loadInterval = setInterval(() => {
      setSystemLoad(Math.floor(Math.random() * 100));
    }, 5000);

    // Cleanup intervals
    return () => {
      clearInterval(timeInterval);
      clearInterval(loadInterval);
    };
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConnectionStatusDisplay = () => {
    const status = props.connectionStatus || "disconnected";
    switch (status) {
      case "connected":
        return {
          icon: "i-lucide-wifi",
          text: "Connected",
          color: "text-green-500"
        };
      case "connecting":
        return {
          icon: "i-lucide-loader",
          text: "Connecting...",
          color: "text-yellow-500"
        };
      default:
        return {
          icon: "i-lucide-wifi-off",
          text: "Disconnected",
          color: "text-red-500"
        };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  return (
    <footer 
      class="px-6 py-3 bg-gray-800 border-t border-gray-700"
      role="contentinfo"
      aria-label="Application status bar"
    >
      <div class="flex items-center justify-between text-sm text-gray-400">
        {/* Left side - Status indicators */}
        <div class="flex items-center gap-4">
          {/* Hook Status */}
          <div class="flex items-center gap-2">
            <div 
              class={props.hooksInstalled ? "status-active" : "status-inactive"}
              aria-hidden="true"
            ></div>
            <span>
              Hooks {props.hooksInstalled ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Connection Status */}
          <div class="flex items-center gap-2">
            <div 
              class={`${connectionDisplay.icon} ${connectionDisplay.color} ${
                props.connectionStatus === "connecting" ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            ></div>
            <span class={connectionDisplay.color}>
              {connectionDisplay.text}
            </span>
          </div>

          {/* System Load */}
          <div class="flex items-center gap-2">
            <div class="i-lucide-cpu text-gray-500" aria-hidden="true"></div>
            <span>
              Load: {systemLoad()}%
            </span>
          </div>
        </div>

        {/* Right side - Time and version */}
        <div class="flex items-center gap-4">
          {/* Version */}
          {props.version && (
            <div class="flex items-center gap-2">
              <div class="i-lucide-tag text-gray-500" aria-hidden="true"></div>
              <span>v{props.version}</span>
            </div>
          )}

          {/* Current Time */}
          <div class="flex items-center gap-2">
            <div class="i-lucide-clock text-gray-500" aria-hidden="true"></div>
            <time 
              datetime={currentTime().toISOString()}
              title={currentTime().toLocaleString()}
            >
              {formatTime(currentTime())}
            </time>
          </div>
        </div>
      </div>

      {/* Screen reader status updates */}
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        Hooks are currently {props.hooksInstalled ? "active" : "inactive"}.
        Connection status: {connectionDisplay.text}.
        System load: {systemLoad()}%.
      </div>
    </footer>
  );
}

export default Footer;