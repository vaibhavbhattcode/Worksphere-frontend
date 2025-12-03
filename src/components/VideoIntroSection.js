import React from "react";
import { motion } from "framer-motion";
import { VideoCameraIcon, TrashIcon } from "@heroicons/react/24/outline";

const VideoIntroSection = ({
  videoIntro,
  uploadingVideo,
  handleVideoUpload,
  handleVideoRemove,
}) => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const videoUrl =
    videoIntro && !videoIntro.startsWith("http")
      ? `${backendUrl}${videoIntro}`
      : videoIntro;

  return (
    <section className="bg-gradient-to-br from-blue-50/80 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900 p-6 sm:p-8 xl:p-10 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-7 border-b border-blue-200 dark:border-blue-900 pb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight text-center sm:text-left">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <VideoCameraIcon className="w-7 h-7 text-blue-600" />
          </span>
          <span>Video Introduction</span>
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          MP4, WebM • Max 50MB
        </span>
      </div>
      {videoIntro ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <video
            controls
            className="w-full rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVideoRemove}
            className="absolute top-4 right-4 bg-red-600 dark:bg-red-600 text-white p-2 rounded-full hover:bg-red-700 dark:hover:bg-red-700 transition-colors"
            aria-label="Remove video introduction"
          >
            <TrashIcon className="w-6 h-6" />
          </motion.button>
        </motion.div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Upload a short video introduction to showcase your personality.
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
            id="videoUpload"
            disabled={uploadingVideo}
          />
          <label
            htmlFor="videoUpload"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 sm:px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md w-full sm:w-auto"
          >
            {uploadingVideo ? "Uploading..." : "Upload Video"}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Max file size: 50MB
          </p>
        </div>
      )}
    </section>
  );
};

export default VideoIntroSection;
