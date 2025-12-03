import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AcademicCapIcon,
  PlusCircleIcon,
  TrashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

// Dynamically infer backend URL – supports env override and dev port remap.
const backendUrl = (() => {
  if (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "");
  }
  if (typeof window !== 'undefined') {
    try {
      const u = new URL(window.location.href);
      if (u.port === '3000') u.port = '5000';
      return u.origin;
    } catch {}
  }
  return 'http://localhost:5000';
})();

// Helper functions
const stripQuery = (u) => (u ? u.split('?')[0].split('#')[0] : "");
const isImage = (url) => /\.(jpe?g|png|gif|webp|svg)$/i.test(stripQuery(url || ""));
const isPdf = (url) => /\.pdf$/i.test(stripQuery(url || ""));

// Card animation variants (consistent with Experience/Education)
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const CertificationsSection = React.memo(({
  editMode,
  profileCertificates = [], // array of certificate objects { _id, title, fileUrl }
  onCertificateUpload,
  onCertificateDelete,
}) => {
  const [newCertificateTitle, setNewCertificateTitle] = useState("");
  const [newCertificateFile, setNewCertificateFile] = useState(null);
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false);

  const handleFileChange = (e) => {
    setNewCertificateFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!newCertificateTitle.trim() || !newCertificateFile) {
      alert("Please provide a title and select a file.");
      return;
    }
    onCertificateUpload(newCertificateTitle, newCertificateFile);
    setNewCertificateTitle("");
    setNewCertificateFile(null);
  };

  const normalizedCertificates = useMemo(() => {
    return profileCertificates.map((cert) => {
      const rawUrl = cert?.fileUrl || "";
      const fullUrl = rawUrl.startsWith("http")
        ? rawUrl
        : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
      return {
        _id: cert._id || cert.id || fullUrl,
        title: cert.title || "Untitled Certificate",
        fileUrl: fullUrl,
        rawUrl,
        type: isPdf(fullUrl) ? 'pdf' : isImage(fullUrl) ? 'image' : 'file'
      };
    });
  }, [profileCertificates]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return normalizedCertificates;
    const q = filter.toLowerCase();
    return normalizedCertificates.filter(c => c.title.toLowerCase().includes(q));
  }, [filter, normalizedCertificates]);

  const displayed = useMemo(() => {
    if (showAll) return filtered;
    return filtered.slice(0, 6); // show first 6 by default
  }, [filtered, showAll]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
  className="bg-gradient-to-br from-blue-50/80 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 p-6 sm:p-8 xl:p-10 mb-6 sm:mb-8"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-7 border-b border-blue-200 dark:border-blue-900 pb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight text-center sm:text-left">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <AcademicCapIcon className="w-7 h-7 text-blue-600" />
          </span>
          <span>Professional Certifications</span>
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          PDF, Image • Max 5MB
        </span>
      </div>

      {/* Upload Fields (only shown in edit mode) */}
      {editMode && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-8 space-y-4">
          {/* Certificate Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Certificate Title
            </label>
            <input
              type="text"
              placeholder="e.g. AWS Certified Developer"
              value={newCertificateTitle}
              onChange={(e) => setNewCertificateTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         transition-colors bg-white dark:bg-gray-600 dark:text-white"
            />
          </div>

          {/* File Input + Add Button Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            {/* File selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Choose File
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                id="certificateFile"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="certificateFile"
                className="block w-full px-4 py-2 border border-gray-300 
                           dark:border-gray-600 rounded-lg text-center cursor-pointer 
                           bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 
                           transition-colors dark:text-white 
                           overflow-hidden whitespace-nowrap text-ellipsis"
                title={
                  newCertificateFile
                    ? newCertificateFile.name
                    : "No file chosen"
                }
              >
                {newCertificateFile
                  ? newCertificateFile.name
                  : "No file chosen"}
              </label>
            </div>

            {/* Add Certificate Button */}
            <div className="flex justify-start sm:justify-end">
              <button
                onClick={handleUpload}
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 
                           rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & count */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter certificates by title..."
          className="w-full sm:max-w-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {normalizedCertificates.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll(s => !s)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAll ? 'Show Less' : `Show All (${normalizedCertificates.length})`}
          </button>
        )}
        <span className="sm:ml-auto text-xs text-gray-500 dark:text-gray-400">
          {filtered.length} item{filtered.length !== 1 && 's'}
        </span>
      </div>

      {/* Display Certificates */}
      {displayed.length > 0 ? (
        <div className="space-y-4">
          {displayed.map((cert) => (
            <motion.article
              key={cert._id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="relative grid gap-4 sm:gap-6 p-4 sm:p-5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow group sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
              >
                {cert.type === 'image' ? (
                  <img
                    src={cert.fileUrl}
                    alt={cert.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                    onError={(e) => { e.currentTarget.style.display='none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/10">
                    <DocumentTextIcon className="w-9 h-9 sm:w-11 sm:h-11 text-blue-600" />
                  </div>
                )}
                <span className={`absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-full tracking-wide shadow ${cert.type==='pdf' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'}`}>
                  {cert.type === 'pdf' ? 'PDF' : cert.type === 'image' ? 'Image' : 'File'}
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <h3
                  className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-snug break-words"
                  title={cert.title}
                >
                  {cert.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cert.type === 'pdf' ? 'PDF Document' : cert.type === 'image' ? 'Image File' : 'File'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center px-3 py-2 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors w-full sm:w-auto text-center"
                >
                  Open
                </a>
                {editMode && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => onCertificateDelete(cert._id)}
                    className="inline-flex justify-center items-center px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-white/80 dark:bg-gray-800/80 rounded-md shadow w-full sm:w-auto"
                    aria-label="Remove certificate"
                    type="button"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic dark:text-gray-400">No certifications uploaded.</p>
      )}
    </motion.section>
  );
});

export default CertificationsSection;
