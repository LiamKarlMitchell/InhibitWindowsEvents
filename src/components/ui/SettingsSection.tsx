import { JSX, createSignal, Show, children } from 'solid-js';
import { BaseComponentProps } from './types';
import { colors, spacing, typography, radius, transitions, shadows } from './tokens';

export interface SettingsSectionProps extends BaseComponentProps {
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  icon?: JSX.Element;
}

export function SettingsSection(props: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = createSignal(props.defaultExpanded ?? true);
  const resolved = children(() => props.children);

  const toggleExpanded = () => {
    if (props.collapsible) {
      setIsExpanded(!isExpanded());
    }
  };

  return (
    <section
      class={`settings-section ${props.class || ''}`}
      id={props.id}
      data-testid={props['data-testid']}
      style={{
        border: `1px solid ${colors.gray[200]}`,
        'border-radius': radius.lg,
        'background-color': colors.gray[50],
        overflow: 'hidden',
        transition: transitions.all
      }}
    >
      {/* Header */}
      <header
        class="settings-section__header"
        onClick={toggleExpanded}
        style={{
          display: 'grid',
          'grid-template-columns': props.icon ? 'auto 1fr auto' : '1fr auto',
          'align-items': 'center',
          gap: spacing[3],
          padding: `${spacing[4]} ${spacing[5]}`,
          'background-color': 'white',
          'border-bottom': isExpanded() ? `1px solid ${colors.gray[200]}` : 'none',
          cursor: props.collapsible ? 'pointer' : 'default',
          transition: transitions.colors,
          ':hover': props.collapsible ? {
            'background-color': colors.gray[50]
          } : {}
        }}
        role={props.collapsible ? 'button' : undefined}
        aria-expanded={props.collapsible ? isExpanded() : undefined}
        aria-controls={props.collapsible ? `${props.id || 'settings-section'}-content` : undefined}
        tabindex={props.collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (props.collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        {/* Optional Icon */}
        <Show when={props.icon}>
          <div
            class="settings-section__icon"
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              width: spacing[6],
              height: spacing[6],
              color: colors.primary[600]
            }}
          >
            {props.icon}
          </div>
        </Show>

        {/* Title and Description */}
        <div class="settings-section__title-area">
          <h3
            class="settings-section__title"
            style={{
              margin: '0',
              'font-size': typography.fontSize.lg,
              'font-weight': typography.fontWeight.semibold,
              'line-height': typography.lineHeight.tight,
              color: colors.gray[900]
            }}
          >
            {props.title}
          </h3>
          <Show when={props.description}>
            <p
              class="settings-section__description"
              style={{
                margin: `${spacing[1]} 0 0 0`,
                'font-size': typography.fontSize.sm,
                'font-weight': typography.fontWeight.normal,
                'line-height': typography.lineHeight.normal,
                color: colors.gray[600]
              }}
            >
              {props.description}
            </p>
          </Show>
        </div>

        {/* Collapse/Expand Indicator */}
        <Show when={props.collapsible}>
          <div
            class="settings-section__toggle"
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              width: spacing[6],
              height: spacing[6],
              color: colors.gray[500],
              transform: isExpanded() ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: transitions.transform
            }}
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06z"
              />
            </svg>
          </div>
        </Show>
      </header>

      {/* Content */}
      <Show when={isExpanded()}>
        <div
          id={props.collapsible ? `${props.id || 'settings-section'}-content` : undefined}
          class="settings-section__content"
          style={{
            display: 'grid',
            gap: spacing[4],
            padding: spacing[5],
            'background-color': 'white',
            animation: props.collapsible ? 'settings-content-expand 200ms ease-out' : 'none'
          }}
        >
          {resolved()}
        </div>
      </Show>

      {/* CSS Keyframes for expand animation */}
      <style>{`
        @keyframes settings-content-expand {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

export default SettingsSection;