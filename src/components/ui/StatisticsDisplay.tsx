import { JSX, Show } from 'solid-js';
import { BaseComponentProps } from './types';

export interface StatisticsData {
  eventsBlocked?: number;
  uptime?: number; // in milliseconds
  errorCount?: number;
  lastActivity?: number; // timestamp
}

export interface StatisticsDisplayProps extends BaseComponentProps {
  statistics?: StatisticsData;
  loading?: boolean;
  compact?: boolean;
}

export function StatisticsDisplay(props: StatisticsDisplayProps) {
  // Format numbers with appropriate suffixes for large values
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '—';
    
    if (num < 1000) return num.toLocaleString();
    if (num < 10000) return `${(num / 1000).toFixed(1)}k`;
    if (num < 1000000) return `${Math.floor(num / 1000)}k`;
    if (num < 10000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${Math.floor(num / 1000000)}M`;
  };

  // Format uptime as human-readable duration
  const formatUptime = (uptime: number | undefined) => {
    if (uptime === undefined) return '—';
    
    const totalSeconds = Math.floor(uptime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Format timestamp as relative time
  const formatRelativeTime = (timestamp: number | undefined) => {
    if (timestamp === undefined) return '—';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const LoadingSkeleton = () => (
    <div
      style={{
        width: '40px',
        height: '14px',
        'background-color': '#E5E7EB',
        'border-radius': '4px',
        animation: 'pulse 1.5s ease-in-out infinite alternate'
      }}
    />
  );

  return (
    <div
      class={`statistics-display ${props.class || ''}`}
      id={props.id}
      data-testid={props['data-testid']}
      style={{
        display: 'flex',
        gap: props.compact ? '12px' : '16px',
        'font-size': props.compact ? '11px' : '12px',
        color: 'var(--text-tertiary, #9CA3AF)',
        'flex-wrap': 'wrap'
      }}
    >
      {/* Events Blocked */}
      <div class="statistics-display__stat">
        <span style={{ 'font-weight': '500' }}>Events Blocked:</span>{' '}
        <span style={{ 
          'font-weight': '600', 
          color: 'var(--text-secondary, #6B7280)' 
        }}>
          <Show when={!props.loading} fallback={<LoadingSkeleton />}>
            {formatNumber(props.statistics?.eventsBlocked)}
          </Show>
        </span>
      </div>

      {/* Uptime */}
      <div class="statistics-display__stat">
        <span style={{ 'font-weight': '500' }}>Uptime:</span>{' '}
        <span style={{ 
          'font-weight': '600', 
          color: 'var(--text-secondary, #6B7280)' 
        }}>
          <Show when={!props.loading} fallback={<LoadingSkeleton />}>
            {formatUptime(props.statistics?.uptime)}
          </Show>
        </span>
      </div>

      {/* Optional Error Count */}
      <Show when={props.statistics?.errorCount !== undefined}>
        <div class="statistics-display__stat">
          <span style={{ 'font-weight': '500' }}>Errors:</span>{' '}
          <span style={{ 
            'font-weight': '600', 
            color: props.statistics!.errorCount! > 0 ? 
              'var(--color-error, #EF4444)' : 
              'var(--text-secondary, #6B7280)' 
          }}>
            <Show when={!props.loading} fallback={<LoadingSkeleton />}>
              {formatNumber(props.statistics?.errorCount)}
            </Show>
          </span>
        </div>
      </Show>

      {/* Optional Last Activity */}
      <Show when={props.statistics?.lastActivity !== undefined && !props.compact}>
        <div class="statistics-display__stat">
          <span style={{ 'font-weight': '500' }}>Last Activity:</span>{' '}
          <span style={{ 
            'font-weight': '600', 
            color: 'var(--text-secondary, #6B7280)' 
          }}>
            <Show when={!props.loading} fallback={<LoadingSkeleton />}>
              {formatRelativeTime(props.statistics?.lastActivity)}
            </Show>
          </span>
        </div>
      </Show>

      {props.children}
    </div>
  );
}

export default StatisticsDisplay;