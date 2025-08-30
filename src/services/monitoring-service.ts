import { createSignal, createEffect, onCleanup } from 'solid-js';
import { tauriService, type HookStatus, type TauriError } from './tauri';
import type { HookStatistics } from '../store/hook-store';

/**
 * Configuration for monitoring behavior
 */
export interface MonitoringConfig {
  pollInterval: number;
  fastPollInterval: number;
  maxRetries: number;
  backoffMultiplier: number;
  enableAdaptivePolling: boolean;
  pauseOnMinimize: boolean;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  pollInterval: 2000,       // 2 seconds default
  fastPollInterval: 500,    // 500ms when activity detected
  maxRetries: 3,
  backoffMultiplier: 1.5,
  enableAdaptivePolling: true,
  pauseOnMinimize: true,
};

/**
 * Monitoring Service Events
 */
export type MonitoringEvent = 
  | 'status_updated'
  | 'connection_lost'
  | 'connection_restored'
  | 'error_occurred'
  | 'activity_detected';

export type MonitoringEventCallback = (event: MonitoringEvent, data?: any) => void;

/**
 * Real-time monitoring service for hook status and statistics
 * Provides adaptive polling, error handling, and event notifications
 */
export class MonitoringService {
  private static instance: MonitoringService;
  
  private config: MonitoringConfig;
  private pollTimer: number | null = null;
  private retryCount = 0;
  private lastStatus: HookStatus | null = null;
  private isActive = true;
  private isPaused = false;
  
  // Event listeners
  private eventListeners = new Map<MonitoringEvent, Set<MonitoringEventCallback>>();
  
  // Statistics tracking
  private startTime = Date.now();
  private eventCounts = {
    statusUpdates: 0,
    errors: 0,
    connectionIssues: 0
  };
  
  // Reactive signals for monitoring state
  private monitoringSignal = createSignal(false);
  private activitySignal = createSignal<number>(Date.now());
  private pollIntervalSignal = createSignal(DEFAULT_CONFIG.pollInterval);
  
  private get isMonitoring() { return this.monitoringSignal[0]; }
  private get setIsMonitoring() { return this.monitoringSignal[1]; }
  private get lastActivity() { return this.activitySignal[0]; }
  private get setLastActivity() { return this.activitySignal[1]; }
  private get currentPollInterval() { return this.pollIntervalSignal[0]; }
  private get setCurrentPollInterval() { return this.pollIntervalSignal[1]; }
  
