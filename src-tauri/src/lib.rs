#[cfg(windows)]
use windows::{
    core::*,
    Win32::Foundation::*,
    Win32::UI::WindowsAndMessaging::*,
    Win32::UI::Input::KeyboardAndMouse::*,
    Win32::System::LibraryLoader::GetModuleHandleW,
};

#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::RegKey;

#[cfg(windows)]
use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}};
#[cfg(windows)]
use tokio::sync::mpsc;
#[cfg(windows)]
use log::{info, warn, error, debug};
#[cfg(windows)]
use tracing::{info as tracing_info, warn as tracing_warn, error as tracing_error, debug as tracing_debug};
#[cfg(windows)]
use thiserror::Error;

// Logging module
mod logging;
pub use logging::*;

#[cfg(windows)]
#[derive(Error, Debug)]
pub enum HookError {
    #[error("Failed to get module handle: {0}")]
    ModuleHandle(#[from] windows::core::Error),
    #[error("Failed to install hook: {source}")]
    InstallHook { source: windows::core::Error },
    #[error("Failed to uninstall hook: {source}")]
    UninstallHook { source: windows::core::Error },
    #[error("Hook already installed")]
    AlreadyInstalled,
    #[error("Hook not installed")]
    NotInstalled,
    #[error("Message pump error: {0}")]
    MessagePump(String),
}

#[cfg(windows)]
#[derive(Error, Debug)]
pub enum StartupError {
    #[error("Registry access denied - Administrator privileges may be required")]
    AccessDenied,
    #[error("Failed to access Windows registry: {0}")]
    RegistryError(#[from] std::io::Error),
    #[error("Failed to get current executable path")]
    ExecutablePath,
    #[error("Registry key not found")]
    KeyNotFound,
}

#[cfg(windows)]
static ENABLE_HOOKS: AtomicBool = AtomicBool::new(true);

#[cfg(windows)]
static ENABLE_WINDOWS_KEY_HOOK: AtomicBool = AtomicBool::new(true);

#[cfg(windows)]
static ENABLE_MOUSE_BUTTON_HOOKS: AtomicBool = AtomicBool::new(true);

#[cfg(windows)]
pub struct HookManager {
    mouse_hook: Arc<Mutex<Option<HHOOK>>>,
    keyboard_hook: Arc<Mutex<Option<HHOOK>>>,
    message_pump_handle: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    shutdown_sender: Arc<Mutex<Option<mpsc::UnboundedSender<()>>>>,
}

#[cfg(windows)]
impl HookManager {
    pub fn new() -> Self {
        Self {
            mouse_hook: Arc::new(Mutex::new(None)),
            keyboard_hook: Arc::new(Mutex::new(None)),
            message_pump_handle: Arc::new(Mutex::new(None)),
            shutdown_sender: Arc::new(Mutex::new(None)),
        }
    }
    
    pub unsafe fn install_hooks(&self) -> std::result::Result<(), HookError> {
        let start_time = std::time::Instant::now();
        
        // Check if hooks are already installed
        if self.mouse_hook.lock().unwrap().is_some() || self.keyboard_hook.lock().unwrap().is_some() {
            tracing_warn!(
                operation = "install_hooks",
                reason = "already_installed",
                "Attempted to install hooks when already installed"
            );
            return Err(HookError::AlreadyInstalled);
        }
        
        tracing_info!(
            operation = "install_hooks",
            "Installing Windows hooks..."
        );
        
        // Enable hooks
        ENABLE_HOOKS.store(true, Ordering::Relaxed);
        
        // Get the current module instance
        let h_instance = unsafe { GetModuleHandleW(PCWSTR::null()) }
            .map_err(|e| {
                log_windows_error!("GetModuleHandleW", e);
                HookError::ModuleHandle(e)
            })?;
        
        tracing_debug!(
            operation = "install_hooks",
            module_handle = ?h_instance,
            "Module handle obtained"
        );
        
        // Install mouse hook
        let mouse_hook = unsafe { SetWindowsHookExW(
            WH_MOUSE_LL,
            Some(mouse_hook_proc),
            h_instance,
            0,
        ) }.map_err(|source| {
            log_windows_error!("SetWindowsHookExW_Mouse", source, hook_type = "WH_MOUSE_LL");
            HookError::InstallHook { source }
        })?;
        
        tracing_debug!(
            operation = "install_hooks",
            hook_type = "mouse",
            handle = ?mouse_hook,
            "Mouse hook installed successfully"
        );
        
        // Install keyboard hook
        let keyboard_hook = unsafe { SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(keyboard_hook_proc),
            h_instance,
            0,
        ) }.map_err(|source| {
            log_windows_error!("SetWindowsHookExW_Keyboard", source, hook_type = "WH_KEYBOARD_LL");
            HookError::InstallHook { source }
        })?;
        
