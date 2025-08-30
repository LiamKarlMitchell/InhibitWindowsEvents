/**
 * Store module exports
 */
export { configStore, ConfigStore } from './config';
export type { AppConfig } from './types';
export { DEFAULT_CONFIG, CONFIG_SCHEMA } from './types';

// Hook management store
export { useHookStore } from './hook-store';
export type { HookStatistics, HookHealthStatus, HookStoreState } from './hook-store';

// SolidJS reactive hooks
export { 
  useConfig, 
  useConfigValue, 
  useWindowsKeyEnabled,
  useMouseButtonsEnabled,
  useAppSettings 
} from './hooks';