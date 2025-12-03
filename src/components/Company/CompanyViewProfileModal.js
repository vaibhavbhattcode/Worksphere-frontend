// Improved CompanyViewProfileModal.js
import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSpinner,
  FaUserCircle,
  FaGraduationCap,
  FaBriefcase,
  FaCertificate,
  FaFileAlt,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import { startConversation } from "../../api/chatApi";
import { useNavigate } from "react-router-dom";

const CompanyViewProfileModal = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchProfile = () => {
    setLoading(true);
    setError("");
    
    // Extract actual userId string if it's an object
    const actualUserId = typeof userId === 'object' ? (userId._id || userId) : userId;
    console.log("CompanyViewProfileModal fetchProfile - userId:", actualUserId, "original:", userId);
    
    if (!actualUserId || actualUserId === '[object Object]') {
      console.error("Invalid userId:", userId);
      setError("Invalid user ID");
      setLoading(false);
      return;
    }
    
    // Use company-specific route
    axiosInstance
      .get(`/company/user-profile/${actualUserId}`)
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        console.error("Error response:", err.response?.data);
        setError("Failed to load profile.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] relative"
          initial={{ scale: 0.95, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-300 shadow-sm"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaTimes className="text-xl" />
          </motion.button>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col justify-center items-center py-12">
              <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
              <span className="text-lg font-medium text-gray-700">Loading profile...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col justify-center items-center py-12 text-center">
              <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
              <motion.button
                onClick={fetchProfile}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:shadow-indigo-500/50 transition-shadow duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry
              </motion.button>
            </div>
          )}

          {/* Profile Content */}
          {profile && !loading && !error && (
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                {profile.profileImage ? (
                  <motion.img
                    src={profile.profileImage}
                    alt={`${profile.name}'s profile`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-300 shadow-lg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <FaUserCircle className="w-32 h-32 text-indigo-400" />
                )}
                <div className="text-center md:text-left space-y-2">
                  <h3 className="text-3xl font-bold text-gray-900">{profile.name || "N/A"}</h3>
                  <p className="text-lg font-medium text-indigo-600">{profile.title || "N/A"}</p>
                  <p className="text-md text-gray-600">{profile.location || "N/A"}</p>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">(5.0)</span> {/* Placeholder rating */}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        try {
                          const conversation = await startConversation("company", { userId });
                          navigate(`/company/chat?conversationId=${conversation._id}`);
                        } catch (e) {
                          console.error("Error starting conversation:", e);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* About Section */}
              {profile.about && profile.about.trim() !== "" && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaUserCircle className="mr-2 text-indigo-600" /> About
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{profile.about}</p>
                </motion.section>
              )}

              {/* Skills Section */}
              {profile.skills && profile.skills.length > 0 && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaCertificate className="mr-2 text-indigo-600" /> Skills
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.skills.map((skill, index) => (
                      <motion.span
                        key={index}
                        className="bg-indigo-200 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Education Section */}
              {profile.education && profile.education.length > 0 && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaGraduationCap className="mr-2 text-indigo-600" /> Education
                  </h4>
                  <ul className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <FaGraduationCap className="text-indigo-500 mt-1 mr-3 text-xl" />
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{edu.degree || "N/A"}</div>
                          <div className="text-gray-700">{edu.institution || "N/A"} {edu.year ? `(${edu.year})` : ""}</div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* Experience Section */}
              {profile.experience && profile.experience.length > 0 && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaBriefcase className="mr-2 text-indigo-600" /> Experience
                  </h4>
                  <ul className="space-y-6">
                    {profile.experience.map((exp, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <FaBriefcase className="text-indigo-500 mt-1 mr-3 text-xl" />
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{exp.position || "N/A"}</div>
                          <div className="text-gray-700">{exp.company || "N/A"}</div>
                          <div className="text-sm text-gray-500 italic">{exp.start || ""} - {exp.end || "Present"}</div>
                          {exp.description && (
                            <p className="mt-2 text-gray-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* Certifications Section */}
              {profile.certificates && profile.certificates.length > 0 && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaCertificate className="mr-2 text-indigo-600" /> Certifications
                  </h4>
                  <ul className="space-y-4">
                    {profile.certificates.map((cert, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <FaCertificate className="text-indigo-500 mr-3 text-xl" />
                        {typeof cert === "object" ? (
                          <a
                            href={
                              cert.fileUrl.startsWith("/")
                                ? `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${cert.fileUrl}`
                                : cert.fileUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline font-medium transition-colors duration-300"
                          >
                            {cert.title || "Untitled Certificate"}
                          </a>
                        ) : (
                          <span className="text-gray-700 font-medium">{cert}</span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* Resume Section */}
              {profile.resume && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaFileAlt className="mr-2 text-indigo-600" /> Resume
                  </h4>
                  <div className="flex items-center">
                    <FaFileAlt className="text-indigo-500 mr-3 text-xl" />
                    <a
                      href={
                        profile.resume.startsWith("/")
                          ? `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${profile.resume}`
                          : profile.resume
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline font-medium transition-colors duration-300"
                    >
                      View Resume
                    </a>
                  </div>
                </motion.section>
              )}

              {/* Video Introduction Section */}
              {profile.videoIntroduction && (
                <motion.section 
                  className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-6 shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <h4 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                    <FaFileAlt className="mr-2 text-indigo-600" /> Video Introduction
                  </h4>
                  <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-inner">
                    <video
                      src={
                        profile.videoIntroduction.startsWith("/")
                          ? `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${profile.videoIntroduction}`
                          : profile.videoIntroduction
                      }
                      controls
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompanyViewProfileModal;