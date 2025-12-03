// Helper to format salary for all types and pay period
function formatSalary(salary) {
  if (!salary || typeof salary !== "object") return null;
  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
  };
  const payPeriodLabels = {
    year: "per year",
    month: "per month",
    day: "per day",
    hour: "per hour",
  };
  const symbol = currencySymbols[salary.currency] || salary.currency || "";
  const payPeriod = salary.payPeriod ? payPeriodLabels[salary.payPeriod] || salary.payPeriod : "";
  if (salary.type === "negotiable") {
    return `Negotiable${payPeriod ? ` (${payPeriod})` : ""}`;
  } else if (salary.type === "exact") {
    return `${symbol} ${salary.min || salary.amount || ''}${payPeriod ? ` / ${payPeriod}` : ""}`;
  } else if (salary.type === "range" && salary.min && salary.max) {
    if (salary.min === salary.max) {
      return `${symbol} ${salary.min}${payPeriod ? ` / ${payPeriod}` : ""}`;
    } else {
      return `${symbol} ${salary.min} - ${symbol} ${salary.max}${payPeriod ? ` / ${payPeriod}` : ""}`;
    }
  } else if (salary.min && salary.max) {
    if (salary.min === salary.max) {
      return `${symbol} ${salary.min}${payPeriod ? ` / ${payPeriod}` : ""}`;
    } else {
      return `${symbol} ${salary.min} - ${symbol} ${salary.max}${payPeriod ? ` / ${payPeriod}` : ""}`;
    }
  } else if (salary.min) {
    return `${symbol} ${salary.min}${payPeriod ? ` / ${payPeriod}` : ""}`;
  } else if (salary.max) {
    return `${symbol} ${salary.max}${payPeriod ? ` / ${payPeriod}` : ""}`;
  } else {
    return "Not specified";
  }
}
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CompanySidebar from "../../components/Company/CompanySidebar";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaIndustry,
  FaHome,
  FaTools,
  FaClock,
  FaHeart,
  FaListUl,
  FaGraduationCap,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";


// Mapping currency codes to symbols
const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
};

