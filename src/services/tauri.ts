import { invoke } from '@tauri-apps/api/core';
import { createSignal } from 'solid-js';

// Check if we're running in Tauri environment
const isTauriEnvironment = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

/**
 * Tauri backend integration service
 * Provides a comprehensive abstraction layer for all Tauri backend communications
 * with proper typing, error handling, retry logic, and state management
 */

// Hook management commands
export async function installHooks(): Promise<string> {
  if (!isTauriEnvironment) {
    return Promise.resolve("Development mode: hooks not available");
  }
  return await invoke<string>('install_hooks');
}

export async function uninstallHooks(): Promise<string> {
  if (!isTauriEnvironment) {
    return Promise.resolve("Development mode: hooks not available");
  }
  return await invoke<string>('uninstall_hooks');
}

export async function toggleWindowsKeyHook(): Promise<string> {
  if (!isTauriEnvironment) {
    return Promise.resolve("Development mode: toggle not available");
  }
  return await invoke<string>('toggle_windows_key_hook');
}

export async function toggleMouseButtonHooks(): Promise<string> {
  if (!isTauriEnvironment) {
    return Promise.resolve("Development mode: toggle not available");
  }
  return await invoke<string>('toggle_mouse_button_hooks');
}

// Status monitoring
export interface HookStatus {
  overall_enabled: boolean;
  windows_key_hook_enabled: boolean;
  mouse_button_hooks_enabled: boolean;
  hooks_installed: boolean;
}

export async function getHookStatus(): Promise<HookStatus> {
  if (!isTauriEnvironment) {
    return Promise.resolve({
      overall_enabled: false,
      windows_key_hook_enabled: false,
      mouse_button_hooks_enabled: false,
      hooks_installed: false
    });
  }
  const result = await invoke<any>('get_hook_status');
  return result as HookStatus;
}

// Startup management
export async function addToWindowsStartup(): Promise<string> {
  if (!isTauriEnvironment) {
    return Promise.resolve("Development mode: startup management not available");
  }
  return await invoke<string>('add_to_windows_startup');
}

export async function removeFromWindowsStartup(): Promise<string> {
  if (!isTauriEnvironment) {
    return Promise.resolve("Development mode: startup management not available");
  }
  return await invoke<string>('remove_from_windows_startup');
}

export interface StartupStatus {
  enabled: boolean;
  path?: string;
  error?: string;
}

export async function checkStartupStatus(): Promise<StartupStatus> {
  if (!isTauriEnvironment) {
    return Promise.resolve({ is_in_startup: false });
  }
  const result = await invoke<any>('check_startup_status');
  return result as StartupStatus;
}