        tracing_debug!(
            operation = "install_hooks",
            hook_type = "keyboard", 
            handle = ?keyboard_hook,
            "Keyboard hook installed successfully"
        );
        
        // Store hook handles
        *self.mouse_hook.lock().unwrap() = Some(mouse_hook);
        *self.keyboard_hook.lock().unwrap() = Some(keyboard_hook);
        
        // Start message pump in background thread
        self.start_message_pump().map_err(|e| {
            tracing_error!(
                operation = "install_hooks",
                error = %e,
                "Failed to start message pump"
            );
            HookError::MessagePump(e.to_string())
        })?;
        
        let duration = start_time.elapsed();
        log_performance!("install_hooks", duration.as_millis() as f64);
        
        tracing_info!(
            operation = "install_hooks",
            duration_ms = duration.as_millis(),
            "Hooks installed successfully"
        );
        Ok(())
    }
    
    fn start_message_pump(&self) -> std::result::Result<(), Box<dyn std::error::Error>> {
        info!("Starting Windows message pump thread...");
        
        let (shutdown_tx, mut shutdown_rx) = mpsc::unbounded_channel();
        
        let handle = tokio::task::spawn_blocking(move || {
            unsafe {
                let mut msg = MSG::default();
                debug!("Message pump thread started");
                
                loop {
                    // Check for shutdown signal
                    if shutdown_rx.try_recv().is_ok() {
                        info!("Message pump received shutdown signal");
                        break;
                    }
                    
                    // Process messages with timeout
                    let result = GetMessageW(&mut msg, HWND(0), 0, 0);
                    if result == BOOL(0) {
                        // WM_QUIT
                        info!("Message pump received WM_QUIT");
                        break;
                    } else if result == BOOL(-1) {
                        // Error
                        error!("GetMessage returned error");
                        break;
                    }
                    
                    TranslateMessage(&msg);
                    DispatchMessageW(&msg);
                }
                
                debug!("Message pump thread exiting");
            }
        });
        
        *self.message_pump_handle.lock().unwrap() = Some(handle);
        *self.shutdown_sender.lock().unwrap() = Some(shutdown_tx);
        
        debug!("Message pump thread spawned successfully");
        Ok(())
    }
    
