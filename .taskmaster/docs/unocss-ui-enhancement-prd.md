# Product Requirements Document: UnoCSS UI Enhancement for Inhibit Windows Events

## Executive Summary

Transform the Inhibit Windows Events Tauri application's user interface from the default template to a modern, polished application using UnoCSS (Windi CSS 4) with SolidJS. This enhancement will provide users with an intuitive, visually appealing interface for managing Windows event hooks while maintaining the application's core functionality.

## Project Overview

### Current State
- Basic Tauri template UI with minimal styling
- SolidJS frontend with default components
- Functional Windows hooks backend
- System tray integration with basic menus

### Target State
- Modern, dark-themed UI with light mode toggle
- Professional dashboard-style interface
- Responsive design principles
- Accessible components following WCAG guidelines
- Smooth animations and micro-interactions

## 1. Technical Architecture

### 1.1 Styling Framework
- **Primary**: UnoCSS (Windi CSS 4) for utility-first CSS
- **Secondary**: CSS Custom Properties for theming
- **Icons**: Use Lucide icons through UnoCss's existing iconify plugin.
- **Typography**: Inter or System UI fonts for readability

### 1.2 Component Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   ├── features/     # Feature-specific components
│   └── icons/        # Icon components
├── styles/
│   ├── globals.css   # Global styles and CSS variables
│   └── themes/       # Theme configurations
└── utils/
    └── cn.ts         # Class name utility functions
```

### 1.3 Design System
- **Colors**: Modern dark/light theme palette
- **Spacing**: 8px grid system (4, 8, 12, 16, 24, 32, 48, 64)
- **Typography**: Consistent scale (xs, sm, base, lg, xl, 2xl, etc.)
- **Shadows**: Subtle elevation system
- **Borders**: Consistent radius and stroke weights

## 2. UI Components & Features

### 2.1 Core Application Shell
- **Header Bar**: App title, theme toggle, minimize/close controls
- **Sidebar Navigation**: Hook status, settings, about sections
- **Main Content Area**: Dynamic content based on selected section
- **Footer**: Status indicators, quick actions

### 2.2 Dashboard Components

#### Hook Status Cards
```typescript
interface HookStatusCard {
  title: string;
  status: 'active' | 'inactive' | 'error';
  description: string;
  toggleAction: () => void;
  icon: ComponentType;
}
```

#### Settings Panel
- Toggle switches for individual hooks
- Keyboard shortcut configuration
- System startup options
- Debug mode toggle

#### System Tray Preview
- Visual representation of tray icon states
- Context menu preview
- Tooltip configuration

### 2.3 Interactive Elements
- **Buttons**: Primary, secondary, ghost, danger variants
- **Toggle Switches**: Animated state transitions
- **Status Indicators**: Color-coded with icons
- **Form Controls**: Input fields, checkboxes, selects
- **Modals/Dialogs**: Confirmation dialogs, settings overlays

## 3. User Experience Requirements

### 3.1 Visual Design Principles
- **Minimalism**: Clean, uncluttered interface
- **Hierarchy**: Clear information architecture
- **Feedback**: Immediate visual feedback for actions
- **Consistency**: Uniform component behavior
- **Accessibility**: WCAG 2.1 AA compliance

### 3.2 Color Scheme

#### Dark Theme (Default)
```css
:root {
  --bg-primary: #0f1419;
  --bg-secondary: #1a1f29;
  --bg-tertiary: #252a35;
  --text-primary: #e6e8eb;
  --text-secondary: #a0a6b0;
  --text-muted: #6b7280;
  --accent-primary: #3b82f6;
  --accent-secondary: #8b5cf6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --border: #374151;
}
```

#### Light Theme
```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --accent-primary: #3b82f6;
  --accent-secondary: #8b5cf6;
  --success: #059669;
  --warning: #d97706;
  --error: #dc2626;
  --border: #e2e8f0;
}
```

### 3.3 Typography Scale
- **Heading 1**: 2.25rem (36px) - Page titles
- **Heading 2**: 1.875rem (30px) - Section headers
- **Heading 3**: 1.5rem (24px) - Subsection headers
- **Body Large**: 1.125rem (18px) - Important text
- **Body**: 1rem (16px) - Regular text
- **Body Small**: 0.875rem (14px) - Captions, labels
- **Caption**: 0.75rem (12px) - Fine print

## 4. Component Specifications

### 4.1 Hook Control Card
```tsx
<HookCard>
  <HookCard.Header>
    <HookCard.Icon /> {/* Windows key, mouse, etc. */}
    <HookCard.Title>Windows Key Hook</HookCard.Title>
    <HookCard.Status status="active" />
  </HookCard.Header>
  <HookCard.Content>
    <HookCard.Description>
      Replaces Windows key with F24 to prevent Start menu
    </HookCard.Description>
    <HookCard.Stats>
      <Stat label="Events Blocked" value="1,247" />
      <Stat label="Uptime" value="2h 34m" />
    </HookCard.Stats>
  </HookCard.Content>
  <HookCard.Actions>
    <Toggle checked={enabled} onChange={onToggle} />
    <Button variant="ghost" size="sm">Configure</Button>
  </HookCard.Actions>
