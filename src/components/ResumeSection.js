import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
// Backend API origin (adjust if your backend runs on a different port)
const backendUrl = "http://localhost:5000";

const buildAbsoluteUrl = (url) => {
  if (!url) return "";
  // If already an absolute URL, return as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  // Ensure a single slash between backendUrl and the relative path
  return url.startsWith("/") ? `${backendUrl}${url}` : `${backendUrl}/${url}`;
};

const ResumeSection = ({
  profileResume,
  resumeName,
  uploadingResume,
  handleResumeUpload,
  handleResumeRemove,
  handleParseResume,
  resumePreferences = {},
  onSetActiveResume,
  updatingResumeSource = false,
}) => {
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);
  const [fileError, setFileError] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [fileMeta, setFileMeta] = React.useState({});
  const [fetchedPrefs, setFetchedPrefs] = React.useState(null);
  const [loadingPrefs, setLoadingPrefs] = React.useState(false);

  const resolvedUploadedResume = React.useMemo(() => {
    if (resumePreferences?.uploadedResume?.url) {
      return resumePreferences.uploadedResume;
    }
    if (profileResume) {
      return {
        url: profileResume,
        name:
          resumeName ||
          profileResume.split("/").pop() ||
          "uploaded-resume.pdf",
      };
    }
    return null;
  }, [profileResume, resumeName, resumePreferences]);

  const builderResumeMeta = resumePreferences?.builderResume || null;
  const activeSource =
    resumePreferences?.activeSource ||
    (resolvedUploadedResume ? "uploaded" : "builder");
  const isBuilderActive = activeSource === "builder";
  const hasUploadedResume = Boolean(resolvedUploadedResume?.url);
  const hasBuilderResume = Boolean(builderResumeMeta?.url);
  const builderLastUpdated = resumePreferences?.builderLastUpdated || null;
  const builderLastUpdatedLabel = builderLastUpdated
    ? formatDistanceToNow(new Date(builderLastUpdated), { addSuffix: true })
    : null;


  const showToggleControls = typeof onSetActiveResume === "function";

  // If parent didn't pass resumePreferences, attempt to fetch them from backend
  React.useEffect(() => {
    let mounted = true;
    const shouldFetch =
      (!resumePreferences || Object.keys(resumePreferences).length === 0) &&
      !fetchedPrefs;
    if (!shouldFetch) return undefined;

    const fetchPrefs = async () => {
      setLoadingPrefs(true);
      try {
        const res = await axios.get("/api/user/profile/resume-builder");
        if (!mounted) return;
        // API returns the builder state along with resumePreferences in many cases
        const data = res.data || {};
        const prefs = data.resumePreferences || data.profile?.resumePreferences || data;
        setFetchedPrefs(prefs);
      } catch (err) {
        // ignore — component will operate with passed props or empty state
        // console.warn("Failed to load resume preferences", err);
      } finally {
        if (mounted) setLoadingPrefs(false);
      }
    };

    fetchPrefs();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge fetched preferences with provided props when available
  const effectiveResumePreferences =
    resumePreferences && Object.keys(resumePreferences).length > 0
      ? resumePreferences
      : fetchedPrefs || {};

  // Recompute derived values when using fetched preferences
  const effectiveResolvedUploaded = React.useMemo(() => {
    if (effectiveResumePreferences?.uploadedResume?.url) return effectiveResumePreferences.uploadedResume;
    return resolvedUploadedResume;
  }, [effectiveResumePreferences, resolvedUploadedResume]);

  const effectiveBuilderMeta = effectiveResumePreferences?.builderResume || builderResumeMeta;
  const effectiveActiveSource =
    effectiveResumePreferences?.activeSource ||
    (effectiveResolvedUploaded ? "uploaded" : "builder");
  const effectiveIsBuilderActive = effectiveActiveSource === "builder";
  const effectiveHasUploaded = Boolean(effectiveResolvedUploaded?.url);
  const effectiveHasBuilder = Boolean(effectiveBuilderMeta?.url);

  const effectiveUploadedUrl = buildAbsoluteUrl(effectiveResolvedUploaded?.url);
  const effectiveBuilderUrl = buildAbsoluteUrl(effectiveBuilderMeta?.url);

  const effectiveBuilderLastUpdated =
    effectiveResumePreferences?.builderLastUpdated || builderLastUpdated;
  const effectiveBuilderLastUpdatedLabel = effectiveBuilderLastUpdated
    ? formatDistanceToNow(new Date(effectiveBuilderLastUpdated), { addSuffix: true })
    : null;

  // Helper: readable size
  const readableSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Check file availability (HEAD request) and cache metadata to avoid repeated backend hits
  const checkFileMeta = React.useCallback(async (key, url) => {
    if (!url) return;
    try {
      const controller = new AbortController();
      const resp = await fetch(url, { method: "HEAD", signal: controller.signal });
      const exists = resp.ok;
      const size = resp.headers.get("content-length")
        ? parseInt(resp.headers.get("content-length"), 10)
        : null;
      setFileMeta((s) => ({ ...s, [key]: { exists, size } }));
    } catch (err) {
      // Network/CORS or other failure — treat as not available
      setFileMeta((s) => ({ ...s, [key]: { exists: false, size: null } }));
    }
  }, []);

  React.useEffect(() => {
    // Only check when effective URL changes and not already known
    if (effectiveUploadedUrl && !fileMeta.uploadedChecked) {
      checkFileMeta("uploaded", effectiveUploadedUrl).then(() =>
        setFileMeta((s) => ({ ...s, uploadedChecked: true }))
      );
    }
    if (effectiveBuilderUrl && !fileMeta.builderChecked) {
      checkFileMeta("builder", effectiveBuilderUrl).then(() =>
        setFileMeta((s) => ({ ...s, builderChecked: true }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUploadedUrl, effectiveBuilderUrl]);

  const openIfAvailable = (url, metaKey, fallback) => {
    const meta = fileMeta[metaKey];
    if (meta && meta.exists) {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    if (meta && meta.exists === false) {
      alert("File isn't available on the server. Please save or re-upload.");
      return false;
    }
    // Not yet known — try to open directly (will show browser error if missing)
    if (fallback) window.open(url, "_blank", "noopener,noreferrer");
    return false;
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const onFileChange = (event) => {
    setFileError("");
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = MAX_UPLOAD_SIZE;

    if (!allowedTypes.includes(file.type)) {
      setFileError("Only PDF, DOC, or DOCX files are allowed.");
      return;
    }

    if (file.size > maxSize) {
      setFileError(
        `File size exceeds the maximum limit of ${Math.round(
          MAX_UPLOAD_SIZE / (1024 * 1024)
        )}MB.`
      );
      return;
    }

    handleResumeUpload(event);
  };

  const renderBuilderCard = () => (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-indigo-900/20 dark:via-gray-900 dark:to-indigo-900/10 p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40">
            <DocumentIcon className="w-7 h-7" />
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
              Resume Builder PDF
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-200 break-all">
              {effectiveBuilderMeta?.name || "resume-builder.pdf"}
            </p>
            {fileMeta.builder?.size && fileMeta.builder?.exists && (
              <p className="text-xs text-indigo-600 dark:text-indigo-300">
                {readableSize(fileMeta.builder.size)}
              </p>
            )}
            {effectiveBuilderLastUpdatedLabel && (
              <p className="text-xs text-indigo-600 dark:text-indigo-300">
                Saved {effectiveBuilderLastUpdatedLabel}
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => navigate("/resume-builder")}
            className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Edit In Builder
          </button>
          <a
            href={effectiveBuilderUrl}
            onClick={(e) => {
              if (!openIfAvailable(effectiveBuilderUrl, "builder", true)) e.preventDefault();
            }}
            target="_blank"
            rel="noopener noreferrer"
            download={effectiveBuilderMeta?.name || "resume-builder.pdf"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
          >
            <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
            Preview PDF
          </a>
        </div>
        {!effectiveHasBuilder && (
          <p className="text-xs text-indigo-600 dark:text-indigo-200">
            Save your resume in the builder to generate a downloadable PDF.
          </p>
        )}
      </div>
    </div>
  );

  const renderUploadedCard = () => (
    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-900/20 dark:via-gray-900 dark:to-emerald-900/10 p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40">
            <DocumentIcon className="w-7 h-7" />
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
              Uploaded Resume
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-200 break-all">
              {effectiveResolvedUploaded?.name || "uploaded-resume.pdf"}
            </p>
            {fileMeta.uploaded?.size && fileMeta.uploaded?.exists && (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                {readableSize(fileMeta.uploaded.size)}
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={triggerUpload}
            className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Replace File
          </button>
          <a
            href={effectiveUploadedUrl}
            onClick={(e) => {
              if (!openIfAvailable(effectiveUploadedUrl, "uploaded", true)) e.preventDefault();
            }}
            target="_blank"
            rel="noopener noreferrer"
            download={effectiveResolvedUploaded?.name || "uploaded-resume.pdf"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
          >
            <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
            View File
          </a>
          {effectiveHasUploaded && !effectiveIsBuilderActive && (
            <button
              onClick={handleResumeRemove}
              disabled={uploadingResume}
              className={`inline-flex w-full items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 ${
                uploadingResume ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <TrashIcon className="mr-2 h-5 w-5" />
              Delete File
            </button>
          )}
        </div>
        {handleParseResume && effectiveHasUploaded && (
          <button
            onClick={async () => {
              setParsing(true);
              try {
                await handleParseResume();
              } finally {
                setParsing(false);
              }
            }}
            className={`inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700 ${
              parsing ? "opacity-60 pointer-events-none" : ""
            }`}
            disabled={parsing}
          >
            {parsing ? "Parsing..." : "Parse & Autofill Profile"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
              <DocumentIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Resume Manager
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX • Max 5MB • Keep recruiters updated effortlessly
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                effectiveIsBuilderActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {effectiveIsBuilderActive
                ? "Builder resume is active"
                : "Uploaded resume is active"}
            </span>
            {effectiveBuilderLastUpdatedLabel && effectiveHasBuilder && (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Saved {effectiveBuilderLastUpdatedLabel}
              </span>
            )}
            {effectiveHasUploaded && (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                Custom resume available
              </span>
            )}
          </div>
        </div>
        {showToggleControls && (
          <div className="w-full max-w-md space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select the resume employers will receive with your applications.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => onSetActiveResume?.("builder")}
                disabled={
                  updatingResumeSource || effectiveIsBuilderActive || !effectiveHasBuilder
                }
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  effectiveIsBuilderActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow"
                    : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                } ${
                  updatingResumeSource || effectiveIsBuilderActive || !effectiveHasBuilder
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {updatingResumeSource && !effectiveIsBuilderActive
                  ? "Updating..."
                  : effectiveHasBuilder
                  ? effectiveIsBuilderActive
                    ? "Builder Active"
                    : "Use Builder Resume"
                  : "Save in builder to activate"}
              </button>
              <button
                onClick={() => onSetActiveResume?.("uploaded")}
                disabled={
                  updatingResumeSource || !effectiveHasUploaded || !effectiveIsBuilderActive
                }
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  !effectiveIsBuilderActive && effectiveHasUploaded
                    ? "bg-emerald-600 text-white border-emerald-600 shadow"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                } ${
                  updatingResumeSource || !effectiveHasUploaded || !effectiveIsBuilderActive
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {updatingResumeSource && effectiveIsBuilderActive
                  ? "Updating..."
                  : effectiveHasUploaded
                  ? !effectiveIsBuilderActive
                    ? "Uploaded Active"
                    : "Use Uploaded Resume"
                  : "Upload to activate"}
              </button>
            </div>
          </div>
        )}
      </div>

      {fileError && (
        <div className="text-sm text-red-600 font-medium text-center">
          {fileError}
        </div>
      )}

      {(effectiveHasBuilder || effectiveHasUploaded) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {effectiveHasBuilder && renderBuilderCard()}
          {effectiveHasUploaded && renderUploadedCard()}
        </div>
      )}

      {!(effectiveHasUploaded || effectiveHasBuilder) && (
        <div className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-2xl p-6 sm:p-8 bg-blue-50/40 dark:bg-blue-900/30 text-center space-y-4">
          <p className="text-gray-700 dark:text-gray-200 text-base font-medium">
            You don't have a saved resume yet. Upload an existing resume or build one with our Resume Builder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={triggerUpload}
              className={`inline-flex items-center justify-center bg-blue-600 text-white px-6 sm:px-7 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-base shadow-md ${
                uploadingResume ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              {uploadingResume ? "Uploading..." : "Upload Resume"}
            </button>
            <button
              onClick={() => navigate("/resume-builder")}
              className="inline-flex items-center justify-center bg-green-600 text-white px-6 sm:px-7 py-3 rounded-xl hover:bg-green-700 transition font-semibold text-base shadow-md"
            >
              📝 Build With Builder
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onFileChange}
        className="hidden"
      />
    </section>
  );
};

export default ResumeSection;
