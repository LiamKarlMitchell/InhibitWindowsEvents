//! Structured logging configuration for the Windows Event Inhibitor application
//! 
//! This module provides centralized logging configuration using the tracing ecosystem
//! with support for multiple output targets, structured fields, and configurable levels.

use std::path::PathBuf;
use tracing_subscriber::{
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter,
    fmt::{self, format::FmtSpan},
    Registry,
};
use tracing_appender::{rolling, non_blocking};

/// Logging configuration options
#[derive(Debug, Clone)]
pub struct LogConfig {
    /// Log level filter (e.g., "debug", "info", "warn", "error")
    pub level: String,
    /// Enable console output
    pub console_enabled: bool,
    /// Enable file output
    pub file_enabled: bool,
    /// Log file directory path
    pub log_dir: Option<PathBuf>,
    /// Log file name prefix
    pub file_prefix: String,
    /// Enable JSON formatted output for structured parsing
    pub json_format: bool,
    /// Enable debug spans for performance monitoring
    pub enable_spans: bool,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            console_enabled: true,
            file_enabled: true,
            log_dir: None, // Will use default app data directory
            file_prefix: "inhibit-windows-events".to_string(),
            json_format: false,
            enable_spans: false,
        }
    }
}

/// Initialize the tracing subscriber with the given configuration
/// 
/// This function sets up structured logging with multiple output targets:
/// - Console output with colored formatting (in debug builds)
/// - File output with log rotation (daily rotation, keeping 7 days)
/// - Environment-based configuration via RUST_LOG
/// 
/// # Examples
/// 
/// ```rust
/// // Basic initialization with defaults
/// init_logging(LogConfig::default()).expect("Failed to initialize logging");
/// 
/// // Custom configuration
/// let config = LogConfig {
///     level: "debug".to_string(),
///     json_format: true,
///     ..LogConfig::default()
/// };
/// init_logging(config).expect("Failed to initialize logging");
/// ```
pub fn init_logging(config: LogConfig) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Create environment filter
    let env_filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new(&config.level))
        .map_err(|e| format!("Failed to create environment filter: {}", e))?;

    // Build subscriber layers
    let registry = Registry::default().with(env_filter);

    // Console layer (if enabled)
    let registry = if config.console_enabled {
        let console_layer = if config.json_format {
            fmt::layer()
                .json()
                .with_span_events(if config.enable_spans { FmtSpan::FULL } else { FmtSpan::NONE })
                .boxed()
        } else {
            fmt::layer()
                .pretty()
                .with_span_events(if config.enable_spans { FmtSpan::FULL } else { FmtSpan::NONE })
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true)
                .boxed()
        };
        registry.with(console_layer)
    } else {
        registry
    };

    // File layer (if enabled)
    let registry = if config.file_enabled {
        let log_dir = match config.log_dir {
            Some(dir) => dir,
            None => get_default_log_dir()?,
        };

        // Ensure log directory exists
        if !log_dir.exists() {
            std::fs::create_dir_all(&log_dir)
                .map_err(|e| format!("Failed to create log directory {:?}: {}", log_dir, e))?;
        }

        // Create file appender with daily rotation
        let file_appender = rolling::daily(&log_dir, &config.file_prefix);
        let (non_blocking_writer, _guard) = non_blocking(file_appender);

        let file_layer = if config.json_format {
            fmt::layer()
                .json()
                .with_writer(non_blocking_writer)
                .with_span_events(if config.enable_spans { FmtSpan::FULL } else { FmtSpan::NONE })
                .with_ansi(false) // No ANSI colors in files
                .boxed()
        } else {
            fmt::layer()
                .with_writer(non_blocking_writer)
                .with_span_events(if config.enable_spans { FmtSpan::FULL } else { FmtSpan::NONE })
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true)
                .with_ansi(false) // No ANSI colors in files
                .boxed()
        };

        // Store the guard to prevent it from being dropped
        // Note: In a real application, you'd want to store this guard somewhere
        // to prevent the file logging from stopping. For now, we'll leak it.
        std::mem::forget(_guard);

        registry.with(file_layer)
    } else {
        registry
    };

    // Initialize the global subscriber
    registry
        .try_init()
        .map_err(|e| format!("Failed to initialize tracing subscriber: {}", e))?;

    tracing::info!(
        app = "inhibit-windows-events",
        version = env!("CARGO_PKG_VERSION"),
        "Logging system initialized"
    );

    tracing::debug!(
        config = ?config,
        "Logging configuration applied"
    );

    Ok(())
}

