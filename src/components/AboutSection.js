import React from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/outline";

const AboutSection = ({
  editMode,
  generatingAbout,
  editData,
  profileData,
  handleGenerateAbout,
  handleInputChange,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
  className="bg-gradient-to-br from-blue-50/80 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 p-6 sm:p-8 xl:p-10 mb-6 sm:mb-8"
    >
      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: profileData.name,
          description: profileData.about,
        })}
      </script>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-7 border-b border-blue-200 dark:border-blue-900 pb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight text-center sm:text-left">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-7 h-7 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3.75h6m-6 3.75h3.75M12 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12s4.365 9.75 9.75 9.75z"
              />
            </svg>
          </span>
          <span>Professional Summary</span>
        </h2>
        {editMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateAbout}
            disabled={generatingAbout}
            className="flex items-center justify-center w-full sm:w-auto bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-600 px-5 sm:px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium shadow-md text-center"
            aria-label={
              generatingAbout
                ? "Generating content"
                : "Generate professional summary"
            }
          >
            {generatingAbout ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700 dark:text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI Generate Summary
              </>
            )}
          </motion.button>
        )}
      </div>

      {editMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <textarea
            name="about"
            value={editData.about}
            onChange={handleInputChange}
            rows="5"
            maxLength="500"
            className="w-full px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-700 outline-none transition-all duration-200 placeholder-gray-400 resize-none bg-white dark:bg-gray-900 dark:text-white shadow-sm"
            placeholder="Describe your professional experience, skills, and career objectives..."
            aria-label="Edit professional summary"
          />
          <div className="absolute bottom-3 right-3 text-sm text-gray-400">
            {editData.about?.length || 0}/500
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose max-w-none text-gray-700 dark:text-gray-200 leading-relaxed relative"
        >
          <span className="hidden sm:block absolute -left-8 top-2 text-blue-300 dark:text-blue-800 opacity-60 text-4xl select-none">
            “
          </span>
          {profileData.about?.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
          {/* Hidden semantic content for SEO */}
          <div className="sr-only" aria-hidden="true">
            <h3>{profileData.name}'s Professional Summary</h3>
            <p>{profileData.about}</p>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
};

export default AboutSection;
