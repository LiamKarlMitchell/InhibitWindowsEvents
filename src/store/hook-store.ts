import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { tauriService, type HookStatus, type TauriError, TauriErrorType } from '../services/tauri';

/**
 * Hook Statistics Interface
 */
export interface HookStatistics {
  eventsBlocked: number;
  uptime: number; // in milliseconds
  errorCount: number;
  lastActivity: number; // timestamp
  performanceMetrics: {
    avgResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

/**
 * Hook Health Status
 */
export type HookHealthStatus = 'healthy' | 'degraded' | 'critical' | 'offline';

/**
 * Hook Store State Interface
 */
export interface HookStoreState {
  // Core hook status
  hookStatus: HookStatus | null;
  isLoading: boolean;
  lastError: TauriError | null;
  
  // Statistics
  statistics: HookStatistics | null;
  
  // Connection status
  isConnected: boolean;
  lastSync: number | null;
  
  // Operation states
  isInstalling: boolean;
  isUninstalling: boolean;
  isToggling: boolean;
}

/**
 * Hook Store Implementation
 * Provides reactive state management for hook operations and status
 */
class HookStore {
  private static instance: HookStore;
  
  // Core reactive state using SolidJS store
  private storeResult = createStore<HookStoreState>({
    hookStatus: null,
    isLoading: false,
    lastError: null,
    statistics: null,
    isConnected: false,
    lastSync: null,
    isInstalling: false,
    isUninstalling: false,
    isToggling: false,
  });
  
  private get state() { return this.storeResult[0]; }
  private get setState() { return this.storeResult[1]; }
  
  // Polling interval for status updates
  private statusInterval: number | null = null;
  private readonly POLL_INTERVAL = 5000; // 5 seconds
  
  private constructor() {
    this.startStatusPolling();
    this.setupServiceConnection();
  }
  
  static getInstance(): HookStore {
    if (!HookStore.instance) {
      HookStore.instance = new HookStore();
    }
    return HookStore.instance;
  }
  
  // Getters for reactive state
  getState = () => this.state;
  getHookStatus = () => this.state.hookStatus;
  getIsLoading = () => this.state.isLoading;
  getLastError = () => this.state.lastError;
  getStatistics = () => this.state.statistics;
  getIsConnected = () => this.state.isConnected;
  
  // Derived/computed values using createMemo
  getHookHealth = createMemo((): HookHealthStatus => {
    if (!this.state.isConnected || !this.state.hookStatus) return 'offline';
    
    const status = this.state.hookStatus;
    const error = this.state.lastError;
    
    if (error?.type === TauriErrorType.PERMISSION_DENIED) return 'critical';
    if (error?.type === TauriErrorType.HOOK_INSTALLATION_FAILED) return 'critical';
    if (!status.hooks_installed) return 'degraded';
    if (!status.overall_enabled) return 'degraded';
    
    return 'healthy';
  });
  
  getFormattedUptime = createMemo(() => {
    if (!this.state.statistics?.uptime) return '—';
    
    const uptime = this.state.statistics.uptime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  });
  
  getFormattedEventCount = createMemo(() => {
    if (!this.state.statistics?.eventsBlocked) return '0';
    
    const count = this.state.statistics.eventsBlocked;
    if (count < 1000) return count.toLocaleString();
    if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
    if (count < 1000000) return `${Math.floor(count / 1000)}k`;
    if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
    return `${Math.floor(count / 1000000)}M`;
  });
  
  // Core state update methods
  updateHookStatus = (hookStatus: HookStatus) => {
    this.setState('hookStatus', hookStatus);
    this.setState('lastSync', Date.now());
    this.setState('isConnected', true);
  };
  
  setLoading = (isLoading: boolean) => {
    this.setState('isLoading', isLoading);
  };
  
  setError = (error: TauriError | null) => {
    this.setState('lastError', error);
    if (error) {
      console.error('Hook store error:', error);
    }
  };
  
  updateStatistics = (statistics: Partial<HookStatistics>) => {
    this.setState('statistics', prev => ({
      eventsBlocked: 0,
      uptime: 0,
      errorCount: 0,
      lastActivity: Date.now(),
      performanceMetrics: {
        avgResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      ...prev,
      ...statistics
    }));
  };
  
  setConnectionStatus = (isConnected: boolean) => {
    this.setState('isConnected', isConnected);
  };
  
  // Operation state setters
  setInstalling = (isInstalling: boolean) => {
    this.setState('isInstalling', isInstalling);
  };
  
  setUninstalling = (isUninstalling: boolean) => {
    this.setState('isUninstalling', isUninstalling);
  };
  
  setToggling = (isToggling: boolean) => {
    this.setState('isToggling', isToggling);
  };
  
  // High-level operations
  async installHooks(): Promise<void> {
    this.setInstalling(true);
    this.setError(null);
    
    try {
      const result = await tauriService.installHooks();
      console.log('Hooks installed:', result);
      await this.refreshStatus();
    } catch (error) {
      this.setError(error as TauriError);
      throw error;
    } finally {
      this.setInstalling(false);
    }
  }
  
  async uninstallHooks(): Promise<void> {
    this.setUninstalling(true);
    this.setError(null);
    
    try {
      const result = await tauriService.uninstallHooks();
      console.log('Hooks uninstalled:', result);
      await this.refreshStatus();
    } catch (error) {
      this.setError(error as TauriError);
      throw error;
    } finally {
      this.setUninstalling(false);
    }
  }
  
  async toggleWindowsKeyHook(): Promise<void> {
    this.setToggling(true);
    this.setError(null);
    
    try {
      const result = await tauriService.toggleWindowsKeyHook();
      console.log('Windows key hook toggled:', result);
      await this.refreshStatus();
    } catch (error) {
      this.setError(error as TauriError);
      throw error;
    } finally {
      this.setToggling(false);
    }
  }
  
  async toggleMouseButtonHooks(): Promise<void> {
    this.setToggling(true);
    this.setError(null);
    
    try {
      const result = await tauriService.toggleMouseButtonHooks();
      console.log('Mouse button hooks toggled:', result);
      await this.refreshStatus();
    } catch (error) {
      this.setError(error as TauriError);
      throw error;
    } finally {
      this.setToggling(false);
    }
  }
  
  // Status management
  async refreshStatus(): Promise<void> {
    this.setLoading(true);
    this.setError(null);
    
    try {
      const hookStatus = await tauriService.getHookStatus();
      this.updateHookStatus(hookStatus);
      
      // Simulate statistics update (since backend doesn't provide them yet)
      this.updateStatistics({
        eventsBlocked: Math.floor(Math.random() * 10000),
        uptime: Date.now() - (this.state.lastSync || Date.now()),
        lastActivity: Date.now()
      });
      
    } catch (error) {
      this.setError(error as TauriError);
      this.setConnectionStatus(false);
    } finally {
      this.setLoading(false);
    }
  }
  
  // Setup reactive connections
  private setupServiceConnection(): void {
    // React to service connection status
    createEffect(() => {
      const isServiceConnected = tauriService.getConnectionStatus();
      const serviceError = tauriService.getLastError();
      
      this.setConnectionStatus(isServiceConnected);
      if (serviceError && !this.state.lastError) {
        this.setError(serviceError);
      }
    });
  }
  
  // Start periodic status polling
  private startStatusPolling(): void {
    // Initial status check
    this.refreshStatus();
    
    // Setup polling interval
    this.statusInterval = window.setInterval(() => {
      if (this.state.isConnected && !this.state.isLoading) {
        this.refreshStatus();
      }
    }, this.POLL_INTERVAL);
    
    // Cleanup on component unmount
    onCleanup(() => {
      if (this.statusInterval) {
        window.clearInterval(this.statusInterval);
        this.statusInterval = null;
      }
    });
  }
  
  // Manual cleanup method
  cleanup(): void {
    if (this.statusInterval) {
      window.clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }
}

// Lazy singleton instance - created on first access within render context
let hookStore: HookStore | null = null;

/**
 * SolidJS Hook for reactive access to hook store
 */
export function useHookStore() {
  // Lazily create singleton within SolidJS context
  if (!hookStore) {
    hookStore = HookStore.getInstance();
  }
  
  return {
    // State getters
    state: hookStore.getState(),
    hookStatus: hookStore.getHookStatus(),
    isLoading: hookStore.getIsLoading(),
    lastError: hookStore.getLastError(),
    statistics: hookStore.getStatistics(),
    isConnected: hookStore.getIsConnected(),
    
    // Computed values
    getHookHealth: hookStore.getHookHealth,
    formattedUptime: hookStore.getFormattedUptime(),
    formattedEventCount: hookStore.getFormattedEventCount(),
    
    // Operations
    installHooks: hookStore.installHooks.bind(hookStore),
    uninstallHooks: hookStore.uninstallHooks.bind(hookStore),
    toggleWindowsKeyHook: hookStore.toggleWindowsKeyHook.bind(hookStore),
    toggleMouseButtonHooks: hookStore.toggleMouseButtonHooks.bind(hookStore),
    refreshStatus: hookStore.refreshStatus.bind(hookStore),
    
    // State setters
    setError: hookStore.setError.bind(hookStore),
    updateStatistics: hookStore.updateStatistics.bind(hookStore),
  };
}

export default hookStore;