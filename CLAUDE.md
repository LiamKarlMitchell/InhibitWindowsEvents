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
pnpm dev               # Start Vite dev server (port 9833)
pnpm build             # Build frontend assets
```

### Tauri Development

#### Native Development (Linux/macOS)
```bash
pnpm tauri dev         # Run Tauri in development mode
pnpm tauri build       # Build production executable
pnpm tauri build --debug  # Build with debug info
```

#### Windows Cross-Compilation from WSL2
```bash
# Build commands
pnpm build:win         # Build Windows release executable
pnpm dev:win           # Start dev server (frontend only, cross-compile backend)

# Alternative direct commands
pnpm tauri build --target x86_64-pc-windows-gnu       # Windows release build
pnpm tauri dev --target x86_64-pc-windows-gnu         # Windows dev mode
cargo build --release --target x86_64-pc-windows-gnu  # Rust-only build
```

#### WSL2 to Windows Development Workflow
```bash
# Option 1: Complete dev workflow (build debug + copy)
pnpm dev:workflow      # Build debug Windows exe + copy to G: drive

# Option 2: Step-by-step
pnpm build:win:debug   # Build Windows debug executable
pnpm copy:win:debug    # Copy debug build to /mnt/g/WSL/win/inhibit-windows-events/

# Option 3: Release build
pnpm build:win         # Build Windows release
pnpm copy:win          # Copy release build to G: drive

# Frontend development server (run separately in the background)
pnpm dev:frontend      # Start Vite dev server on all interfaces (0.0.0.0:9833)
```

**Development Process:**
1. Run `pnpm dev:workflow` to build and copy Windows executable
2. Run `pnpm dev:frontend` for live frontend development  
3. Execute the Windows binary manually: `G:\WSL\win\inhibit-windows-events\inhibit-windows-events.exe`
4. Frontend changes auto-reload via HMR, backend changes require rebuilding

**One-time Windows Setup (run as Administrator):**
```powershell
# Setup port forwarding for development
.\scripts\setup-port-forwarding.ps1

# Setup firewall exceptions
.\scripts\setup-firewall.ps1
```

### Rust Backend
```bash
cd src-tauri
cargo check            # Check Rust code
cargo clippy           # Lint Rust code
cargo test             # Run Rust tests

# Windows cross-compilation
cargo check --target x86_64-pc-windows-gnu
cargo clippy --target x86_64-pc-windows-gnu
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
- `src-tauri/Cargo.toml`: Rust dependencies, Windows-specific features with cross-compilation
- `package.json`: Frontend dependencies, npm scripts with Windows build targets
- `vite.config.ts`: Frontend build config, dev server on port 9833, HMR on port 9834
- `.cargo/config.toml`: Cross-compilation linker configuration for Windows targets

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

### WSL2 Cross-Compilation Notes
- **Target**: `x86_64-pc-windows-gnu` (GNU toolchain via MinGW-w64)
- **Prerequisites**: Install `mingw-w64` in WSL2: `sudo apt install mingw-w64`
- **Linker Config**: `.cargo/config.toml` configures MinGW linker for Windows targets
- **Port Forwarding**: Development server accessible from Windows via `localhost:9833`
- **File Sharing**: Built executables copied to `/mnt/g/WSL/win/inhibit-windows-events/`
- **Limitations**: Cannot run Windows executables directly in WSL2 - must copy to Windows to test

### WSL2 Development Setup Scripts
- `scripts/copy-to-windows.sh`: Copies built Windows executable to mounted Windows drive
- `scripts/setup-port-forwarding.ps1`: Configures Windows port forwarding to WSL2
- `scripts/setup-firewall.ps1`: Creates Windows Firewall exceptions for development ports
- `scripts/README.md`: Complete setup and troubleshooting guide

**Required Windows Configuration:**
1. Mount G: drive accessible as `/mnt/g/` in WSL2
2. Port forwarding: `0.0.0.0:9833/9834` → `WSL2_IP:9833/9834`
3. Firewall exceptions for ports 9833 (dev server) and 9834 (HMR websocket)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

When task is completed you MUST remember to commit changes with a nice generated commit message.

