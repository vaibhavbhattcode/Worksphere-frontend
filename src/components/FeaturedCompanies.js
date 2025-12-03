// FeaturedCompanies.js
import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { useAuth } from "../context/AuthContext"; // Add user context for personalization
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaBriefcase, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
import { getCompanyLogo } from "../utils/companyUtils";

export default function FeaturedCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth(); // Get user for personalization

  // Fetch companies (professional logic)
  const fetchFeaturedCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(
        "/company-profiles/featured-random"
      );
      setCompanies(response.data);
    } catch (err) {
      setError(
        "Could not fetch live featured companies. Showing a random sample."
      );
      setCompanies([
        {
          _id: "1",
          company: "innovex-solutions",
          companyName: "Innovex Solutions",
          industry: "Technology",
          logo: "https://source.unsplash.com/100x100/?tech,logo",
          totalActiveJobs: 12,
          companySize: "500-1000 employees",
          companyAddress: "San Francisco, CA",
        },
        {
          _id: "2",
          company: "datacore-technologies",
          companyName: "DataCore Technologies",
          industry: "Data Analytics",
          logo: "https://source.unsplash.com/100x100/?data,logo",
          totalActiveJobs: 8,
          companySize: "100-500 employees",
          companyAddress: "New York, NY",
        },
        {
          _id: "3",
          company: "brightpath-inc",
          companyName: "BrightPath Inc.",
          industry: "Marketing",
          logo: "https://source.unsplash.com/100x100/?marketing,logo",
          totalActiveJobs: 5,
          companySize: "50-100 employees",
          companyAddress: "Austin, TX",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedCompanies();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Featured Companies
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover the pioneers shaping the future of work
          </p>
          <button
            onClick={fetchFeaturedCompanies}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow hover:shadow-xl transition-all text-sm font-semibold"
            aria-label="Show another set of featured companies"
            disabled={loading}
          >
            {loading ? "Loading..." : "Show Another Set"}
          </button>
          {error && (
            <div className="mt-4 p-2 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 text-sm">
              {error}
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-5 min-h-[300px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company, index) => (
              <motion.div
                key={company._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  boxShadow: "0 8px 32px 0 rgba(99,102,241,0.15)",
                }}
                className="relative glassmorphism rounded-3xl p-8 shadow-xl min-h-[340px] flex flex-col justify-between border border-indigo-100 dark:border-purple-900/30 hover:border-indigo-400 dark:hover:border-pink-400 transition-all group overflow-hidden"
                aria-label={`Featured company: ${company.companyName}`}
              >
                {/* Decorative gradient ring */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-indigo-400/30 to-purple-400/20 rounded-full blur-2xl z-0" />
                <motion.div
                  className="mb-4 flex justify-center z-10"
                  whileHover={{ scale: 1.13 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative flex flex-col items-center">
                    <img
                      src={getCompanyLogo(company.logo)}
                      alt={company.companyName || "Company Logo"}
                      className="w-20 h-20 object-cover rounded-full border-4 border-indigo-200 dark:border-purple-400 shadow-md bg-white group-hover:scale-105 transition-transform"
                    />
                    {/* Badges: horizontally below logo, above industry label */}
                    <div className="flex flex-row items-center justify-center gap-2 mt-3 mb-1">
                      {company.isNew && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md border-2 border-white">New</span>
                      )}
                      {company.isHot && (
                        <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md border-2 border-white">Hot</span>
                      )}
                      {company.totalActiveJobs > 0 && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md border-2 border-white">Hiring Now</span>
                      )}
                    </div>
  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full shadow font-semibold mb-2">
    {company.industry || "Industry"}
  </span>
</div>
                </motion.div>
                {/* Company Info */}
                <div className="text-center z-10">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight group-hover:text-indigo-700 dark:group-hover:text-pink-400 transition-colors">
                    {company.companyName}
                  </h3>
                </div>
                {/* Details Section */}
                <div className="space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaBriefcase className="text-indigo-500 dark:text-purple-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Active Jobs
                      </span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-purple-400">
                      {company.totalActiveJobs || "No Jobs"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaUsers className="text-indigo-500 dark:text-purple-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Company Size
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {company.companySize || "Not Specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-indigo-500 dark:text-purple-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Location
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {company.companyAddress || "Not Available"}
                    </span>
                  </div>
                </div>
                {/* View Profile Button */}
                <motion.div
                  className="text-center mt-7 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    to={`/company/profile/${company.company || company._id}`}
                    className="inline-block px-7 py-3 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-glow dark:from-purple-500 dark:to-pink-500 transition-all duration-300 group-hover:scale-105"
                    aria-label={`View ${company.companyName} profile`}
                  >
                    View Profile
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
