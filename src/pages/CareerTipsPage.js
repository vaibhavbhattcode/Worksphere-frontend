import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaHeart, FaBookmark, FaShare, FaStar, FaClock, FaEye, FaThumbsUp, FaUser, FaQuoteLeft, FaLightbulb, FaRocket, FaHandshake } from "react-icons/fa";
import Header from "../components/Header";
import { useDarkMode } from "../context/DarkModeContext";

const CareerTipsPage = () => {
  const { darkMode } = useDarkMode();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const [bookmarkedTips, setBookmarkedTips] = useState(new Set());

  // Expanded mock data for career tips with more valuable content
  const careerTips = [
    {
      id: 1,
      title: "Master Your Interview Skills: 10 Essential Questions to Prepare",
      excerpt: "Learn how to confidently answer the most common interview questions and stand out from other candidates. Includes sample answers and expert tips.",
      category: "Interview Prep",
      author: "Sarah Johnson",
      authorBio: "Senior HR Manager at TechCorp with 8+ years in recruitment",
      readTime: "5 min read",
      views: 2847,
      likes: 156,
      featured: true,
      tags: ["interview", "preparation", "questions"],
      image: "https://images.unsplash.com/photo-1562564055-71e051d33c19?w=400&h=250&fit=crop",
      keyTakeaways: ["Practice STAR method", "Research company culture", "Prepare questions for interviewer"]
    },
    {
      id: 2,
      title: "Building a Personal Brand That Gets You Hired",
      excerpt: "Discover strategies to create a compelling personal brand that attracts recruiters and opportunities. From LinkedIn optimization to networking.",
      category: "Career Growth",
      author: "Michael Chen",
      authorBio: "Career Coach and LinkedIn Expert helping 500+ professionals",
      readTime: "7 min read",
      views: 1923,
      likes: 89,
      featured: false,
      tags: ["branding", "networking", "career"],
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=250&fit=crop",
      keyTakeaways: ["Consistent online presence", "Share valuable content", "Build authentic connections"]
    },
    {
      id: 3,
      title: "The Complete Guide to Salary Negotiation",
      excerpt: "Learn proven techniques to negotiate your salary and get the compensation you deserve. Includes market research and communication strategies.",
      category: "Skills",
      author: "Emily Rodriguez",
      authorBio: "Compensation Specialist at Fortune 500 company",
      readTime: "6 min read",
      views: 3421,
      likes: 234,
      featured: true,
      tags: ["salary", "negotiation", "compensation"],
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
      keyTakeaways: ["Know your worth", "Practice negotiation", "Consider total compensation"]
    },
    {
      id: 4,
      title: "Remote Work Productivity: Tips from Successful Professionals",
      excerpt: "Maximize your productivity while working remotely with insights from top performers. Includes time management and communication strategies.",
      category: "Workplace",
      author: "David Kim",
      authorBio: "Remote Work Consultant and Author",
      readTime: "4 min read",
      views: 1567,
      likes: 67,
      featured: false,
      tags: ["remote work", "productivity", "tips"],
      image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6b7e6?w=400&h=250&fit=crop",
      keyTakeaways: ["Create dedicated workspace", "Set clear boundaries", "Use productivity tools"]
    },
    {
      id: 5,
      title: "LinkedIn Optimization: Get Noticed by Recruiters",
      excerpt: "Transform your LinkedIn profile into a powerful tool that attracts job opportunities. Step-by-step guide to profile optimization.",
      category: "Networking",
      author: "Lisa Thompson",
      authorBio: "LinkedIn Marketing Expert with 10+ years experience",
      readTime: "8 min read",
      views: 2891,
      likes: 178,
      featured: false,
      tags: ["linkedin", "profile", "optimization"],
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop",
      keyTakeaways: ["Professional headshot", "Compelling headline", "Detailed experience descriptions"]
    },
    {
      id: 6,
      title: "Career Transition: From Tech to Management",
      excerpt: "A comprehensive guide for technical professionals looking to transition into management roles. Includes skill development and mindset shifts.",
      category: "Career Growth",
      author: "Robert Davis",
      authorBio: "Former CTO turned Executive Coach",
      readTime: "10 min read",
      views: 2156,
      likes: 145,
      featured: true,
      tags: ["career transition", "management", "leadership"],
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
      keyTakeaways: ["Develop soft skills", "Seek mentorship", "Take on leadership roles"]
    },
    {
      id: 7,
      title: "Resume Writing: The Ultimate Guide for 2025",
      excerpt: "Create a resume that gets you noticed. Latest trends, ATS optimization, and expert tips for maximum impact.",
      category: "Skills",
      author: "Jennifer Wu",
      authorBio: "Resume Writer and Career Strategist",
      readTime: "9 min read",
      views: 4123,
      likes: 298,
      featured: true,
      tags: ["resume", "writing", "ATS"],
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop",
      keyTakeaways: ["Use action verbs", "Quantify achievements", "Tailor for each job"]
    },
    {
      id: 8,
      title: "Networking in the Digital Age: Building Meaningful Connections",
      excerpt: "Master online networking strategies to expand your professional circle and discover new opportunities.",
      category: "Networking",
      author: "Alex Martinez",
      authorBio: "Networking Coach and Speaker",
      readTime: "6 min read",
      views: 1876,
      likes: 92,
      featured: false,
      tags: ["networking", "digital", "connections"],
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=250&fit=crop",
      keyTakeaways: ["Be genuine", "Follow up consistently", "Provide value first"]
    }
  ];

  const categories = [
    { id: "all", name: "All Tips", count: careerTips.length, icon: FaFilter },
    { id: "Interview Prep", name: "Interview Prep", count: careerTips.filter(t => t.category === "Interview Prep").length, icon: FaHandshake },
    { id: "Career Growth", name: "Career Growth", count: careerTips.filter(t => t.category === "Career Growth").length, icon: FaRocket },
    { id: "Skills", name: "Skills", count: careerTips.filter(t => t.category === "Skills").length, icon: FaLightbulb },
    { id: "Networking", name: "Networking", count: careerTips.filter(t => t.category === "Networking").length, icon: FaUser },
    { id: "Workplace", name: "Workplace", count: careerTips.filter(t => t.category === "Workplace").length, icon: FaStar }
  ];

  // Quick stats for job seekers
  const quickStats = [
    { label: "Average Salary Increase", value: "15-25%", icon: FaRocket },
    { label: "Jobs Found via Networking", value: "70%", icon: FaHandshake },
    { label: "Interview Success Rate", value: "85%", icon: FaThumbsUp },
    { label: "Career Changes This Year", value: "2.3M", icon: FaUser }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setTips(careerTips);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredTips = useMemo(() => {
    let filtered = tips.filter(tip => {
      const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tip.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tip.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || tip.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort tips
    switch (sortBy) {
      case "popular":
        return filtered.sort((a, b) => b.likes - a.likes);
      case "recent":
        return filtered.sort((a, b) => b.id - a.id);
      case "trending":
        return filtered.sort((a, b) => b.views - a.views);
      default:
        return filtered;
    }
  }, [tips, searchTerm, selectedCategory, sortBy]);

  const handleLike = (tipId) => {
    setTips(prev => prev.map(tip =>
      tip.id === tipId ? { ...tip, likes: tip.likes + 1 } : tip
    ));
  };

  const handleBookmark = (tipId) => {
    setBookmarkedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tipId)) {
        newSet.delete(tipId);
      } else {
        newSet.add(tipId);
      }
      return newSet;
    });
  };

  const handleShare = (tipId) => {
    const tip = tips.find(t => t.id === tipId);
    if (navigator.share) {
      navigator.share({
        title: tip.title,
        text: tip.excerpt,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${tip.title} - ${window.location.href}`);
      // Could show a toast notification here
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1">
                  <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="lg:col-span-3">
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-24 pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Career Tips & Insights
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Professional guidance to accelerate your career growth and help you land your dream job
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 max-w-4xl mx-auto"
            >
              {quickStats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <stat.icon className="text-3xl mb-2 mx-auto" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for career tips, interview advice, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-indigo-800 shadow-lg text-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FaFilter />
                  Categories
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                        selectedCategory === category.id
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-md"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <category.icon className="text-lg" />
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm opacity-75">{category.count} tips</div>
                      </div>
                    </button>
                  ))}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="recent">Most Recent</option>
                  <option value="trending">Trending</option>
                </select>

                {/* Inspirational Quote */}
                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <FaQuoteLeft className="text-blue-500 mb-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "The only way to do great work is to love what you do." - Steve Jobs
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Featured Tips */}
              {selectedCategory === "all" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                    <FaStar className="text-yellow-500" />
                    Featured Tips
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredTips.filter(tip => tip.featured).map((tip) => (
                      <motion.article
                        key={tip.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="relative">
                          <img
                            src={tip.image}
                            alt={tip.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg">
                              <FaStar className="mr-1" />
                              Featured
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {tip.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                            {tip.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                            {tip.excerpt}
                          </p>
                          
                          {/* Key Takeaways */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Takeaways:</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {tip.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  {takeaway}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => handleLike(tip.id)}
                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <FaHeart className="mr-1" />
                                {tip.likes}
                              </button>
                              <button
                                onClick={() => handleBookmark(tip.id)}
                                className={`flex items-center transition-colors ${
                                  bookmarkedTips.has(tip.id)
                                    ? "text-blue-500"
                                    : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                                }`}
                              >
                                <FaBookmark className="mr-1" />
                                {bookmarkedTips.has(tip.id) ? "Saved" : "Save"}
                              </button>
                              <button
                                onClick={() => handleShare(tip.id)}
                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
                              >
                                <FaShare className="mr-1" />
                                Share
                              </button>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <FaEye className="mr-1" />
                              {tip.views.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <FaUser className="text-white text-xs" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{tip.author}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{tip.readTime}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* All Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  {selectedCategory === "all" ? "All Career Tips" : `${selectedCategory} Tips`}
                </h2>
                <div className="space-y-8">
                  {filteredTips.map((tip) => (
                    <motion.article
                      key={tip.id}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-1/4">
                          <img
                            src={tip.image}
                            alt={tip.title}
                            className="w-full h-32 lg:h-24 object-cover rounded-lg"
                          />
                        </div>
                        <div className="lg:w-3/4 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                              {tip.category}
                            </span>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <FaClock className="mr-1" />
                              {tip.readTime}
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                            {tip.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {tip.excerpt}
                          </p>
                          
                          {/* Key Takeaways */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Takeaways:</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {tip.keyTakeaways.map((takeaway, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  {takeaway}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => handleLike(tip.id)}
                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <FaHeart className="mr-1" />
                                {tip.likes}
                              </button>
                              <button
                                onClick={() => handleBookmark(tip.id)}
                                className={`flex items-center transition-colors ${
                                  bookmarkedTips.has(tip.id)
                                    ? "text-blue-500"
                                    : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                                }`}
                              >
                                <FaBookmark className="mr-1" />
                                {bookmarkedTips.has(tip.id) ? "Saved" : "Save"}
                              </button>
                              <button
                                onClick={() => handleShare(tip.id)}
                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
                              >
                                <FaShare className="mr-1" />
                                Share
                              </button>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <FaEye className="mr-1" />
                              {tip.views.toLocaleString()} views
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <FaUser className="text-white text-xs" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{tip.author}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{tip.authorBio}</div>
                                </div>
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                                Read More →
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CareerTipsPage;
