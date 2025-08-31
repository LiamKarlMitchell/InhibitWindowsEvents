import { JSX, createUniqueId } from 'solid-js';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  children?: JSX.Element;
  class?: string;
  id?: string;
}

export function Checkbox(props: CheckboxProps) {
  const uniqueId = createUniqueId();
  const checkboxId = props.id || uniqueId;

  // Single handler for toggle functionality
  const handleToggle = () => {
    if (props.disabled) return;
    const newChecked = !(props.checked ?? false);
    props.onChange?.(newChecked);
  };

  return (
    <label
      class={`
        flex items-start gap-3 cursor-pointer group
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800/50'}
        p-3 rounded-lg transition-all duration-200
        ${props.class || ''}
      `}
      onClick={handleToggle}
    >
      {/* Hidden checkbox input for accessibility */}
      <input
        type="checkbox"
        id={checkboxId}
        checked={props.checked ?? false}
        disabled={props.disabled}
        onChange={handleToggle}
        class="sr-only"
      />

      {/* Lucide icon visual indicator */}
      <div class="flex-shrink-0 mt-0.5">
        {props.checked ? (
          <div class="i-lucide-circle-check text-blue-500 text-xl transition-all duration-200" />
        ) : (
          <div class="i-lucide-circle-x text-gray-500 text-xl transition-all duration-200 group-hover:text-gray-400" />
        )}
      </div>

      {/* Label content */}
      <div class="flex-1 min-w-0">
        {props.children || (
          <div>
            {props.label && (
              <span class="text-sm font-medium text-gray-100 block">
                {props.label}
              </span>
            )}
            {props.description && (
              <span class="text-xs text-gray-400 mt-1 block">
                {props.description}
              </span>
            )}
          </div>
        )}
      </div>
    </label>
  );
}

export default Checkbox;