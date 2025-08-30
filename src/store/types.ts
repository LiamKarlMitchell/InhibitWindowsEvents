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
  // Metadata for first-run detection and migrations
  configVersion: number;
  firstRun: boolean;
  installedAt?: string;
}

/**
 * Current configuration version for migration purposes
 */
export const CONFIG_VERSION = 1;

/**
 * Default configuration values
 * Mouse Button 4 is enabled by default as per PRD requirements
 */
export const DEFAULT_CONFIG: AppConfig = {
  enableWindowsKey: false,
  enableMouseButton3: false,
  enableMouseButton4: true,
  enableMouseButton5: false,
  startMinimized: false,
  startWithWindows: false,
  // Metadata
  configVersion: CONFIG_VERSION,
  firstRun: true,
  installedAt: new Date().toISOString(),
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
  configVersion: { type: 'number' as const, required: true },
  firstRun: { type: 'boolean' as const, required: true },
  installedAt: { type: 'string' as const, required: false },
};