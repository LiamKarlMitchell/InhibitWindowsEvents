import { TauriError, TauriErrorType, tauriService } from './tauri';
import toast, { ToastStore } from '../components/ui/Toast';

/**
 * Error Recovery Service
 * Provides user-friendly error handling, recovery flows, and retry mechanisms
 */

export interface ErrorRecoveryConfig {
  showToastNotifications: boolean;
  enableAutoRetry: boolean;
  maxAutoRetries: number;
  userConfirmationRequired: boolean;
}

export interface RecoveryAction {
  label: string;
  action: () => Promise<void>;
  primary?: boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  
  private config: ErrorRecoveryConfig = {
    showToastNotifications: true,
    enableAutoRetry: true,
    maxAutoRetries: 2,
    userConfirmationRequired: true
  };
  
  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }
  
  /**
   * Handle errors with user-friendly feedback and recovery options
   */
  async handleError(error: TauriError, operation: string): Promise<void> {
    console.error(`Error handling service - ${operation}:`, error);
    
    const userMessage = this.getUserFriendlyMessage(error);
    const recoveryActions = this.getRecoveryActions(error, operation);
    
    if (this.config.showToastNotifications) {
      // Show toast notification with recovery actions
      toast.error(
        `${operation} Failed`,
        userMessage,
        {
          duration: error.retryable ? 8000 : 5000,
          persistent: recoveryActions.length > 0,
          actions: recoveryActions.map(action => ({
            label: action.label,
            action: action.action,
            variant: action.primary ? 'primary' : 'secondary'
          }))
        }
      );
    }
    
    // Log detailed error for debugging
    this.logDetailedError(error, operation);
  }
  
  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyMessage(error: TauriError): string {
    switch (error.type) {
      case TauriErrorType.PERMISSION_DENIED:
        return 'This action requires administrator privileges. Please run the application as administrator and try again.';
        
      case TauriErrorType.HOOK_INSTALLATION_FAILED:
        return 'Failed to install Windows hooks. This may be due to antivirus software or conflicting applications.';
        
      case TauriErrorType.REGISTRY_ACCESS_FAILED:
        return 'Unable to access Windows registry. Administrator privileges may be required for startup settings.';
        
      case TauriErrorType.TIMEOUT:
        return 'The operation timed out. The system may be under heavy load or experiencing issues.';
        
      case TauriErrorType.NETWORK_ERROR:
        return 'Communication with the backend service failed. The application may need to be restarted.';
        
      case TauriErrorType.INVALID_COMMAND:
        return 'Invalid operation requested. This may indicate a compatibility issue.';
        
      default:
        return `An unexpected error occurred: ${error.message}. Please try again or restart the application.`;
    }
  }
  
  /**
   * Generate context-appropriate recovery actions
   */
  private getRecoveryActions(error: TauriError, operation: string): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    
    switch (error.type) {
      case TauriErrorType.PERMISSION_DENIED:
        actions.push({
          label: 'Run as Admin',
          action: async () => {
            toast.info(
              'Administrator Required',
              'Please restart the application as administrator and try again.',
              { duration: 8000 }
            );
          }
        });
        break;
        
      case TauriErrorType.HOOK_INSTALLATION_FAILED:
        if (error.retryable) {
          actions.push({
            label: 'Retry',
            action: async () => {
              await this.retryOperation(operation);
            },
            primary: true
          });
        }
        actions.push({
          label: 'Check Antivirus',
          action: async () => {
            toast.info(
              'Antivirus Check',
              'Please check if your antivirus software is blocking the application, then try again.',
              { duration: 10000 }
            );
          }
        });
        break;
        
      case TauriErrorType.TIMEOUT:
      case TauriErrorType.NETWORK_ERROR:
        actions.push({
          label: 'Retry',
          action: async () => {
            await this.retryOperation(operation);
          },
          primary: true
        });
        actions.push({
          label: 'Restart App',
          action: async () => {
            toast.warning(
              'Application Restart',
              'Please save your work and restart the application to resolve connectivity issues.',
              { duration: 8000 }
            );
          }
        });
        break;
        
      case TauriErrorType.REGISTRY_ACCESS_FAILED:
        actions.push({
          label: 'Run as Admin',
          action: async () => {
            toast.info(
              'Administrator Required',
              'Registry access requires administrator privileges. Please restart as administrator.',
              { duration: 8000 }
            );
          }
        });
        break;
        
      default:
        if (error.retryable) {
          actions.push({
            label: 'Retry',
            action: async () => {
              await this.retryOperation(operation);
            },
            primary: true
          });
        }
    }
    
    return actions;
  }
  
  /**
   * Retry operation with user feedback
   */
  private async retryOperation(operation: string): Promise<void> {
    try {
      toast.info('Retrying...', `Attempting to ${operation.toLowerCase()} again.`, { duration: 2000 });
      
      switch (operation.toLowerCase()) {
        case 'install hooks':
          await tauriService.installHooks();
          toast.success('Success', 'Hooks installed successfully.');
          break;
          
        case 'uninstall hooks':
          await tauriService.uninstallHooks();
          toast.success('Success', 'Hooks uninstalled successfully.');
          break;
          
        case 'toggle windows key hook':
          await tauriService.toggleWindowsKeyHook();
          toast.success('Success', 'Windows key hook toggled successfully.');
          break;
          
        case 'toggle mouse button hooks':
          await tauriService.toggleMouseButtonHooks();
          toast.success('Success', 'Mouse button hooks toggled successfully.');
          break;
          
        case 'add to windows startup':
          await tauriService.addToWindowsStartup();
          toast.success('Success', 'Added to Windows startup successfully.');
          break;
          
        case 'remove from windows startup':
          await tauriService.removeFromWindowsStartup();
          toast.success('Success', 'Removed from Windows startup successfully.');
          break;
          
        default:
          toast.warning('Unknown Operation', 'Unable to retry unknown operation.');
      }
    } catch (retryError) {
      if (retryError instanceof TauriError) {
        await this.handleError(retryError, `Retry ${operation}`);
      } else {
        toast.error('Retry Failed', 'The retry operation also failed. Please try a different approach.');
      }
    }
  }
  
  /**
   * Log detailed error information for debugging
   */
  private logDetailedError(error: TauriError, operation: string): void {
    console.group(`🔴 Error Details - ${operation}`);
    console.error('Error Type:', error.type);
    console.error('Command:', error.command);
    console.error('Message:', error.message);
    console.error('Retryable:', error.retryable);
    console.error('Original Error:', error.originalError);
    console.error('Stack Trace:', error.stack);
    console.groupEnd();
  }
  
  /**
   * Show success notification for completed operations
   */
  showSuccess(operation: string, details?: string): void {
    toast.success(
      `${operation} Successful`,
      details || `${operation} completed successfully.`,
      { duration: 3000 }
    );
  }
  
  /**
   * Show informational notifications
   */
  showInfo(title: string, message: string, persistent = false): void {
    toast.info(title, message, { 
      duration: persistent ? 0 : 5000,
      persistent 
    });
  }
  
  /**
   * Show warning notifications
   */
  showWarning(title: string, message: string): void {
    toast.warning(title, message, { duration: 6000 });
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Show connection status notifications
   */
  showConnectionStatus(isConnected: boolean): void {
    if (isConnected) {
      toast.success('Connected', 'Backend connection restored.', { duration: 3000 });
    } else {
      toast.warning(
        'Connection Lost', 
        'Lost connection to backend service. Some features may not work properly.',
        { duration: 8000 }
      );
    }
  }
  
  /**
   * Show operation progress with loading indicator
   */
  showProgress(operation: string): string {
    return toast.info(
      `${operation}...`,
      'Please wait while the operation completes.',
      { 
        duration: 0,
        persistent: true
      }
    );
  }
  
  /**
   * Hide progress notification
   */
  hideProgress(toastId: string): void {
    const toastStore = ToastStore.getInstance();
    toastStore.removeToast(toastId);
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();

// Convenience functions
export const handleTauriError = (error: TauriError, operation: string) => 
  errorHandlingService.handleError(error, operation);

export const showSuccess = (operation: string, details?: string) => 
  errorHandlingService.showSuccess(operation, details);

export const showWarning = (title: string, message: string) => 
  errorHandlingService.showWarning(title, message);

export const showInfo = (title: string, message: string, persistent = false) => 
  errorHandlingService.showInfo(title, message, persistent);

export const showConnectionStatus = (isConnected: boolean) => 
  errorHandlingService.showConnectionStatus(isConnected);

export default errorHandlingService;