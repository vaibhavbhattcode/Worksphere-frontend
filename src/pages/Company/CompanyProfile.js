// CompanyProfile.js
import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import { Formik, Form, Field, ErrorMessage } from "formik";
import LocationInput from "../../components/LocationInput";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import * as Yup from "yup";
import CompanySidebar from "../../components/Company/CompanySidebar";
import { FaSave, FaTimes, FaUpload, FaExternalLinkAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCompanyLogo } from "../../utils/companyUtils";

const companyTypeOptions = ["Public", "Private", "Non-Profit", "Government"];
const companySizeOptions = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1001+ employees",
];

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState(null);

  // Dynamic validation schema that has access to industries state
  const ProfileSchema = Yup.object().shape({
    companyName: Yup.string()
      .transform((value) => value?.trim())
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must not exceed 100 characters")
      .required("Company name is required"),
    tagline: Yup.string()
      .transform((value) => value?.trim())
      .max(150, "Tagline must not exceed 150 characters")
      .nullable(),
    description: Yup.string()
      .transform((value) => value?.trim().replace(/\s+/g, ' '))
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must not exceed 2000 characters")
      .nullable(),
    industry: Yup.string()
      .required("Industry is required")
      .test("valid-industry", "Please select a valid industry from the list", function(value) {
        if (!value) return false;
        return industries.includes(value);
      }),
    website: Yup.string()
      .transform((value) => value?.trim())
      .url("Please enter a valid URL (e.g., https://example.com)")
      .matches(
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        "Invalid website URL format"
      )
      .nullable(),
    headquarters: Yup.string()
      .transform((value) => value?.trim())
      .min(2, "Headquarters must be at least 2 characters")
      .max(100, "Headquarters must not exceed 100 characters")
      .nullable(),
    companyType: Yup.string()
      .oneOf(companyTypeOptions, "Please select a valid company type")
      .required("Company type is required"),
    companySize: Yup.string()
      .oneOf(companySizeOptions, "Please select a valid company size")
      .required("Company size is required"),
    founded: Yup.string()
      .transform((value) => value?.trim())
      .matches(/^\d{4}$/, "Please enter a valid 4-digit year (e.g., 2010)")
      .test("valid-year", "Year must be between 1800 and current year", function(value) {
        if (!value) return true;
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        return year >= 1800 && year <= currentYear;
      })
      .nullable(),
    specialties: Yup.string()
      .transform((value) => value?.trim())
      .max(500, "Specialties must not exceed 500 characters")
      .nullable(),
    contactEmail: Yup.string()
      .transform((value) => value?.trim().toLowerCase())
      .email("Please enter a valid email address")
      .required("Contact email is required"),
    contactPhone: Yup.string()
      .transform((value) => value?.trim())
      .test(
        "valid-phone",
        "Please enter a valid phone number (with country code)",
        function (value) {
          if (!value) return true;
          try {
            const phone = parsePhoneNumberFromString("+" + value.replace(/\D/g, ""));
            return phone && phone.isValid();
          } catch {
            return false;
          }
        }
      )
      .nullable(),
    mission: Yup.string()
      .transform((value) => value?.trim().replace(/\s+/g, ' '))
      .max(1000, "Mission must not exceed 1000 characters")
      .nullable(),
    vision: Yup.string()
      .transform((value) => value?.trim().replace(/\s+/g, ' '))
      .max(1000, "Vision must not exceed 1000 characters")
      .nullable(),
  });

  // Fetch industries from database
  useEffect(() => {
    const fetchIndustries = async () => {
      setIndustriesLoading(true);
      setIndustriesError(null);

      try {
        const response = await axiosInstance.get("/industries");

        if (response.data && response.data.success && response.data.data) {
          const fetchedIndustries = response.data.data.map(industry => industry.name);
          setIndustries(fetchedIndustries);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching industries:", error);
        setIndustriesError("Failed to load industries from server.");
        toast.error("Failed to load industries. Please refresh the page.");
        setIndustries([]); // Empty array to show error state
      } finally {
        setIndustriesLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axiosInstance.get("/company/auth/status");
        if (res.data.loggedIn && res.data.type !== "company") {
          setError("Please log in as a company to access this page.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const fetchProfileData = async () => {
          try {
            const response = await axiosInstance.get("/company/profile");
            setProfileData(response.data);
          } catch (err) {
            setError("Failed to fetch profile data.");
          } finally {
            setLoading(false);
          }
        };
        fetchProfileData();
      } catch (err) {
        navigate("/company/login");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const response = await axiosInstance.post(
        "/company/profile/logo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setProfileData((prev) => ({ ...prev, logo: response.data.logo }));
      toast.success("Logo updated successfully!");
    } catch (error) {
      toast.error("Failed to upload logo.");
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    // Trim all string values and remove extra whitespace
    const cleanValues = Object.keys(values).reduce((acc, key) => {
      let value = values[key];
      if (typeof value === 'string') {
        // Trim leading/trailing whitespace
        value = value.trim();
        // Replace multiple spaces with single space for multi-line fields
        if (['description', 'mission', 'vision'].includes(key)) {
          value = value.replace(/\s+/g, ' ');
        }
      }
      acc[key] = value;
      return acc;
    }, {});

    const updatedValues = {
      ...cleanValues,
      specialties: cleanValues.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
    };

    try {
      const response = await axiosInstance.put(
        "/company/profile",
        updatedValues
      );
      setProfileData(response.data);
      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update profile.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-10 text-gray-600">Loading profile...</div>
    );
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  // Check if profile is incomplete
  const isProfileIncomplete =
    !profileData.companyName ||
    !profileData.industry ||
    !profileData.companyType ||
    !profileData.companySize ||
    !profileData.contactEmail;

  const initialValues = {
    companyName: profileData.companyName || "",
    tagline: profileData.tagline || "",
    description: profileData.description || "",
    industry: profileData.industry || "",
    website: profileData.website || "",
    headquarters: profileData.headquarters || "",
    companyType: profileData.companyType || "",
    companySize: profileData.companySize || "",
    founded: profileData.founded || "",
    specialties: profileData.specialties
      ? profileData.specialties.join(", ")
      : "",
    contactEmail: profileData.contactEmail || "",
    contactPhone: profileData.contactPhone || "",
    mission: profileData.mission || "",
    vision: profileData.vision || "",
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <CompanySidebar />
      <div className="flex-1 p-4 md:ml-80 pt-16 md:pt-4 bg-white/50 backdrop-blur-sm border-l border-slate-200/50">
        <div className="max-w-4xl mx-auto">
          {/* Notification if profile is incomplete */}
          {isProfileIncomplete && !editMode && (
            <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md flex items-center justify-between">
              <span>
                Your profile is incomplete. Please complete your profile.
              </span>
              <button
                onClick={() => setEditMode(true)}
                className="ml-4 text-blue-600 underline"
              >
                Complete Profile
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Company Profile
            </h1>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 text-white rounded-md flex items-center transition-colors ${
                editMode
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {editMode ? (
                <>
                  <FaTimes className="mr-2" /> Cancel
                </>
              ) : (
                <>
                  <FaSave className="mr-2" /> Edit Profile
                </>
              )}
            </button>
          </div>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-8 text-white">
              <div className="flex items-center space-x-6">
                <img
                  src={getCompanyLogo(profileData.logo)}
                  alt={`${profileData.companyName || 'Company'} Logo`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                <div>
                  <h2 className="text-3xl font-bold">
                    {profileData.companyName}
                  </h2>
                  {profileData.tagline && (
                    <p className="text-lg mt-1">{profileData.tagline}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8">
              {editMode ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Formik
                    initialValues={initialValues}
                    validationSchema={ProfileSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ isSubmitting }) => (
                      <Form>
                        <div className="mb-6">
                          <label className="block text-gray-700 font-semibold mb-2">
                            Company Logo
                          </label>
                          <div className="flex items-center space-x-4">
                            <img
                              src={getCompanyLogo(profileData.logo)}
                              alt="Company Logo"
                              className="w-24 h-24 rounded-full object-cover"
                            />
                            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center transition-colors">
                              <FaUpload className="mr-2" /> Upload Logo
                              <input
                                type="file"
                                className="hidden"
                                onChange={handleLogoUpload}
                                accept="image/*"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="companyName"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Company Name <span className="text-red-500">*</span>
                            </label>
                            <Field
                              name="companyName"
                              type="text"
                              placeholder="Enter your company name"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <ErrorMessage
                              name="companyName"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="tagline"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Tagline
                            </label>
                            <Field
                              name="tagline"
                              type="text"
                              placeholder="Brief company tagline (max 150 chars)"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <ErrorMessage
                              name="tagline"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        </div>
                        <div className="mb-6">
                          <label
                            htmlFor="description"
                            className="block text-gray-700 font-semibold mb-1"
                          >
                            Description
                            <span className="text-gray-500 text-xs font-normal ml-2">(10-2000 characters)</span>
                          </label>
                          <Field
                            as="textarea"
                            name="description"
                            rows="4"
                            placeholder="Describe your company, its mission, and what makes it unique..."
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                          />
                          <ErrorMessage
                            name="description"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="industry"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Industry <span className="text-red-500">*</span>
                            </label>
                            <Field
                              as="select"
                              name="industry"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                              <option value="">Select Industry</option>
                              {industriesLoading ? (
                                <option disabled>Loading industries...</option>
                              ) : (
                                industries.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))
                              )}
                            </Field>
                            <ErrorMessage
                              name="industry"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="website"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Website
                            </label>
                            <Field
                              name="website"
                              type="text"
                              placeholder="https://www.example.com"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <ErrorMessage
                              name="website"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="headquarters"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Headquarters
                            </label>
                            <Field name="headquarters">
                              {({ field, form }) => (
                                <LocationInput
                                  value={field.value}
                                  onChange={(val) => form.setFieldValue("headquarters", val)}
                                  placeholder="Enter city, state, country"
                                  requireSelection={false}
                                />
                              )}
                            </Field>
                            <ErrorMessage
                              name="headquarters"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="companyType"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Company Type <span className="text-red-500">*</span>
                            </label>
                            <Field
                              as="select"
                              name="companyType"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                              <option value="">Select Type</option>
                              {companyTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage
                              name="companyType"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="companySize"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Company Size <span className="text-red-500">*</span>
                            </label>
                            <Field
                              as="select"
                              name="companySize"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                              <option value="">Select Size</option>
                              {companySizeOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage
                              name="companySize"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="founded"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Founded
                            </label>
                            <Field
                              name="founded"
                              type="text"
                              placeholder="e.g., 2010"
                              maxLength="4"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <ErrorMessage
                              name="founded"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        </div>
                        <div className="mb-6">
                          <label
                            htmlFor="specialties"
                            className="block text-gray-700 font-semibold mb-1"
                          >
                            Specialties
                            <span className="text-gray-500 text-xs font-normal ml-2">(Comma separated, max 500 chars)</span>
                          </label>
                          <Field
                            name="specialties"
                            type="text"
                            placeholder="e.g., Web Development, Mobile Apps, Cloud Solutions"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                          />
                          <ErrorMessage
                            name="specialties"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="contactEmail"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Contact Email <span className="text-red-500">*</span>
                              <span className="text-gray-500 text-xs font-normal ml-2">(Cannot be changed)</span>
                            </label>
                            <Field
                              name="contactEmail"
                              type="email"
                              disabled
                              className="w-full p-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none shadow-sm"
                              title="Contact email cannot be changed. Please contact support if you need to update this."
                            />
                            <ErrorMessage
                              name="contactEmail"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="contactPhone"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Contact Phone
                            </label>
                            <Field name="contactPhone">
                              {({ field, form }) => (
                                <PhoneInput
                                  country={'us'}
                                  value={field.value}
                                  onChange={val => form.setFieldValue('contactPhone', val)}
                                  inputProps={{
                                    name: 'contactPhone',
                                    required: false,
                                    autoFocus: false,
                                  }}
                                  inputClass="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                  specialLabel=""
                                />
                              )}
                            </Field>
                            <ErrorMessage
                              name="contactPhone"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label
                              htmlFor="mission"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Mission
                              <span className="text-gray-500 text-xs font-normal ml-2">(Max 1000 characters)</span>
                            </label>
                            <Field
                              as="textarea"
                              name="mission"
                              rows="3"
                              placeholder="What is your company's mission?"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <ErrorMessage
                              name="mission"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="vision"
                              className="block text-gray-700 font-semibold mb-1"
                            >
                              Vision
                              <span className="text-gray-500 text-xs font-normal ml-2">(Max 1000 characters)</span>
                            </label>
                            <Field
                              as="textarea"
                              name="vision"
                              rows="3"
                              placeholder="What is your company's vision?"
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <ErrorMessage
                              name="vision"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 transition-colors"
                        >
                          {isSubmitting ? (
                            "Saving..."
                          ) : (
                            <>
                              <FaSave className="mr-2" /> Save Profile
                            </>
                          )}
                        </button>
                      </Form>
                    )}
                  </Formik>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Overview
                    </h3>
                    <p className="text-gray-600">
                      {profileData.description || "No description provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <p className="text-gray-500 font-medium">Industry</p>
                      <p className="text-gray-700">
                        {profileData.industry || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Website</p>
                      {profileData.website ? (
                        <a
                          href={profileData.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
                        >
                          {profileData.website}{" "}
                          <FaExternalLinkAlt className="ml-1 text-sm" />
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Headquarters</p>
                      <p className="text-gray-700">
                        {profileData.headquarters || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Company Type</p>
                      <p className="text-gray-700">
                        {profileData.companyType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Company Size</p>
                      <p className="text-gray-700">
                        {profileData.companySize || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Founded</p>
                      <p className="text-gray-700">
                        {profileData.founded || "N/A"}
                      </p>
                    </div>
                  </div>
                  {profileData.specialties?.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Specialties
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Contact Information
                      </h3>
                      <p className="text-gray-700">
                        <span className="text-gray-500 font-medium">
                          Email:{" "}
                        </span>
                        {profileData.contactEmail || "N/A"}
                      </p>
                      <p className="text-gray-700">
                        <span className="text-gray-500 font-medium">
                          Phone:{" "}
                        </span>
                        {profileData.contactPhone || "N/A"}
                      </p>
                    </div>
                    {(profileData.mission || profileData.vision) && (
                      <div>
                        {profileData.mission && (
                          <>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              Mission
                            </h3>
                            <p className="text-gray-700">
                              {profileData.mission}
                            </p>
                          </>
                        )}
                        {profileData.vision && (
                          <>
                            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">
                              Vision
                            </h3>
                            <p className="text-gray-700">
                              {profileData.vision}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CompanyProfile;
