// Shared loading component used across the application
import React from 'react';

/**
 * Professional loading skeleton component
 * Can be used as Suspense fallback or during data fetching
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-6 text-gray-600 dark:text-gray-400 text-sm font-medium">{message}</p>
    </div>
  </div>
);

/**
 * Small inline loader for buttons and inline elements
 */
export const InlineLoader = ({ size = 'sm', color = 'white' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin inline-block`} />
  );
};

/**
 * Card skeleton for loading states
 */
export const CardSkeleton = ({ count = 1, className = '' }) => (
  <>
    {[...Array(count)].map((_, index) => (
      <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    ))}
  </>
);

/**
 * Table skeleton for loading states
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-100 dark:bg-gray-700">
        <tr>
          {[...Array(cols)].map((_, index) => (
            <th key={index} className="px-6 py-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, rowIndex) => (
          <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700">
            {[...Array(cols)].map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default PageLoader;