    pub unsafe fn uninstall_hooks(&self) -> std::result::Result<(), HookError> {
        let start_time = std::time::Instant::now();
        
        tracing_info!(
            operation = "uninstall_hooks",
            "Uninstalling Windows hooks..."
        );
        
        // Check if hooks are installed
        let has_mouse_hook = self.mouse_hook.lock().unwrap().is_some();
        let has_keyboard_hook = self.keyboard_hook.lock().unwrap().is_some();
        
        if !has_mouse_hook && !has_keyboard_hook {
            tracing_warn!(
                operation = "uninstall_hooks",
                reason = "not_installed",
                "Attempted to uninstall hooks when none are installed"
            );
            return Err(HookError::NotInstalled);
        }
        
        // Disable hooks first
        ENABLE_HOOKS.store(false, Ordering::Relaxed);
        tracing_debug!(
            operation = "uninstall_hooks",
            "Hooks disabled, beginning cleanup process"
        );
        
        // Signal message pump to shutdown
        if let Some(shutdown_tx) = self.shutdown_sender.lock().unwrap().take() {
            tracing_debug!(
                operation = "uninstall_hooks",
                "Signaling message pump to shutdown"
            );
            if let Err(e) = shutdown_tx.send(()) {
                tracing_warn!(
                    operation = "uninstall_hooks",
                    error = ?e,
                    "Failed to send shutdown signal to message pump"
                );
            }
        }
        
        // Wait for message pump to finish (with timeout)
        if let Some(handle) = self.message_pump_handle.lock().unwrap().take() {
            tracing_debug!(
                operation = "uninstall_hooks",
                "Waiting for message pump thread to finish..."
            );
            tokio::task::block_in_place(move || {
                futures::executor::block_on(async {
                    match tokio::time::timeout(
                        std::time::Duration::from_secs(2),
                        handle
                    ).await {
                        Ok(_) => tracing_debug!(
                            operation = "uninstall_hooks",
                            "Message pump thread finished gracefully"
                        ),
                        Err(_) => tracing_warn!(
                            operation = "uninstall_hooks",
                            timeout_sec = 2,
                            "Message pump thread did not finish within timeout"
                        ),
                    }
                });
            });
        }
        
        // Uninstall mouse hook
        if let Some(hook) = self.mouse_hook.lock().unwrap().take() {
            tracing_debug!(
                operation = "uninstall_hooks",
                hook_type = "mouse",
                handle = ?hook,
                "Uninstalling mouse hook"
            );
            unsafe { UnhookWindowsHookEx(hook) }
                .map_err(|source| {
                    log_windows_error!("UnhookWindowsHookEx_Mouse", source, hook_type = "mouse");
                    HookError::UninstallHook { source }
                })?;
        }
        
        // Uninstall keyboard hook
        if let Some(hook) = self.keyboard_hook.lock().unwrap().take() {
            tracing_debug!(
                operation = "uninstall_hooks",
                hook_type = "keyboard",
                handle = ?hook,
                "Uninstalling keyboard hook"
            );
            unsafe { UnhookWindowsHookEx(hook) }
                .map_err(|source| {
                    log_windows_error!("UnhookWindowsHookEx_Keyboard", source, hook_type = "keyboard");
                    HookError::UninstallHook { source }
                })?;
        }
        
        let duration = start_time.elapsed();
        log_performance!("uninstall_hooks", duration.as_millis() as f64);
        
        tracing_info!(
            operation = "uninstall_hooks",
            duration_ms = duration.as_millis(),
            "Hooks uninstalled successfully"
        );
        Ok(())
    }
}

#[cfg(windows)]
impl Drop for HookManager {
    fn drop(&mut self) {
        unsafe {
            let _ = self.uninstall_hooks();
        }
    }
}

#[cfg(windows)]
unsafe extern "system" fn mouse_hook_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    // Always call next hook if nCode < 0 as per Windows documentation
    if n_code < 0 {
        return CallNextHookEx(None, n_code, w_param, l_param);
    }
    
    // Check if hooks are enabled
    if !ENABLE_HOOKS.load(Ordering::Relaxed) {
        return CallNextHookEx(None, n_code, w_param, l_param);
    }
    
    // Handle mouse messages
    match w_param.0 as u32 {
        WM_XBUTTONDOWN | WM_XBUTTONUP => {
            // Check if mouse button hooks are enabled
            if !ENABLE_MOUSE_BUTTON_HOOKS.load(Ordering::Relaxed) {
                return CallNextHookEx(None, n_code, w_param, l_param);
            }
            
            // Validate l_param is not null
            if l_param.0 != 0 {
                log_hook_event!(
                    "mouse_button_suppressed",
                    button_message = format!("{:X}", w_param.0),
                    hook_enabled = true
                );
                return LRESULT(1);
            } else {
                tracing_warn!(
                    target = "hook_events",
                    event_type = "mouse_hook_invalid",
                    w_param = w_param.0,
                    "Received mouse hook with null lParam"
                );
            }
        }
        _ => {
            // Not a message we care about
        }
    }
    
    // Call next hook for all other cases
    CallNextHookEx(None, n_code, w_param, l_param)
}

