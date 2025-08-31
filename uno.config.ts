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
    // Enhanced Button variants with animations
    ['btn', 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer btn-complete'],
    ['btn-primary', 'btn bg-blue-600 text-white hover:bg-blue-700 hover:scale-102 active:scale-98 focus-visible:scale-105'],
    ['btn-secondary', 'btn bg-gray-700 text-gray-100 hover:bg-gray-600 border border-gray-600 hover:scale-102'],
    ['btn-ghost', 'btn text-gray-300 hover:bg-gray-800 hover:scale-102'],
    ['btn-danger', 'btn bg-red-600 text-white hover:bg-red-700 hover:scale-102 active:scale-98'],
    
    // Enhanced Card styles with micro-interactions
    ['card', 'bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 card-complete'],
    ['card-hover', 'card transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1'],
    ['card-interactive', 'card-hover cursor-pointer hover:border-gray-600'],
    
    // Enhanced Layout with animations
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    ['app-layout', 'min-h-screen flex flex-col bg-gray-900 text-gray-100 layout-fade-in'],
    ['main-layout', 'flex-1 flex min-h-0 transition-all duration-300'],
    
    // Enhanced Status indicators with animations
    ['status-active', 'w-3 h-3 bg-green-500 rounded-full status-micro active transition-all duration-300'],
    ['status-inactive', 'w-3 h-3 bg-gray-400 rounded-full status-micro transition-all duration-300'],
    ['status-error', 'w-3 h-3 bg-red-500 rounded-full status-micro error transition-all duration-300'],
    ['status-warning', 'w-3 h-3 bg-yellow-500 rounded-full status-micro warning transition-all duration-300'],
    
    // Interactive states
    ['interactive', 'interactive-element transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg'],
    ['interactive-card', 'card-interactive cursor-pointer'],
    ['interactive-btn', 'btn-enhanced cursor-pointer'],
    
    // Form enhancements
    ['input-enhanced', 'input-micro transition-all duration-200'],
    ['toggle-enhanced', 'toggle-complete transition-all duration-200'],
    
    // Loading states
    ['loading-skeleton', 'animate-skeleton bg-gray-700 rounded'],
    ['loading-spinner', 'animate-spin'],
    ['loading-pulse', 'animate-pulse-gentle'],
    
    // Responsive utilities with animations
    ['sidebar-mobile', 'lg:relative absolute inset-y-0 left-0 z-50 lg:z-auto transition-transform duration-300'],
    ['sidebar-overlay', 'lg:hidden fixed inset-0 bg-black/50 z-40 modal-backdrop'],
    ['mobile-hidden', 'hidden lg:block'],
    ['desktop-hidden', 'lg:hidden'],
    
    // Animation utilities
    ['fade-in', 'layout-fade-in'],
    ['slide-up', 'layout-slide-in-up'],
    ['slide-down', 'layout-slide-in-down'],
    ['stagger', 'stagger-children'],
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
      'fadeIn': 'fadeIn 0.5s ease-in-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' }
      }
    }
  },
  
  // Rules for custom utilities
  rules: [
    // Missing utility definitions for shortcuts
    ['btn-complete', {
      'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'border': '1px solid transparent'
    }],
    
    ['card-complete', {
      'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }],
    
    ['status-micro', {
      'animation': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }],
    
    ['active', {
      'box-shadow': '0 0 0 2px rgba(34, 197, 94, 0.2)'
    }],
    
    ['layout-fade-in', {
      'animation': 'fadeIn 0.5s ease-in-out'
    }],
    
    ['interactive-element', {
      'transform': 'translateZ(0)',
      'transition-property': 'transform, box-shadow'
    }],
    
    ['modal-backdrop', {
      'backdrop-filter': 'blur(4px)',
      'animation': 'fadeIn 0.2s ease-out'
    }],
    
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