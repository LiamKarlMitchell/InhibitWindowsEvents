import { Collection } from '@signaldb/core';
import { createTauriFileSystemAdapter } from '@pitzzahh/signaldb-adapter-tauri';
import { BaseDirectory } from '@tauri-apps/plugin-fs';
import solidReactivityAdapter from '@signaldb/solid';
import { AppConfig, DEFAULT_CONFIG, CONFIG_SCHEMA } from './types';

/**
 * SignalDB collection for application configuration
 * This provides reactive state management with persistent storage
 */
export class ConfigStore {
  private collection: Collection<AppConfig & { id: string }>;
  private static instance: ConfigStore;

  private constructor() {
    // Initialize SignalDB collection with Tauri filesystem persistence
    // Data will be stored in %APPDATA%/inhibit-windows-events/config.json on Windows
    const adapter = createTauriFileSystemAdapter<AppConfig & { id: string }>('config.json', {
      base_dir: BaseDirectory.AppLocalData,
    });

    this.collection = new Collection<AppConfig & { id: string }>({
      persistence: adapter,
      reactivity: solidReactivityAdapter,
    });
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
   */
  public async init(): Promise<void> {
    // Wait for collection to be ready (persistence loaded)
    await this.collection.isReady();
    
    const existing = this.collection.findOne({ id: 'config' });
    if (!existing) {
      this.collection.insert({
        id: 'config',
        ...DEFAULT_CONFIG,
      });
    }
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
}

/**
 * Export singleton instance
 */
export const configStore = ConfigStore.getInstance();