import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import CountUp from "react-countup";
import { FaSpinner, FaStar, FaBuilding, FaRocket } from "react-icons/fa";
import { useDarkMode } from "../context/DarkModeContext";
import LocationInput from "./LocationInput";

const API_URL = "/api/user/overview";

const popularTags = [
  {
    label: "Software Engineer",
    icon: <FaStar className="text-yellow-400 mr-1" />,
  },
  {
    label: "Product Manager",
    icon: <FaRocket className="text-pink-400 mr-1" />,
  },
  {
    label: "Data Scientist",
    icon: <FaBuilding className="text-blue-400 mr-1" />,
  },
];

const trustCompanies = [
  {
    name: "Google",
    logo: "https://logodownload.org/wp-content/uploads/2014/07/google-logo-white.png",
  },
  {
    name: "Microsoft",
    logo: "https://logodownload.org/wp-content/uploads/2014/09/microsoft-logo-white.png",
  },
  {
    name: "Amazon",
    logo: "https://logodownload.org/wp-content/uploads/2014/04/amazon-logo-white.png",
  },
  {
    name: "Apple",
    logo: "https://logodownload.org/wp-content/uploads/2013/12/apple-logo-white.png",
  },
  {
    name: "Netflix",
    logo: "https://logodownload.org/wp-content/uploads/2014/10/netflix-logo-white.png",
  },
];

const jobTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];

const videoSources = [
  "/videos/Data_2.mp4",
  "/videos/data.mp4",
  "/videos/office_work_2.mp4",
  "/videos/office_work_3.mp4",
  "/videos/office_work.mp4",
];

function getRandomVideo() {
  return videoSources[Math.floor(Math.random() * videoSources.length)];
}

