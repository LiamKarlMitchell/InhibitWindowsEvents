/**
 * Configuration types for the Windows Events Inhibitor application
 */
export interface AppConfig {
  enableWindowsKey: boolean;
  enableMouseButton3: boolean;
  enableMouseButton4: boolean;
  enableMouseButton5: boolean;
  startMinimized: boolean;
  startWithWindows: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  enableWindowsKey: true,
  enableMouseButton3: true,
  enableMouseButton4: true,
  enableMouseButton5: false,
  startMinimized: false,
  startWithWindows: false,
};

/**
 * Configuration validation schema
 */
export const CONFIG_SCHEMA = {
  enableWindowsKey: { type: 'boolean' as const, required: true },
  enableMouseButton3: { type: 'boolean' as const, required: true },
  enableMouseButton4: { type: 'boolean' as const, required: true },
  enableMouseButton5: { type: 'boolean' as const, required: true },
  startMinimized: { type: 'boolean' as const, required: true },
  startWithWindows: { type: 'boolean' as const, required: true },
};