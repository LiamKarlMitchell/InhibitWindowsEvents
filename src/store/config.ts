import { Collection } from '@signaldb/core';
import { createTauriFileSystemAdapter } from '@pitzzahh/signaldb-adapter-tauri';
import { BaseDirectory } from '@tauri-apps/plugin-fs';
import solidReactivityAdapter from '@signaldb/solid';
import { AppConfig, DEFAULT_CONFIG, CONFIG_SCHEMA, CONFIG_VERSION } from './types';

// Check if we're running in Tauri environment
const isTauriEnvironment = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

/**
 * SignalDB collection for application configuration
 * This provides reactive state management with persistent storage
 */
export class ConfigStore {
  private collection: Collection<AppConfig & { id: string }>;
  private static instance: ConfigStore;

  private constructor() {
    if (isTauriEnvironment) {
      // Initialize SignalDB collection with Tauri filesystem persistence
      // Data will be stored in %APPDATA%/inhibit-windows-events/config.json on Windows
      const adapter = createTauriFileSystemAdapter<AppConfig & { id: string }>('config.json', {
        base_dir: BaseDirectory.AppLocalData,
      });

      this.collection = new Collection<AppConfig & { id: string }>({
        persistence: adapter,
        reactivity: solidReactivityAdapter,
      });
    } else {
      // Development mode: use in-memory collection
      this.collection = new Collection<AppConfig & { id: string }>({
        reactivity: solidReactivityAdapter,
      });
      
      // Initialize with default config in dev mode
      this.collection.insert({ ...DEFAULT_CONFIG, id: 'default' });
    }
  }

  /**
   * Get singleton instance of ConfigStore
   */
  public static getInstance(): ConfigStore {
    if (!ConfigStore.instance) {
      ConfigStore.instance = new ConfigStore();
    }
    return ConfigStore.instance;
  }

  /**
   * Initialize the config store with default values if not exists
   * Handles first-run detection and configuration migration
   */
  public async init(): Promise<void> {
    // Wait for collection to be ready (persistence loaded)
    await this.collection.isReady();
    
    const existing = this.collection.findOne({ id: 'config' });
    
    if (!existing) {
      // First run - create new configuration with defaults
      console.log('[ConfigStore] First run detected - creating default configuration');
      console.log('[ConfigStore] Default config:', {
        enableWindowsKey: DEFAULT_CONFIG.enableWindowsKey,
        enableMouseButton3: DEFAULT_CONFIG.enableMouseButton3, 
        enableMouseButton4: DEFAULT_CONFIG.enableMouseButton4,
        enableMouseButton5: DEFAULT_CONFIG.enableMouseButton5,
      });
      
      this.collection.insert({
        id: 'config',
        ...DEFAULT_CONFIG,
        installedAt: new Date().toISOString(),
      });
    } else {
      // Configuration exists - check if migration is needed
      this.handleConfigMigration(existing);
      
      // Mark as no longer first run if it was previously set
      if (existing.firstRun) {
        console.log('[ConfigStore] Marking configuration as no longer first run');
        this.collection.updateOne(
          { id: 'config' },
          { $set: { firstRun: false } }
        );
      }
    }
  }

  /**
   * Handle configuration migration if needed
   */
  private handleConfigMigration(config: AppConfig & { id: string }): void {
    if (config.configVersion !== CONFIG_VERSION) {
      console.log(`[ConfigStore] Configuration migration needed: v${config.configVersion} -> v${CONFIG_VERSION}`);
      
      // Apply migrations step by step
      let currentVersion = config.configVersion || 0;
      let migrationConfig = { ...config };
      
      while (currentVersion < CONFIG_VERSION) {
        migrationConfig = this.applyMigration(migrationConfig, currentVersion + 1);
        currentVersion++;
      }
      
      // Update the configuration in the database
      this.collection.updateOne(
        { id: 'config' },
        { $set: migrationConfig }
      );
      
      console.log(`[ConfigStore] Configuration migration completed: v${config.configVersion} -> v${CONFIG_VERSION}`);
    }
  }

