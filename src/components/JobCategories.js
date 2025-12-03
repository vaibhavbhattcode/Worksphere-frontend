import React, { useEffect, useState } from "react";
import {
  FaLaptopCode,
  FaChartLine,
  FaStethoscope,
  FaArrowRight,
  FaGraduationCap,
  FaCog,
  FaShoppingBag,
  FaBuilding,
  FaTruck,
  FaBolt,
  FaFilm,
  FaHome,
  FaBalanceScale,
  FaBriefcase,
  FaConciergeBell,
  FaSeedling,
  FaLandmark,
  FaHeart,
  FaBroadcastTower,
  FaCar,
  FaPills,
} from "react-icons/fa";
import { motion } from "framer-motion";
import axiosInstance from "../axiosInstance";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function JobCategories() {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  // Removed showAll toggle logic (button caused blank state); always show limited set.
  const [loading, setLoading] = useState(true);
  const { userLoading } = useAuth();

  // Icon mapping function with all industry icons
  const getIconComponent = (iconName) => {
    const iconProps = { className: "text-3xl drop-shadow-lg" };
    try {
      switch (iconName) {
        case "laptop-code":
          return <FaLaptopCode {...iconProps} />;
        case "stethoscope":
          return <FaStethoscope {...iconProps} />;
        case "chart-line":
          return <FaChartLine {...iconProps} />;
        case "graduation-cap":
          return <FaGraduationCap {...iconProps} />;
        case "cog":
          return <FaCog {...iconProps} />;
        case "shopping-bag":
          return <FaShoppingBag {...iconProps} />;
        case "building":
          return <FaBuilding {...iconProps} />;
        case "truck":
          return <FaTruck {...iconProps} />;
        case "bolt":
          return <FaBolt {...iconProps} />;
        case "film":
          return <FaFilm {...iconProps} />;
        case "home":
          return <FaHome {...iconProps} />;
        case "balance-scale":
          return <FaBalanceScale {...iconProps} />;
        case "briefcase":
          return <FaBriefcase {...iconProps} />;
        case "concierge-bell":
          return <FaConciergeBell {...iconProps} />;
        case "seedling":
          return <FaSeedling {...iconProps} />;
        case "landmark":
          return <FaLandmark {...iconProps} />;
        case "heart":
          return <FaHeart {...iconProps} />;
        case "broadcast-tower":
          return <FaBroadcastTower {...iconProps} />;
        case "car":
          return <FaCar {...iconProps} />;
        case "pills":
          return <FaPills {...iconProps} />;
        default:
          return <FaBriefcase {...iconProps} />;
      }
    } catch (error) {
      console.error(`Error rendering icon ${iconName}:`, error);
      return <FaBriefcase {...iconProps} />;
    }
  };

  // Fetch industries from the database
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching trending industries from database...");

        // Fetch trending industries (this will be the main data source)
  const response = await axiosInstance.get("/jobs/trending-industries");
        console.log("✅ Trending industries fetched:", response.data);

        if (response.data && response.data.length > 0) {
          const industries = response.data.map((industry) => ({
            _id: industry._id,
            title: industry.title,
            icon: industry.icon || "briefcase",
            gradient: industry.gradient || "from-gray-500 to-gray-400",
            description: industry.description || "",
            jobs: `${industry.totalJobs}+`,
            totalJobs: industry.totalJobs || 0,
            growth: industry.growth || Math.floor(Math.random() * 30) + 10,
            roles: industry.roles || [],
            isActive: industry.isActive !== false,
          }));

          console.log("📊 Processed trending industries:", industries);
          setCategories(industries);
          setTrending(industries.slice(0, 6)); // Set trending to first 6 industries
        } else {
          throw new Error("No industries data received");
        }
      } catch (error) {
        console.error("❌ Error fetching industries:", error);

        // Fallback to mock data if API fails
        console.log("🔄 Using fallback data...");
        const fallbackCategories = [
          {
            _id: "1",
            title: "Technology",
            icon: "laptop-code",
            jobs: "12,500+",
            gradient: "from-blue-500 to-cyan-500",
            totalJobs: 12500,
            growth: 28,
            description: "Software development and IT services",
            roles: [
              { jobId: "tech1", title: "Software Engineer" },
              { jobId: "tech2", title: "Data Scientist" },
              { jobId: "tech3", title: "Product Manager" },
            ],
          },
          {
            _id: "2",
            title: "Healthcare",
            icon: "stethoscope",
            jobs: "8,200+",
            gradient: "from-green-500 to-emerald-500",
            totalJobs: 8200,
            growth: 22,
            description: "Medical and healthcare services",
            roles: [
              { jobId: "health1", title: "Registered Nurse" },
              { jobId: "health2", title: "Physician Assistant" },
              { jobId: "health3", title: "Medical Assistant" },
            ],
          },
          {
            _id: "3",
            title: "Finance",
            icon: "chart-line",
            jobs: "6,800+",
            gradient: "from-purple-500 to-pink-500",
            totalJobs: 6800,
            growth: 15,
            description: "Banking and financial services",
            roles: [
              { jobId: "finance1", title: "Financial Analyst" },
              { jobId: "finance2", title: "Investment Banker" },
              { jobId: "finance3", title: "Accountant" },
            ],
          },
          {
            _id: "4",
            title: "Education",
            icon: "graduation-cap",
            jobs: "5,400+",
            gradient: "from-indigo-500 to-purple-500",
            totalJobs: 5400,
            growth: 18,
            description: "Schools, universities, and training",
            roles: [
              { jobId: "edu1", title: "Teacher" },
              { jobId: "edu2", title: "Professor" },
              { jobId: "edu3", title: "Education Coordinator" },
            ],
          },
          {
            _id: "5",
            title: "Manufacturing",
            icon: "cog",
            jobs: "4,200+",
            gradient: "from-gray-500 to-gray-400",
            totalJobs: 4200,
            growth: 12,
            description: "Industrial production and assembly",
            roles: [
              { jobId: "mfg1", title: "Production Manager" },
              { jobId: "mfg2", title: "Quality Engineer" },
              { jobId: "mfg3", title: "Machinist" },
            ],
          },
        ];
        setCategories(fallbackCategories);
        setTrending(fallbackCategories.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 15 },
    },
  };

  if (loading || userLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 min-h-[360px] animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Helper to render the trending section
  const renderCategorySection = (title, cats) => (
    cats && cats.length > 0 && (
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-7">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </span>
          <span className="ml-2 px-3 py-1 text-xs rounded-full bg-indigo-50 dark:bg-purple-900/30 text-indigo-600 dark:text-purple-300 font-semibold tracking-wider animate-pulse">
            High Growth
          </span>
        </div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {cats.slice(0, 3).map((cat, index) => (
            <motion.article
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.04, y: -8 }}
              className="group bg-white/90 dark:bg-gray-900/80 rounded-3xl p-8 shadow-xl min-h-[380px] flex flex-col justify-between border border-gray-100/30 dark:border-gray-700/30 transition-all duration-200 hover:shadow-2xl hover:border-indigo-300 dark:hover:border-purple-400 focus-within:ring-2 focus-within:ring-indigo-400"
              aria-label={`Job category: ${cat.title}`}
              tabIndex={0}
            >
              <div>
                <motion.div
                  className={`mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r ${cat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}
                  whileHover={{ scale: 1.12 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-white text-3xl drop-shadow-lg">
                    {getIconComponent(cat.icon)}
                  </span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-700 dark:group-hover:text-purple-400 transition-colors">
                  {cat.title}
                </h3>
                {cat.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                    <span className="font-bold text-indigo-600 dark:text-purple-400 text-lg">
                      {cat.jobs}
                    </span>{" "}
                    Open Positions
                  </p>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-purple-400 bg-indigo-100 dark:bg-purple-900/30 px-3 py-1 rounded-full shadow-sm">
                    +{cat.growth || 0}% Growth
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
                  <motion.div
                    className={`bg-gradient-to-r ${cat.gradient} h-3 rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(cat.growth || 0, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
                <div className="mb-7">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 tracking-wide uppercase">
                    Open Positions:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {cat.roles && cat.roles.length > 0 ? (
                      cat.roles.slice(0, 3).map((role, i) => (
                        <Link
                          key={i}
                          to={role.jobId ? `/job/${role.jobId}` : `/jobs?industry=${encodeURIComponent(cat.title)}`}
                          className={`px-3 py-1 text-xs rounded-full font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                            role.jobId
                              ? "bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-purple-900 hover:text-indigo-600 dark:hover:text-purple-400"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-purple-900 hover:text-indigo-600 dark:hover:text-purple-400"
                          }`}
                          aria-label={`View ${role.title} job`}
                          tabIndex={role.jobId ? 0 : 0}
                        >
                          {role.title}
                        </Link>
                      ))
                    ) : (
                      <div className="w-full">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          No specific roles available
                        </p>
                        <Link
                          to={`/jobs?industry=${encodeURIComponent(cat.title)}`}
                          className="inline-flex items-center px-3 py-1 text-xs rounded-full font-medium text-indigo-600 dark:text-purple-400 bg-indigo-50 dark:bg-purple-900/30 hover:bg-indigo-100 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          View All {cat.title} Jobs
                          <FaArrowRight className="ml-1 w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Link
                to={`/jobs?industry=${encodeURIComponent(cat.title)}`}
                className="w-full flex items-center justify-between px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-2xl hover:shadow-glow transition-all group font-semibold text-base mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label={`Explore ${cat.title} jobs`}
                tabIndex={0}
              >
                <span>Browse Opportunities</span>
                <FaArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    )
  );

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div
        className="absolute -top-16 -left-16 w-[340px] h-[340px] bg-gradient-to-br from-indigo-200/40 to-purple-200/10 rounded-full blur-3xl z-0 pointer-events-none select-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 w-[360px] h-[360px] bg-gradient-to-tr from-purple-200/30 to-pink-200/10 rounded-full blur-3xl z-0 pointer-events-none select-none"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 overflow-visible">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            Discover High-Demand Career Paths
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Explore thriving industries, trending roles, and real open positions
            in today's job market.
          </p>
        </motion.div>

        {/* Trending Section */}
        {renderCategorySection("Trending", trending)}

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            to="/jobs"
            className="inline-flex items-center px-10 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-purple-500 dark:to-pink-500 rounded-2xl hover:shadow-glow transition-all gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Explore all job categories"
          >
            Explore All Categories
            <FaArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}