#[cfg(windows)]
unsafe extern "system" fn keyboard_hook_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    // Always call next hook if nCode < 0 as per Windows documentation
    if n_code < 0 {
        return CallNextHookEx(None, n_code, w_param, l_param);
    }
    
    // Validate l_param is not null before dereferencing
    if l_param.0 == 0 {
        warn!("Received keyboard hook with null lParam");
        return CallNextHookEx(None, n_code, w_param, l_param);
    }
    
    let keyboard = &*(l_param.0 as *const KBDLLHOOKSTRUCT);
    let vk_code = keyboard.vkCode;
    let w_param_u32 = w_param.0 as u32;
    
    // Handle left Windows key suppression
    if vk_code == VK_LWIN.0 as u32 
        && ENABLE_HOOKS.load(Ordering::Relaxed) 
        && ENABLE_WINDOWS_KEY_HOOK.load(Ordering::Relaxed) {
        match w_param_u32 {
            WM_KEYDOWN | WM_SYSKEYDOWN => {
                log_hook_event!(
                    "windows_key_suppressed",
                    key_event = "down",
                    replacement_key = "F24",
                    vk_code = vk_code
                );
                keybd_event(VK_F24.0 as u8, 0, KEYBD_EVENT_FLAGS(0), 0);
            }
            WM_KEYUP | WM_SYSKEYUP => {
                log_hook_event!(
                    "windows_key_suppressed", 
                    key_event = "up",
                    replacement_key = "F24",
                    vk_code = vk_code
                );
                keybd_event(VK_F24.0 as u8, 0, KEYEVENTF_KEYUP, 0);
            }
            _ => {
                tracing_debug!(
                    target = "hook_events",
                    event_type = "windows_key_unhandled",
                    w_param = w_param_u32,
                    vk_code = vk_code,
                    "Unhandled Windows key message"
                );
            }
        }
        return LRESULT(1);
    }
    
    // Handle Alt+Scroll Lock toggle (like C++ version)
    if vk_code == VK_SCROLL.0 as u32 
        && (keyboard.flags & LLKHF_ALTDOWN) != KBDLLHOOKSTRUCT_FLAGS(0) 
        && (w_param_u32 == WM_KEYUP || w_param_u32 == WM_SYSKEYUP) {
        
        let current_state = ENABLE_HOOKS.load(Ordering::Relaxed);
        let new_state = !current_state;
        ENABLE_HOOKS.store(new_state, Ordering::Relaxed);
        
        if new_state {
            info!("Hooks enabled via Alt+Scroll Lock");
        } else {
            info!("Hooks disabled via Alt+Scroll Lock");
        }
        return LRESULT(1);
    }
    
    // Call next hook for all other cases
    CallNextHookEx(None, n_code, w_param, l_param)
}

#[cfg(windows)]
/// Add the application to Windows startup by creating a registry entry
/// in HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
pub fn add_to_startup() -> std::result::Result<(), StartupError> {
    info!("Adding application to Windows startup...");
    
    // Get the current executable path
    let exe_path = std::env::current_exe()
        .map_err(|e| {
            error!("Failed to get current executable path: {}", e);
            StartupError::ExecutablePath
        })?;
    
    let exe_path_str = exe_path.to_string_lossy();
    info!("Current executable path: {}", exe_path_str);
    
    // Open the Windows Run registry key
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        KEY_SET_VALUE
    ).map_err(|e| {
        error!("Failed to open Run registry key: {}", e);
        match e.kind() {
            std::io::ErrorKind::PermissionDenied => StartupError::AccessDenied,
            _ => StartupError::RegistryError(e),
        }
    })?;
    
    // Set the registry value with the application name and executable path
    let app_name = "InhibitWindowsEvents";
    run_key.set_value(app_name, &exe_path_str.to_string())
        .map_err(|e| {
            error!("Failed to set registry value for startup: {}", e);
            match e.kind() {
                std::io::ErrorKind::PermissionDenied => StartupError::AccessDenied,
                _ => StartupError::RegistryError(e),
            }
        })?;
    
    info!("Successfully added '{}' to Windows startup with path: {}", app_name, exe_path_str);
    Ok(())
}

#[cfg(windows)]
/// Remove the application from Windows startup by deleting the registry entry
/// in HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
pub fn remove_from_startup() -> std::result::Result<(), StartupError> {
    info!("Removing application from Windows startup...");
    
    // Open the Windows Run registry key
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        KEY_SET_VALUE
    ).map_err(|e| {
        error!("Failed to open Run registry key: {}", e);
        match e.kind() {
            std::io::ErrorKind::PermissionDenied => StartupError::AccessDenied,
            std::io::ErrorKind::NotFound => StartupError::KeyNotFound,
            _ => StartupError::RegistryError(e),
        }
    })?;
    
    // Delete the registry value
    let app_name = "InhibitWindowsEvents";
    match run_key.delete_value(app_name) {
        Ok(_) => {
            info!("Successfully removed '{}' from Windows startup", app_name);
            Ok(())
        }
        Err(e) => {
            match e.kind() {
                std::io::ErrorKind::NotFound => {
                    info!("Application '{}' was not found in startup entries", app_name);
                    Ok(()) // Not an error - already removed
                }
                std::io::ErrorKind::PermissionDenied => {
                    error!("Access denied when removing startup entry: {}", e);
                    Err(StartupError::AccessDenied)
                }
                _ => {
                    error!("Failed to remove startup entry: {}", e);
                    Err(StartupError::RegistryError(e))
                }
            }
        }
    }
}

