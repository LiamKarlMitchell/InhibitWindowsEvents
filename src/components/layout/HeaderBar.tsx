import { createSignal } from "solid-js";

interface HeaderBarProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

function HeaderBar(props: HeaderBarProps) {
  const [isMinimized, setIsMinimized] = createSignal(false);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized());
    // TODO: Integrate with Tauri window controls
  };

  const handleClose = () => {
    // TODO: Integrate with Tauri window controls
    console.log("Close app");
  };

  return (
    <header 
      class="px-6 py-4 border-b border-gray-700 bg-gray-900"
      role="banner"
      aria-label="Application header"
    >
      <div class="flex-between">
        <div class="flex items-center gap-3">
          <div 
            class="i-lucide-shield-check text-2xl text-blue-500" 
            aria-hidden="true"
          ></div>
          <h1 
            class="text-xl font-semibold text-gray-100"
            id="app-title"
          >
            Windows Events Inhibitor
          </h1>
        </div>
        
        <div class="flex items-center gap-2">
          {/* Theme toggle */}
          <button 
            class="btn-ghost p-2 rounded-lg focus-ring"
            onClick={props.onThemeToggle}
            aria-label={props.isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={props.isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div class={props.isDarkMode ? "i-lucide-sun text-lg" : "i-lucide-moon text-lg"}></div>
          </button>

          {/* Window Controls */}
          <div class="flex items-center gap-1 ml-2">
            <button 
              class="btn-ghost p-2 rounded-lg focus-ring"
              onClick={handleMinimize}
              aria-label="Minimize window"
              title="Minimize"
            >
              <div class="i-lucide-minus text-sm"></div>
            </button>
            <button 
              class="btn-ghost p-2 rounded-lg focus-ring hover:bg-red-600"
              onClick={handleClose}
              aria-label="Close application"
              title="Close"
            >
              <div class="i-lucide-x text-sm"></div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderBar;