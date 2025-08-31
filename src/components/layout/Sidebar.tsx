import { createSignal } from "solid-js";

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

function Sidebar(props: SidebarProps) {
  const navigationSections: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "i-lucide-home"
    },
    {
      id: "hooks",
      label: "Hook Controls",
      icon: "i-lucide-power"
    },
    {
      id: "keyboard",
      label: "Keyboard Settings",
      icon: "i-lucide-keyboard"
    },
    {
      id: "mouse",
      label: "Mouse Settings",
      icon: "i-lucide-mouse"
    },
    {
      id: "hotkeys",
      label: "Hotkeys",
      icon: "i-lucide-zap"
    },
    {
      id: "settings",
      label: "Settings",
      icon: "i-lucide-settings"
    }
  ];

  const handleNavClick = (item: NavigationItem) => {
    props.onSectionChange?.(item.id);
  };

  return (
    <aside 
      id="navigation"
      class={`
        bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out
        ${props.isCollapsed ? "w-16" : "w-64"}
        flex flex-col self-stretch
      `}
      role="navigation"
      aria-label="Main navigation"
      tabindex="-1"
    >
      {/* Sidebar Header */}
      <div class="p-4 border-b border-gray-700">
        <button
          class="btn-ghost p-2 rounded-lg w-full flex items-center gap-3 focus-ring"
          onClick={props.onToggle}
          aria-label={props.isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={props.isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div class="i-lucide-panel-left text-lg text-gray-400"></div>
          {!props.isCollapsed && (
            <span class="text-sm text-gray-400">Navigation</span>
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav class="flex-1 py-4">
        <ul class="space-y-1 px-3" role="list">
          {navigationSections.map((item) => (
            <li key={item.id} role="none">
              <button
                class={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                  transition-all duration-200 focus-ring
                  ${props.activeSection === item.id 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                  }
                `}
                onClick={() => handleNavClick(item)}
                aria-current={props.activeSection === item.id ? "page" : undefined}
                title={props.isCollapsed ? item.label : undefined}
              >
                <div class={`${item.icon} text-lg flex-shrink-0`}></div>
                {!props.isCollapsed && (
                  <span class="text-sm font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-700 rounded-full flex-center">
            <div class="i-lucide-user text-sm text-gray-400"></div>
          </div>
          {!props.isCollapsed && (
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-100 truncate">System</p>
              <p class="text-xs text-gray-400 truncate">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;