  private constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupEventListeners();
  }
  
  static getInstance(config?: Partial<MonitoringConfig>): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }
  
  // Public getters
  getIsMonitoring = () => this.isMonitoring();
  getLastActivity = () => this.lastActivity();
  getCurrentPollInterval = () => this.currentPollInterval();
  
  /**
   * Start real-time monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring()) return;
    
    console.log('Starting real-time hook monitoring service');
    this.setIsMonitoring(true);
    this.isActive = true;
    this.retryCount = 0;
    this.startPolling();
    this.emit('status_updated', { monitoring: true });
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring()) return;
    
    console.log('Stopping real-time hook monitoring service');
    this.setIsMonitoring(false);
    this.isActive = false;
    this.stopPolling();
    this.emit('status_updated', { monitoring: false });
  }
  
  /**
   * Pause monitoring (e.g., when app is minimized)
   */
  pauseMonitoring(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.stopPolling();
    console.log('Monitoring paused');
  }
  
  /**
   * Resume monitoring
   */
  resumeMonitoring(): void {
    if (!this.isPaused || !this.isActive) return;
    
    this.isPaused = false;
    this.startPolling();
    console.log('Monitoring resumed');
  }
  
  /**
   * Force immediate status check
   */
  async forceStatusCheck(): Promise<HookStatus | null> {
    try {
      const status = await this.pollHookStatus();
      return status;
    } catch (error) {
      console.error('Force status check failed:', error);
      return null;
    }
  }
  
  /**
   * Get current monitoring statistics
   */
  getMonitoringStatistics(): HookStatistics {
    const uptime = Date.now() - this.startTime;
    
    return {
      eventsBlocked: this.eventCounts.statusUpdates,
      uptime,
      errorCount: this.eventCounts.errors,
      lastActivity: this.lastActivity(),
      performanceMetrics: {
        avgResponseTime: this.calculateAverageResponseTime(),
        memoryUsage: this.estimateMemoryUsage(),
        cpuUsage: 0, // Not available in browser environment
      }
    };
  }
  
  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    const oldInterval = this.config.pollInterval;
    this.config = { ...this.config, ...newConfig };
    
    // Restart polling if interval changed
    if (oldInterval !== this.config.pollInterval && this.isMonitoring()) {
      this.stopPolling();
      this.startPolling();
    }
  }
  
  /**
   * Add event listener
   */
  addEventListener(event: MonitoringEvent, callback: MonitoringEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(event: MonitoringEvent, callback: MonitoringEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }
  
  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.eventListeners.clear();
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.removeAllEventListeners();
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  // Private implementation methods
  
  private setupEventListeners(): void {
    // Window focus/blur events
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    
    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Cleanup on component unmount
    onCleanup(() => this.cleanup());
  }
  
  private handleWindowBlur = (): void => {
    if (this.config.pauseOnMinimize) {
      this.pauseMonitoring();
    }
  };
  
  private handleWindowFocus = (): void => {
    if (this.config.pauseOnMinimize && this.isPaused) {
      this.resumeMonitoring();
    }
  };
  
  private handleVisibilityChange = (): void => {
    if (document.hidden && this.config.pauseOnMinimize) {
      this.pauseMonitoring();
    } else if (!document.hidden && this.isPaused) {
      this.resumeMonitoring();
    }
  };
  
  private startPolling(): void {
    if (this.pollTimer || !this.isActive || this.isPaused) return;
    
    // Initial poll
    this.pollHookStatus();
    
    // Setup recurring polling
    this.pollTimer = window.setInterval(() => {
      if (this.isActive && !this.isPaused) {
        this.pollHookStatus();
      }
    }, this.currentPollInterval());
  }
  
  private stopPolling(): void {
    if (this.pollTimer) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
  
  private async pollHookStatus(): Promise<HookStatus | null> {
    const startTime = performance.now();
    
    try {
      const status = await tauriService.getHookStatus();
      const responseTime = performance.now() - startTime;
      
      // Check for status changes
      const hasChanged = this.hasStatusChanged(status);
      
      if (hasChanged) {
        this.lastStatus = status;
        this.setLastActivity(Date.now());
        this.emit('status_updated', status);
        this.eventCounts.statusUpdates++;
        
        // Use faster polling if activity detected and adaptive polling is enabled
        if (this.config.enableAdaptivePolling) {
          this.setCurrentPollInterval(this.config.fastPollInterval);
          
          // Return to normal polling after 10 seconds of no activity
          setTimeout(() => {
            if (this.config.enableAdaptivePolling) {
              this.setCurrentPollInterval(this.config.pollInterval);
            }
          }, 10000);
        }
        
        this.emit('activity_detected', { status, responseTime });
      }
      
      // Reset retry count on successful poll
      this.retryCount = 0;
      
      // Restore connection if it was lost
      if (this.eventCounts.connectionIssues > 0) {
        this.emit('connection_restored', status);
        this.eventCounts.connectionIssues = 0;
      }
      
      return status;
      
    } catch (error) {
      const tauriError = error as TauriError;
      this.handlePollingError(tauriError);
      return null;
    }
  }
  
  private hasStatusChanged(newStatus: HookStatus): boolean {
    if (!this.lastStatus) return true;
    
    return (
      this.lastStatus.overall_enabled !== newStatus.overall_enabled ||
      this.lastStatus.windows_key_hook_enabled !== newStatus.windows_key_hook_enabled ||
      this.lastStatus.mouse_button_hooks_enabled !== newStatus.mouse_button_hooks_enabled ||
      this.lastStatus.hooks_installed !== newStatus.hooks_installed
    );
  }
  
  private handlePollingError(error: TauriError): void {
    this.eventCounts.errors++;
    this.retryCount++;
    
    console.warn(`Polling error (attempt ${this.retryCount}):`, error);
    this.emit('error_occurred', error);
    
    if (this.retryCount >= this.config.maxRetries) {
      this.eventCounts.connectionIssues++;
      this.emit('connection_lost', error);
      
      // Implement exponential backoff
      const backoffDelay = this.config.pollInterval * Math.pow(this.config.backoffMultiplier, this.retryCount - 1);
      this.setCurrentPollInterval(Math.min(backoffDelay, 30000)); // Max 30 seconds
      
      // Reset retry count after extended delay
      setTimeout(() => {
        this.retryCount = 0;
        this.setCurrentPollInterval(this.config.pollInterval);
      }, backoffDelay);
    }
  }
  
  private emit(event: MonitoringEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(event, data));
    }
  }
  
  private calculateAverageResponseTime(): number {
    // Simplified estimation - in a real implementation, you'd track actual response times
    return this.retryCount > 0 ? 150 : 50; // ms
  }
  
  private estimateMemoryUsage(): number {
    // Simplified estimation for browser environment
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
}

/**
 * Singleton instance and convenience functions
 */
export const monitoringService = MonitoringService.getInstance();

/**
 * SolidJS composable for monitoring service
 */
export function useMonitoring(config?: Partial<MonitoringConfig>) {
  const service = MonitoringService.getInstance(config);
  
  return {
    // State
    isMonitoring: service.getIsMonitoring,
    lastActivity: service.getLastActivity,
    currentPollInterval: service.getCurrentPollInterval,
    
    // Operations
    start: () => service.startMonitoring(),
    stop: () => service.stopMonitoring(),
    pause: () => service.pauseMonitoring(),
    resume: () => service.resumeMonitoring(),
    forceCheck: () => service.forceStatusCheck(),
    getStatistics: () => service.getMonitoringStatistics(),
    updateConfig: (newConfig: Partial<MonitoringConfig>) => service.updateConfig(newConfig),
    
    // Event management
    addEventListener: (event: MonitoringEvent, callback: MonitoringEventCallback) => 
      service.addEventListener(event, callback),
    removeEventListener: (event: MonitoringEvent, callback: MonitoringEventCallback) => 
      service.removeEventListener(event, callback),
  };
}