export default function Hero({ user }) {
  const { darkMode } = useDarkMode(); // triggers re-render on dark mode change
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const videoRef = useRef(null);
  const [selectedVideo] = useState(getRandomVideo());
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [locationValid, setLocationValid] = useState(true);
  const [locationInputKey, setLocationInputKey] = useState(0);
  const navigate = useNavigate();

  // Mocked recommended jobs for demonstration
  const recommendedJobs = user
    ? [
        {
          title: "Frontend Developer",
          company: "Google",
          location: "Remote",
          link: "/jobs/1",
        },
        {
          title: "Backend Engineer",
          company: "Amazon",
          location: "Bangalore, India",
          link: "/jobs/2",
        },
        {
          title: "Data Analyst",
          company: "Netflix",
          location: "Remote",
          link: "/jobs/3",
        },
      ]
    : [];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        // Public endpoint available at /api/user/overview, no auth required
        const { data } = await axiosInstance.get("/user/overview");
        setTotalJobs(data.totalJobs || 0);
        setTotalCompanies(data.totalCompanies || 0);
        setSuccessRate(data.successRate || 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleSearch = () => {
    setSearchLoading(true);
    const searchQuery = jobTitle.trim();
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.append("search", searchQuery);
    if (location) {
      const city = location.split(",")[0].trim();
      queryParams.append("location", city);
    }
    if (jobType) queryParams.append("jobType", jobType);
    navigate(`/jobs?${queryParams.toString()}`);
    setTimeout(() => setSearchLoading(false), 800); // Simulate loading
  };

  const handleLocationSelect = (location) => {
    setLocation(location);
    setLocationValid(true);
  };

  return (
    <section
      className={`relative overflow-hidden text-white ${
        darkMode
          ? "bg-gradient-to-br from-gray-800 to-gray-900"
          : "bg-gradient-to-br from-indigo-900 to-purple-900"
      }`}
      style={{
        backgroundImage:
          !videoRef.current || videoRef.current?.readyState < 3
            ? darkMode
              ? "linear-gradient(rgba(31,41,55,0.95),rgba(17,24,39,0.95)), url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80)"
              : "linear-gradient(rgba(49, 46, 129, 0.85), rgba(91, 33, 182, 0.85)), url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80)"
            : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-label="Hero section with job search"
    >
      {/* Animated video background (hidden on mobile, fallback to image) */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover z-0 hidden md:block transition-opacity duration-700 ${
          videoLoaded ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        loop
        muted
        playsInline
        poster="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80"
        style={{ opacity: 0.25 }}
        onCanPlay={() => setVideoLoaded(true)}
      >
        <source src={selectedVideo} type="video/mp4" />
        {/* fallback handled by backgroundImage */}
      </video>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8">
              <div className="space-y-4">
                {/* Personalized greeting for logged-in users */}
                {user && user.name && (
                  <div className="animate-fade-in-up">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 shadow-lg mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">👋</span>
                      </div>
                      <div className="text-left">
                        <span className="text-white font-semibold text-lg">
                          Welcome back, {user.name.split(" ")[0]}!
                        </span>
                        <span className="text-purple-200 text-sm ml-2">
                          Ready to advance your career?
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <span className="inline-block bg-white/10 px-4 py-2 rounded-full text-sm font-medium animate-fade-in-up">
                  🚀 Join 50,000+ Successful Hires
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-in-down">
                  Find Your
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block animate-pulse">
                    Dream Job
                  </span>
                  <span className="text-2xl md:text-3xl font-normal text-purple-200 block mt-4 animate-fade-in-up">
                    Your Perfect Opportunity Awaits
                  </span>
                </h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                <div className="p-4 bg-white/5 rounded-xl backdrop-blur-sm shadow-md">
                  <div className="text-2xl font-bold">
                    {dashboardLoading ? (
                      <CountUp end={0} duration={2} />
                    ) : (
                      <CountUp end={totalJobs} duration={3} suffix="+" />
                    )}
                  </div>
                  <div className="text-sm text-purple-200">Total Jobs</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl backdrop-blur-sm shadow-md">
                  <div className="text-2xl font-bold">
                    {dashboardLoading ? (
                      <CountUp end={0} duration={2} />
                    ) : (
                      <CountUp end={totalCompanies} duration={3} suffix="+" />
                    )}
                  </div>
                  <div className="text-sm text-purple-200">Companies</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl backdrop-blur-sm shadow-md">
                  <div className="text-2xl font-bold">
                    {dashboardLoading ? (
                      <CountUp end={0} duration={2} />
                    ) : (
                      <CountUp end={successRate} duration={3} suffix="%" />
                    )}
                  </div>
                  <div className="text-sm text-purple-200">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 w-full animate-fade-in-up">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">
                      Start Your Search
                    </h2>
                    <p className="text-purple-200">
                      Find jobs that match your skills and ambitions
                    </p>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Job title or skills"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-5 py-4 bg-white/5 rounded-xl border border-white/20 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      aria-label="Job title or skills"
                    />
                    <div className="relative flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/2 relative">
                        <LocationInput
                          key={locationInputKey}
                          value={location}
                          onChange={handleLocationSelect}
                          placeholder="Search location (e.g., Surat)"
                          requireSelection
                          onValidityChange={(valid) => setLocationValid(valid)}
                          className="w-full px-5 py-4 bg-white/5 rounded-xl border border-white/20 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                        />
                        {!locationValid && location.trim() !== "" && (
                          <p className="mt-2 text-xs text-red-400">Please select a city from suggestions.</p>
                        )}
                      </div>
                      <div className="w-full md:w-1/2 relative">
                        <select
                          className="w-full px-5 py-4 bg-white/5 rounded-xl border border-white/20 text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
                          value={jobType}
                          onChange={(e) => setJobType(e.target.value)}
                          aria-label="Job type"
                        >
                          <option value="" className="bg-gray-800 text-white">
                            Job Type
                          </option>
                          {jobTypeOptions.map((type) => (
                            <option
                              key={type}
                              value={type}
                              className="bg-gray-800 text-white"
                            >
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSearch}
                      className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold transition-transform duration-150 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 ${
                        searchLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      aria-label="Find jobs now"
                      disabled={searchLoading}
                    >
                      {searchLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : null}
                      Find Jobs Now
                    </button>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-purple-300">Popular searches:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {popularTags.map((tag) => (
                        <span
                          key={tag.label}
                          className="flex items-center px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors cursor-pointer font-medium text-white border border-white/20 shadow-sm"
                          onClick={() => {
                            setJobTitle(tag.label);
                            navigate(`/jobs?search=${tag.label}`);
                          }}
                          tabIndex={0}
                          aria-label={`Search for ${tag.label}`}
                        >
                          {tag.icon}
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Trust Badges/Logos (lazy loaded, touch feedback) */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-90 animate-fade-in-up">
            {trustCompanies.map((company) => (
              <div
                key={company.name}
                className="flex items-center bg-white/10 px-6 py-3 rounded-xl shadow-md transition-transform duration-150 active:scale-95 hover:scale-105 focus:scale-105"
                tabIndex={0}
                aria-label={company.name + " logo"}
                style={{ WebkitTapHighlightColor: "rgba(0,0,0,0.1)" }}
              >
                <span className="text-white font-semibold text-lg">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
    </section>
  );
}
// Add the following CSS to your global styles or Tailwind config:
// .animate-fade-in-up { animation: fadeInUp 0.8s both; }
// .animate-slide-in-down { animation: slideInDown 0.8s both; }
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
// @keyframes slideInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: none; } }
// .animate-pulse { animation: pulse 2s infinite; }
// @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