</HookCard>
```

### 4.2 Settings Section
```tsx
<SettingsSection>
  <SettingsSection.Header>
    <Title>Hook Configuration</Title>
    <Description>Configure individual hook behavior</Description>
  </SettingsSection.Header>
  <SettingsSection.Content>
    <SettingRow>
      <SettingLabel>Windows Key Hook</SettingLabel>
      <Toggle />
    </SettingRow>
    <SettingRow>
      <SettingLabel>Mouse Button Hooks</SettingLabel>
      <Toggle />
    </SettingRow>
    <SettingRow>
      <SettingLabel>Global Toggle Hotkey</SettingLabel>
      <KeyboardShortcut keys={["Alt", "ScrollLock"]} />
    </SettingRow>
  </SettingsSection.Content>
</SettingsSection>
```

### 4.3 System Tray Simulation
```tsx
<TrayPreview>
  <TrayPreview.Icon state={currentState} />
  <TrayPreview.Tooltip>{dynamicTooltip}</TrayPreview.Tooltip>
  <TrayPreview.Menu>
    <MenuItem>Show/Hide Window</MenuItem>
    <MenuSeparator />
    <MenuItem>Toggle Windows Key Hook</MenuItem>
    <MenuItem>Toggle Mouse Button Hooks</MenuItem>
    <MenuSeparator />
    <MenuItem>Exit Application</MenuItem>
  </TrayPreview.Menu>
</TrayPreview>
```

## 5. Animation & Micro-interactions

### 5.1 Transition Specifications
- **Duration**: 150ms for micro-interactions, 300ms for larger changes
- **Easing**: `ease-out` for entrances, `ease-in` for exits
- **Properties**: Transform, opacity, colors, shadows

### 5.2 Interactive Feedback
- **Hover States**: Subtle scale (1.02x) or brightness changes
- **Active States**: Scale down (0.98x) for buttons
- **Focus States**: Ring outline with theme colors
- **Loading States**: Skeleton loaders and spinners

### 5.3 State Transitions
```css
/* Toggle switches */
.toggle {
  @apply transition-all duration-200 ease-out;
  @apply transform hover:scale-105 active:scale-95;
}

/* Cards */
.card {
  @apply transition-shadow duration-200 ease-out;
  @apply hover:shadow-lg hover:shadow-black/5;
}

/* Status indicators */
.status-indicator {
  @apply transition-colors duration-300 ease-out;
  @apply animate-pulse;
}
```

## 6. Responsive Design

### 6.1 Breakpoints
- **Mobile**: 375px - 767px (not primary target but consider)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+ (primary target)
- **Large Desktop**: 1440px+

### 6.2 Layout Adaptations
- Sidebar collapses to icons on smaller screens
- Card layouts adjust from grid to stack
- Typography scales appropriately
- Touch targets meet minimum 44px requirement

## 7. Accessibility Requirements

### 7.1 Keyboard Navigation
- Full keyboard navigation support
- Logical tab order
- Visible focus indicators
- Escape key closes modals

### 7.2 Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for status updates
- Alternative text for icons

### 7.3 Color & Contrast
- WCAG AA contrast ratios (4.5:1 for normal text)
- Color not the only means of conveying information
- High contrast mode support
- Reduced motion preferences respected

## 8. Performance Requirements

### 8.1 Bundle Size
- UnoCSS atomic CSS generation
- Tree-shaking for unused utilities
- Critical CSS inlined
- Non-critical CSS lazy-loaded

### 8.2 Runtime Performance
- Smooth 60fps animations
- <100ms interaction response time
- Efficient re-renders with SolidJS signals
- Minimal layout shifts

## 9. Implementation Phases

### Phase 1: Foundation Setup (3-5 tasks)
- Install and configure UnoCSS
- Set up design system tokens
- Create base layout components
- Implement theme switching

### Phase 2: Core Components (5-7 tasks)
- Build reusable UI component library
- Implement hook status cards
- Create settings panel
- Add navigation structure

### Phase 3: Feature Integration (4-6 tasks)
- Connect UI to Tauri backend
- Implement real-time status updates
- Add hook configuration controls
- System tray integration preview

### Phase 4: Polish & Enhancement (3-4 tasks)
- Add animations and micro-interactions
- Accessibility audit and fixes
- Performance optimization
- User testing and refinements

## 10. Success Metrics

### 10.1 User Experience Metrics
- Time to complete common tasks reduced by 40%
- User satisfaction score >4.5/5
- Zero accessibility violations
- <3 second app startup time

### 10.2 Technical Metrics
- Bundle size <2MB total
- 90+ Lighthouse performance score
- <16ms frame render time
- 100% component test coverage

## 11. Risk Assessment

### 11.1 Technical Risks
- **UnoCSS Learning Curve**: Team unfamiliar with utility-first CSS
- **SolidJS Integration**: Ensuring smooth UnoCSS + SolidJS workflow
- **Bundle Size**: Risk of CSS bloat without proper optimization

### 11.2 Mitigation Strategies
- Start with simple components and gradually increase complexity
- Use UnoCSS dev tools for debugging and optimization
- Implement CSS purging and minification
- Regular bundle analysis during development

## 12. Future Enhancements

### 12.1 Advanced Features
- Customizable themes and color schemes
- Plugin system for additional hook types
- Advanced statistics and analytics
- Export/import configuration profiles

### 12.2 Platform Extensions
- macOS version with native styling
- Linux version consideration
- Web-based configuration panel
- Mobile companion app

## 13. Conclusion

This PRD outlines a comprehensive approach to transforming the Inhibit Windows Events application into a polished, professional tool. By leveraging UnoCSS with SolidJS, we can create a maintainable, performant, and visually appealing interface that enhances the user experience while preserving the application's core functionality.

The phased approach ensures steady progress while allowing for iterative improvements and user feedback integration throughout the development process.