#[cfg(windows)]
/// Check if the application is currently registered for Windows startup
pub fn is_in_startup() -> std::result::Result<bool, StartupError> {
    debug!("Checking if application is in Windows startup...");
    
    // Open the Windows Run registry key
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        KEY_READ
    ).map_err(|e| {
        debug!("Failed to open Run registry key for reading: {}", e);
        match e.kind() {
            std::io::ErrorKind::PermissionDenied => StartupError::AccessDenied,
            std::io::ErrorKind::NotFound => StartupError::KeyNotFound,
            _ => StartupError::RegistryError(e),
        }
    })?;
    
    // Check if our application entry exists
    let app_name = "InhibitWindowsEvents";
    match run_key.get_value::<String, _>(app_name) {
        Ok(path) => {
            debug!("Found startup entry for '{}' with path: {}", app_name, path);
            Ok(true)
        }
        Err(e) => {
            match e.kind() {
                std::io::ErrorKind::NotFound => {
                    debug!("Application '{}' not found in startup entries", app_name);
                    Ok(false)
                }
                _ => {
                    error!("Error checking startup entry: {}", e);
                    Err(StartupError::RegistryError(e))
                }
            }
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(windows)]
use std::sync::OnceLock;

#[cfg(windows)]
static HOOK_MANAGER: OnceLock<HookManager> = OnceLock::new();

#[cfg(windows)]
#[tauri::command]
async fn install_hooks() -> std::result::Result<String, String> {
    tracing_info!(
        operation = "install_hooks_command",
        "Received install_hooks command"
    );
    
    let manager = HOOK_MANAGER.get_or_init(|| {
        tracing_debug!(
            operation = "install_hooks_command",
            "Initializing new HookManager instance"
        );
        HookManager::new()
    });
    
    unsafe {
        match manager.install_hooks() {
            Ok(_) => {
                tracing_info!(
                    operation = "install_hooks_command",
                    success = true,
                    "Hooks installed successfully via Tauri command"
                );
                Ok("Hooks installed successfully".to_string())
            }
            Err(HookError::AlreadyInstalled) => {
                tracing_debug!(
                    operation = "install_hooks_command",
                    warning = "already_installed",
                    "Hooks already installed, continuing normally"
                );
                Ok("Hooks are already installed".to_string())
            }
            Err(e) => {
                tracing_error!(
                    operation = "install_hooks_command",
                    error = %e,
                    error_type = ?e,
                    "Failed to install hooks"
                );
                
                // Graceful degradation: Provide specific guidance based on error type
                let graceful_guidance = match e {
                    HookError::PermissionDenied => {
                        tracing_warn!(
                            operation = "install_hooks_command",
                            degradation_mode = "permission_denied",
                            suggestion = "run_as_administrator",
                            "Hook installation failed due to permissions"
                        );
                        " Try running the application as Administrator."
                    },
                    HookError::InstallHook { .. } => {
                        tracing_warn!(
                            operation = "install_hooks_command",
                            degradation_mode = "windows_api_failure",
                            suggestion = "system_restart_or_wait",
                            "Windows API hook installation failed"
                        );
                        " System may be busy with other hook applications. Try restarting the application or waiting a moment."
                    },
                    HookError::MessagePump(_) => {
                        tracing_warn!(
                            operation = "install_hooks_command",
                            degradation_mode = "message_pump_failure",
                            suggestion = "resource_constraint",
                            "Message pump failed to start"
                        );
                        " System resources may be constrained. Close other applications and try again."
                    },
                    _ => {
                        tracing_warn!(
                            operation = "install_hooks_command",
                            degradation_mode = "unknown_error",
                            "Unhandled error type in hook installation"
                        );
                        " Check system compatibility and application logs."
                    }
                };
                
                Err(format!("Failed to install hooks: {}.{}", e, graceful_guidance))
            }
        }
    }
}

#[cfg(windows)]
#[tauri::command]
async fn uninstall_hooks() -> std::result::Result<String, String> {
    tracing_info!(
        operation = "uninstall_hooks_command",
        "Received uninstall_hooks command"
    );
    
    if let Some(manager) = HOOK_MANAGER.get() {
        unsafe {
            match manager.uninstall_hooks() {
                Ok(_) => {
                    tracing_info!(
                        operation = "uninstall_hooks_command",
                        success = true,
                        "Hooks uninstalled successfully via Tauri command"
                    );
                    Ok("Hooks uninstalled successfully".to_string())
                }
                Err(HookError::NotInstalled) => {
                    tracing_debug!(
                        operation = "uninstall_hooks_command",
                        warning = "not_installed", 
                        "No hooks to uninstall"
                    );
                    Ok("No hooks are currently installed".to_string())
                }
                Err(e) => {
                    tracing_error!(
                        operation = "uninstall_hooks_command",
                        error = %e,
                        error_type = ?e,
                        "Failed to uninstall hooks"
                    );
                    
                    // Graceful degradation guidance
                    let graceful_guidance = " The application can continue running, but you may need to restart to fully clean up system hooks.";
                    
                    Err(format!("Failed to uninstall hooks: {}.{}", e, graceful_guidance))
                }
            }
        }
    } else {
        tracing_debug!(
            operation = "uninstall_hooks_command",
            degradation_mode = "manager_not_initialized",
            "Hook manager not initialized - no hooks to uninstall"
        );
        Ok("Hook manager not initialized".to_string())
    }
}

#[cfg(windows)]
#[tauri::command]
async fn toggle_windows_key_hook() -> std::result::Result<String, String> {
    let current_state = ENABLE_WINDOWS_KEY_HOOK.load(Ordering::Relaxed);
    let new_state = !current_state;
    ENABLE_WINDOWS_KEY_HOOK.store(new_state, Ordering::Relaxed);
    
    let status = if new_state { "enabled" } else { "disabled" };
    info!("Windows Key hook {}", status);
    Ok(format!("Windows Key hook {}", status))
}

#[cfg(windows)]
#[tauri::command]
async fn toggle_mouse_button_hooks() -> std::result::Result<String, String> {
    let current_state = ENABLE_MOUSE_BUTTON_HOOKS.load(Ordering::Relaxed);
    let new_state = !current_state;
    ENABLE_MOUSE_BUTTON_HOOKS.store(new_state, Ordering::Relaxed);
    
    let status = if new_state { "enabled" } else { "disabled" };
    info!("Mouse Button hooks {}", status);
    Ok(format!("Mouse Button hooks {}", status))
}

#[cfg(windows)]
#[tauri::command]
async fn get_hook_status() -> std::result::Result<serde_json::Value, String> {
    let hook_status = serde_json::json!({
        "overall_enabled": ENABLE_HOOKS.load(Ordering::Relaxed),
        "windows_key_enabled": ENABLE_WINDOWS_KEY_HOOK.load(Ordering::Relaxed),
        "mouse_buttons_enabled": ENABLE_MOUSE_BUTTON_HOOKS.load(Ordering::Relaxed),
        "hooks_installed": HOOK_MANAGER.get().is_some()
    });
    
    Ok(hook_status)
}

/// Show a system tray notification for errors or important status updates
#[tauri::command]
pub async fn show_tray_notification(
    app_handle: tauri::AppHandle,
    title: String,
    message: String,
    notification_type: String, // "error", "warning", "info", "success"
) -> Result<String, String> {
    tracing_info!(
        operation = "show_tray_notification",
        notification_type = %notification_type,
        title = %title,
        "Showing tray notification"
    );

    #[cfg(windows)]
    {
        // Update tray tooltip with notification context
        if let Some(tray) = app_handle.tray_by_id("main") {
            let notification_tooltip = format!("{}: {}", title, message);
            
            // Temporarily update tooltip to show notification
            if let Err(e) = tray.set_tooltip(Some(&notification_tooltip)) {
                tracing_error!(
                    operation = "show_tray_notification",
                    error = %e,
                    "Failed to update tray tooltip for notification"
                );
                return Err(format!("Failed to update tray tooltip: {}", e));
            }
            
            // Reset tooltip after 5 seconds
            let app_handle_clone = app_handle.clone();
            tokio::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                update_tray_tooltip(&app_handle_clone);
            });
        }

        Ok(format!("Tray notification shown: {} - {}", title, message))
    }

    #[cfg(not(windows))]
    {
        tracing_warn!(
            operation = "show_tray_notification",
            platform = "non-windows",
            "Tray notifications not supported on this platform"
        );
        Err("Tray notifications only supported on Windows".to_string())
    }
}

