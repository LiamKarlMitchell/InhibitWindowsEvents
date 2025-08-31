import { createEffect, createSignal, onCleanup } from 'solid-js';
import { configStore } from './config';
import { AppConfig } from './types';

/**
 * SolidJS hook for reactive access to application configuration
 * Automatically updates when configuration changes
 */
export function useConfig() {
  // Create a signal for the current configuration and loading state
  const [config, setConfig] = createSignal<AppConfig | undefined>(undefined);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | undefined>(undefined);

  // Initialize the config store asynchronously
  createEffect(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      // Wait for config store to initialize
      await configStore.init();
      
      // Set initial config value
      const initialConfig = configStore.getConfig();
      if (initialConfig) {
        const { id, ...configData } = initialConfig;
        setConfig(configData as AppConfig);
      }

      // Set up reactive observation of config changes
      const cursor = configStore.getConfigCursor();
      
      // Set up observer for reactive updates
      const observer = cursor.observe((docs: any) => {
        const configDoc = docs.find((doc: any) => doc.id === 'config');
        if (configDoc) {
          const { id, ...configData } = configDoc;
          setConfig(configData as AppConfig);
        }
      });

      // Cleanup observer when effect is disposed
      onCleanup(() => {
        observer.stop();
      });

      setIsLoading(false);
    } catch (err) {
      console.error('[useConfig] Failed to initialize config store:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  });

  return {
    config,
    isLoading,
    error,
    updateConfig: (updates: Partial<AppConfig>) => {
      try {
        configStore.updateConfig(updates);
        setError(undefined);
      } catch (err) {
        console.error('[useConfig] Failed to update config:', err);
        setError(err instanceof Error ? err.message : 'Update failed');
      }
    },
    resetConfig: () => {
      try {
        configStore.resetConfig();
        setError(undefined);
      } catch (err) {
        console.error('[useConfig] Failed to reset config:', err);
        setError(err instanceof Error ? err.message : 'Reset failed');
      }
    },
    // Metadata and migration methods
    isFirstRun: () => configStore.isFirstRun(),
    getInstallationDate: () => configStore.getInstallationDate(),
    getConfigVersion: () => configStore.getConfigVersion(),
    needsMigration: () => configStore.needsMigration(),
    getMigrationInfo: () => configStore.getMigrationInfo(),
    forceMigration: () => configStore.forceMigration(),
  };
}

/**
 * Hook for individual configuration values with type safety
 */
export function useConfigValue<K extends keyof AppConfig>(key: K) {
  const { config, updateConfig, isLoading, error } = useConfig();
  
  const value = () => config()?.[key];
  const setValue = (newValue: AppConfig[K]) => {
    updateConfig({ [key]: newValue } as Partial<AppConfig>);
  };

  return [value, setValue, { isLoading, error }] as const;
}

/**
 * Specialized hooks for common configuration values
 */
export function useWindowsKeyEnabled() {
  return useConfigValue('enableWindowsKey');
}

export function useMouseButtonsEnabled() {
  const { config, updateConfig, isLoading, error } = useConfig();
  
  const mouseButton3 = () => config()?.enableMouseButton3;
  const mouseButton4 = () => config()?.enableMouseButton4;
  const mouseButton5 = () => config()?.enableMouseButton5;
  
  const setMouseButton3 = (enabled: boolean) => 
    updateConfig({ enableMouseButton3: enabled });
  
  const setMouseButton4 = (enabled: boolean) => 
    updateConfig({ enableMouseButton4: enabled });
  
  const setMouseButton5 = (enabled: boolean) => 
    updateConfig({ enableMouseButton5: enabled });

  return {
    mouseButton3: [mouseButton3, setMouseButton3] as const,
    mouseButton4: [mouseButton4, setMouseButton4] as const,
    mouseButton5: [mouseButton5, setMouseButton5] as const,
    isLoading,
    error,
  };
}

export function useAppSettings() {
  const { config, updateConfig, isLoading, error } = useConfig();
  
  const startMinimized = () => config()?.startMinimized;
  const startWithWindows = () => config()?.startWithWindows;
  
  const setStartMinimized = (enabled: boolean) => 
    updateConfig({ startMinimized: enabled });
  
  const setStartWithWindows = (enabled: boolean) => 
    updateConfig({ startWithWindows: enabled });

  return {
    startMinimized: [startMinimized, setStartMinimized] as const,
    startWithWindows: [startWithWindows, setStartWithWindows] as const,
    isLoading,
    error,
  };
}