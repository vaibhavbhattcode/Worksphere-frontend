import React from "react";
import { motion } from "framer-motion";
import SkillsSelector from "./SkillsSelector";
import { PuzzlePieceIcon, CpuChipIcon } from "@heroicons/react/24/outline";

const SkillsSection = ({
  editMode,
  skillsValue,
  profileSkills,
  onSkillsChange,
}) => {
  const skillCategories = {
    technical: {
      color: "bg-blue-100 text-blue-800",
      icon: <CpuChipIcon className="w-4 h-4" />,
    },
    soft: {
      color: "bg-green-100 text-green-800",
      icon: <PuzzlePieceIcon className="w-4 h-4" />,
    },
  };

  return (
    <section className="bg-gradient-to-br from-blue-50/80 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 p-6 sm:p-8 xl:p-10 mb-6 sm:mb-8">
      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          knowsAbout: profileSkills || [],
        })}
      </script>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-7 border-b border-blue-200 dark:border-blue-900 pb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight text-center sm:text-left">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <PuzzlePieceIcon className="w-7 h-7 text-blue-600" />
          </span>
          <span>Professional Skills</span>
        </h2>
      </div>

      {editMode ? (
        <div className="space-y-4">
          <SkillsSelector
            onChange={onSkillsChange}
            value={
              skillsValue?.map((skill) => ({ label: skill, value: skill })) ||
              []
            }
            className="react-select-container"
            classNamePrefix="react-select"
            aria-label="Select skills"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Start typing to search or add skills.
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            {profileSkills?.map((skill, index) => {
              const category = skill.toLowerCase().includes("soft")
                ? "soft"
                : "technical";
              return (
                <motion.span
                  key={index}
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0 2px 8px 0 rgba(59,130,246,0.15)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-2 ${skillCategories[category].color} rounded-full text-base font-medium flex items-center gap-2 transition-transform shadow-sm hover:shadow-lg border border-blue-200 dark:border-blue-900`}
                  itemProp="knowsAbout"
                >
                  {skillCategories[category].icon}
                  {skill.replace("Skill: ", "")}
                </motion.span>
              );
            })}
          </motion.div>
          {/* Hidden semantic content for SEO */}
          <div className="sr-only" aria-hidden="true">
            <h3>Skill Set</h3>
            <ul>
              {profileSkills?.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
};

export default SkillsSection;
