#[cfg(windows)]
use windows::{
    core::*,
    Win32::Foundation::*,
    Win32::UI::WindowsAndMessaging::*,
    Win32::System::Threading::*,
    Win32::UI::Input::KeyboardAndMouse::*,
};

#[cfg(windows)]
use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}};
#[cfg(windows)]
use tokio::sync::mpsc;
#[cfg(windows)]
use log::{info, warn, error, debug};
#[cfg(windows)]
use thiserror::Error;

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
static ENABLE_HOOKS: AtomicBool = AtomicBool::new(true);

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
    
    pub unsafe fn install_hooks(&self) -> Result<(), HookError> {
        // Check if hooks are already installed
        if self.mouse_hook.lock().unwrap().is_some() || self.keyboard_hook.lock().unwrap().is_some() {
            warn!("Attempted to install hooks when already installed");
            return Err(HookError::AlreadyInstalled);
        }
        
        info!("Installing Windows hooks...");
        
        // Enable hooks
        ENABLE_HOOKS.store(true, Ordering::Relaxed);
        
        // Get the current module instance
        let h_instance = GetModuleHandleW(None)
            .map_err(HookError::ModuleHandle)?;
        
        // Install mouse hook
        let mouse_hook = SetWindowsHookExW(
            WH_MOUSE_LL,
            Some(mouse_hook_proc),
            h_instance,
            0,
        ).map_err(|source| HookError::InstallHook { source })?;
        
        debug!("Mouse hook installed with handle: {:?}", mouse_hook);
        
        // Install keyboard hook
        let keyboard_hook = SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(keyboard_hook_proc),
            h_instance,
            0,
        ).map_err(|source| HookError::InstallHook { source })?;
        
        debug!("Keyboard hook installed with handle: {:?}", keyboard_hook);
        
        // Store hook handles
        *self.mouse_hook.lock().unwrap() = Some(mouse_hook);
        *self.keyboard_hook.lock().unwrap() = Some(keyboard_hook);
        
        // Start message pump in background thread
        self.start_message_pump().map_err(|e| {
            error!("Failed to start message pump: {}", e);
            HookError::MessagePump(e.to_string())
        })?;
        
        info!("Hooks installed successfully");
        Ok(())
    }
    
    fn start_message_pump(&self) -> Result<(), Box<dyn std::error::Error>> {
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
                    let result = GetMessage(&mut msg, None, 0, 0);
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
    
    pub unsafe fn uninstall_hooks(&self) -> Result<(), HookError> {
        info!("Uninstalling Windows hooks...");
        
        // Check if hooks are installed
        let has_mouse_hook = self.mouse_hook.lock().unwrap().is_some();
        let has_keyboard_hook = self.keyboard_hook.lock().unwrap().is_some();
        
        if !has_mouse_hook && !has_keyboard_hook {
            warn!("Attempted to uninstall hooks when none are installed");
            return Err(HookError::NotInstalled);
        }
        
        // Disable hooks first
        ENABLE_HOOKS.store(false, Ordering::Relaxed);
        debug!("Hooks disabled");
        
        // Signal message pump to shutdown
        if let Some(shutdown_tx) = self.shutdown_sender.lock().unwrap().take() {
            info!("Signaling message pump to shutdown");
            if let Err(e) = shutdown_tx.send(()) {
                warn!("Failed to send shutdown signal to message pump: {:?}", e);
            }
        }
        
        // Wait for message pump to finish (with timeout)
        if let Some(handle) = self.message_pump_handle.lock().unwrap().take() {
            debug!("Waiting for message pump thread to finish...");
            tokio::task::block_in_place(move || {
                futures::executor::block_on(async {
                    match tokio::time::timeout(
                        std::time::Duration::from_secs(2),
                        handle
                    ).await {
                        Ok(_) => debug!("Message pump thread finished gracefully"),
                        Err(_) => warn!("Message pump thread did not finish within timeout"),
                    }
                });
            });
        }
        
        // Uninstall mouse hook
        if let Some(hook) = self.mouse_hook.lock().unwrap().take() {
            debug!("Uninstalling mouse hook: {:?}", hook);
            UnhookWindowsHookEx(hook)
                .map_err(|source| HookError::UninstallHook { source })?;
        }
        
        // Uninstall keyboard hook
        if let Some(hook) = self.keyboard_hook.lock().unwrap().take() {
            debug!("Uninstalling keyboard hook: {:?}", hook);
            UnhookWindowsHookEx(hook)
                .map_err(|source| HookError::UninstallHook { source })?;
        }
        
        info!("Hooks uninstalled successfully");
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
            // Validate l_param is not null
            if l_param.0 != 0 {
                debug!("Suppressing extra mouse button: wParam={:X}", w_param.0);
                return LRESULT(1);
            } else {
                warn!("Received mouse hook with null lParam");
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
    if vk_code == VK_LWIN.0 as u32 && ENABLE_HOOKS.load(Ordering::Relaxed) {
        match w_param_u32 {
            WM_KEYDOWN | WM_SYSKEYDOWN => {
                debug!("Suppressing VK_LWIN key down, replacing with F24");
                keybd_event(VK_F24.0 as u8, 0, KEYBD_EVENT_FLAGS(0), 0);
            }
            WM_KEYUP | WM_SYSKEYUP => {
                debug!("Suppressing VK_LWIN key up, replacing with F24");
                keybd_event(VK_F24.0 as u8, 0, KEYEVENTF_KEYUP, 0);
            }
            _ => {
                debug!("Unhandled Windows key message: {:X}", w_param_u32);
            }
        }
        return LRESULT(1);
    }
    
    // Handle Alt+Scroll Lock toggle (like C++ version)
    if vk_code == VK_SCROLL.0 as u32 
        && (keyboard.flags & LLKHF_ALTDOWN.0) != 0 
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
async fn install_hooks() -> Result<String, String> {
    info!("Received install_hooks command");
    let manager = HOOK_MANAGER.get_or_init(|| HookManager::new());
    
    unsafe {
        match manager.install_hooks() {
            Ok(_) => {
                info!("Hooks installed successfully via Tauri command");
                Ok("Hooks installed successfully".to_string())
            }
            Err(HookError::AlreadyInstalled) => {
                warn!("Hooks already installed");
                Ok("Hooks are already installed".to_string())
            }
            Err(e) => {
                error!("Failed to install hooks: {}", e);
                Err(format!("Failed to install hooks: {}", e))
            }
        }
    }
}

#[cfg(windows)]
#[tauri::command]
async fn uninstall_hooks() -> Result<String, String> {
    info!("Received uninstall_hooks command");
    if let Some(manager) = HOOK_MANAGER.get() {
        unsafe {
            match manager.uninstall_hooks() {
                Ok(_) => {
                    info!("Hooks uninstalled successfully via Tauri command");
                    Ok("Hooks uninstalled successfully".to_string())
                }
                Err(HookError::NotInstalled) => {
                    warn!("No hooks to uninstall");
                    Ok("No hooks are currently installed".to_string())
                }
                Err(e) => {
                    error!("Failed to uninstall hooks: {}", e);
                    Err(format!("Failed to uninstall hooks: {}", e))
                }
            }
        }
    } else {
        warn!("Hook manager not initialized");
        Ok("Hook manager not initialized".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init());
        
    #[cfg(windows)]
    {
        builder = builder
            .invoke_handler(tauri::generate_handler![greet, install_hooks, uninstall_hooks])
            .on_window_event(|window, event| {
                use tauri::WindowEvent;
                match event {
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
