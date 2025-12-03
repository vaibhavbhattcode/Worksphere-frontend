import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { motion } from "framer-motion";
import {
  CameraIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { FaLinkedin, FaGithub, FaTwitter, FaGlobe } from "react-icons/fa";
// CitySelector previously used static list; replace with dynamic LocationInput suggestions
import LocationInput from "./LocationInput";
import JobTitleSelector from "./JobTitleSelector";

const ProfileHeader = ({
  profileData,
  editMode,
  editData,
  validationErrors,
  handleInputChange,
  handlePhotoUpload,
  uploadingPhoto,
  handleEditToggle,
  onTitleChange,
  onLocationChange,
  onLocationValidityChange,
}) => {
  // Professional phone input with validation
  const handlePhoneChange = (value) => {
    // value is numeric string without +, e.g. '1234567890'
    let formatted = value ? "+" + value.replace(/\D/g, "") : "";
    // Validate E.164
    let isValid = false;
    if (formatted.length > 0) {
      try {
        const phone = parsePhoneNumberFromString(formatted);
        isValid = phone && phone.isValid();
      } catch {}
    }
    handleInputChange({ target: { name: "phone", value: formatted } });
    // Optionally, you can set validation error here if needed
    // e.g. setPhoneError(!isValid ? "Invalid phone number" : "");
  };

  const backendUrl = "http://localhost:5000";

  const imageUrl = profileData.profileImage
    ? profileData.profileImage.startsWith("http")
      ? profileData.profileImage
      : `${backendUrl}${profileData.profileImage}?t=${new Date().getTime()}`
    : "https://placehold.co/150x150.png";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-blue-50/80 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 p-6 sm:p-8 xl:p-10 mb-6 sm:mb-8 relative"
    >
  <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
        {/* Profile Image */}
        <div className="relative group">
          <motion.div
            whileHover={{ scale: 1.05 }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full border-4 border-blue-200 dark:border-blue-900 shadow-2xl overflow-hidden bg-white dark:bg-gray-900"
          >
            <img
              src={imageUrl}
              alt={`${profileData.name}'s profile`}
              className="w-full h-full object-cover transition-transform duration-300"
              loading="lazy"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <input
            type="file"
            accept="image/*"
            id="photoUpload"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
          />
          <label
            htmlFor="photoUpload"
            className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition-all cursor-pointer shadow-md border-2 border-white dark:border-gray-900"
            aria-label="Update profile photo"
          >
            {uploadingPhoto ? (
              <span className="text-xs">Uploading</span>
            ) : (
              <CameraIcon className="w-5 h-5" />
            )}
          </label>
        </div>

        {/* Details Section */}
        <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 flex-1 w-full">
              {editMode ? (
                <form className="space-y-6">
                  {/* Name */}
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                        className="w-full text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-600 focus:outline-none pb-2 bg-transparent"
                      placeholder="Full Name"
                      aria-label="Full name"
                    />
                    {validationErrors.name && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {validationErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <JobTitleSelector
                      value={editData.title}
                      onChange={onTitleChange}
                      aria-label="Job title"
                    />
                    {validationErrors.title && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {validationErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Location with suggestions */}
                  <div className="w-full max-w-md mx-auto">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Your City
                    </label>
                    <LocationInput
                      value={editData.location}
                      onChange={(val) => onLocationChange({ value: val })}
                      placeholder="Type to search cities..."
                      requireSelection
                      onValidityChange={onLocationValidityChange}
                    />
                    {validationErrors.location && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {validationErrors.location}
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      readOnly
                      disabled
                      className="w-full text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-600 focus:outline-none pb-1 bg-transparent cursor-not-allowed"
                      placeholder="Email address"
                      aria-label="Email address"
                    />
                  </div>

                  {/* Phone (E.164) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <PhoneInput
                      country={'us'}
                      value={editData.phone?.replace(/^\+/, '') || ''}
                      onChange={val => handlePhoneChange(val)}
                      inputProps={{
                        name: 'phone',
                        required: false,
                        autoFocus: false,
                      }}
                      inputClass="w-full px-3 py-2 border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-600 focus:outline-none bg-transparent dark:bg-gray-800 dark:text-white"
                      specialLabel=""
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Must be a valid international phone number (e.g. +12345678901)
                    </p>
                    {validationErrors.phone && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <input
                      type="url"
                      name="linkedin"
                      value={editData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="LinkedIn URL"
                      aria-label="LinkedIn URL"
                    />
                    <input
                      type="url"
                      name="github"
                      value={editData.github}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="GitHub URL"
                      aria-label="GitHub URL"
                    />
                    <input
                      type="url"
                      name="twitter"
                      value={editData.twitter}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Twitter URL"
                      aria-label="Twitter URL"
                    />
                    <input
                      type="url"
                      name="portfolio"
                      value={editData.portfolio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 bg-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Portfolio URL"
                      aria-label="Portfolio URL"
                    />
                  </div>
                </form>
              ) : (
                <>
                  {/* Non-edit mode display */}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">
                    {profileData.name}
                  </h1>
                    <p className="text-xl sm:text-2xl text-blue-700 dark:text-blue-400 font-semibold mb-2">
                    {profileData.title}
                  </p>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1 mb-2">
                    <MapPinIcon className="w-5 h-5 mr-1.5 text-blue-500" />
                    <span className="font-medium">{profileData.location}</span>
                  </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <EnvelopeIcon className="w-5 h-5 mr-1.5 text-blue-500" />
                      <a
                        href={`mailto:${profileData.email}`}
                        className="hover:text-blue-700 transition-colors font-medium"
                      >
                        {profileData.email}
                      </a>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <PhoneIcon className="w-5 h-5 mr-1.5 text-blue-500" />
                      <a
                        href={`tel:${profileData.phone}`}
                        className="hover:text-blue-700 transition-colors font-medium"
                      >
                        {profileData.phone}
                      </a>
                    </div>
                  </div>
                  {/* Social Links */}
                  <div className="flex flex-wrap gap-4 mt-5">
                    {profileData.socialLinks?.linkedin && (
                      <a
                        href={profileData.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn Profile"
                        className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full hover:scale-105 transition-transform shadow"
                      >
                        <FaLinkedin className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                      </a>
                    )}
                    {profileData.socialLinks?.github && (
                      <a
                        href={profileData.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub Profile"
                        className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full hover:scale-105 transition-transform shadow"
                      >
                        <FaGithub className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                      </a>
                    )}
                    {profileData.socialLinks?.twitter && (
                      <a
                        href={profileData.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter Profile"
                        className="bg-blue-50 dark:bg-blue-950 p-2 rounded-full hover:scale-105 transition-transform shadow"
                      >
                        <FaTwitter className="w-6 h-6 text-blue-400" />
                      </a>
                    )}
                    {profileData.socialLinks?.portfolio && (
                      <a
                        href={profileData.socialLinks.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Portfolio"
                        className="bg-green-50 dark:bg-green-950 p-2 rounded-full hover:scale-105 transition-transform shadow"
                      >
                        <FaGlobe className="w-6 h-6 text-green-600" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Edit Toggle Button */}
              <motion.button
                onClick={handleEditToggle}
                className="flex items-center justify-center w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-xl"
              aria-label={editMode ? "Cancel editing" : "Edit profile"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              {editMode ? "Cancel Changes" : "Edit Profile"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default ProfileHeader;