#[cfg(windows)]
#[tauri::command]
async fn add_to_windows_startup() -> std::result::Result<String, String> {
    info!("Received add_to_windows_startup command");
    
    match add_to_startup() {
        Ok(_) => {
            info!("Successfully added application to Windows startup");
            Ok("Application added to Windows startup successfully".to_string())
        }
        Err(StartupError::AccessDenied) => {
            warn!("Access denied when adding to startup");
            Err("Access denied. Administrator privileges may be required to modify startup settings.".to_string())
        }
        Err(StartupError::ExecutablePath) => {
            error!("Could not determine executable path for startup");
            Err("Failed to determine application path for startup registration.".to_string())
        }
        Err(e) => {
            error!("Failed to add to startup: {}", e);
            Err(format!("Failed to add to Windows startup: {}", e))
        }
    }
}

#[cfg(windows)]
#[tauri::command]
async fn remove_from_windows_startup() -> std::result::Result<String, String> {
    info!("Received remove_from_windows_startup command");
    
    match remove_from_startup() {
        Ok(_) => {
            info!("Successfully removed application from Windows startup");
            Ok("Application removed from Windows startup successfully".to_string())
        }
        Err(StartupError::AccessDenied) => {
            warn!("Access denied when removing from startup");
            Err("Access denied. Administrator privileges may be required to modify startup settings.".to_string())
        }
        Err(StartupError::KeyNotFound) => {
            info!("Registry key not found when removing from startup");
            Ok("Application was not found in startup entries (already removed)".to_string())
        }
        Err(e) => {
            error!("Failed to remove from startup: {}", e);
            Err(format!("Failed to remove from Windows startup: {}", e))
        }
    }
}

