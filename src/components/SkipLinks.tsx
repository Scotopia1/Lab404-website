import React from 'react';
import { useSkipLinks } from '@/hooks/useFocusManagement';

export const SkipLinks: React.FC = () => {
  const { skipTo } = useSkipLinks();

  return (
    <nav 
      className="sr-only focus-within:not-sr-only bg-blue-600 text-white p-2"
      aria-label="Skip navigation links"
    >
      <div className="max-w-7xl mx-auto flex space-x-4">
        <button
          onClick={() => skipTo('main-content')}
          className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded px-2 py-1"
        >
          Skip to main content
        </button>
        <button
          onClick={() => skipTo('main-navigation')}
          className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded px-2 py-1"
        >
          Skip to navigation
        </button>
        <button
          onClick={() => skipTo('search')}
          className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded px-2 py-1"
        >
          Skip to search
        </button>
      </div>
    </nav>
  );
};

export default SkipLinks;