import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigateHome?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigateHome }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 max-w-7xl mx-auto w-full">
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 font-medium">
        <li className="inline-flex items-center">
          <button
            type="button"
            onClick={onNavigateHome || (() => {
              if (typeof window !== 'undefined') {
                window.history.pushState(null, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            })}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.active;
          return (
            <li key={index} className="inline-flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {isLast ? (
                <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-[320px]" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-slate-500 hover:text-blue-600 transition-colors truncate max-w-[160px] sm:max-w-[220px] cursor-pointer"
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  className="text-slate-500 hover:text-blue-600 transition-colors truncate max-w-[160px] sm:max-w-[220px]"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-slate-500 truncate max-w-[160px] sm:max-w-[220px]">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
