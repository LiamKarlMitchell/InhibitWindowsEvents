import { JSX, Show, createSignal } from 'solid-js';
import { BaseComponentProps } from './types';
import { colors, spacing, typography, radius, transitions } from './tokens';
import { Toggle } from './Toggle';
import { Input } from './Input';
import { Button } from './Button';

// Validation state types
export type ValidationState = 'default' | 'error' | 'warning' | 'success';

// Control types supported by SettingRow
export type ControlType = 'toggle' | 'input' | 'select' | 'button' | 'custom';

export interface SettingRowProps extends BaseComponentProps {
  label: string;
  description?: string;
  controlType: ControlType;
  value?: any;
  onChange?: (value: any) => void;
  
  // Validation
  validationState?: ValidationState;
  validationMessage?: string;
  
  // Control-specific props
  disabled?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  buttonText?: string;
  
  // Layout
  layout?: 'horizontal' | 'vertical';
  
  // Additional context
  tooltip?: string;
  required?: boolean;
}

export function SettingRow(props: SettingRowProps) {
  const [showTooltip, setShowTooltip] = createSignal(false);
  const layout = props.layout || 'horizontal';
  
  // Get validation colors
  const getValidationColor = () => {
    switch (props.validationState) {
      case 'error': return colors.danger[500];
      case 'warning': return colors.warning[500];
      case 'success': return colors.success[500];
      default: return colors.gray[400];
    }
  };

  // Render the appropriate control based on type
  const renderControl = () => {
    switch (props.controlType) {
      case 'toggle':
        return (
          <Toggle
            checked={props.value || false}
            onChange={(checked) => props.onChange?.(checked)}
            disabled={props.disabled}
            aria-labelledby={`${props.id || 'setting'}-label`}
            aria-describedby={props.description ? `${props.id || 'setting'}-description` : undefined}
          />
        );
      
      case 'input':
        return (
          <Input
            value={props.value || ''}
            onInput={(e) => props.onChange?.(e.currentTarget.value)}
            placeholder={props.placeholder}
            disabled={props.disabled}
            aria-labelledby={`${props.id || 'setting'}-label`}
            aria-describedby={props.description ? `${props.id || 'setting'}-description` : undefined}
            style={{
              'min-width': '200px',
              'border-color': props.validationState && props.validationState !== 'default' ? 
                getValidationColor() : undefined
            }}
          />
        );
      
      case 'select':
        return (
          <select
            value={props.value || ''}
            onChange={(e) => props.onChange?.(e.currentTarget.value)}
            disabled={props.disabled}
            aria-labelledby={`${props.id || 'setting'}-label`}
            aria-describedby={props.description ? `${props.id || 'setting'}-description` : undefined}
            style={{
              padding: `${spacing[2]} ${spacing[3]}`,
              border: `1px solid ${props.validationState && props.validationState !== 'default' ? 
                getValidationColor() : colors.gray[300]}`,
              'border-radius': radius.md,
              'background-color': props.disabled ? colors.gray[100] : 'white',
              'font-size': typography.fontSize.sm,
              'min-width': '150px',
              cursor: props.disabled ? 'not-allowed' : 'pointer',
              transition: transitions.colors
            }}
          >
            {props.options?.map((option) => (
              <option value={option.value}>{option.label}</option>
            ))}
          </select>
        );
      
      case 'button':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => props.onChange?.(true)}
            disabled={props.disabled}
            aria-labelledby={`${props.id || 'setting'}-label`}
          >
            {props.buttonText || 'Configure'}
          </Button>
        );
      
      case 'custom':
        return props.children;
      
      default:
        return null;
    }
  };

  return (
    <div
      class={`setting-row ${props.class || ''}`}
      id={props.id}
      data-testid={props['data-testid']}
      style={{
        display: 'grid',
        'grid-template-columns': layout === 'horizontal' ? '1fr auto' : '1fr',
        'grid-template-rows': layout === 'horizontal' ? 'auto' : 'auto auto',
        gap: spacing[3],
        'align-items': layout === 'horizontal' ? 'center' : 'start',
        padding: `${spacing[3]} 0`,
        'border-bottom': `1px solid ${colors.gray[200]}`,
        transition: transitions.colors,
        ':last-child': {
          'border-bottom': 'none'
        }
      }}
    >
      {/* Label and Description Area */}
      <div
        class="setting-row__info"
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: spacing[1],
          'min-width': 0 // Allow text wrapping
        }}
      >
        {/* Label */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: spacing[2]
          }}
        >
          <label
            id={`${props.id || 'setting'}-label`}
            class="setting-row__label"
            style={{
              'font-size': typography.fontSize.sm,
              'font-weight': typography.fontWeight.medium,
              'line-height': typography.lineHeight.tight,
              color: props.disabled ? colors.gray[400] : colors.gray[900],
              cursor: props.controlType === 'toggle' ? 'pointer' : 'default',
              transition: transitions.colors
            }}
            onClick={() => {
              if (props.controlType === 'toggle' && !props.disabled) {
                props.onChange?.(!props.value);
              }
            }}
          >
            {props.label}
            {props.required && (
              <span style={{ color: colors.danger[500], 'margin-left': spacing[1] }}>*</span>
            )}
          </label>

          {/* Tooltip Icon */}
          <Show when={props.tooltip}>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                type="button"
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  width: '16px',
                  height: '16px',
                  border: 'none',
                  'background-color': 'transparent',
                  color: colors.gray[400],
                  cursor: 'help',
                  'border-radius': '50%',
                  transition: transitions.colors,
                  ':hover': {
                    color: colors.gray[600],
                    'background-color': colors.gray[100]
                  }
                }}
                aria-label="More information"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0C2.7 0 0 2.7 0 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 9c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H5V3h2v3z"/>
                </svg>
              </button>
              
              {/* Tooltip */}
              <Show when={showTooltip()}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    'margin-bottom': spacing[2],
                    padding: `${spacing[2]} ${spacing[3]}`,
                    'background-color': colors.gray[900],
                    color: 'white',
                    'font-size': typography.fontSize.xs,
                    'border-radius': radius.md,
                    'white-space': 'nowrap',
                    'z-index': '1000',
                    'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {props.tooltip}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0',
                      height: '0',
                      'border-left': '4px solid transparent',
                      'border-right': '4px solid transparent',
                      'border-top': `4px solid ${colors.gray[900]}`
                    }}
                  />
                </div>
              </Show>
            </div>
          </Show>
        </div>

        {/* Description */}
        <Show when={props.description}>
          <p
            id={`${props.id || 'setting'}-description`}
            class="setting-row__description"
            style={{
              margin: '0',
              'font-size': typography.fontSize.xs,
              'line-height': typography.lineHeight.normal,
              color: props.disabled ? colors.gray[400] : colors.gray[600],
              transition: transitions.colors
            }}
          >
            {props.description}
          </p>
        </Show>

        {/* Validation Message */}
        <Show when={props.validationMessage && props.validationState !== 'default'}>
          <p
            class="setting-row__validation"
            style={{
              margin: '0',
              'font-size': typography.fontSize.xs,
              'line-height': typography.lineHeight.normal,
              color: getValidationColor(),
              'font-weight': typography.fontWeight.medium
            }}
          >
            {props.validationMessage}
          </p>
        </Show>
      </div>

      {/* Control Area */}
      <div
        class="setting-row__control"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': layout === 'horizontal' ? 'flex-end' : 'flex-start',
          'margin-top': layout === 'vertical' ? spacing[2] : '0'
        }}
      >
        {renderControl()}
      </div>
    </div>
  );
}

export default SettingRow;