// EducationSection.js
import React from "react";
import { motion } from "framer-motion";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

const EducationSection = ({
  editMode,
  editEducation,
  profileEducation,
  handleAddEducation,
  handleEducationChange,
  handleRemoveEducation,
}) => {
  // Use editEducation if in edit mode; otherwise, use profileEducation
  const educationData = editMode ? editEducation : profileEducation || [];

  // Framer Motion variants for each card
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
  };

  // For the Year field, we use a simple input (you can further improve with validation if needed)
  const renderYearInput = (index, value, placeholder) => (
    <input
      type="number"
      value={value}
      onChange={(e) => handleEducationChange(index, "year", e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
    />
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-blue-50/80 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 p-10 mb-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7 border-b border-blue-200 dark:border-blue-900 pb-4">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <AcademicCapIcon className="w-7 h-7 text-blue-600" />
          </span>
          <span>Education</span>
        </h2>
        {editMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddEducation}
            className="flex items-center bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md"
            aria-label="Add education"
          >
            <PlusCircleIcon className="w-6 h-6 mr-2" />
            Add Education
          </motion.button>
        )}
      </div>
      {educationData.length > 0 ? (
        <div className="relative pl-6">
          {/* Timeline vertical accent */}
          <div
            className="absolute left-2 top-0 bottom-0 w-1 bg-blue-100 dark:bg-blue-900 rounded-full"
            style={{ zIndex: 0 }}
          />
          <div className="space-y-8 relative z-10">
            {educationData.map((edu, index) => (
              <motion.article
                key={edu.id || index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="relative p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 group shadow hover:shadow-xl transition-shadow duration-300 flex items-start gap-4"
                itemScope
                itemType="https://schema.org/EducationalOrganization"
                style={{ marginLeft: "-1.5rem" }}
              >
                {/* Timeline dot */}
                <span className="absolute -left-7 top-7 w-5 h-5 bg-blue-500 border-4 border-white dark:border-gray-900 rounded-full z-20 shadow-md"></span>
                {editMode && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleRemoveEducation(index)}
                    className="absolute top-4 right-4 p-2 text-red-600 hover:text-red-700 transition-colors"
                    aria-label="Remove education"
                    type="button"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </motion.button>
                )}
                {editMode ? (
                  <div className="space-y-6 w-full">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          handleEducationChange(
                            index,
                            "institution",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="University Name"
                        aria-label="Institution name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(index, "degree", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Degree (e.g., Bachelor of Science)"
                        aria-label="Degree"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year
                      </label>
                      {renderYearInput(index, edu.year, "YYYY")}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-3">
                      <h3
                        className="text-xl font-semibold text-gray-900 dark:text-white"
                        itemProp="name"
                      >
                        {edu.institution}
                      </h3>
                      {edu.degree && (
                        <span className="inline-block bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold px-3 py-1 rounded-full ml-2">
                          {edu.degree}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {edu.year && (
                        <span className="font-medium">{edu.year}</span>
                      )}
                    </p>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 italic dark:text-gray-400">
            {editMode
              ? "Add your education details"
              : "No education details listed"}
          </p>
        </div>
      )}
    </motion.section>
  );
};

export default EducationSection;
