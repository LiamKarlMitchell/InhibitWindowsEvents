import { createEffect, createSignal, onCleanup } from 'solid-js';
import { configStore } from './config';
import { AppConfig } from './types';

/**
 * SolidJS hook for reactive access to application configuration
 * Automatically updates when configuration changes
 */
export function useConfig() {
  // Initialize the config store
  configStore.init().catch(console.error);

  // Create a signal for the current configuration
  const [config, setConfig] = createSignal<AppConfig | undefined>(
    configStore.getConfig()
  );

  // Set up reactive observation of config changes
  createEffect(() => {
    const cursor = configStore.getConfigCursor();
    
    // Set up observer for reactive updates
    const observer = cursor.observe((docs) => {
      const configDoc = docs.find(doc => doc.id === 'config');
      if (configDoc) {
        const { id, ...configData } = configDoc;
        setConfig(configData as AppConfig);
      }
    });

    // Cleanup observer when effect is disposed
    onCleanup(() => {
      observer.stop();
    });
  });

  return {
    config,
    updateConfig: (updates: Partial<AppConfig>) => {
      configStore.updateConfig(updates);
    },
    resetConfig: () => {
      configStore.resetConfig();
    }
  };
}

/**
 * Hook for individual configuration values with type safety
 */
export function useConfigValue<K extends keyof AppConfig>(key: K) {
  const { config, updateConfig } = useConfig();
  
  const value = () => config()?.[key];
  const setValue = (newValue: AppConfig[K]) => {
    updateConfig({ [key]: newValue } as Partial<AppConfig>);
  };

  return [value, setValue] as const;
}

/**
 * Specialized hooks for common configuration values
 */
export function useWindowsKeyEnabled() {
  return useConfigValue('enableWindowsKey');
}

export function useMouseButtonsEnabled() {
  const { config, updateConfig } = useConfig();
  
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
  };
}

export function useAppSettings() {
  const { config, updateConfig } = useConfig();
  
  const startMinimized = () => config()?.startMinimized;
  const startWithWindows = () => config()?.startWithWindows;
  
  const setStartMinimized = (enabled: boolean) => 
    updateConfig({ startMinimized: enabled });
  
  const setStartWithWindows = (enabled: boolean) => 
    updateConfig({ startWithWindows: enabled });

  return {
    startMinimized: [startMinimized, setStartMinimized] as const,
    startWithWindows: [startWithWindows, setStartWithWindows] as const,
  };
}