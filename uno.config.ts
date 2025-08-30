import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      // Enable dark mode with class-based strategy
      dark: 'class'
    }),
    presetIcons({
      // Use Lucide icons through Iconify
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default)
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    })
  ],
  
  // Shortcuts for common patterns
  shortcuts: [
    // Button variants
    ['btn', 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer'],
    ['btn-primary', 'btn bg-blue-600 text-white hover:bg-blue-700 active:scale-98'],
    ['btn-secondary', 'btn bg-gray-700 text-gray-100 hover:bg-gray-600 border border-gray-600'],
    ['btn-ghost', 'btn text-gray-300 hover:bg-gray-800'],
    ['btn-danger', 'btn bg-red-600 text-white hover:bg-red-700 active:scale-98'],
    
    // Card styles
    ['card', 'bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6'],
    ['card-hover', 'card transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5'],
    
    // Layout
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    ['app-layout', 'min-h-screen flex flex-col bg-gray-900 text-gray-100'],
    ['main-layout', 'flex-1 flex'],
    
    // Status indicators
    ['status-active', 'w-3 h-3 bg-green-500 rounded-full'],
    ['status-inactive', 'w-3 h-3 bg-gray-400 rounded-full'],
    ['status-error', 'w-3 h-3 bg-red-500 rounded-full'],
    
    // Responsive utilities
    ['sidebar-mobile', 'lg:relative absolute inset-y-0 left-0 z-50 lg:z-auto'],
    ['sidebar-overlay', 'lg:hidden fixed inset-0 bg-black/50 z-40'],
    ['mobile-hidden', 'hidden lg:block'],
    ['desktop-hidden', 'lg:hidden'],
  ],
  
  // CSS custom properties for theming
  theme: {
    colors: {
      // Dark theme colors using standard Tailwind names
      'primary': {
        50: '#f8fafc',
        900: '#0f1419'
      },
      'secondary': {
        50: '#f1f5f9', 
        800: '#1a1f29'
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    animation: {
      'spin-slow': 'spin 3s linear infinite',
      'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }
  },
  
  // Rules for custom utilities
  rules: [
    // Custom glass effect
    ['glass', { 
      'backdrop-filter': 'blur(10px) saturate(180%)',
      'background': 'rgba(255, 255, 255, 0.1)',
      'border': '1px solid rgba(255, 255, 255, 0.2)'
    }],
    
    // Custom scrollbar
    ['scrollbar-none', {
      'scrollbar-width': 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    }],
    
    // Custom focus ring with better visibility
    ['focus-ring', {
      '&:focus': {
        outline: '2px solid #3b82f6',
        'outline-offset': '2px',
        'box-shadow': '0 0 0 4px rgba(59, 130, 246, 0.1)'
      },
      '&:focus:not(:focus-visible)': {
        outline: 'none',
        'box-shadow': 'none'
      }
    }],
    
    // High contrast focus for accessibility
    ['focus-ring-high-contrast', {
      '&:focus': {
        outline: '3px solid #ffffff',
        'outline-offset': '2px',
        'box-shadow': '0 0 0 6px #000000'
      }
    }],
    
    // Screen reader only
    ['sr-only', {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      'white-space': 'nowrap',
      border: '0'
    }],
    
    // High contrast mode support
    ['force-colors-adjust', {
      'forced-color-adjust': 'auto'
    }]
  ],
  
  // Content sources for purging
  content: {
    filesystem: [
      'src/**/*.{tsx,ts,jsx,js}',
      'index.html'
    ]
  }
})