#[cfg(windows)]
#[tauri::command]
async fn check_startup_status() -> std::result::Result<serde_json::Value, String> {
    debug!("Received check_startup_status command");
    
    match is_in_startup() {
        Ok(is_enabled) => {
            let status = serde_json::json!({
                "enabled": is_enabled,
                "status": if is_enabled { "Application is registered for Windows startup" } else { "Application is not registered for Windows startup" }
            });
            Ok(status)
        }
        Err(StartupError::AccessDenied) => {
            warn!("Access denied when checking startup status");
            Err("Access denied when checking startup status. Administrator privileges may be required.".to_string())
        }
        Err(StartupError::KeyNotFound) => {
            debug!("Registry key not found when checking startup status");
            let status = serde_json::json!({
                "enabled": false,
                "status": "Startup registry key not found (startup not available)"
            });
            Ok(status)
        }
        Err(e) => {
            error!("Failed to check startup status: {}", e);
            Err(format!("Failed to check startup status: {}", e))
        }
    }
}

/// Restart the application
#[tauri::command]
async fn restart_app(app_handle: tauri::AppHandle) -> std::result::Result<String, String> {
    tracing::info!("Received restart_app command");
    
    // Clean up hooks before restarting
    if let Some(manager) = HOOK_MANAGER.get() {
        unsafe {
            if let Err(e) = manager.uninstall_hooks() {
                tracing::warn!("Failed to clean up hooks before restart: {}", e);
            } else {
                tracing::info!("Hooks cleaned up successfully before restart");
            }
        }
    }
    
    // Restart the application
    match app_handle.restart() {
        Ok(_) => Ok("Application restarting...".to_string()),
        Err(e) => Err(format!("Failed to restart application: {}", e))
    }
}

#[cfg(windows)]
fn get_dynamic_tooltip() -> String {
    let overall_enabled = ENABLE_HOOKS.load(Ordering::Relaxed);
    let windows_key_enabled = ENABLE_WINDOWS_KEY_HOOK.load(Ordering::Relaxed);
    let mouse_buttons_enabled = ENABLE_MOUSE_BUTTON_HOOKS.load(Ordering::Relaxed);
    let hooks_installed = HOOK_MANAGER.get().is_some();
    
    if !hooks_installed {
        return "Windows Event Inhibitor - No hooks installed".to_string();
    }
    
    if !overall_enabled {
        return "Windows Event Inhibitor - All hooks disabled (Alt+ScrollLock to enable)".to_string();
    }
    
    let mut status_parts = Vec::new();
    if windows_key_enabled {
        status_parts.push("Win Key: ON");
    } else {
        status_parts.push("Win Key: OFF");
    }
    
    if mouse_buttons_enabled {
        status_parts.push("Mouse Btns: ON");
    } else {
        status_parts.push("Mouse Btns: OFF");
    }
    
    format!("Windows Event Inhibitor - {}", status_parts.join(", "))
}