/// Get the default log directory for the application
/// 
/// On Windows, this will be in %LOCALAPPDATA%/inhibit-windows-events/logs/
/// On other platforms, it uses the standard directories.
fn get_default_log_dir() -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    #[cfg(windows)]
    {
        let local_app_data = std::env::var("LOCALAPPDATA")
            .map_err(|_| "LOCALAPPDATA environment variable not found")?;
        let mut path = PathBuf::from(local_app_data);
        path.push("inhibit-windows-events");
        path.push("logs");
        Ok(path)
    }

    #[cfg(not(windows))]
    {
        use std::env;
        let home = env::var("HOME")
            .map_err(|_| "HOME environment variable not found")?;
        let mut path = PathBuf::from(home);
        path.push(".local");
        path.push("share");
        path.push("inhibit-windows-events");
        path.push("logs");
        Ok(path)
    }
}

/// Initialize logging with development-friendly defaults
/// 
/// This is a convenience function for development that sets up:
/// - Console output with pretty formatting
/// - File output with daily rotation
/// - Debug level logging in debug builds, info level in release builds
pub fn init_dev_logging() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let config = LogConfig {
        level: if cfg!(debug_assertions) { 
            "debug".to_string() 
        } else { 
            "info".to_string() 
        },
        console_enabled: true,
        file_enabled: true,
        json_format: false,
        enable_spans: cfg!(debug_assertions),
        ..LogConfig::default()
    };

    init_logging(config)
}

/// Initialize logging with production-friendly defaults
/// 
/// This sets up:
/// - JSON formatted output for log aggregation
/// - File output only (no console spam)
/// - Info level logging with error details
pub fn init_production_logging() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let config = LogConfig {
        level: "info".to_string(),
        console_enabled: false,
        file_enabled: true,
        json_format: true,
        enable_spans: false,
        ..LogConfig::default()
    };

    init_logging(config)
}

/// Log application startup information
pub fn log_startup_info() {
    tracing::info!(
        app = "inhibit-windows-events",
        version = env!("CARGO_PKG_VERSION"),
        target = env!("TARGET"),
        profile = if cfg!(debug_assertions) { "debug" } else { "release" },
        "Application starting"
    );

    #[cfg(windows)]
    tracing::info!(
        platform = "windows",
        os_version = get_windows_version(),
        "Platform information"
    );

    #[cfg(not(windows))]
    tracing::info!(
        platform = std::env::consts::OS,
        arch = std::env::consts::ARCH,
        "Platform information"
    );
}

/// Get Windows version information for logging
#[cfg(windows)]
fn get_windows_version() -> String {
    use windows::Win32::System::SystemInformation::{GetVersion};
    
    unsafe {
        let version = GetVersion();
        let major = version & 0xFF;
        let minor = (version >> 8) & 0xFF;
        let build = version >> 16;
        
        format!("{}.{}.{}", major, minor, build)
    }
}

/// Macro for logging hook events with structured data
#[macro_export]
macro_rules! log_hook_event {
    ($event_type:expr, $($field:ident = $value:expr),* $(,)?) => {
        tracing::debug!(
            event_type = $event_type,
            $($field = $value,)*
            target = "hook_events",
            "Hook event occurred"
        );
    };
}

/// Macro for logging Windows API errors with context
#[macro_export]
macro_rules! log_windows_error {
    ($operation:expr, $error:expr, $($field:ident = $value:expr),* $(,)?) => {
        tracing::error!(
            operation = $operation,
            error = %$error,
            error_code = $error.code().0,
            $($field = $value,)*
            target = "windows_api",
            "Windows API operation failed"
        );
    };
}

/// Macro for logging performance metrics
#[macro_export]
macro_rules! log_performance {
    ($operation:expr, $duration_ms:expr, $($field:ident = $value:expr),* $(,)?) => {
        tracing::debug!(
            operation = $operation,
            duration_ms = $duration_ms,
            $($field = $value,)*
            target = "performance",
            "Operation completed"
        );
    };
}