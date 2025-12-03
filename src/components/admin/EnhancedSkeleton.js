// src/components/admin/EnhancedSkeleton.js
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Enhanced skeleton loader for table rows
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.1 }}
          className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm"
        >
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '60%' }} />
            <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: '40%' }} />
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Enhanced skeleton loader for cards/grid items
 */
export const CardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse"
        >
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>

            {/* Stats skeleton */}
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>

            {/* Actions skeleton */}
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-16" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Enhanced skeleton loader for profile/list items
 */
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm animate-pulse"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Enhanced skeleton loader for forms
 */
export const FormSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="flex justify-end space-x-3">
        <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Enhanced skeleton loader for analytics/charts
 */
export const AnalyticsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Stats cards */}
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          </div>
        </motion.div>
      ))}

      {/* Chart skeleton */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow-sm animate-pulse"
      >
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </motion.div>
    </div>
  );
};

/**
 * Enhanced skeleton loader for dashboard charts
 */
export const DashboardChartSkeleton = ({ type = 'bar' }) => {
  return (
    <div className="space-y-4">
      {/* Chart Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 sm:gap-3">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>

      {/* Chart Area Skeleton */}
      <div className="h-48 sm:h-56 lg:h-64 relative">
        <div className="absolute inset-0 bg-gray-100 rounded-lg">
          {type === 'bar' ? (
            /* Bar chart skeleton */
            <div className="flex items-end justify-center h-full px-4 py-6 space-x-2">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.random() * 80 + 20}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-gradient-to-t from-blue-200 to-blue-300 rounded-t w-6 sm:w-8 animate-pulse"
                />
              ))}
            </div>
          ) : type === 'line' ? (
            /* Line chart skeleton */
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                d="M 5,80 Q 25,60 45,70 T 85,50"
                stroke="rgb(203 213 225)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
              {[...Array(5)].map((_, i) => (
                <motion.circle
                  key={i}
                  initial={{ r: 0 }}
                  animate={{ r: 1.5 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  cx={20 + i * 15}
                  cy={65 - Math.random() * 20}
                  fill="rgb(203 213 225)"
                  className="animate-pulse"
                />
              ))}
            </svg>
          ) : (
            /* Pie chart skeleton */
            <div className="flex items-center justify-center h-full">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {[
                    { percentage: 45, color: 'rgb(245 158 11)' },
                    { percentage: 30, color: 'rgb(16 185 129)' },
                    { percentage: 15, color: 'rgb(59 130 246)' },
                    { percentage: 10, color: 'rgb(239 68 68)' }
                  ].map((segment, index) => (
                    <motion.circle
                      key={index}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: segment.percentage / 100 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={segment.color}
                      strokeWidth="20"
                      fill="none"
                      strokeLinecap="round"
                      className="animate-pulse"
                      strokeDasharray={`${segment.percentage * 2.51} ${251 - segment.percentage * 2.51}`}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend Skeleton for pie chart */}
      {type === 'pie' && (
        <div className="flex flex-wrap justify-center gap-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced skeleton loader for dashboard stats cards
 */
export const DashboardStatsSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="group relative bg-gradient-to-br from-gray-50 to-gray-100 p-5 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm overflow-hidden animate-pulse"
        >
          {/* Background Pattern Skeleton */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 opacity-50"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12"></div>

          <div className="relative flex items-center justify-between h-full">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="h-8 sm:h-9 font-bold bg-gray-300 rounded w-16"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
            <div className="bg-gray-300 p-3 rounded-xl ml-4 w-12 h-12 sm:w-14 sm:h-14"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Enhanced skeleton loader for dashboard sections
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7 animate-pulse"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-2xl"></div>

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
            <div className="space-y-3">
              <div className="h-8 sm:h-9 lg:h-10 bg-gray-200 rounded-lg w-64 sm:w-80 lg:w-96"></div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-96 sm:w-[500px] lg:w-[600px]"></div>
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 py-3 rounded-xl shadow-lg border border-emerald-100 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-3 h-3 bg-emerald-200 rounded-full"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-emerald-300 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-emerald-200 rounded w-20"></div>
                    <div className="h-4 bg-emerald-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Skeleton */}
      <DashboardStatsSkeleton count={3} />

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="group relative bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-xl sm:rounded-2xl"></div>
          <div className="relative">
            <DashboardChartSkeleton type="bar" />
          </div>
        </div>

        <div className="group relative bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-indigo-50/30 rounded-xl sm:rounded-2xl"></div>
          <div className="relative">
            <DashboardChartSkeleton type="line" />
          </div>
        </div>
      </div>

      {/* Job Status Overview Skeleton */}
      <div className="group relative bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-orange-50/30 rounded-xl sm:rounded-2xl"></div>
        <div className="relative">
          <DashboardChartSkeleton type="pie" />
        </div>
      </div>
    </div>
  );
};

/**
 * Main skeleton component that renders appropriate skeleton based on type
 */
export const EnhancedSkeleton = ({
  type = 'card',
  count = 6,
  rows = 5,
  columns = 4,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return <TableSkeleton rows={rows} columns={columns} />;
      case 'card':
        return <CardSkeleton count={count} />;
      case 'list':
        return <ListSkeleton count={count} />;
      case 'form':
        return <FormSkeleton />;
      case 'analytics':
        return <AnalyticsSkeleton />;
      case 'modal':
        return <ModalSkeleton />;
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'dashboard-stats':
        return <DashboardStatsSkeleton count={count} />;
      case 'chart':
        return <DashboardChartSkeleton type="bar" />;
      case 'bar-chart':
        return <DashboardChartSkeleton type="bar" />;
      case 'line-chart':
        return <DashboardChartSkeleton type="line" />;
      case 'pie-chart':
        return <DashboardChartSkeleton type="pie" />;
      default:
        return <CardSkeleton count={count} />;
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

export default EnhancedSkeleton;