  /**
   * Apply a specific migration based on target version
   */
  private applyMigration(config: AppConfig & { id: string }, targetVersion: number): AppConfig & { id: string } {
    const migratedConfig = { ...config };
    
    switch (targetVersion) {
      case 1:
        // Migration to version 1: Add new metadata fields
        console.log('[ConfigStore] Applying migration to v1: Adding metadata fields');
        
        // Add missing fields with defaults
        if (!migratedConfig.hasOwnProperty('configVersion')) {
          migratedConfig.configVersion = 1;
        }
        if (!migratedConfig.hasOwnProperty('firstRun')) {
          migratedConfig.firstRun = false; // Already existing config, not first run
        }
        if (!migratedConfig.hasOwnProperty('installedAt') || !migratedConfig.installedAt) {
          migratedConfig.installedAt = new Date().toISOString();
        }
        
        // Ensure all hook settings exist (in case they were added later)
        if (!migratedConfig.hasOwnProperty('enableWindowsKey')) {
          migratedConfig.enableWindowsKey = DEFAULT_CONFIG.enableWindowsKey;
        }
        if (!migratedConfig.hasOwnProperty('enableMouseButton3')) {
          migratedConfig.enableMouseButton3 = DEFAULT_CONFIG.enableMouseButton3;
        }
        if (!migratedConfig.hasOwnProperty('enableMouseButton4')) {
          migratedConfig.enableMouseButton4 = DEFAULT_CONFIG.enableMouseButton4;
        }
        if (!migratedConfig.hasOwnProperty('enableMouseButton5')) {
          migratedConfig.enableMouseButton5 = DEFAULT_CONFIG.enableMouseButton5;
        }
        if (!migratedConfig.hasOwnProperty('startMinimized')) {
          migratedConfig.startMinimized = DEFAULT_CONFIG.startMinimized;
        }
        if (!migratedConfig.hasOwnProperty('startWithWindows')) {
          migratedConfig.startWithWindows = DEFAULT_CONFIG.startWithWindows;
        }
        
        break;
        
      default:
        console.warn(`[ConfigStore] Unknown migration version: ${targetVersion}`);
        break;
    }
    
    return migratedConfig;
  }

  /**
   * Get current configuration
   */
  public getConfig(): (AppConfig & { id: string }) | undefined {
    return this.collection.findOne({ id: 'config' });
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<AppConfig>): void {
    // Validate the updates against schema
    this.validateConfigUpdate(updates);

    this.collection.updateOne(
      { id: 'config' },
      { $set: updates }
    );
  }

  /**
   * Get reactive cursor for configuration changes
   */
  public getConfigCursor() {
    return this.collection.find({ id: 'config' });
  }

  /**
   * Validate configuration updates against schema
   */
  private validateConfigUpdate(updates: Partial<AppConfig>): void {
    for (const [key, value] of Object.entries(updates)) {
      const schema = CONFIG_SCHEMA[key as keyof AppConfig];
      if (!schema) {
        throw new Error(`Unknown configuration key: ${key}`);
      }

      if (schema.required && value === undefined) {
        throw new Error(`Required configuration key missing: ${key}`);
      }

      if (value !== undefined && typeof value !== schema.type) {
        throw new Error(`Invalid type for ${key}: expected ${schema.type}, got ${typeof value}`);
      }
    }
  }

  /**
   * Validate complete configuration object
   */
  public validateConfig(config: Partial<AppConfig>): void {
    // Check all required fields are present
    for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
      if (schema.required && config[key as keyof AppConfig] === undefined) {
        throw new Error(`Required configuration key missing: ${key}`);
      }
    }

    // Validate individual fields
    this.validateConfigUpdate(config);
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.collection.updateOne(
      { id: 'config' },
      { $set: DEFAULT_CONFIG }
    );
  }

  /**
   * Check if this is the first run of the application
   */
  public isFirstRun(): boolean {
    const config = this.getConfig();
    return config?.firstRun ?? true;
  }

  /**
   * Get the installation timestamp
   */
  public getInstallationDate(): string | null {
    const config = this.getConfig();
    return config?.installedAt ?? null;
  }

  /**
   * Get the current configuration version
   */
  public getConfigVersion(): number {
    const config = this.getConfig();
    return config?.configVersion ?? 0;
  }

  /**
   * Check if configuration needs migration
   */
  public needsMigration(): boolean {
    const currentVersion = this.getConfigVersion();
    return currentVersion < CONFIG_VERSION;
  }

  /**
   * Get migration information
   */
  public getMigrationInfo(): { current: number; latest: number; needsMigration: boolean } {
    const current = this.getConfigVersion();
    return {
      current,
      latest: CONFIG_VERSION,
      needsMigration: current < CONFIG_VERSION,
    };
  }

  /**
   * Force a configuration migration (useful for testing or manual migration)
   */
  public async forceMigration(): Promise<void> {
    const config = this.getConfig();
    if (config) {
      this.handleConfigMigration(config);
    }
  }
}

/**
 * Export singleton instance
 */
export const configStore = ConfigStore.getInstance();