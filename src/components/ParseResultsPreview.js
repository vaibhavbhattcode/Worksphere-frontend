// Professional preview component for parsed resume data
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const ConfidenceBadge = ({ confidence }) => {
  if (!confidence) return null;
  
  const percentage = Math.round(confidence * 100);
  let colorClass = "bg-gray-100 text-gray-700";
  let icon = null;
  
  if (confidence >= 0.8) {
    colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    icon = <CheckCircleIcon className="w-4 h-4" />;
  } else if (confidence >= 0.6) {
    colorClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    icon = <ExclamationTriangleIcon className="w-4 h-4" />;
  } else {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    icon = <XCircleIcon className="w-4 h-4" />;
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {icon}
      {percentage}%
    </span>
  );
};

const FieldComparison = ({ label, current, parsed, confidence, selected, onToggle }) => {
  const hasChange = parsed && parsed !== current;
  
  if (!hasChange && !parsed) return null;
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            {label}
            <ConfidenceBadge confidence={confidence} />
          </label>
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
      
      <div className="space-y-2 text-sm">
        {current && (
          <div className="text-gray-500 dark:text-gray-400">
            <span className="font-medium">Current:</span> {current}
          </div>
        )}
        <div className="text-blue-600 dark:text-blue-400 font-medium">
          <span className="font-medium">Parsed:</span> {parsed}
        </div>
      </div>
    </div>
  );
};

const ParseResultsPreview = ({ 
  parsedData, 
  currentData, 
  onApply, 
  onCancel,
  isApplying = false 
}) => {
  const [selectedFields, setSelectedFields] = React.useState({
    name: true,
    title: true,
    email: true,
    phone: true,
    about: true,
    linkedin: true,
    github: true,
    twitter: true,
    portfolio: true,
    skills: true,
    experience: true,
    education: true,
  });
  
  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const handleApply = () => {
    const dataToApply = {};
    Object.keys(selectedFields).forEach(key => {
      if (selectedFields[key] && parsedData[key]) {
        dataToApply[key] = parsedData[key];
      }
    });
    onApply(dataToApply);
  };
  
  const selectAll = () => {
    const allSelected = {};
    Object.keys(selectedFields).forEach(key => {
      allSelected[key] = true;
    });
    setSelectedFields(allSelected);
  };
  
  const selectNone = () => {
    const noneSelected = {};
    Object.keys(selectedFields).forEach(key => {
      noneSelected[key] = false;
    });
    setSelectedFields(noneSelected);
  };
  
  const selectedCount = Object.values(selectedFields).filter(Boolean).length;
  const totalChanges = Object.keys(parsedData).filter(key => 
    parsedData[key] && parsedData[key] !== currentData[key]
  ).length;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Resume Parsed Successfully!</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Review and select the fields you want to apply ({totalChanges} changes detected)
                </p>
              </div>
            </div>
          </div>
          
          {/* Metadata */}
          {parsedData.metadata && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">
                  Confidence threshold: {Math.round(parsedData.metadata.confidenceThreshold * 100)}%
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {parsedData.metadata.fieldsFiltered > 0 && 
                    `${parsedData.metadata.fieldsFiltered} low-confidence fields filtered`
                  }
                </span>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Select None
                </button>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto max-h-[50vh] px-6 py-4">
            <div className="space-y-4">
              <FieldComparison
                label="Name"
                current={currentData.name}
                parsed={parsedData.name}
                confidence={parsedData.name_confidence}
                selected={selectedFields.name}
                onToggle={() => toggleField('name')}
              />
              
              <FieldComparison
                label="Job Title"
                current={currentData.title}
                parsed={parsedData.title}
                confidence={parsedData.title_confidence}
                selected={selectedFields.title}
                onToggle={() => toggleField('title')}
              />
              
              <FieldComparison
                label="Email"
                current={currentData.email}
                parsed={parsedData.email}
                confidence={parsedData.email_confidence}
                selected={selectedFields.email}
                onToggle={() => toggleField('email')}
              />
              
              <FieldComparison
                label="Phone"
                current={currentData.phone}
                parsed={parsedData.phone}
                confidence={parsedData.phone_confidence}
                selected={selectedFields.phone}
                onToggle={() => toggleField('phone')}
              />
              
              <FieldComparison
                label="About / Summary"
                current={currentData.about?.substring(0, 100)}
                parsed={parsedData.about?.substring(0, 100)}
                confidence={parsedData.about_confidence}
                selected={selectedFields.about}
                onToggle={() => toggleField('about')}
              />
              
              {/* Skills */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skills ({parsedData.skills.length})
                    </label>
                    <input
                      type="checkbox"
                      checked={selectedFields.skills}
                      onChange={() => toggleField('skills')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsedData.skills.length > 10 && (
                      <span className="px-3 py-1 text-gray-600 dark:text-gray-400 text-xs">
                        +{parsedData.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Experience */}
              {parsedData.experience && parsedData.experience.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Work Experience ({parsedData.experience.length} entries)
                    </label>
                    <input
                      type="checkbox"
                      checked={selectedFields.experience}
                      onChange={() => toggleField('experience')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {/* Education */}
              {parsedData.education && parsedData.education.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Education ({parsedData.education.length} entries)
                    </label>
                    <input
                      type="checkbox"
                      checked={selectedFields.education}
                      onChange={() => toggleField('education')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {/* Social Links */}
              <FieldComparison
                label="LinkedIn"
                current={currentData.linkedin}
                parsed={parsedData.linkedin}
                selected={selectedFields.linkedin}
                onToggle={() => toggleField('linkedin')}
              />
              
              <FieldComparison
                label="GitHub"
                current={currentData.github}
                parsed={parsedData.github}
                selected={selectedFields.github}
                onToggle={() => toggleField('github')}
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={isApplying}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || selectedCount === 0}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isApplying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Applying...
                  </>
                ) : (
                  `Apply Selected (${selectedCount})`
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ParseResultsPreview;
