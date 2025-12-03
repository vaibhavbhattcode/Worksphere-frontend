import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import axiosInstance from "../../axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import CompanySidebar from "../../components/Company/CompanySidebar";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Reuse the richer location autocomplete used in the posting page
const LocationInput = ({ value, onChange, error }) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const toFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return "";
    const code = countryCode.toUpperCase();
    const base = 0x1f1e6;
    return String.fromCodePoint(base + (code.charCodeAt(0) - 65), base + (code.charCodeAt(1) - 65));
  };

  const formatSuggestion = (item) => {
    const a = item.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.hamlet || "";
    const state = a.state || a.region || a.county || "";
    const country = a.country || "";
    const parts = [];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    const label = parts.join(", ") || item.display_name;
    const flag = toFlag(a.country_code);
    return { label, flag };
  };

  useEffect(() => {
    if (query.length < 2 || query === selectedLocation) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const allowedTypes = new Set([
      "city",
      "town",
      "village",
      "hamlet",
      "municipality",
      "suburb",
      "county",
      "state",
      "province",
      "region",
      "country",
    ]);

    const fetchParallel = async () => {
      setLoading(true);
      try {
        const encoded = encodeURIComponent(query);
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&dedupe=1&limit=8&q=${encoded}`;
        const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=8&language=en&format=json`;

        const [nomRes, meteoRes] = await Promise.allSettled([
          axios.get(nominatimUrl, {
            headers: { "Accept-Language": "en" },
            timeout: 8000,
            signal: controller.signal,
          }),
          axios.get(openMeteoUrl, {
            timeout: 6000,
            signal: controller.signal,
          }),
        ]);

        const results = [];

        if (meteoRes.status === "fulfilled" && meteoRes.value?.data?.results) {
          meteoRes.value.data.results.forEach((r) => {
            const address = {
              city: r.name,
              state: r.admin1 || r.admin2 || "",
              country: r.country || "",
              country_code: (r.country_code || "").toLowerCase(),
            };
            results.push({
              place_id: `om_${r.id}`,
              address,
              display_name: `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`,
              type: "city",
            });
          });
        }

        if (nomRes.status === "fulfilled" && Array.isArray(nomRes.value.data)) {
          const filtered = nomRes.value.data.filter((item) => allowedTypes.has(item.type));
          results.push(...filtered);
        }

        const seen = new Set();
        const deduped = [];
        for (const item of results) {
          const { label } = formatSuggestion(item);
          const key = label.toLowerCase();
          if (!label || seen.has(key)) continue;
          seen.add(key);
          deduped.push(item);
        }

        setSuggestions(deduped.slice(0, 10));
        setActiveIndex(-1);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
        console.error("Error fetching location suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchParallel, 250);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, selectedLocation]);

  const handleSelect = (label) => {
    onChange(label);
    setQuery(label);
    setSelectedLocation(label);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleChange = (e) => {
    const nextValue = e.target.value;
    if (selectedLocation && nextValue !== selectedLocation) {
      setSelectedLocation("");
    }
    setQuery(nextValue);
    onChange(nextValue);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const { label } = formatSuggestion(suggestions[activeIndex]);
      handleSelect(label);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const highlight = (text, q) => {
    if (!q) return text;
    try {
      const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      return text.split(regex).map((part, idx) =>
        regex.test(part) ? (
          <mark key={idx} className="bg-yellow-100 text-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="relative" role="combobox" aria-expanded={suggestions.length > 0} aria-haspopup="listbox">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-9 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
          placeholder="Type location (City, State, Country)"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="edit-location-suggestions"
        />
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 10.5c0 7-7.5 9-7.5 9s-7.5-2-7.5-9a7.5 7.5 0 1115 0z" />
          </svg>
        </span>
        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setSuggestions([]);
              setActiveIndex(-1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {loading && <p className="text-xs text-gray-500 mt-1">Loading...</p>}
      {suggestions.length > 0 && (
        <ul
          id="edit-location-suggestions"
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto"
        >
          {suggestions.map((item, index) => {
            const { label, flag } = formatSuggestion(item);
            const isActive = index === activeIndex;
            return (
              <li
                key={`${item.place_id}-${index}`}
                role="option"
                aria-selected={isActive}
                className={`px-3 py-2 text-gray-700 cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                  isActive ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50 hover:text-blue-700"
                }`}
                onMouseDown={() => handleSelect(label)}
              >
                <span className="truncate pr-2">{highlight(label, query)}</span>
                {flag && <span className="ml-2 text-base">{flag}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

const preventInvalidKeys = (e) => {
  if (["e", "E", "-"].includes(e.key)) {
    e.preventDefault();
  }
};

const formatData = (data) => {
  const formatted = { ...data };
  Object.keys(formatted).forEach((key) => {
    if (typeof formatted[key] === "string") {
      formatted[key] = formatted[key].trim();
    }
  });

  if (formatted.minSalary === "" || formatted.minSalary === null) formatted.minSalary = null;
  if (formatted.maxSalary === "" || formatted.maxSalary === null) formatted.maxSalary = null;
  if (formatted.exactSalary === "" || formatted.exactSalary === null) formatted.exactSalary = null;
  if (formatted.currency === "" || formatted.currency === null) formatted.currency = null;
  if (formatted.skills === "") formatted.skills = null;
  if (formatted.benefits === "") formatted.benefits = null;
  if (formatted.responsibilities === "") formatted.responsibilities = null;
  if (formatted.qualifications === "") formatted.qualifications = null;
  if (formatted.experienceLevel === "") formatted.experienceLevel = null;
  if (formatted.applicationDeadline === "") formatted.applicationDeadline = null;

  return formatted;
};

const EditJobPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const suggestionRefs = useRef([]);

  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobData, setJobData] = useState(null);
  const [hasInitializedForm, setHasInitializedForm] = useState(false);

  const [industryItems, setIndustryItems] = useState([]);
  const [industryNames, setIndustryNames] = useState([]);
  const [industryLookup, setIndustryLookup] = useState({});
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState(null);

  const [currencies, setCurrencies] = useState([]);
  const [currencyNames, setCurrencyNames] = useState({});
  const [currencySymbols, setCurrencySymbols] = useState({});
  const [popularCurrencies, setPopularCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [currenciesError, setCurrenciesError] = useState(null);

  const POPULAR_CURRENCY_CODES = useMemo(
    () => [
      "USD",
      "EUR",
      "GBP",
      "INR",
      "JPY",
      "CNY",
      "CAD",
      "AUD",
      "NZD",
      "CHF",
      "SEK",
      "NOK",
      "DKK",
      "SGD",
      "HKD",
      "AED",
      "SAR",
      "ZAR",
      "BRL",
      "MXN",
    ],
    []
  );

  const schema = yup
    .object()
    .shape({
      salaryType: yup
        .string()
        .oneOf(["range", "exact", "negotiable"], "Invalid salary type")
        .required("Salary type is required"),
      payPeriod: yup
        .string()
        .oneOf(["year", "month", "hour", "day"], "Invalid pay period")
        .required("Pay period is required"),
      jobTitle: yup
        .string()
        .trim()
        .test(
          "not-only-spaces",
          "Job title cannot be empty or contain only spaces",
          (value) => value && value.trim().length > 0
        )
        .min(3, "Job title must be at least 3 characters long")
        .max(100, "Job title cannot exceed 100 characters")
        .matches(
          /^[a-zA-Z0-9\s&\-\|\(\)\.,'"/#]+$/,
          "Job title contains invalid characters. Allowed: letters, numbers, spaces, and special characters like &, -, |, (, ), ., ,, ', \" , /, #"
        )
        .required("Job title is required"),
      description: yup
        .string()
        .trim()
        .test(
          "not-only-spaces",
          "Description cannot be empty or contain only spaces",
          (value) => value && value.trim().length > 0
        )
        .min(30, "Description must be at least 30 characters long")
        .max(5000, "Description cannot exceed 5000 characters")
        .required("Description is required"),
      jobType: yup
        .string()
        .oneOf(
          ["Full-time", "Part-time", "Contract", "Internship", "Temporary"],
          "Please select a valid job type"
        )
        .required("Job type is required"),
      location: yup
        .string()
        .trim()
        .test(
          "not-only-spaces",
          "Location cannot be empty or contain only spaces",
          (value) => value && value.trim().length > 0
        )
        .required("Location is required"),
      exactSalary: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .when("salaryType", (salaryType, inner) =>
          salaryType === "exact"
            ? inner.required("Exact salary is required").min(0, "Amount cannot be negative")
            : inner.nullable()
        ),
      minSalary: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .min(0, "Minimum salary cannot be negative")
        .when("salaryType", (salaryType, inner) =>
          salaryType === "range" ? inner.required("Minimum salary is required") : inner.nullable()
        ),
      maxSalary: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .min(0, "Maximum salary cannot be negative")
        .when("salaryType", (salaryType, inner) =>
          salaryType === "range" ? inner.required("Maximum salary is required") : inner.nullable()
        )
        .test("is-greater", "Maximum salary must be greater than minimum salary", function (value) {
          const { minSalary } = this.parent;
          if (minSalary != null && value != null) {
            return value > minSalary;
          }
          return true;
        }),
      currency: yup
        .string()
        .nullable()
        .test(
          "valid-currency",
          "Please select a valid ISO currency code (e.g., USD)",
          (value) => !value || /^[A-Z]{3}$/.test(value)
        )
        .when("salaryType", (salaryType, inner) =>
          salaryType === "negotiable" ? inner.nullable() : inner.required("Currency is required")
        ),
      industry: yup
        .string()
        .required("Industry is required")
        .test("valid-industry", "Please select a valid industry", function (value) {
          if (!value) return false;
          return industryNames.includes(value);
        }),
      remoteOption: yup
        .boolean()
        .transform((value, originalValue) => originalValue === "true")
        .default(false),
      skills: yup
        .string()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : originalValue?.trim() || null))
        .test(
          "not-only-spaces",
          "Skills cannot contain only spaces",
          (value) => !value || value.trim().length > 0
        )
        .test(
          "skills-format",
          "Each skill must be at least 2 characters long (e.g., 'JavaScript, React')",
          (value) => {
            if (!value) return true;
            const trimmed = value.trim();
            if (trimmed.length === 0) return true;
            const skillsArray = trimmed.split(",").map((skill) => skill.trim()).filter((skill) => skill.length > 0);
            if (skillsArray.length === 0) return true;
            return skillsArray.every((skill) => skill.length >= 2);
          }
        ),
      experienceLevel: yup
        .string()
        .oneOf(["Entry-level", "Mid-level", "Senior", "Executive"], "Please select a valid experience level")
        .nullable(),
      applicationDeadline: yup
        .date()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : new Date(originalValue)))
        .test(
          "deadline-at-least-tomorrow",
          "Application deadline must be at least tomorrow",
          (value) => {
            if (!value) return true;
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return value >= tomorrow;
          }
        )
        .typeError("Please enter a valid date in the format YYYY-MM-DD"),
      benefits: yup
        .string()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : originalValue?.trim() || null))
        .test("not-only-spaces", "Benefits cannot contain only spaces", (value) => !value || value.trim().length > 0)
        .max(2000, "Benefits cannot exceed 2000 characters"),
      responsibilities: yup
        .string()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : originalValue?.trim() || null))
        .test(
          "not-only-spaces",
          "Responsibilities cannot contain only spaces",
          (value) => !value || value.trim().length > 0
        )
        .max(3000, "Responsibilities cannot exceed 3000 characters"),
      qualifications: yup
        .string()
        .nullable()
        .transform((value, originalValue) => (originalValue === "" ? null : originalValue?.trim() || null))
        .test(
          "not-only-spaces",
          "Qualifications cannot contain only spaces",
          (value) => !value || value.trim().length > 0
        )
        .max(3000, "Qualifications cannot exceed 3000 characters"),
    });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      salaryType: "range",
      payPeriod: "year",
      jobTitle: "",
      description: "",
      jobType: "",
      location: "",
      minSalary: "",
      maxSalary: "",
      exactSalary: "",
      currency: "",
      industry: "",
      remoteOption: "false",
      skills: "",
      experienceLevel: "",
      applicationDeadline: "",
      benefits: "",
      responsibilities: "",
      qualifications: "",
    },
  });

  const formValues = watch();

  // Effect: If salaryType is 'negotiable', clear salary fields
  useEffect(() => {
    if (formValues.salaryType === 'negotiable') {
      // Clear numeric salary fields but preserve any selected currency so companies can choose it
      reset({
        ...formValues,
        minSalary: '',
        maxSalary: '',
        exactSalary: '',
      }, { keepErrors: true, keepDirty: true, keepTouched: true });
    }
  }, [formValues.salaryType]);
  const jobTitleValue = watch("jobTitle");

  const fetchTitleSuggestions = useMemo(
    () =>
      debounce(async (title) => {
        if (!title || title.length < 2) {
          setSuggestedTitles([]);
          return;
        }
        setTitleLoading(true);
        try {
          const res = await axiosInstance.get("/jobs/suggest-title", {
            params: { query: title },
            timeout: 3000,
          });
          setSuggestedTitles(res.data.suggestions || []);
        } catch (err) {
          const localSuggestions = [
            "Software Engineer",
            "Senior Software Engineer",
            "Full Stack Developer",
            "Frontend Developer",
            "Backend Developer",
            "DevOps Engineer",
            "Product Manager",
            "Project Manager",
            "Data Scientist",
            "UX Designer",
            "UI Designer",
            "Marketing Manager",
            "Sales Representative",
            "Business Analyst",
            "HR Manager",
            "Financial Analyst",
            "Accountant",
            "Operations Manager",
            "Customer Service Representative",
            "Quality Assurance Engineer",
            "System Administrator",
          ].filter((candidate) => candidate.toLowerCase().includes(title.toLowerCase()));
          setSuggestedTitles(localSuggestions.slice(0, 5));
        } finally {
          setTitleLoading(false);
        }
      }, 200),
    []
  );

  useEffect(() => {
    fetchTitleSuggestions(jobTitleValue);
    return () => {
      fetchTitleSuggestions.cancel();
    };
  }, [jobTitleValue, fetchTitleSuggestions]);

  useEffect(() => {
    const fetchIndustries = async () => {
      setIndustriesLoading(true);
      setIndustriesError(null);
      try {
        const response = await axiosInstance.get("/industries", {
          timeout: 10000,
        });
        if (response.data && response.data.success && response.data.data) {
          const fetched = response.data.data.map((item) => ({ id: item._id, name: item.name }));
          setIndustryItems(fetched);
          setIndustryNames(fetched.map((item) => item.name));
          const lookup = {};
          fetched.forEach((item) => {
            lookup[item.id] = item.name;
          });
          setIndustryLookup(lookup);
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error fetching industries:", error);
        setIndustriesError("Failed to load industries from database.");
        setIndustryItems([]);
        setIndustryNames([]);
        setIndustryLookup({});
      } finally {
        setIndustriesLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      setCurrenciesLoading(true);
      setCurrenciesError(null);
      try {
        const res = await axios.get("https://openexchangerates.org/api/currencies.json", {
          timeout: 10000,
        });
        if (res.status === 200 && res.data && typeof res.data === "object") {
          const codes = Object.keys(res.data)
            .filter((code) => /^[A-Z]{3}$/.test(code))
            .sort();
          setCurrencies(codes);
          setCurrencyNames(res.data);
          const symbols = {};
          const getSymbol = (code) => {
            try {
              const parts = new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: code,
                currencyDisplay: "symbol",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).formatToParts(0);
              const sym = parts.find((part) => part.type === "currency");
              return sym?.value || code;
            } catch (e) {
              return code;
            }
          };
          codes.forEach((code) => {
            symbols[code] = getSymbol(code);
          });
          setCurrencySymbols(symbols);
          const popular = codes.filter((code) => POPULAR_CURRENCY_CODES.includes(code));
          const orderedPopular = POPULAR_CURRENCY_CODES.filter((code) => popular.includes(code));
          setPopularCurrencies(orderedPopular);
        } else {
          throw new Error("Invalid currencies response");
        }
      } catch (error) {
        console.error("Error fetching currencies:", error);
        setCurrenciesError("Failed to load currencies");
        setCurrencies([]);
        setCurrencyNames({});
        setCurrencySymbols({});
      } finally {
        setCurrenciesLoading(false);
      }
    };
    fetchCurrencies();
  }, [POPULAR_CURRENCY_CODES]);

  useEffect(() => {
    const fetchJob = async () => {
      setJobLoading(true);
      try {
        const response = await axiosInstance.get(`/jobs/${jobId}`, {
          timeout: 10000,
        });
        setJobData(response.data);
      } catch (error) {
        console.error("Failed to fetch job details:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/company/login");
        } else if (error.response?.status === 404) {
          toast.error("Job not found.");
          navigate("/company/posted-jobs");
        } else {
          toast.error("Failed to fetch job details. Please try again.");
        }
        setJobLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const resolveIndustryName = useCallback(
    (industryField) => {
      if (!industryField) return "";
      if (typeof industryField === "string") {
        if (industryLookup[industryField]) return industryLookup[industryField];
        const trimmed = industryField.trim();
        if (!/[0-9a-fA-F]{24}/.test(trimmed)) return trimmed;
        return industryLookup[trimmed] || "";
      }
      if (typeof industryField === "object") {
        if (industryField.name) return industryField.name;
        if (industryField._id && industryLookup[industryField._id]) return industryLookup[industryField._id];
      }
      return "";
    },
    [industryLookup]
  );

  useEffect(() => {
    if (!jobData || hasInitializedForm) return;

    const salaryType = jobData.salaryType || (jobData.salary ? (jobData.salary.min === jobData.salary.max ? "exact" : "range") : "negotiable");
    const payPeriod = jobData.payPeriod || "year";

    const salary = jobData.salary || {};
    const industryName = resolveIndustryName(jobData.industry);

    reset({
      salaryType,
      payPeriod,
      jobTitle: jobData.jobTitle || "",
      description: jobData.description || "",
      jobType: jobData.jobType || "",
      location: jobData.location || "",
      minSalary: salaryType === "range" ? salary.min ?? "" : "",
      maxSalary: salaryType === "range" ? salary.max ?? "" : "",
      exactSalary: salaryType === "exact" ? salary.min ?? salary.max ?? "" : "",
      currency: salary.currency || "",
      industry: industryName || jobData.industryName || "",
      remoteOption: (jobData.remoteOption === true || String(jobData.remoteOption) === 'true') ? "true" : "false",
      skills: Array.isArray(jobData.skills) ? jobData.skills.join(", ") : jobData.skills || "",
      experienceLevel: jobData.experienceLevel || "",
      applicationDeadline: jobData.applicationDeadline
        ? new Date(jobData.applicationDeadline).toISOString().slice(0, 10)
        : "",
      benefits: Array.isArray(jobData.benefits) ? jobData.benefits.join("\n") : jobData.benefits || "",
      responsibilities: Array.isArray(jobData.responsibilities)
        ? jobData.responsibilities.join("\n")
        : jobData.responsibilities || "",
      qualifications: Array.isArray(jobData.qualifications)
        ? jobData.qualifications.join("\n")
        : jobData.qualifications || "",
    });

    setHasInitializedForm(true);
    setJobLoading(false);
  }, [jobData, reset, resolveIndustryName, hasInitializedForm]);

  useEffect(() => {
    if (!jobData || !hasInitializedForm) return;
    const resolved = resolveIndustryName(jobData.industry);
    if (resolved) {
      setValue("industry", resolved, { shouldDirty: false, shouldTouch: false });
    }
  }, [industryLookup, jobData, hasInitializedForm, resolveIndustryName, setValue]);

  const onSubmit = async (data) => {
    try {
      const formattedData = formatData(data);
      // Accept both boolean and string values for remoteOption
      formattedData.remoteOption = formattedData.remoteOption === true || String(formattedData.remoteOption) === "true";

      if (!formattedData.applicationDeadline) {
        formattedData.applicationDeadline = null;
      }

      if (formattedData.salaryType === "exact") {
        formattedData.minSalary = null;
        formattedData.maxSalary = null;
      } else if (formattedData.salaryType === "range") {
        formattedData.exactSalary = null;
      } else if (formattedData.salaryType === "negotiable") {
        formattedData.minSalary = null;
        formattedData.maxSalary = null;
        formattedData.exactSalary = null;
        // Preserve currency for negotiable postings if the company selected one
      }

      // Debug: show outgoing payload (temporary)
      console.debug('[debug] EditJobPage outgoing payload:', formattedData);
      toast.info("🔄 Updating your job...", {
        autoClose: false,
        toastId: "updating-job",
        style: {
          background: "#3B82F6",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        },
        icon: "🔄",
      });

      const response = await axiosInstance.put(`/jobs/${jobId}`, formattedData, {
        timeout: 15000,
      });

      toast.dismiss("updating-job");

      if (response.status === 200) {
        toast.success("✅ Job updated successfully!", {
          duration: 3500,
          style: {
            background: "#10B981",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          },
          icon: "✅",
        });

        setTimeout(() => {
          navigate("/company/posted-jobs");
        }, 1800);
      } else {
        throw new Error(response.data?.message || "Failed to update job");
      }
    } catch (error) {
      toast.dismiss("updating-job");

      let errorMessage = "Failed to update job. Please try again.";
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        if (status === 400) errorMessage = serverMessage || "⚠️ Invalid job data.";
        else if (status === 401) errorMessage = "🔒 Authentication failed. Please log in again.";
        else if (status === 403) errorMessage = "🚫 You do not have permission to update this job.";
        else if (status === 404) errorMessage = "🔍 Job not found.";
        else if (status === 500) errorMessage = "🔧 Server error. Please try again later.";
        else errorMessage = serverMessage || errorMessage;
      } else if (error.request) {
        errorMessage = "📡 Cannot connect to server. Please ensure the backend is running.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: "#EF4444",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 8px 25px rgba(239, 68, 68, 0.3)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        },
        icon: "❌",
      });
    }
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          className="text-gray-600 text-lg flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading job details...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CompanySidebar />
      <div className="flex-grow md:ml-80 p-6 lg:p-8 pt-16 md:pt-6 bg-white/50 backdrop-blur-sm border-l border-slate-200/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Job</h1>
              <p className="text-gray-600 text-sm mt-1">Update the information below to keep your posting accurate and compelling.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/company/posted-jobs")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 shadow-sm"
              >
                View Posted Jobs
              </button>
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                Job Preview
              </h2>
              <div className="space-y-3 bg-white rounded-lg p-4 shadow-sm">
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Title:</span> <span className="text-blue-600">{formValues.jobTitle || "Untitled Job"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Description:</span> <span className="text-sm">{formValues.description || "No description provided"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Job Type:</span> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{formValues.jobType || "Not specified"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Location:</span> <span className="text-sm">{formValues.location || "Not specified"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Remote Option:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${(formValues.remoteOption === true || String(formValues.remoteOption) === "true") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{(formValues.remoteOption === true || String(formValues.remoteOption) === "true") ? "Yes" : "No"}</span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Compensation:</span> <span className="text-green-600 font-medium">
                    {(() => {
                      const type = formValues.salaryType;
                      const period = formValues.payPeriod || "year";
                      const suffix = `/${period}`;
                      const code = formValues.currency;
                      try {
                        const formatter = code
                          ? new Intl.NumberFormat(undefined, { style: "currency", currency: code })
                          : null;
                        if (type === "negotiable") return "Negotiable";
                        if (type === "exact") {
                          const amount = formValues.exactSalary;
                          if (!amount) return `N/A ${suffix}`;
                          const val = Number(amount);
                          return `${formatter ? formatter.format(val) : val} ${suffix}`;
                        }
                        const min = formValues.minSalary;
                        const max = formValues.maxSalary;
                        if (!min && !max) return `N/A ${suffix}`;
                        const minTxt = min ? (formatter ? formatter.format(Number(min)) : Number(min)) : "N/A";
                        const maxTxt = max ? (formatter ? formatter.format(Number(max)) : Number(max)) : "N/A";
                        return `${minTxt} - ${maxTxt} ${suffix}`;
                      } catch {
                        if (type === "exact") return `${formValues.exactSalary || "N/A"} ${code ? code + " " : ""}${suffix}`;
                        return `${formValues.minSalary || "N/A"} - ${formValues.maxSalary || "N/A"} ${code ? code + " " : ""}${suffix}`;
                      }
                    })()}
                  </span>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium text-gray-900">Industry:</span> <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">{formValues.industry || "Not specified"}</span>
                </p>
                {formValues.skills && (
                  <p className="text-gray-700">
                    <span className="font-medium text-gray-900">Skills:</span> <span className="text-sm">{formValues.skills}</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Job Details
              </h2>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500 font-normal">({formValues.jobTitle?.length || 0}/100 characters)</span>
                </label>
                <input
                  type="text"
                  {...register("jobTitle")}
                  onBlur={(e) => {
                    e.target.value = e.target.value.trim();
                    register("jobTitle").onBlur(e);
                    setActiveSuggestion(-1);
                  }}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                  placeholder="e.g., Senior Software Engineer & Team Lead"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (suggestedTitles.length > 0) {
                      if (e.key === "ArrowDown") {
                        setActiveSuggestion((prev) => {
                          const next = Math.min(prev + 1, suggestedTitles.length - 1);
                          setTimeout(() => {
                            if (suggestionRefs.current[next]) {
                              suggestionRefs.current[next].scrollIntoView({ block: "nearest" });
                            }
                          }, 0);
                          return next;
                        });
                        e.preventDefault();
                      } else if (e.key === "ArrowUp") {
                        setActiveSuggestion((prev) => {
                          const next = Math.max(prev - 1, 0);
                          setTimeout(() => {
                            if (suggestionRefs.current[next]) {
                              suggestionRefs.current[next].scrollIntoView({ block: "nearest" });
                            }
                          }, 0);
                          return next;
                        });
                        e.preventDefault();
                      } else if (e.key === "Enter" && activeSuggestion >= 0) {
                        reset({ ...formValues, jobTitle: suggestedTitles[activeSuggestion] });
                        setSuggestedTitles([]);
                        setActiveSuggestion(-1);
                        e.preventDefault();
                      } else if (e.key === "Escape") {
                        setSuggestedTitles([]);
                        setActiveSuggestion(-1);
                      }
                    }
                  }}
                />
                {titleLoading && <div className="absolute right-2 top-2 text-xs text-gray-400">Loading...</div>}
                {suggestedTitles.length > 0 && formValues.jobTitle && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {suggestedTitles.map((title, idx) => {
                      const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);
                      return (
                        <li
                          key={idx}
                          ref={(el) => (suggestionRefs.current[idx] = el)}
                          className={`px-4 py-2 text-gray-700 cursor-pointer transition-colors duration-150 ${
                            activeSuggestion === idx ? "bg-blue-50 text-blue-600" : "hover:bg-blue-50 hover:text-blue-600"
                          }`}
                          onMouseDown={() => {
                            reset({ ...formValues, jobTitle: title });
                            setSuggestedTitles([]);
                            setActiveSuggestion(-1);
                          }}
                          aria-selected={activeSuggestion === idx}
                        >
                          {displayTitle}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500 font-normal">({formValues.description?.length || 0}/5000 characters)</span>
                </label>
                <textarea
                  {...register("description")}
                  onBlur={(e) => {
                    e.target.value = e.target.value.trim();
                    register("description").onBlur(e);
                  }}
                  maxLength={5000}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm resize-vertical"
                  rows="5"
                  placeholder="Describe the role, responsibilities, and requirements..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("jobType")}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                >
                  <option value="">Select Job Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Temporary">Temporary</option>
                </select>
                {errors.jobType && <p className="text-red-500 text-sm mt-1">{errors.jobType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <LocationInput value={field.value} onChange={field.onChange} error={error} />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remote Option</label>
                <select
                  {...register("remoteOption")}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                  <select
                    {...register("salaryType")}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                  >
                    <option value="range">Range</option>
                    <option value="exact">Exact</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
                  <select
                    {...register("payPeriod")}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                    disabled={formValues.salaryType === 'negotiable'}
                  >
                    <option value="year">Yearly</option>
                    <option value="month">Monthly</option>
                    <option value="hour">Hourly</option>
                    <option value="day">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formValues.salaryType === "exact" ? "Amount" : "Minimum Salary"}
                  </label>
                  {formValues.salaryType === "exact" ? (
                    <input
                      type="number"
                      min="0"
                      {...register("exactSalary")}
                      onKeyDown={preventInvalidKeys}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                      placeholder="e.g., 70000"
                      disabled={formValues.salaryType === 'negotiable'}
                    />
                  ) : (
                    <input
                      type="number"
                      min="0"
                      {...register("minSalary")}
                      onKeyDown={preventInvalidKeys}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                      placeholder="e.g., 50000"
                      disabled={formValues.salaryType === 'negotiable'}
                    />
                  )}
                  {errors.minSalary && formValues.salaryType !== "exact" && <p className="text-red-500 text-sm mt-1">{errors.minSalary.message}</p>}
                  {errors.exactSalary && formValues.salaryType === "exact" && <p className="text-red-500 text-sm mt-1">{errors.exactSalary.message}</p>}
                </div>
                {formValues.salaryType === "range" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
                    <input
                      type="number"
                      min="0"
                      {...register("maxSalary")}
                      onKeyDown={preventInvalidKeys}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                      placeholder="e.g., 90000"
                      disabled={formValues.salaryType === 'negotiable'}
                    />
                    {errors.maxSalary && <p className="text-red-500 text-sm mt-1">{errors.maxSalary.message}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  {currenciesLoading ? (
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 animate-pulse flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading currencies...
                    </div>
                  ) : currenciesError ? (
                    <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-700 flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      {currenciesError}
                    </div>
                  ) : (
                    <select
                      {...register("currency")}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                    >
                      <option value="">Select Currency</option>
                      {(popularCurrencies.length ? popularCurrencies : POPULAR_CURRENCY_CODES).map((cur) => {
                        const symbol = currencySymbols[cur] || cur;
                        const name = currencyNames[cur] || "";
                        return (
                          <option key={`popular-${cur}`} value={cur}>
                            {cur} — {symbol}
                            {name ? ` (${name})` : ""}
                          </option>
                        );
                      })}
                      {currencies
                        .filter((code) => !POPULAR_CURRENCY_CODES.includes(code))
                        .map((code) => (
                          <option key={code} value={code}>
                            {code} — {currencySymbols[code] || code}
                            {currencyNames[code] ? ` (${currencyNames[code]})` : ""}
                          </option>
                        ))}
                    </select>
                  )}
                  {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry <span className="text-red-500">*</span>
                </label>
                {industriesLoading ? (
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 animate-pulse flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading industries...
                  </div>
                ) : industriesError ? (
                  <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-700 flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    {industriesError}
                  </div>
                ) : (
                  <select
                    {...register("industry")}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                  >
                    <option value="">Select Industry</option>
                    {industryItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (optional, comma-separated)</label>
                <input
                  type="text"
                  {...register("skills")}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed !== e.target.value) {
                      e.target.value = trimmed;
                      register("skills").onChange(e);
                    }
                    register("skills").onBlur(e);
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
                {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  {...register("experienceLevel")}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                >
                  <option value="">Select Experience Level</option>
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
                {errors.experienceLevel && <p className="text-red-500 text-sm mt-1">{errors.experienceLevel.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline (optional)</label>
                <input
                  type="date"
                  {...register("applicationDeadline")}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm"
                />
                {errors.applicationDeadline && <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits (optional)
                  <span className="ml-2 text-xs text-gray-500 font-normal">({formValues.benefits?.length || 0}/2000 characters)</span>
                </label>
                <textarea
                  {...register("benefits")}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed !== e.target.value) {
                      e.target.value = trimmed;
                      register("benefits").onChange(e);
                    }
                    register("benefits").onBlur(e);
                  }}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm resize-vertical"
                  rows="3"
                  placeholder="e.g., Health insurance, 401(k), remote work flexibility..."
                />
                {errors.benefits && <p className="text-red-500 text-sm mt-1">{errors.benefits.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsibilities (optional)
                  <span className="ml-2 text-xs text-gray-500 font-normal">({formValues.responsibilities?.length || 0}/3000 characters)</span>
                </label>
                <textarea
                  {...register("responsibilities")}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed !== e.target.value) {
                      e.target.value = trimmed;
                      register("responsibilities").onChange(e);
                    }
                    register("responsibilities").onBlur(e);
                  }}
                  maxLength={3000}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm resize-vertical"
                  rows="4"
                  placeholder="List the main responsibilities..."
                />
                {errors.responsibilities && <p className="text-red-500 text-sm mt-1">{errors.responsibilities.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualifications (optional)
                  <span className="ml-2 text-xs text-gray-500 font-normal">({formValues.qualifications?.length || 0}/3000 characters)</span>
                </label>
                <textarea
                  {...register("qualifications")}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed !== e.target.value) {
                      e.target.value = trimmed;
                      register("qualifications").onChange(e);
                    }
                    register("qualifications").onBlur(e);
                  }}
                  maxLength={3000}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 shadow-sm resize-vertical"
                  rows="4"
                  placeholder="List the required qualifications..."
                />
                {errors.qualifications && <p className="text-red-500 text-sm mt-1">{errors.qualifications.message}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update Job"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{
          zIndex: 9999,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        toastStyle={{
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
          minWidth: "320px",
          padding: "16px",
        }}
        progressStyle={{
          background: "rgba(255, 255, 255, 0.8)",
          height: "3px",
        }}
      />
    </div>
  );
};

export default EditJobPage;
