import { JSX } from 'solid-js';
import { BaseComponentProps } from './types';

export type StatusType = 'active' | 'inactive' | 'error' | 'warning' | 'loading';

export interface StatusIndicatorProps extends BaseComponentProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  pulse?: boolean;
}

export function StatusIndicator(props: StatusIndicatorProps) {
  const size = props.size || 'md';
  const showLabel = props.showLabel ?? true;
  const showIcon = props.showIcon ?? false;
  const pulse = props.pulse ?? false;

  // Get status configuration
  const getStatusConfig = () => {
    switch (props.status) {
      case 'active':
        return {
          color: '#10B981', // emerald-500
          bgColor: '#D1FAE5', // emerald-100
          label: 'Active',
          ariaLabel: 'Status: Active and running'
        };
      case 'inactive':
        return {
          color: '#6B7280', // gray-500
          bgColor: '#F3F4F6', // gray-100
          label: 'Inactive',
          ariaLabel: 'Status: Inactive and stopped'
        };
      case 'error':
        return {
          color: '#EF4444', // red-500
          bgColor: '#FEE2E2', // red-100
          label: 'Error',
          ariaLabel: 'Status: Error state detected'
        };
      case 'warning':
        return {
          color: '#F59E0B', // amber-500
          bgColor: '#FEF3C7', // amber-100
          label: 'Warning',
          ariaLabel: 'Status: Warning state'
        };
      case 'loading':
        return {
          color: '#3B82F6', // blue-500
          bgColor: '#DBEAFE', // blue-100
          label: 'Loading',
          ariaLabel: 'Status: Loading'
        };
      default:
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          label: 'Unknown',
          ariaLabel: 'Status: Unknown'
        };
    }
  };

  // Get size configuration
  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          dotSize: '8px',
          fontSize: '10px',
          gap: '6px',
          glowSize: '4px'
        };
      case 'lg':
        return {
          dotSize: '16px',
          fontSize: '14px',
          gap: '10px',
          glowSize: '12px'
        };
      default: // md
        return {
          dotSize: '12px',
          fontSize: '12px',
          gap: '8px',
          glowSize: '8px'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();

  // Animation styles for pulse effect
  const getPulseAnimation = () => {
    if (!pulse) return {};
    
    return {
      animation: 'status-pulse 2s ease-in-out infinite',
      '@keyframes status-pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 }
      }
    };
  };

  return (
    <div
      class={`status-indicator ${props.class || ''}`}
      id={props.id}
      data-testid={props['data-testid']}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: sizeConfig.gap
      }}
      role="status"
      aria-label={statusConfig.ariaLabel}
    >
      {/* Status Dot */}
      <div
        class="status-indicator__dot"
        style={{
          width: sizeConfig.dotSize,
          height: sizeConfig.dotSize,
          'border-radius': '50%',
          'background-color': statusConfig.color,
          'box-shadow': `0 0 ${sizeConfig.glowSize} ${statusConfig.color}33`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'flex-shrink': 0,
          ...getPulseAnimation()
        }}
      />

      {/* Status Label */}
      {showLabel && (
        <span
          class="status-indicator__label"
          style={{
            'font-size': sizeConfig.fontSize,
            'font-weight': '500',
            color: statusConfig.color,
            'text-transform': 'uppercase',
            'letter-spacing': '0.5px',
            transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {statusConfig.label}
        </span>
      )}

      {/* Optional Icon Placeholder */}
      {showIcon && (
        <div
          class="status-indicator__icon"
          style={{
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            color: statusConfig.color,
            transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Icon would go here based on status type */}
        </div>
      )}

      {props.children}
    </div>
  );
}

export default StatusIndicator;