// Utility to format date as DD/MM/YYYY
function formatDateDMY(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Collapsible section component
const CollapsibleSection = ({ title, children, icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left text-gray-800 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`section-${title}`}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? (
          <FaChevronUp className="text-gray-500" />
        ) : (
          <FaChevronDown className="text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`section-${title}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="py-4 text-gray-700">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);

  // Fetch industries from database
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/industries", {
          withCredentials: true
        });

        if (response.data && response.data.success && response.data.data) {
          const fetchedIndustries = response.data.data.map(industry => ({
            id: industry._id,
            name: industry.name
          }));
          setIndustries(fetchedIndustries);
        } else {
          // Fallback to static industries if API fails
          const fallbackIndustries = [
            "Technology",
            "Healthcare",
            "Finance",
            "Education",
            "Manufacturing",
            "Retail",
            "Consulting",
            "Marketing",
            "Real Estate",
            "Transportation",
            "Energy",
            "Telecommunications",
            "Media & Entertainment",
            "Non-profit",
            "Government",
            "Other"
          ];
          setIndustries(fallbackIndustries.map((name, index) => ({
            id: `fallback-${index}`,
            name
          })));
        }
      } catch (error) {
        console.error("Error fetching industries:", error);
        // Fallback to static industries
        const fallbackIndustries = [
          "Technology",
          "Healthcare",
          "Finance",
          "Education",
          "Manufacturing",
          "Retail",
          "Consulting",
          "Marketing",
          "Real Estate",
          "Transportation",
          "Energy",
          "Telecommunications",
          "Media & Entertainment",
          "Non-profit",
          "Government",
          "Other"
        ];
        setIndustries(fallbackIndustries.map((name, index) => ({
          id: `fallback-${index}`,
          name
        })));
      } finally {
        setIndustriesLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  // Get industry name by ID
  const getIndustryName = (industryId) => {
    if (!industryId) return "Not specified";

    // If industries are still loading or empty, return the ID as fallback
    if (industriesLoading || industries.length === 0) {
      console.log("Industries still loading or empty, showing industry ID:", industryId);
      return industryId; // This might be the ID, but at least it shows something
    }

    // Try to find the industry by ID
    const industry = industries.find(ind => ind.id === industryId);
    if (industry) {
      console.log("Found industry:", industry.name, "for ID:", industryId);
      return industry.name;
    }

    // If not found, check if industryId is already a name (string)
    if (typeof industryId === 'string' && industryId.length > 0) {
      console.log("Industry ID appears to be a name already:", industryId);
      return industryId; // It's already a name
    }

    console.log("Industry not found for ID:", industryId);
    return "Industry not found";
  };

  // Always fetch job details by ID for freshest data
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/jobs/${jobId}`,
          { withCredentials: true }
        );
        setJob(response.data);
      } catch (err) {
        toast.error("Failed to fetch job details.");
        setError("Failed to fetch job details.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Loading job details...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          className="text-red-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100">
      <CompanySidebar />
      <div className="flex-grow md:ml-80 p-4 sm:p-8 pt-16 md:pt-6 bg-transparent">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </motion.button>

        {/* Job Details Card */}
        <motion.div
          className="bg-white/90 rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-100 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Company & Job Header */}
          <section className="mb-10">
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-blue-50 border border-indigo-100 shadow flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 px-6 py-6">
              <div className="flex items-center gap-5 w-full">
                {/* Company Logo or Avatar */}
                {job.companyLogo && job.companyLogo !== '/demo.png' && job.companyLogo !== '/uploads/defaults/companyprofile.png' ? (
                  <img
                    src={job.companyLogo}
                    alt="Company Logo"
                    className="w-20 h-20 rounded-full border-4 border-indigo-200 shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 via-indigo-100 to-blue-100 flex items-center justify-center text-3xl font-extrabold text-indigo-500 border-4 border-indigo-100 shadow-lg select-none">
                    {job.companyName
                      ? job.companyName
                          .split(' ')
                          .map(word => word[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : <FaIndustry />}
                  </div>
                )}
                <div className="flex flex-col gap-1 min-w-0">
                  <h1 className="text-3xl font-extrabold text-gray-900 leading-tight flex items-center gap-2 truncate">
                    <FaBriefcase className="text-indigo-400" />
                    <span className="truncate">{job.jobTitle || <span className="text-gray-400">No Title</span>}</span>
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-base text-gray-700 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded">
                      <FaIndustry className="text-indigo-300" />
                      {job.companyName || <span className="text-gray-400">No Company</span>}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <FaIndustry /> {getIndustryName(job.industry)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <FaClock className="inline" />
                    Posted on {job.createdAt ? formatDateDMY(job.createdAt) : <span className="text-gray-300">N/A</span>}
                  </span>
                </div>
              </div>
              <motion.button
                onClick={() => navigate(`/company/jobs/${job._id}/edit`)}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors flex items-center space-x-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 font-semibold text-base"
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.97 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Job</span>
              </motion.button>
            </div>
          </section>

          {/* Step-by-step Details Sections */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <FaListUl /> Job Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <FaBriefcase className="text-indigo-500 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Job Type</p>
                  <p className="text-gray-800 font-semibold">{job.jobType || <span className="text-gray-400">N/A</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-blue-500 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Location</p>
                  <p className="text-gray-800 font-semibold">{job.location || <span className="text-gray-400">N/A</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaHome className="text-green-500 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Remote Option</p>
                  <p className="text-gray-800 font-semibold">{(job.remoteOption === true || String(job.remoteOption) === 'true') ? "Yes" : "No"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaGraduationCap className="text-purple-500 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Experience Level</p>
                  <p className="text-gray-800 font-semibold">{job.experienceLevel || <span className="text-gray-400">N/A</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaMoneyBillWave className="text-yellow-500 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Salary</p>
                  <p className="text-gray-800 font-semibold">
                    {job.salary ? formatSalary(job.salary) : <span className="text-gray-400">N/A</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaIndustry className="text-indigo-400 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Industry</p>
                  <p className="text-gray-800 font-semibold">{getIndustryName(job.industry)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaClock className="text-red-400 text-xl" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Application Deadline</p>
                  <p className="text-gray-800 font-semibold">
                    {job.applicationDeadline ? formatDateDMY(job.applicationDeadline) : <span className="text-gray-400">N/A</span>}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <FaListUl /> Description
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {job.description || <span className="text-gray-400">No description provided.</span>}
            </p>
          </section>

          {/* Skills Section */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <FaTools /> Skills
            </h2>
            {job.skills && job.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium shadow-sm hover:bg-indigo-200 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">No skills specified.</span>
            )}
          </section>

          {/* Responsibilities Section */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <FaListUl /> Responsibilities
            </h2>
            {job.responsibilities && job.responsibilities.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {job.responsibilities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No responsibilities listed.</span>
            )}
          </section>

          {/* Qualifications Section */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <FaGraduationCap /> Qualifications
            </h2>
            {job.qualifications && job.qualifications.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {job.qualifications.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No qualifications specified.</span>
            )}
          </section>

          {/* Benefits Section */}
          <section className="mb-2">
            <h2 className="text-lg font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <FaHeart /> Benefits
            </h2>
            {job.benefits && job.benefits.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {job.benefits.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No benefits specified.</span>
            )}
          </section>
        </motion.div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default JobDetailsPage;