// Enhanced error handling with specific error types
export enum TauriErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  HOOK_INSTALLATION_FAILED = 'HOOK_INSTALLATION_FAILED',
  REGISTRY_ACCESS_FAILED = 'REGISTRY_ACCESS_FAILED',
  INVALID_COMMAND = 'INVALID_COMMAND',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export class TauriError extends Error {
  constructor(
    message: string,
    public command: string,
    public type: TauriErrorType = TauriErrorType.UNKNOWN,
    public originalError?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'TauriError';
  }
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableErrors: TauriErrorType[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableErrors: [TauriErrorType.TIMEOUT, TauriErrorType.NETWORK_ERROR]
};

// Enhanced error classification
function classifyError(error: any, command: string): TauriError {
  const errorString = String(error).toLowerCase();
  
  if (errorString.includes('permission') || errorString.includes('access denied')) {
    return new TauriError(
      `Permission denied accessing ${command}`,
      command,
      TauriErrorType.PERMISSION_DENIED,
      error,
      false
    );
  }
  
  if (errorString.includes('hook') && errorString.includes('failed')) {
    return new TauriError(
      `Hook installation/management failed for ${command}`,
      command,
      TauriErrorType.HOOK_INSTALLATION_FAILED,
      error,
      true
    );
  }
  
  if (errorString.includes('registry')) {
    return new TauriError(
      `Registry access failed for ${command}`,
      command,
      TauriErrorType.REGISTRY_ACCESS_FAILED,
      error,
      false
    );
  }
  
  if (errorString.includes('timeout')) {
    return new TauriError(
      `Command ${command} timed out`,
      command,
      TauriErrorType.TIMEOUT,
      error,
      true
    );
  }
  
  return new TauriError(
    `Backend operation failed: ${error}`,
    command,
    TauriErrorType.UNKNOWN,
    error,
    false
  );
}

// Retry utility with exponential backoff
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  command: string,
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: TauriError;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error, command);
      
      // Don't retry if error is not retryable or we're on the last attempt
      if (!lastError.retryable || 
          !retryConfig.retryableErrors.includes(lastError.type) || 
          attempt === retryConfig.maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
      console.warn(`Attempt ${attempt}/${retryConfig.maxAttempts} failed for ${command}, retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

export async function withErrorHandling<T>(
  command: string,
  operation: () => Promise<T>
): Promise<T> {
  if (!isTauriEnvironment) {
    throw new TauriError(
      `Tauri backend not available in development mode`,
      command,
      TauriErrorType.NETWORK_ERROR,
      new Error('Tauri API not available'),
      false
    );
  }
  try {
    return await operation();
  } catch (error) {
    console.error(`Tauri command '${command}' failed:`, error);
    throw classifyError(error, command);
  }
}

/**
 * Centralized Tauri Service Class
 * Provides a unified interface for all backend operations with proper state management
 */
export class TauriService {
  private static instance: TauriService;
  private connectionSignal = createSignal(false);
  private errorSignal = createSignal<TauriError | null>(null);
  
  private get isConnected() { return this.connectionSignal[0]; }
  private get setIsConnected() { return this.connectionSignal[1]; }
  private get lastError() { return this.errorSignal[0]; }
  private get setLastError() { return this.errorSignal[1]; }
  
  private constructor() {
    this.checkConnection();
  }
  
  static getInstance(): TauriService {
    if (!TauriService.instance) {
      TauriService.instance = new TauriService();
    }
    return TauriService.instance;
  }
  
  // Connection status
  getConnectionStatus = () => this.isConnected();
  getLastError = () => this.lastError();
  
  private async checkConnection(): Promise<void> {
    try {
      await this.greet('test');
      this.setIsConnected(true);
      this.setLastError(null);
    } catch (error) {
      this.setIsConnected(false);
      this.setLastError(classifyError(error, 'connection_check'));
    }
  }
  
  // Hook Management Methods
  async installHooks(): Promise<string> {
    return withRetry('install_hooks', async () => {
      const result = await invoke<string>('install_hooks');
      this.setLastError(null);
      return result;
    });
  }
  
  async uninstallHooks(): Promise<string> {
    return withRetry('uninstall_hooks', async () => {
      const result = await invoke<string>('uninstall_hooks');
      this.setLastError(null);
      return result;
    });
  }
  
  async toggleWindowsKeyHook(): Promise<string> {
    return withErrorHandling('toggle_windows_key_hook', async () => {
      const result = await invoke<string>('toggle_windows_key_hook');
      this.setLastError(null);
      return result;
    });
  }
  
  async toggleMouseButtonHooks(): Promise<string> {
    return withErrorHandling('toggle_mouse_button_hooks', async () => {
      const result = await invoke<string>('toggle_mouse_button_hooks');
      this.setLastError(null);
      return result;
    });
  }
  
  async getHookStatus(): Promise<HookStatus> {
    return withErrorHandling('get_hook_status', async () => {
      const result = await invoke<any>('get_hook_status');
      this.setLastError(null);
      return result as HookStatus;
    });
  }
  
  // Startup Management Methods  
  async addToWindowsStartup(): Promise<string> {
    return withErrorHandling('add_to_windows_startup', async () => {
      const result = await invoke<string>('add_to_windows_startup');
      this.setLastError(null);
      return result;
    });
  }
  
  async removeFromWindowsStartup(): Promise<string> {
    return withErrorHandling('remove_from_windows_startup', async () => {
      const result = await invoke<string>('remove_from_windows_startup');
      this.setLastError(null);
      return result;
    });
  }
  
  async checkStartupStatus(): Promise<StartupStatus> {
    return withErrorHandling('check_startup_status', async () => {
      const result = await invoke<any>('check_startup_status');
      this.setLastError(null);
      return result as StartupStatus;
    });
  }
  
  // Utility Methods
  async greet(name: string): Promise<string> {
    return withErrorHandling('greet', async () => {
      const result = await invoke<string>('greet', { name });
      this.setLastError(null);
      return result;
    });
  }
  
  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.greet('health_check');
      this.setIsConnected(true);
      this.setLastError(null);
      return true;
    } catch (error) {
      this.setIsConnected(false);
      this.setLastError(classifyError(error, 'health_check'));
      return false;
    }
  }
}

// Export singleton instance and convenience functions
export const tauriService = TauriService.getInstance();