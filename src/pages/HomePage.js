// HomePage.js
import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import Header from "../components/Header";
import Hero from "../components/Hero";
import JobCategories from "../components/JobCategories";
import FeaturedCompanies from "../components/FeaturedCompanies";
import SalaryExplorer from "../components/SalaryExplorer";
import TrendingSkills from "../components/TrendingSkills";
import Footer from "../components/Footer";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth loading to complete, then set local loading to false
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  // Professional Skeleton Loading with Theme Support
  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <Header user={user} />
        <main className="max-w-6xl mx-auto pt-20 py-8 px-4 sm:px-6 lg:px-8">
          {/* Hero Section Skeleton */}
          <div className="mb-16">
            <div className={`rounded-2xl p-8 lg:p-12 shadow-xl border ${
              darkMode
                ? 'bg-gray-800/50 border-gray-700/50'
                : 'bg-white/80 border-gray-200/50'
            } backdrop-blur-sm`}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="lg:w-1/2 space-y-6">
                  <div className="space-y-4">
                    <Skeleton
                      height={12}
                      width="30%"
                      baseColor={darkMode ? "#374151" : "#e5e7eb"}
                      highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                      className="rounded-full"
                    />
                    <Skeleton
                      height={48}
                      width="85%"
                      baseColor={darkMode ? "#374151" : "#e5e7eb"}
                      highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                      className="rounded-xl"
                    />
                    <Skeleton
                      height={24}
                      width="60%"
                      baseColor={darkMode ? "#374151" : "#e5e7eb"}
                      highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Stats Grid Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${
                        darkMode ? 'bg-gray-700/30 border-gray-600/30' : 'bg-gray-100/50 border-gray-200/50'
                      }`}>
                        <Skeleton
                          height={28}
                          width="50%"
                          baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                          highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                          className="mb-2 rounded-lg"
                        />
                        <Skeleton
                          height={16}
                          width="70%"
                          baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                          highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                          className="rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Form Skeleton */}
                <div className="lg:w-1/2">
                  <div className={`p-6 rounded-2xl shadow-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="space-y-4">
                      <Skeleton
                        height={20}
                        width="40%"
                        baseColor={darkMode ? "#374151" : "#e5e7eb"}
                        highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                        className="rounded-lg"
                      />
                      <Skeleton
                        height={48}
                        width="100%"
                        baseColor={darkMode ? "#374151" : "#e5e7eb"}
                        highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                        className="rounded-xl"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton
                          height={48}
                          width="100%"
                          baseColor={darkMode ? "#374151" : "#e5e7eb"}
                          highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                          className="rounded-xl"
                        />
                        <Skeleton
                          height={48}
                          width="100%"
                          baseColor={darkMode ? "#374151" : "#e5e7eb"}
                          highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                          className="rounded-xl"
                        />
                      </div>
                      <Skeleton
                        height={48}
                        width="100%"
                        baseColor={darkMode ? "#1f2937" : "#3b82f6"}
                        highlightColor={darkMode ? "#374151" : "#60a5fa"}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections Skeleton */}
          {[...Array(4)].map((_, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className={`p-6 rounded-2xl shadow-lg border mb-6 ${
                darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
              } backdrop-blur-sm`}>
                <Skeleton
                  height={32}
                  width="35%"
                  baseColor={darkMode ? "#374151" : "#e5e7eb"}
                  highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                  className="mb-4 rounded-xl"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, cardIndex) => (
                    <div key={cardIndex} className={`p-6 rounded-xl border ${
                      darkMode ? 'bg-gray-700/30 border-gray-600/30' : 'bg-gray-100/50 border-gray-200/50'
                    }`}>
                      <div className="flex items-center space-x-4 mb-4">
                        <Skeleton
                          circle
                          width={48}
                          height={48}
                          baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                          highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                        />
                        <div className="flex-1 space-y-2">
                          <Skeleton
                            height={18}
                            width="80%"
                            baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                            highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                            className="rounded"
                          />
                          <Skeleton
                            height={14}
                            width="60%"
                            baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                            highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                            className="rounded"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton
                          height={16}
                          width="90%"
                          baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                          highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                          className="rounded"
                        />
                        <Skeleton
                          height={16}
                          width="75%"
                          baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                          highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                          className="rounded"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <Skeleton
                          height={32}
                          width="40%"
                          baseColor={darkMode ? "#1f2937" : "#3b82f6"}
                          highlightColor={darkMode ? "#374151" : "#60a5fa"}
                          className="rounded-lg"
                        />
                        <Skeleton
                          height={32}
                          width="30%"
                          baseColor={darkMode ? "#374151" : "#e5e7eb"}
                          highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header user={user} />
      <main>
        <Hero user={user} />
        <JobCategories />
        <SalaryExplorer />
        <TrendingSkills />
        <FeaturedCompanies />
      </main>
      <Footer />
    </div>
  );
}
