# UI Component Library

A comprehensive set of reusable UI components built with SolidJS and UnoCSS for the Windows Event Inhibition application.

## Architecture

### Foundation Files

- **`types.ts`** - Base TypeScript interfaces and component prop definitions
- **`tokens.ts`** - Design system tokens (colors, spacing, typography, etc.)
- **`utils.ts`** - Utility functions for class composition and styling
- **`index.ts`** - Main export file for the component library

### Component Structure

Each component follows a consistent pattern:
- Props interface extending `BaseComponentProps`
- Variant support using design system tokens
- Accessibility features built-in
- Animation and transition support
- TypeScript-first development

## Available Components

### Button
Comprehensive button component with multiple variants and states.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={false} onClick={handleClick}>
  Save Changes
</Button>
```

**Props:**
- `variant`: `primary` | `secondary` | `ghost` | `danger` | `outline`
- `size`: `sm` | `md` | `lg` | `xl`
- `loading`: Shows spinner overlay
- `leftIcon` / `rightIcon`: Icon slots
- Full accessibility and keyboard support

### Toggle
Animated toggle switch with smooth state transitions.

```tsx
import { Toggle } from '@/components/ui';

<Toggle 
  checked={enabled} 
  onChange={setEnabled}
  label="Enable notifications"
  color="blue"
/>
```

**Props:**
- `checked`: Controlled state
- `color`: `blue` | `green` | `red` | `orange`
- `size`: `sm` | `md` | `lg` | `xl`
- `label` / `description`: Text content
- `labelPosition`: `left` | `right`

### Card
Container component with hover effects and content slots.

```tsx
import { Card } from '@/components/ui';

<Card hover interactive padding="md">
  <div slot="header">
    <h3>Settings</h3>
  </div>
  <p>Card content goes here</p>
  <div slot="footer">
    <Button>Apply</Button>
  </div>
</Card>
```

**Props:**
- `hover`: Enable hover shadow effects
- `interactive`: Make clickable with keyboard support
- `padding`: `none` | `sm` | `md` | `lg`
- `border`: `none` | `subtle` | `solid`
- `header` / `footer`: Content slots

### Input
Form input with validation states and comprehensive features.

```tsx
import { Input } from '@/components/ui';

<Input
  type="email"
  label="Email Address"
  placeholder="Enter your email"
  state="error"
  error="Please enter a valid email"
  leftIcon={<EmailIcon />}
  required
/>
```

**Props:**
- `type`: Standard HTML input types
- `state`: `default` | `error` | `success` | `warning`
- `size`: `sm` | `md` | `lg` | `xl`
- `label` / `helpText`: Form text
- `leftIcon` / `rightIcon`: Icon slots
- Full controlled/uncontrolled support

### Modal & Dialog
Modal overlay with focus management and accessibility.

```tsx
import { Modal, Dialog } from '@/components/ui';

// Full modal
<Modal open={showModal} onClose={() => setShowModal(false)} title="Settings">
  <p>Modal content</p>
</Modal>

// Simple dialog
<Dialog
  open={showDialog}
  title="Confirm Delete"
  confirmText="Delete"
  confirmVariant="danger"
  onConfirm={handleDelete}
  onClose={() => setShowDialog(false)}
>
  Are you sure you want to delete this item?
</Dialog>
```

**Modal Props:**
- `size`: `sm` | `md` | `lg` | `xl` | `full`
- `closeOnBackdrop` / `closeOnEscape`: Dismissal options
- `header` / `footer`: Content slots
- Focus trapping and restoration

**Dialog Props:**
- Simplified modal for confirmations
- `confirmText` / `cancelText`: Button labels
- `confirmVariant`: `primary` | `danger`

## Design System

### Color Variants
- **Primary**: Main brand color (blue)
- **Secondary**: Secondary actions (gray)
- **Success**: Positive actions (green)
- **Warning**: Cautionary actions (orange)
- **Danger**: Destructive actions (red)
- **Info**: Informational (blue)

### Size Variants
- **sm**: Small size
- **md**: Medium size (default)
- **lg**: Large size
- **xl**: Extra large size

### Animation Durations
- **150ms**: Micro-interactions (hover, focus)
- **300ms**: Larger state changes (toggles, modals)
- **500ms**: Major transitions

## Accessibility Features

All components include:
- ARIA attributes support
- Keyboard navigation (Tab, Space, Enter, Escape)
- Focus management and restoration
- Screen reader compatibility
- High contrast mode support
- Proper semantic markup

## Usage Example

```tsx
import { Button, Card, Input, Toggle, Modal } from '@/components/ui';

function SettingsPanel() {
  const [notifications, setNotifications] = createSignal(true);
  const [showModal, setShowModal] = createSignal(false);

  return (
    <Card hover padding="lg">
      <h2>Application Settings</h2>
      
      <Input 
        label="API Key" 
        type="password" 
        placeholder="Enter API key"
        helpText="Keep your API key secure"
      />
      
      <Toggle
        checked={notifications()}
        onChange={setNotifications}
        label="Enable notifications"
        description="Receive alerts when hooks are activated"
      />
      
      <Button 
        variant="primary" 
        onClick={() => setShowModal(true)}
      >
        Advanced Settings
      </Button>

      <Modal
        open={showModal()}
        onClose={() => setShowModal(false)}
        title="Advanced Configuration"
      >
        <p>Advanced settings content...</p>
      </Modal>
    </Card>
  );
}
```

## UnoCSS Integration

Components leverage UnoCSS shortcuts defined in `uno.config.ts`:
- `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`
- `card`, `card-hover`
- `status-active`, `status-inactive`, `status-error`
- Focus and animation utilities

## Contributing

When adding new components:
1. Create the component file in this directory
2. Follow the established prop interface pattern
3. Include accessibility features
4. Add comprehensive TypeScript interfaces
5. Add exports to `index.ts`
6. Update this README with usage examples
7. Test with all size variants and states