import { JSX, createSignal, createEffect, Show, onCleanup } from 'solid-js';
import { BaseComponentProps, InteractiveProps } from './types';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { StatusIndicator } from './StatusIndicator';
import { StatisticsDisplay } from './StatisticsDisplay';

// Hook data interface for the component
export interface HookData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  enabled: boolean;
  statistics?: {
    eventsBlocked: number;
    uptime: number; // in milliseconds
  };
}

export interface HookCardProps extends BaseComponentProps {
  hook: HookData;
  loading?: boolean;
  onToggle?: (enabled: boolean) => void;
  onConfigure?: () => void;
}

export function HookCard(props: HookCardProps) {
  const [isHovered, setIsHovered] = createSignal(false);
  const [isToggling, setIsToggling] = createSignal(false);
  const [previousStatus, setPreviousStatus] = createSignal(props.hook.status);
  const [animateStatusChange, setAnimateStatusChange] = createSignal(false);

  // Reactive effect to handle status changes with animation
  createEffect(() => {
    const currentStatus = props.hook.status;
    if (currentStatus !== previousStatus()) {
      setAnimateStatusChange(true);
      setPreviousStatus(currentStatus);
      
      // Reset animation flag after animation completes
      const timer = setTimeout(() => {
        setAnimateStatusChange(false);
      }, 300);
      
      onCleanup(() => clearTimeout(timer));
    }
  });

  // Convert hook status to StatusIndicator status type
  const getIndicatorStatus = (): 'active' | 'inactive' | 'error' => {
    return props.hook.status;
  };

  // Handle toggle change with optimistic UI updates
  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true);
    
    try {
      // Optimistic update - provide immediate feedback
      await props.onToggle?.(enabled);
    } catch (error) {
      console.error('Toggle operation failed:', error);
      // TODO: Show error toast or revert optimistic update
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setIsToggling(false), 150);
    }
  };

  // Handle configure button click
  const handleConfigure = () => {
    props.onConfigure?.();
  };

  return (
    <div
      class={`hook-card ${props.class || ''}`}
      id={props.id}
      data-testid={props['data-testid']}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: '1px solid var(--border-color, #E5E7EB)',
        'border-radius': '8px',
        padding: '16px',
        'background-color': 'var(--card-bg, #FFFFFF)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'box-shadow': isHovered() ? 
          '0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)' : 
          '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        transform: isHovered() ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        'border-color': animateStatusChange() ? 
          (props.hook.status === 'active' ? '#10B981' : 
           props.hook.status === 'error' ? '#EF4444' : 
           'var(--border-color, #E5E7EB)') : 
          'var(--border-color, #E5E7EB)',
        '--card-glow': animateStatusChange() ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
        'box-shadow': `${isHovered() ? 
          '0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)' : 
          '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'}, var(--card-glow)`
      }}
    >
      {/* Header Section */}
      <div
        class="hook-card__header"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'margin-bottom': '12px'
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
          {/* Status Indicator */}
          <StatusIndicator 
            status={getIndicatorStatus()}
            size="sm"
            showLabel={false}
            pulse={props.hook.status === 'active'}
          />
          
          {/* Hook Name */}
          <h3
            class="hook-card__title"
            style={{
              margin: '0',
              'font-size': '16px',
              'font-weight': '600',
              color: 'var(--text-primary, #111827)'
            }}
          >
            {props.hook.name}
          </h3>
        </div>

        {/* Status Text */}
        <StatusIndicator 
          status={getIndicatorStatus()}
          size="sm"
          showLabel={true}
          showIcon={false}
          class="hook-card__status-text"
        />
      </div>

      {/* Content Section */}
      <div
        class="hook-card__content"
        style={{ 'margin-bottom': '16px' }}
      >
        {/* Description */}
        <p
          class="hook-card__description"
          style={{
            margin: '0 0 12px 0',
            'font-size': '14px',
            color: 'var(--text-secondary, #6B7280)',
            'line-height': '1.5'
          }}
        >
          {props.hook.description}
        </p>

        {/* Statistics Display */}
        <StatisticsDisplay
          statistics={{
            eventsBlocked: props.hook.statistics?.eventsBlocked,
            uptime: props.hook.statistics?.uptime
          }}
          loading={props.loading || isToggling()}
          compact={true}
          class="hook-card__statistics"
        />
      </div>

      {/* Actions Section */}
      <div
        class="hook-card__actions"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          gap: '12px'
        }}
      >
        {/* Toggle Switch */}
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <Toggle
            checked={props.hook.enabled}
            onChange={handleToggle}
            disabled={props.hook.status === 'error' || props.loading || isToggling()}
            aria-label={`Toggle ${props.hook.name} hook`}
            aria-describedby={`${props.id || props.hook.id}-status`}
          />
          <span
            id={`${props.id || props.hook.id}-status`}
            style={{
              'font-size': '13px',
              'font-weight': '500',
              color: (props.loading || isToggling()) ? 
                'var(--text-tertiary, #9CA3AF)' : 
                'var(--text-secondary, #6B7280)',
              transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isToggling() ? 0.7 : 1
            }}
          >
            <Show when={!props.loading && !isToggling()} fallback="Updating...">
              {props.hook.enabled ? 'Enabled' : 'Disabled'}
            </Show>
          </span>
        </div>

        {/* Configure Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConfigure}
          disabled={!props.hook.enabled || props.loading || isToggling() || props.hook.status === 'error'}
          aria-label={`Configure ${props.hook.name} hook settings`}
          aria-describedby={`${props.id || props.hook.id}-config-help`}
          style={{
            cursor: (props.loading || isToggling() || !props.hook.enabled || props.hook.status === 'error') ? 
              'not-allowed' : 'pointer',
            opacity: (props.loading || isToggling()) ? 0.6 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered() && !props.loading && !isToggling() ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Show when={!props.loading && !isToggling()} fallback="...">
            ⚙️ Configure
          </Show>
          <span 
            id={`${props.id || props.hook.id}-config-help`}
            style={{ display: 'none' }}
          >
            Opens configuration dialog for {props.hook.name} hook settings
          </span>
        </Button>
      </div>
    </div>
  );
}

export default HookCard;