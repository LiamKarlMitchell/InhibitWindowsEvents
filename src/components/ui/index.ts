/**
 * UI Component Library
 * 
 * A comprehensive set of reusable UI components built with SolidJS and UnoCSS
 * for the Windows Event Inhibition application.
 * 
 * @example
 * ```tsx
 * import { Button, Card, Input, Toggle, Modal } from '@/components/ui';
 * 
 * function MyComponent() {
 *   return (
 *     <Card hover>
 *       <Input label="Username" placeholder="Enter username" />
 *       <Toggle label="Remember me" />
 *       <Button variant="primary">Save Changes</Button>
 *     </Card>
 *   );
 * }
 * ```
 */

// Foundation exports - Design system tokens, types, and utilities
export * from './types';
export * from './tokens';
export * from './utils';

// Component exports - Reusable UI components
export { default as Button } from './Button';
export { default as Toggle } from './Toggle';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Modal, Dialog } from './Modal';
export { default as HookCard } from './HookCard';
export type { HookData, HookCardProps } from './HookCard';
export { default as StatusIndicator } from './StatusIndicator';
export type { StatusIndicatorProps, StatusType } from './StatusIndicator';
export { default as StatisticsDisplay } from './StatisticsDisplay';
export type { StatisticsDisplayProps, StatisticsData } from './StatisticsDisplay';
export { default as SettingsSection } from './SettingsSection';
export type { SettingsSectionProps } from './SettingsSection';
export { default as SettingRow } from './SettingRow';
export type { SettingRowProps, ValidationState, ControlType } from './SettingRow';
export { default as KeyboardShortcut } from './KeyboardShortcut';
export type { KeyboardShortcutProps, Shortcut } from './KeyboardShortcut';