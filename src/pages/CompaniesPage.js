import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axiosInstance from "../axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { startConversation } from "../api/chatApi";
import { FaSearch, FaFilter, FaBuilding, FaBriefcase, FaEnvelope, FaTimes } from "react-icons/fa";
import Select from "react-select";
import { useAuth } from "../context/AuthContext";

// Premium Skeleton Card
const SkeletonCompanyCard = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse flex flex-col space-y-4">
    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl mx-auto" />
    <div className="space-y-3">
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-3/4 mx-auto" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-1/2 mx-auto" />
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
    </div>
  </div>
);

// Memoized Company Card Component
const CompanyCard = React.memo(({ company, index, navigate, user, userType }) => {
  const [logoError, setLogoError] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/50 dark:group-hover:from-blue-900/10 dark:group-hover:to-purple-900/10 transition-all duration-300 pointer-events-none" />
      
      {/* Job Openings Badge */}
      {company.jobOpenings > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10"
        >
          {company.jobOpenings} {company.jobOpenings === 1 ? 'Opening' : 'Openings'}
        </motion.div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center h-full flex-1">
        {/* Company Logo */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="mb-4 relative"
        >
            {company.logo && !logoError ? (
              <img
                src={company.logo}
                alt={`${company.companyName} logo`}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-all duration-300"
                loading="lazy"
                decoding="async"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div aria-hidden className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-200">{(company.companyName || ' ').split(' ').map(s => s[0]).slice(0, 2).join('')}</div>
            )}
          {company.industry && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-full shadow-md whitespace-nowrap">
              {company.industry}
            </div>
          )}
        </motion.div>

        {/* Company Name */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {company.companyName}
        </h2>

        {/* Tagline - Fixed height for consistency */}
        <div className="min-h-[3.5rem] mb-6 flex items-center justify-center">
          {company.tagline ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center line-clamp-2 px-2">
              {company.tagline}
            </p>
          ) : (
            <div className="min-h-[3.5rem]"></div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 mt-auto">
          <Link
            to={`/company/profile/${company.company || company._id}`}
            className="block w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-center"
          >
            View Profile
          </Link>
          {userType === "user" && user && (
            <button
              onClick={async () => {
                try {
                  await startConversation("user", { companyId: company.company || company._id });
                  navigate("/chat");
                } catch (e) {
                  console.error("Error starting conversation:", e);
                }
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <FaEnvelope />
              <span>Start Chat</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

CompanyCard.displayName = 'CompanyCard';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CompaniesPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [displayedCompanies, setDisplayedCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );
  
  // Infinite scroll / batching
  const BATCH_SIZE = 20;
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const isFilteringRef = useRef(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      setIndustriesLoading(true);
      try {
        const response = await axiosInstance.get("/industries");
        if (response.data && response.data.success && response.data.data) {
          const industriesData = response.data.data.map(industry => ({
            value: industry.name,
            label: industry.name,
            ...industry
          }));
          setIndustries(industriesData);
        }
      } catch (error) {
        console.error("Error fetching industries:", error);
      } finally {
        setIndustriesLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  // Theme observer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError("");
        const companiesRes = await axiosInstance.get("/companies");
        const companiesData = companiesRes.data || [];
        setCompanies(companiesData);
      } catch (err) {
        console.error("Error fetching companies:", err);
        setError("Failed to load companies. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Filter and search companies
  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          (company.companyName && company.companyName.toLowerCase().includes(query)) ||
          (company.tagline && company.tagline.toLowerCase().includes(query)) ||
          (company.industry && company.industry.toLowerCase().includes(query))
      );
    }

    // Apply industry filter
    if (selectedIndustries.length > 0) {
      const industryNames = selectedIndustries.map(ind => ind.value || ind);
      filtered = filtered.filter(
        (company) => company.industry && industryNames.includes(company.industry)
      );
    }

    return filtered;
  }, [companies, debouncedSearchQuery, selectedIndustries]);

  // Calculate hasMore based on filtered companies, not all companies
  const hasMore = useMemo(() => {
    return displayedCompanies.length < filteredCompanies.length;
  }, [displayedCompanies.length, filteredCompanies.length]);

  // Reset display count when filters change - prevent flickering
  useEffect(() => {
    // Set filtering flag to prevent observer from triggering
    isFilteringRef.current = true;
    setLoadingMore(false);
    
    // Reset display count immediately
    setDisplayCount(12);
    
    // Clear any pending timeouts
    const timeoutId = setTimeout(() => {
      isFilteringRef.current = false;
    }, 600);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [debouncedSearchQuery, selectedIndustries]);

  // Update displayed companies (for lazy loading)
  useEffect(() => {
    setDisplayedCompanies(filteredCompanies.slice(0, displayCount));
  }, [filteredCompanies, displayCount]);

  // Infinite scroll - Fixed to prevent infinite loading
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't set up observer if filtering or loading
    if (isFilteringRef.current || loading || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        // Only load more if:
        // 1. Element is intersecting
        // 2. There are more companies to load
        // 3. Not currently loading
        // 4. Not in initial loading state
        // 5. Not currently filtering
        if (
          firstEntry.isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !isFilteringRef.current
        ) {
          setLoadingMore(true);
          // Use requestAnimationFrame for smoother updates
          requestAnimationFrame(() => {
            setDisplayCount(prev => {
              const newCount = prev + BATCH_SIZE;
              // Ensure we don't exceed filtered companies length
              const maxCount = filteredCompanies.length;
              return Math.min(newCount, maxCount);
            });
            // Reset loading state after update
            setTimeout(() => {
              setLoadingMore(false);
            }, 300);
          });
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observerRef.current = observer;

    const currentRef = loadMoreRef.current;
    if (currentRef && hasMore && !isFilteringRef.current) {
      observer.observe(currentRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, filteredCompanies.length]);

  // Manual load more for accessibility / very large lists
  const handleLoadMoreClick = () => {
    if (!hasMore) return;
    setLoadingMore(true);
    setDisplayCount((prev) => Math.min(prev + BATCH_SIZE, filteredCompanies.length));
    setTimeout(() => setLoadingMore(false), 250);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedIndustries([]);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCompanyCard key={idx} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md"
          >
            <p className="text-red-600 dark:text-red-400 text-xl font-semibold mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
            >
              Retry
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Explore Top Companies
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover innovative employers and exciting career opportunities waiting for you
            </p>
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Search Bar */}
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search companies by name, industry, or tagline..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Industry Filter */}
                <div>
                  <Select
                    key={`industry-select-${isDarkMode}`}
                    isMulti
                    options={industries}
                    value={selectedIndustries}
                    onChange={setSelectedIndustries}
                    placeholder="Filter by industry..."
                    isClearable
                    isSearchable
                    isLoading={industriesLoading}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                        borderColor: state.isFocused 
                          ? '#6366f1' 
                          : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                        borderRadius: '12px',
                        minHeight: '48px',
                        boxShadow: state.isFocused 
                          ? '0 0 0 3px rgba(99, 102, 241, 0.1)' 
                          : (isDarkMode ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'),
                        '&:hover': {
                          borderColor: '#6366f1',
                        },
                      }),
                      menu: (provided) => ({
                        ...provided,
                        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        boxShadow: isDarkMode 
                          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                          : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 9999,
                      }),
                      menuPortal: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected
                          ? '#6366f1'
                          : state.isFocused
                          ? (isDarkMode ? '#4b5563' : '#f3f4f6')
                          : (isDarkMode ? '#374151' : '#ffffff'),
                        color: state.isSelected 
                          ? '#ffffff' 
                          : (isDarkMode ? '#f3f4f6' : '#1f2937'),
                      }),
                      multiValue: (provided) => ({
                        ...provided,
                        backgroundColor: '#6366f1',
                        borderRadius: '8px',
                      }),
                      multiValueLabel: (provided) => ({
                        ...provided,
                        color: '#ffffff',
                      }),
                      multiValueRemove: (provided) => ({
                        ...provided,
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#4f46e5',
                        },
                      }),
                    }}
                  />
                </div>
              </div>

              {/* Active Filters & Clear Button */}
              {(debouncedSearchQuery || selectedIndustries.length > 0) && (
                <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active filters:
                    </span>
                    {debouncedSearchQuery && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        Search: "{debouncedSearchQuery}"
                      </span>
                    )}
                    {selectedIndustries.map((industry, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium"
                      >
                        {industry.label || industry.value}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    <FaTimes />
                    <span>Clear all</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center justify-between"
          >
            <p className="text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{displayedCompanies.length}</span> of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{filteredCompanies.length}</span> companies
            </p>
          </motion.div>

          {/* Companies Grid */}
          {displayedCompanies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <FaBuilding className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No companies found
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Try adjusting your search or filters
              </p>
            </motion.div>
          ) : (
            <>
              {/* Horizontal scrollable list with snap behavior */}
              <div className="-mx-4 px-4">
                <div className="flex gap-6 overflow-x-auto py-4 snap-x snap-mandatory touch-pan-x scrollbar-thin scrollbar-thumb-indigo-300 dark:scrollbar-thumb-indigo-700">
                  <AnimatePresence>
                    {displayedCompanies.map((company, index) => (
                      <div key={company._id} className="snap-start flex-shrink-0 w-[280px] sm:w-72 md:w-80 lg:w-96">
                        <CompanyCard
                          company={company}
                          index={index}
                          navigate={navigate}
                          user={user}
                          userType={userType}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex flex-col items-center py-8">
                  {loadingMore ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Loading more companies...</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleLoadMoreClick}
                      className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition-colors"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}

              {/* End of Results */}
              {!hasMore && displayedCompanies.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    You've reached the end of the results
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CompaniesPage;
