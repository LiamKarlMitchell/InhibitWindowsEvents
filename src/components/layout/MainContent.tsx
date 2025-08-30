import { JSX } from "solid-js";

interface MainContentProps {
  activeSection?: string;
  children?: JSX.Element;
  title?: string;
  subtitle?: string;
}

function MainContent(props: MainContentProps) {
  return (
    <main 
      class="flex-1 overflow-auto bg-gray-900"
      role="main"
      aria-labelledby="main-content-title"
    >
      <div class="p-6 max-w-6xl mx-auto">
        {/* Content Header */}
        {(props.title || props.subtitle) && (
          <header class="mb-6">
            {props.title && (
              <h1 
                id="main-content-title"
                class="text-2xl font-semibold text-gray-100 mb-2"
              >
                {props.title}
              </h1>
            )}
            {props.subtitle && (
              <p class="text-gray-400 text-sm">
                {props.subtitle}
              </p>
            )}
          </header>
        )}

        {/* Main Content Area */}
        <div class="space-y-6">
          {props.children || (
            <div class="text-center py-12">
              <div class="i-lucide-layout-dashboard text-4xl text-gray-600 mb-4 mx-auto"></div>
              <h2 class="text-xl font-medium text-gray-300 mb-2">
                Select a section
              </h2>
              <p class="text-gray-500 text-sm">
                Choose from the navigation menu to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        class="
          fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full
          shadow-lg hover:bg-blue-700 focus-ring transition-all duration-200
          opacity-0 invisible hover:opacity-100 hover:visible
        "
        onClick={() => {
          const main = document.querySelector('main');
          main?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <div class="i-lucide-arrow-up text-lg"></div>
      </button>
    </main>
  );
}

export default MainContent;