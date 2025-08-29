/**
 * Store module exports
 */
export { configStore, ConfigStore } from './config';
export type { AppConfig } from './types';
export { DEFAULT_CONFIG, CONFIG_SCHEMA } from './types';

// SolidJS reactive hooks
export { 
  useConfig, 
  useConfigValue, 
  useWindowsKeyEnabled,
  useMouseButtonsEnabled,
  useAppSettings 
} from './hooks';