#[cfg(windows)]
fn update_tray_tooltip(app_handle: &tauri::AppHandle) {
    if let Some(tray) = app_handle.tray_by_id("main") {
        let new_tooltip = get_dynamic_tooltip();
        if let Err(e) = tray.set_tooltip(Some(&new_tooltip)) {
            error!("Failed to update tray tooltip: {}", e);
        } else {
            debug!("Updated tray tooltip: {}", new_tooltip);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize structured logging
    if let Err(e) = init_dev_logging() {
        eprintln!("Failed to initialize logging: {}", e);
        // Continue without structured logging - fallback to println!
    } else {
        log_startup_info();
    }

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize system tray
            #[cfg(windows)]
            {
                use tauri::tray::TrayIconBuilder;
                use tauri::{
                    menu::{MenuBuilder, MenuItemBuilder},
                    tray::{MouseButton, MouseButtonState, TrayIconEvent},
                    Manager,
                };

                // Create tray menu items
                let show_hide = MenuItemBuilder::with_id("show_hide", "Show/Hide").build(app)?;
                let separator1 = tauri::menu::PredefinedMenuItem::separator(app)?;
                let toggle_windows_key = MenuItemBuilder::with_id("toggle_windows_key", "Toggle Windows Key Hook").build(app)?;
                let toggle_mouse_buttons = MenuItemBuilder::with_id("toggle_mouse_buttons", "Toggle Mouse Button Hooks").build(app)?;
                let separator2 = tauri::menu::PredefinedMenuItem::separator(app)?;
                let exit = MenuItemBuilder::with_id("exit", "Exit").build(app)?;

                // Build the menu
                let menu = MenuBuilder::new(app)
                    .items(&[
                        &show_hide,
                        &separator1,
                        &toggle_windows_key,
                        &toggle_mouse_buttons,
                        &separator2,
                        &exit,
                    ])
                    .build()?;

                // Create tray icon with dynamic tooltip
                let initial_tooltip = get_dynamic_tooltip();
                let _tray = TrayIconBuilder::with_id("main")
                    .tooltip(&initial_tooltip)
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(move |app, event| match event.id().as_ref() {
                        "show_hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                match window.is_visible() {
                                    Ok(true) => {
                                        let _ = window.hide();
                                    }
                                    Ok(false) => {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                    Err(e) => {
                                        eprintln!("Error checking window visibility: {}", e);
                                    }
                                }
                            }
                        }
                        "toggle_windows_key" => {
                            let app_handle = app.clone();
                            tokio::spawn(async move {
                                match toggle_windows_key_hook().await {
                                    Ok(message) => {
                                        info!("Windows Key hook toggled: {}", message);
                                        update_tray_tooltip(&app_handle);
                                    }
                                    Err(e) => {
                                        error!("Failed to toggle Windows Key hook: {}", e);
                                    }
                                }
                            });
                        }
                        "toggle_mouse_buttons" => {
                            let app_handle = app.clone();
                            tokio::spawn(async move {
                                match toggle_mouse_button_hooks().await {
                                    Ok(message) => {
                                        info!("Mouse Button hooks toggled: {}", message);
                                        update_tray_tooltip(&app_handle);
                                    }
                                    Err(e) => {
                                        error!("Failed to toggle Mouse Button hooks: {}", e);
                                    }
                                }
                            });
                        }
                        "exit" => {
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;

                info!("System tray initialized successfully");
            }

            Ok(())
        });
        
    #[cfg(windows)]
    {
        builder = builder
            .invoke_handler(tauri::generate_handler![
                greet, 
                install_hooks, 
                uninstall_hooks, 
                toggle_windows_key_hook, 
                toggle_mouse_button_hooks, 
                get_hook_status,
                add_to_windows_startup,
                remove_from_windows_startup,
                check_startup_status,
                show_tray_notification,
                restart_app
            ])
            .on_window_event(|window, event| {
                use tauri::WindowEvent;
                match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        info!("Window close requested, hiding window instead of closing");
                        // Prevent the default close behavior
                        api.prevent_close();
                        // Hide the window instead of closing it
                        let _ = window.hide();
                    }
                    WindowEvent::Destroyed => {
                        info!("Window destroyed, cleaning up hooks...");
                        if let Some(manager) = HOOK_MANAGER.get() {
                            unsafe {
                                if let Err(e) = manager.uninstall_hooks() {
                                    error!("Failed to clean up hooks on window destroy: {}", e);
                                } else {
                                    info!("Hooks cleaned up successfully on window destroy");
                                }
                            }
                        }
                    }
                    _ => {}
                }
            });
    }
    
    #[cfg(not(windows))]
    {
        builder = builder.invoke_handler(tauri::generate_handler![greet]);
    }
    
    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
