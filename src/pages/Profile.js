// Profile.js
import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import WorkExperienceSection from "../components/WorkExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import CertificationsSection from "../components/CertificationsSection";
import ResumeSection from "../components/ResumeSection";
import VideoIntroSection from "../components/VideoIntroSection";
import AnalyticsSection from "../components/AnalyticsSection";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useDarkMode } from "../context/DarkModeContext";
import {
  validateCompleteProfile,
  sanitizeProfileData,
  validateExperience,
  validateEducation,
  sanitizeString,
  sanitizeUrl,
} from "../utils/profileValidation";

// Using shared axiosInstance with baseURL set to /api

// Animation Variants
const messageVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.4, ease: "easeIn" } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const bannerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.5, ease: "easeIn" },
  },
};

const ProfilePage = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    title: "",
    location: "",
    email: "",
    phone: "",
    about: "",
    skills: [],
    experience: [],
    education: [],
    linkedin: "",
    github: "",
    twitter: "",
    portfolio: "",
  });
  const [locationValid, setLocationValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [generatingAbout, setGeneratingAbout] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState({
    isComplete: false,
    missingFields: [],
  });
  const [updatingResumeSource, setUpdatingResumeSource] = useState(false);

  // Fetch session & profile data
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axiosInstance.get(`/auth/status`);
        if (res.data.loggedIn && res.data.type !== "user") {
          setError("Please log in as a user to access this page.");
          setTimeout(() => navigate("/company/logout"), 2000);
          return;
        }
      } catch {
        // No active user session
      }

      const fetchProfile = async () => {
        try {
          const response = await axiosInstance.get(`/user/profile`);
          const data = {
            ...response.data,
            education: response.data.education || [],
            experience: response.data.experience || [],
            skills: response.data.skills || [],
            about: response.data.about || "",
            profileImage: response.data.profileImage || "",
            resume: response.data.resume || "",
            videoIntroduction: response.data.videoIntroduction || "",
            certificates: response.data.certificates || [],
            socialLinks: response.data.socialLinks || {},
            resumePreferences: {
              ...(response.data.resumePreferences || {}),
              activeSource:
                response.data.resumePreferences?.activeSource ??
                (response.data.resume ? "uploaded" : "builder"),
              builderLastUpdated:
                response.data.resumePreferences?.builderLastUpdated || null,
            },
          };
          setProfileData(data);
          checkProfileCompletion(data);
        } catch (err) {
          if (err.response && err.response.status === 401) {
            navigate("/", { state: { message: "Please login first" } });
            return;
          }
          setError("Failed to load profile.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    };
    checkSession();
  }, [navigate]);

  // Clear messages after 5s
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Profile Completion Check
  const checkProfileCompletion = (data) => {
    const missingFields = [];
    const resumeActiveSource = data.resumePreferences?.activeSource;
    const requiredFields = {
      "Full Name": data.name?.trim(),
      "Job Title": data.title?.trim(),
      Location: data.location?.trim(),
      "Phone Number": data.phone?.trim(),
      "About Me": data.about?.trim(),
      Skills: data.skills?.length > 0,
      "Work Experience": data.experience?.length > 0,
      Education: data.education?.length > 0,
      "Profile Photo": data.profileImage?.trim(),
      Resume:
        data.resume?.trim() ||
        (resumeActiveSource && resumeActiveSource === "builder"),
      Certificates: data.certificates?.length > 0,
      "Video Introduction": data.videoIntroduction?.trim(),
      "Social Links":
        data.socialLinks &&
        (data.socialLinks.linkedin?.trim() ||
          data.socialLinks.github?.trim() ||
          data.socialLinks.twitter?.trim() ||
          data.socialLinks.portfolio?.trim()),
    };

    Object.entries(requiredFields).forEach(([field, value]) => {
      if (!value) missingFields.push(field);
    });

    setProfileCompletion({
      isComplete: missingFields.length === 0,
      missingFields,
    });
  };

  // Handlers

  // Parse Resume and Autofill Profile
  const handleParseResume = async () => {
    setError("");
    setSuccessMessage("");
    try {
      const response = await axiosInstance.post(
        `/user/profile/parse-resume?autoSave=false`,
        {}
      );
      const data = response.data;
      setEditData((prev) => ({
        ...prev,
        name: data.name || "",
        title: data.title || data.jobTitle || "",
        email: data.email || "",
        phone: data.phone || "",
        // Do not overwrite location; keep user's current selection
        location: prev.location,
        about: data.about || "",
        // Prefer parsed skill names
        skills: Array.isArray(data.skills) ? data.skills : [],
        // Add unique IDs to experience entries and ensure valid format
        experience: Array.isArray(data.experience) 
          ? data.experience.map((exp, idx) => ({
              id: Date.now() + idx,
              company: exp.company || "",
              position: exp.position || "",
              start: exp.start || "",
              end: exp.end || "",
              description: exp.description || "",
            }))
          : [],
        // Add unique IDs to education entries  
        education: Array.isArray(data.education)
          ? data.education.map((edu, idx) => ({
              id: Date.now() + idx + 1000,
              institution: edu.institution || "",
              degree: edu.degree || "",
              year: edu.year || "",
            }))
          : [],
        linkedin: data.linkedin || "",
        github: data.github || "",
        twitter: data.twitter || "",
        portfolio: data.portfolio || "",
        certifications: data.certifications || [],
      }));
      // Optionally surface confidence info (toast)
      if (data.name_confidence || data.email_confidence || data.location_confidence) {
        setSuccessMessage(
          "Profile fields auto-filled with AI. Review highlighted suggestions and save."
        );
      } else {
        setSuccessMessage("Profile fields auto-filled from resume. Please review and save.");
      }
      setEditMode(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to parse resume.");
    }
  };
  const handleEditToggle = () => {
    setError("");
    setSuccessMessage("");
    if (!editMode && profileData) {
      setEditData({
        name: profileData.name || "",
        title: profileData.title || "",
        location: profileData.location || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        about: profileData.about || "",
        skills: profileData.skills || [],
        experience: profileData.experience || [],
        education: profileData.education || [],
        linkedin: profileData.socialLinks?.linkedin || "",
        github: profileData.socialLinks?.github || "",
        twitter: profileData.socialLinks?.twitter || "",
        portfolio: profileData.socialLinks?.portfolio || "",
      });
      setValidationErrors({});
      setLocationValid(true);
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Real-time sanitization based on field type
    let sanitizedValue = value;
    if (['name', 'title', 'location', 'about'].includes(name)) {
      // For text fields, allow typing but prepare for validation
      sanitizedValue = value; // Keep raw value for better UX during typing
    } else if (name === 'email') {
      sanitizedValue = value.trim(); // Trim email immediately
    } else if (name === 'phone') {
      sanitizedValue = value.replace(/\s+/g, ''); // Remove spaces from phone
    } else if (['linkedin', 'github', 'twitter', 'portfolio'].includes(name)) {
      sanitizedValue = value.trim(); // Trim URLs
    }
    
    setEditData((prev) => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear field-specific error on change
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    // Sanitize data first
    const sanitized = sanitizeProfileData(editData);
    
    // Perform comprehensive validation
    const errors = validateCompleteProfile({
      ...sanitized,
      email: profileData?.authMethod === 'google' ? profileData.email : sanitized.email,
    });
    
    // For Google auth, don't validate email
    if (profileData?.authMethod === 'google' && errors.email) {
      delete errors.email;
    }
    
    // Location validity check (if external service was used)
    if (!locationValid && !errors.location) {
      errors.location = 'Please select a valid location from the suggestions';
    }
    
    return errors;
  };

  const handleGenerateAbout = async () => {
    if (!editData.title.trim()) {
      setError("Job title is required to generate About Me.");
      return;
    }
    if (!editData.skills || editData.skills.length === 0) {
      setError("At least one skill is required to generate About Me.");
      return;
    }
    setGeneratingAbout(true);
    try {
      const response = await axiosInstance.post(
        `/ai/generate-about`,
        {
          jobTitle: editData.title,
          skills: editData.skills,
          currentAbout: editData.about || "",
          tone: "professional",
          formatting: "insertAsteriskBetweenSolveAndGenerate",
        }
      );
      const aboutText = response?.data?.about || "";
      const enhancedAbout = aboutText.replace(/solve\s+generate/gi, "solve * generate");
      if (!editMode) setEditMode(true);
      setEditData((prev) => ({ ...prev, about: enhancedAbout }));
      setSuccessMessage("About Me text generated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to generate About Me text.");
    } finally {
      setGeneratingAbout(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Show summary error message
      const errorCount = Object.keys(errors).length;
      // Count only entries that actually have field errors
      const experienceErrors = errors.experience
        ? errors.experience.filter(e => e && Object.keys(e).length > 0).length
        : 0;
      const educationErrors = errors.education
        ? errors.education.filter(e => e && Object.keys(e).length > 0).length
        : 0;

      let errorMsg = `Please fix ${errorCount} validation error(s) before saving.`;

      if (experienceErrors > 0) {
        const expPhrase = experienceErrors === 1 ? 'entry needs attention' : 'entries need attention';
        errorMsg += ` ${experienceErrors} experience ${expPhrase}.`;
      }
      if (educationErrors > 0) {
        const eduPhrase = educationErrors === 1 ? 'entry needs attention' : 'entries need attention';
        errorMsg += ` ${educationErrors} education ${eduPhrase}.`;
      }

      // Add a short, friendly example of what exactly is wrong
      const details = [];
      if (errors.experience) {
        errors.experience.forEach((errObj, idx) => {
          const msgs = errObj ? Object.values(errObj) : [];
          if (msgs.length > 0) {
            const cleaned = String(msgs[0])
              .replace(/\s*for experience #\d+\s*$/i, '')
              .trim();
            details.push(`Experience ${idx + 1}: ${cleaned}`);
          }
        });
      }
      if (errors.education) {
        errors.education.forEach((errObj, idx) => {
          const msgs = errObj ? Object.values(errObj) : [];
          if (msgs.length > 0) {
            const cleaned = String(msgs[0])
              .replace(/\s*for education #\d+\s*$/i, '')
              .trim();
            details.push(`Education ${idx + 1}: ${cleaned}`);
          }
        });
      }
      // Include top-level field error hints (e.g., Name, Title) if present
      Object.entries(errors)
        .filter(([k]) => !['experience', 'education', 'socialLinks'].includes(k))
        .forEach(([, v]) => {
          if (typeof v === 'string' && v) details.push(v);
        });

      if (details.length > 0) {
        const preview = details.slice(0, 3).join(' | ');
        errorMsg += ` Example: ${preview}${details.length > 3 ? ' ...' : ''}`;
      }
      setError(errorMsg);
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('[class*="border-red"]');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }
    
    // Sanitize payload before sending
    const sanitizedData = sanitizeProfileData(editData);
    const payload = { ...sanitizedData };
    delete payload.email;
    delete payload.certifications; // Remove certifications from profile update payload

    // Experience already sanitized by sanitizeProfileData
    // Education already sanitized by sanitizeProfileData

    try {
      const response = await axiosInstance.put(`/user/profile`, payload);
      const updatedData = {
        ...response.data,
        education: response.data.education || [],
        experience: response.data.experience || [],
        skills: response.data.skills || [],
        about: response.data.about || "",
        profileImage: profileData.profileImage || "",
        resume: profileData.resume || "",
        videoIntroduction: profileData.videoIntroduction || "",
        certificates: profileData.certificates || [], // Keep existing certificates
        socialLinks: response.data.socialLinks || {},
      };
      setProfileData(updatedData);
      setEditMode(false);
      setValidationErrors({});
      setSuccessMessage("Profile updated successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleSkillsChange = (selectedOptions) =>
    setEditData((prev) => ({
      ...prev,
      skills: selectedOptions.map((opt) => opt.label),
    }));

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...editData.experience];
    
    // Apply field-specific sanitization
    let sanitizedValue = value;
    if (field === 'company' || field === 'position' || field === 'description') {
      // Allow typing but will be sanitized on save
      sanitizedValue = value;
    } else if (field === 'start' || field === 'end') {
      // Trim dates
      sanitizedValue = value.trim();
    }
    
    newExperience[index] = { ...newExperience[index], [field]: sanitizedValue };
    setEditData((prev) => ({ ...prev, experience: newExperience }));
    
    // Clear experience-specific errors
    if (validationErrors.experience && validationErrors.experience[index]) {
      const updatedErrors = { ...validationErrors };
      if (updatedErrors.experience[index][field]) {
        delete updatedErrors.experience[index][field];
        if (Object.keys(updatedErrors.experience[index]).length === 0) {
          updatedErrors.experience = updatedErrors.experience.filter((_, i) => i !== index);
          if (updatedErrors.experience.length === 0) {
            delete updatedErrors.experience;
          }
        }
        setValidationErrors(updatedErrors);
      }
    }
  };
  
  const handleAddExperience = () =>
    setEditData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now(),
          company: "",
          position: "",
          start: "",
          end: "",
          description: "",
        },
      ],
    }));
    
  const handleRemoveExperience = (index) =>
    setEditData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...editData.education];
    
    // Apply field-specific sanitization
    let sanitizedValue = value;
    if (field === 'institution' || field === 'degree') {
      // Allow typing but will be sanitized on save
      sanitizedValue = value;
    } else if (field === 'year') {
      // Only allow digits for year
      sanitizedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    newEducation[index] = { ...newEducation[index], [field]: sanitizedValue };
    setEditData((prev) => ({ ...prev, education: newEducation }));
    
    // Clear education-specific errors
    if (validationErrors.education && validationErrors.education[index]) {
      const updatedErrors = { ...validationErrors };
      if (updatedErrors.education[index][field]) {
        delete updatedErrors.education[index][field];
        if (Object.keys(updatedErrors.education[index]).length === 0) {
          updatedErrors.education = updatedErrors.education.filter((_, i) => i !== index);
          if (updatedErrors.education.length === 0) {
            delete updatedErrors.education;
          }
        }
        setValidationErrors(updatedErrors);
      }
    }
  };
  
  const handleAddEducation = () =>
    setEditData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Date.now(), institution: "", degree: "", year: "" },
      ],
    }));
  const handleRemoveEducation = (index) =>
    setEditData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePhoto", file);
    try {
      setUploadingPhoto(true);
      const response = await axiosInstance.post(
        `/user/profile/upload-photo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedData = {
        ...profileData,
        profileImage: response.data.profileImage,
      };
      setProfileData(updatedData);
      setSuccessMessage("Photo uploaded successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeSourceChange = async (activeSource) => {
    if (!profileData) return;
    if (profileData.resumePreferences?.activeSource === activeSource) return;
    try {
      setUpdatingResumeSource(true);
      setError("");
      setSuccessMessage("");
      const response = await axiosInstance.put(`/user/profile/resume-source`, {
        activeSource,
      });
      setProfileData((prev) => {
        if (!prev) return prev;
        const currentPrefs = prev.resumePreferences || {};
        const apiPrefs = response.data?.resumePreferences || {};
        const mergedPrefs = {
          ...currentPrefs,
          ...apiPrefs,
          activeSource: apiPrefs.activeSource || activeSource,
          builderLastUpdated:
            apiPrefs.builderLastUpdated ?? currentPrefs.builderLastUpdated ?? null,
        };
        const updated = { ...prev, resumePreferences: mergedPrefs };
        checkProfileCompletion(updated);
        return updated;
      });
      setSuccessMessage(
        activeSource === "builder"
          ? "Resume builder set as your active resume."
          : "Uploaded resume will be used for applications."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update active resume preference."
      );
    } finally {
      setUpdatingResumeSource(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("resume", file);
    try {
      setUploadingResume(true);
      const response = await axiosInstance.post(
        `/user/profile/upload-resume`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedData = {
        ...profileData,
        resume: response.data.resume,
        resumeName: response.data.resumeName,
      };
      setProfileData(updatedData);
      setSuccessMessage("Resume uploaded successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  };
  const handleResumeRemove = async () => {
    try {
      await axiosInstance.delete(`/user/profile/resume`);
      const updatedData = {
        ...profileData,
        resume: null,
        resumeName: null,
        resumePreferences: {
          ...(profileData.resumePreferences || {}),
          activeSource: "builder",
        },
      };
      setProfileData(updatedData);
      setSuccessMessage("Resume removed successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove resume.");
    }
  };

  const handleCertificateUpload = async (title, file) => {
    const formData = new FormData();
    formData.append("certificate", file);
    formData.append("title", title);
    try {
      const response = await axiosInstance.post(
        `/user/profile/upload-certificate`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedData = {
        ...profileData,
        certificates: [
          ...(profileData.certificates || []),
          response.data.certificate,
        ],
      };
      setProfileData(updatedData);
      setSuccessMessage("Certificate uploaded successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Certificate upload failed.");
    }
  };
  const handleCertificateDelete = async (certificateId) => {
    try {
      await axiosInstance.delete(
        `/user/profile/certificate/${certificateId}`
      );
      const updatedData = {
        ...profileData,
        certificates: profileData.certificates.filter(
          (cert) => cert._id !== certificateId
        ),
      };
      setProfileData(updatedData);
      setSuccessMessage("Certificate removed successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove certificate.");
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("videoIntro", file);
    try {
      setUploadingVideo(true);
      const response = await axiosInstance.post(
        `/user/profile/upload-video-intro`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedData = {
        ...profileData,
        videoIntroduction: response.data.videoIntroduction,
      };
      setProfileData(updatedData);
      setSuccessMessage("Video uploaded successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Video upload failed.");
    } finally {
      setUploadingVideo(false);
    }
  };
  const handleVideoRemove = async () => {
    try {
      await axiosInstance.delete(`/user/profile/video-intro`);
      const updatedData = { ...profileData, videoIntroduction: "" };
      setProfileData(updatedData);
      setSuccessMessage("Video removed successfully.");
      checkProfileCompletion(updatedData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove video.");
    }
  };

  // Professional Skeleton Loading with Enhanced Theme Support
  if (loading) {
    return (
      <>
        <Header />
        <div className={`min-h-screen pt-24 pb-16 transition-colors duration-300 ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Profile Header Skeleton */}
            <div className={`rounded-2xl shadow-xl p-8 mb-8 border backdrop-blur-sm ${
              darkMode
                ? 'bg-gray-800/50 border-gray-700/50'
                : 'bg-white/80 border-gray-200/50'
            }`}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar Skeleton */}
                <div className="relative">
                  <Skeleton
                    circle
                    width={140}
                    height={140}
                    baseColor={darkMode ? "#374151" : "#e5e7eb"}
                    highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                    className="ring-4 ring-offset-4 ring-offset-transparent"
                    style={{
                      background: darkMode
                        ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                        : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                    }}
                  />
                  <div className="absolute -bottom-2 -right-2">
                    <Skeleton
                      circle
                      width={40}
                      height={40}
                      baseColor={darkMode ? "#1f2937" : "#3b82f6"}
                      highlightColor={darkMode ? "#374151" : "#60a5fa"}
                    />
                  </div>
                </div>

                {/* Profile Info Skeleton */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="space-y-3">
                    <Skeleton
                      height={36}
                      width="70%"
                      baseColor={darkMode ? "#374151" : "#e5e7eb"}
                      highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                      className="rounded-xl"
                    />
                    <Skeleton
                      height={20}
                      width="50%"
                      baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                      highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                      className="rounded-lg"
                    />
                    <Skeleton
                      height={16}
                      width="40%"
                      baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                      highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                      className="rounded"
                    />
                  </div>

                  {/* Stats Skeleton */}
                  <div className="flex justify-center md:justify-start gap-6 mt-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="text-center">
                        <Skeleton
                          height={24}
                          width={40}
                          baseColor={darkMode ? "#374151" : "#e5e7eb"}
                          highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                          className="mb-1 rounded"
                        />
                        <Skeleton
                          height={14}
                          width={50}
                          baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                          highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                          className="rounded"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex justify-center md:justify-start gap-3 mt-6">
                    <Skeleton
                      height={44}
                      width={120}
                      baseColor={darkMode ? "#1f2937" : "#3b82f6"}
                      highlightColor={darkMode ? "#374151" : "#60a5fa"}
                      className="rounded-xl"
                    />
                    <Skeleton
                      height={44}
                      width={100}
                      baseColor={darkMode ? "#374151" : "#e5e7eb"}
                      highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {[...Array(3)].map((_, sectionIndex) => (
                  <div key={sectionIndex} className={`rounded-2xl shadow-lg p-8 border ${
                    darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
                  } backdrop-blur-sm`}>
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <Skeleton
                        circle
                        width={32}
                        height={32}
                        baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                        highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                      />
                      <Skeleton
                        height={28}
                        width="30%"
                        baseColor={darkMode ? "#374151" : "#e5e7eb"}
                        highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                        className="rounded-lg"
                      />
                    </div>

                    {/* Section Content */}
                    <div className="space-y-4">
                      {[...Array(4)].map((_, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-transparent to-transparent hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all duration-200">
                          <Skeleton
                            circle
                            width={24}
                            height={24}
                            baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                            highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <Skeleton
                              height={18}
                              width="85%"
                              baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                              highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                              className="rounded"
                            />
                            <Skeleton
                              height={14}
                              width="60%"
                              baseColor={darkMode ? "#6b7280" : "#9ca3af"}
                              highlightColor={darkMode ? "#9ca3af" : "#d1d5db"}
                              className="rounded"
                            />
                          </div>
                          <Skeleton
                            height={32}
                            width={80}
                            baseColor={darkMode ? "#374151" : "#e5e7eb"}
                            highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                            className="rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-2 space-y-8">
                {[...Array(2)].map((_, sidebarIndex) => (
                  <div key={sidebarIndex} className={`rounded-2xl shadow-lg p-6 border ${
                    darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
                  } backdrop-blur-sm`}>
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between mb-6">
                      <Skeleton
                        height={24}
                        width="50%"
                        baseColor={darkMode ? "#374151" : "#e5e7eb"}
                        highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                        className="rounded-lg"
                      />
                      <Skeleton
                        circle
                        width={32}
                        height={32}
                        baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                        highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                      />
                    </div>

                    {/* Sidebar Content */}
                    <div className="space-y-4">
                      {[...Array(3)].map((_, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-transparent to-transparent hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <Skeleton
                              circle
                              width={20}
                              height={20}
                              baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                              highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                            />
                            <div>
                              <Skeleton
                                height={16}
                                width={100}
                                baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                                highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                                className="mb-1 rounded"
                              />
                              <Skeleton
                                height={12}
                                width={60}
                                baseColor={darkMode ? "#6b7280" : "#9ca3af"}
                                highlightColor={darkMode ? "#9ca3af" : "#d1d5db"}
                                className="rounded"
                              />
                            </div>
                          </div>
                          <Skeleton
                            height={24}
                            width={24}
                            baseColor={darkMode ? "#4b5563" : "#d1d5db"}
                            highlightColor={darkMode ? "#6b7280" : "#e5e7eb"}
                            className="rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Skills/Interests Section */}
                <div className={`rounded-2xl shadow-lg p-6 border ${
                  darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
                } backdrop-blur-sm`}>
                  <Skeleton
                    height={24}
                    width="40%"
                    baseColor={darkMode ? "#374151" : "#e5e7eb"}
                    highlightColor={darkMode ? "#4b5563" : "#f3f4f6"}
                    className="mb-4 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[...Array(8)].map((_, tagIndex) => (
                      <Skeleton
                        key={tagIndex}
                        height={28}
                        width={Math.random() * 60 + 60}
                        baseColor={darkMode ? "#4b5563" : "#dbeafe"}
                        highlightColor={darkMode ? "#6b7280" : "#bfdbfe"}
                        className="rounded-full"
                      />
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

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-lg p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          No profile data available
        </div>
      </div>
    );
  }

  // Premium Layout with Profile Completion Banner
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-24 pb-16 relative overflow-hidden">
        <AnimatePresence>
          {error && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-lg w-full border border-red-400"
            >
              <span className="text-xl">⚠</span>
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-lg w-full border border-green-400"
            >
              <span className="text-xl">✓</span>
              <span className="font-medium">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Profile Completion Banner */}
            {!editMode && !profileCompletion.isComplete && (
              <motion.div
                variants={bannerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg shadow-md p-6 border border-blue-100 dark:border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Your profile is incomplete!
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {profileCompletion.missingFields.length > 3
                        ? "Add more details to stand out to employers."
                        : `You're missing: ${profileCompletion.missingFields.join(
                            ", "
                          )}.`}{" "}
                      Complete your profile to increase your visibility!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEditToggle}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold"
                >
                  Update Profile Now
                </button>
              </motion.div>
            )}

            {/* Profile Header */}
            <motion.div variants={sectionVariants}>
              <ProfileHeader
                profileData={profileData}
                editMode={editMode}
                editData={editData}
                validationErrors={validationErrors}
                handleInputChange={handleInputChange}
                handlePhotoUpload={handlePhotoUpload}
                uploadingPhoto={uploadingPhoto}
                handleEditToggle={handleEditToggle}
                onTitleChange={(selectedOption) =>
                  setEditData((prev) => ({
                    ...prev,
                    title: selectedOption ? selectedOption.value : "",
                  }))
                }
                onLocationChange={(selectedOption) =>
                  setEditData((prev) => ({
                    ...prev,
                    location: selectedOption ? selectedOption.value : "",
                  }))
                }
                onLocationValidityChange={(valid) => setLocationValid(valid)}
              />
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-6">
                <motion.div variants={sectionVariants}>
                  <AboutSection
                    editMode={editMode}
                    generatingAbout={generatingAbout}
                    editData={editData}
                    profileData={profileData}
                    handleGenerateAbout={handleGenerateAbout}
                    handleInputChange={handleInputChange}
                  />
                </motion.div>
                <motion.div variants={sectionVariants}>
                  <WorkExperienceSection
                    editMode={editMode}
                    editExperience={editData.experience || []}
                    profileExperience={profileData.experience || []}
                    handleAddExperience={handleAddExperience}
                    handleExperienceChange={handleExperienceChange}
                    handleRemoveExperience={handleRemoveExperience}
                    validationErrors={validationErrors}
                  />
                </motion.div>
                <motion.div variants={sectionVariants}>
                  <EducationSection
                    editMode={editMode}
                    editEducation={editData.education || []}
                    profileEducation={profileData.education || []}
                    handleAddEducation={handleAddEducation}
                    handleEducationChange={handleEducationChange}
                    handleRemoveEducation={handleRemoveEducation}
                    validationErrors={validationErrors}
                  />
                </motion.div>
                <motion.div variants={sectionVariants}>
                  <ResumeSection
                    profileResume={profileData.resume || ""}
                    resumeName={profileData.resumeName || ""}
                    uploadingResume={uploadingResume}
                    handleResumeUpload={handleResumeUpload}
                    handleResumeRemove={handleResumeRemove}
                    handleParseResume={handleParseResume}
                    resumePreferences={profileData.resumePreferences}
                    onSetActiveResume={handleResumeSourceChange}
                    updatingResumeSource={updatingResumeSource}
                  />
                </motion.div>
              </div>

              {/* Right Column (Sticky Sidebar) */}
              <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:h-fit">
                <motion.div variants={sectionVariants}>
                  <SkillsSection
                    editMode={editMode}
                    skillsValue={editData.skills || []}
                    profileSkills={profileData.skills || []}
                    onSkillsChange={handleSkillsChange}
                  />
                </motion.div>
                <motion.div variants={sectionVariants}>
                  <CertificationsSection
                    editMode={editMode}
                    profileCertificates={profileData.certificates || []}
                    onCertificateUpload={handleCertificateUpload}
                    onCertificateDelete={handleCertificateDelete}
                  />
                </motion.div>

                <motion.div variants={sectionVariants}>
                  <VideoIntroSection
                    videoIntro={profileData.videoIntroduction || ""}
                    uploadingVideo={uploadingVideo}
                    handleVideoUpload={handleVideoUpload}
                    handleVideoRemove={handleVideoRemove}
                  />
                </motion.div>
              </div>
            </div>

            {/* Save Button */}
            {editMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-12 flex justify-end"
              >
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-indigo-800 font-semibold text-lg"
                >
                  Save Changes
                </button>
              </motion.div>
            )}
            {/* Career Tips Link */}
            {!editMode && profileCompletion.isComplete && (
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="mt-10 text-center"
              >
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800 p-8">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-4xl">💡</span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ready to Level Up?
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                    Your profile is complete! Explore our comprehensive career tips and insights to accelerate your professional growth.
                  </p>
                  <Link
                    to="/career-tips"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <span className="mr-2">📚</span>
                    Explore Career Tips
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
