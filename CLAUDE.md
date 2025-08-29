# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Windows event inhibition application built with Tauri (Rust backend) + SolidJS (TypeScript frontend). It provides low-level Windows hooks to suppress specific keyboard and mouse events:
- Left Windows key (replaced with F24)
- Extra mouse buttons (Mouse 3/4, typically browser back/forward)
- Alt+Scroll Lock toggles hook enable/disable state

## Development Commands

### Frontend Development
```bash
pnpm install           # Install dependencies
pnpm dev               # Start Vite dev server (port 1420)
pnpm build             # Build frontend assets
```

### Tauri Development
```bash
pnpm tauri dev         # Run Tauri in development mode
pnpm tauri build       # Build production executable
pnpm tauri build --debug  # Build with debug info
```

### Rust Backend
```bash
cd src-tauri
cargo check            # Check Rust code
cargo clippy           # Lint Rust code
cargo test             # Run Rust tests
```

## Architecture

### Windows Hook System (src-tauri/src/lib.rs)

The core functionality uses Windows Low-Level Hooks:
- **HookManager**: Thread-safe singleton managing hook lifecycle
- **ENABLE_HOOKS**: Global atomic boolean for runtime enable/disable
- **Message Pump**: Background thread processing Windows messages via GetMessage/DispatchMessage
- **Hook Callbacks**: `mouse_hook_proc` and `keyboard_hook_proc` for event interception

**Key Implementation Details:**
- Uses `windows` crate with specific Win32 APIs (Win32_UI_WindowsAndMessaging, Win32_UI_Input_KeyboardAndMouse)
- Thread-safe using Arc<Mutex<>> for hook handles and atomic operations
- Proper resource cleanup in Drop implementation
- Error handling with custom HookError enum
- Async/await compatible with Tauri's runtime

**Hook Behavior:**
- Mouse: Suppresses WM_XBUTTONDOWN/WM_XBUTTONUP (returns LRESULT(1))
- Keyboard: Intercepts VK_LWIN, injects VK_F24 keypresses instead
- Toggle: Alt+Scroll Lock flips ENABLE_HOOKS state

### Tauri Commands (src-tauri/src/lib.rs:317-377)

Exposed Rust functions to frontend:
- `install_hooks()` -> `Result<String, String>`
- `uninstall_hooks()` -> `Result<String, String>`
- `greet(name: &str)` -> String (template command)

### Frontend (src/App.tsx)

Currently contains Tauri template code. Production app should replace with:
- Configuration UI for individual hook toggles
- Real-time status indicators
- System tray integration controls

### Legacy C++ Implementation (InhibitWindowsEvents/Source.cpp)

Original implementation for reference:
- Similar hook logic but synchronous
- Console application with realtime priority
- Registry timeout checking for debugging
- Direct SetWindowsHookEx calls without async handling

## Platform Requirements

- **Windows Only**: Uses Win32 APIs exclusively
- **Administrator Privileges**: Low-level hooks may require elevation
- **Windows Version**: Tested on Windows 10/11 (requires modern Win32 API support)

## Configuration Files

- `src-tauri/tauri.conf.json`: Tauri app config, window settings, build commands
- `src-tauri/Cargo.toml`: Rust dependencies, Windows-specific features
- `package.json`: Frontend dependencies, npm scripts
- `vite.config.ts`: Frontend build config, dev server on port 1420

## Planned Features (Task Master Tasks)

Based on current task list:
1. SignalDB integration for configuration persistence
2. System tray support with context menus
3. SolidJS configuration interface
4. Windows startup registration
5. Extended mouse button support

## Development Notes

### Windows Hook Debugging
- Hooks can be silently removed by Windows if they timeout (default 200ms)
- Check HKEY_CURRENT_USER\Control Panel\Desktop\LowLevelHooksTimeout
- Use Ctrl+Alt+Delete screen to recover from hook instability
- Message pump must process messages promptly to avoid system instability

### Cross-Platform Considerations
- All Windows-specific code is behind `#[cfg(windows)]` attributes
- Non-Windows builds compile but hooks are no-ops
- Use conditional compilation for platform-specific features

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

When task is completed you MUST remember to commit changes with a nice generated commit message.

