// ResumeBuilderAdvanced.js - Professional Resume Builder
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as Yup from "yup";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ClassicTemplate,
  ModernBlueTemplate,
  MinimalTemplate,
  SidebarTemplate,
  ExecutiveTemplate,
  TechnicalTemplate
} from "../components/ResumeTemplateComponents";

// Professional templates with proper configurations
const templates = [
  {
    id: 1,
    name: "Classic Professional",
    component: ClassicTemplate,
    previewColor: "bg-white",
    textColor: "text-gray-900",
    description: "Timeless traditional design suitable for all industries",
    category: "professional"
  },
  {
    id: 2,
    name: "Modern Blue",
    component: ModernBlueTemplate,
    previewColor: "bg-blue-600",
    textColor: "text-white",
    description: "Contemporary design with blue accent header",
    category: "modern"
  },
  {
    id: 3,
    name: "Minimal Clean",
    component: MinimalTemplate,
    previewColor: "bg-gray-50",
    textColor: "text-gray-800",
    description: "Clean and minimalist design for creative roles",
    category: "minimal"
  },
  {
    id: 4,
    name: "Creative Sidebar",
    component: SidebarTemplate,
    previewColor: "bg-gray-900",
    textColor: "text-white",
    description: "Two-column layout with sidebar for skills",
    category: "creative"
  },
  {
    id: 5,
    name: "Executive",
    component: ExecutiveTemplate,
    previewColor: "bg-gradient-to-r from-gray-100 to-gray-200",
    textColor: "text-gray-900",
    description: "Premium design for senior professionals",
    category: "executive"
  },
  {
    id: 6,
    name: "Technical",
    component: TechnicalTemplate,
    previewColor: "bg-gray-800",
    textColor: "text-green-400",
    description: "Tech-focused design with monospace fonts",
    category: "technical"
  }
];

// Animation variants for step transitions
const stepVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

// Dropdown options for form fields
const institutions = [
  "Harvard University", "Stanford University", "MIT", "University of Oxford", "University of Cambridge", 
  "IIT Bombay", "IIT Delhi", "IIT Kanpur", "IIT Kharagpur", "IIT Madras", "NIT Trichy", 
  "NIT Surathkal", "NIT Warangal", "BITS Pilani", "Delhi University", "Mumbai University", 
  "JNU", "Anna University", "VIT", "SRM University", "Other"
];

const degreeOptions = [
  "B.Tech", "M.Tech", "B.E.", "M.E.", "B.Sc", "M.Sc", "B.Com", "M.Com", 
  "B.A.", "M.A.", "MBA", "PhD", "Diploma", "Other"
];

const positions = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", 
  "Data Scientist", "Product Manager", "UI/UX Designer", "DevOps Engineer", "QA Engineer", 
  "Business Analyst", "Project Manager", "Intern", "Other"
];

const companies = [
  "Google", "Microsoft", "Amazon", "Facebook", "Apple", "Netflix", "Tesla", "TCS", 
  "Infosys", "Wipro", "Accenture", "Capgemini", "Cognizant", "IBM", "HCL", "Other"
];

function ResumeBuilderAdvanced() {
  const navigate = useNavigate();
  
  // Cancel operation
  const cancelOperation = () => navigate('/profile');
  
  // State management
  const [step, setStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState({ 
    name: '', title: '', location: '', email: '', phone: '', about: '', photo: '' 
  });
  const [educationList, setEducationList] = useState([]);
  const [experienceList, setExperienceList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [builderData, setBuilderData] = useState(null);
  
  const totalSteps = 7;
  const resumePreviewRef = useRef(null);

  // Fetch existing resume builder data
  const fetchBuilderData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/user/profile/resume-builder', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const data = res.data;
      setBuilderData(data);
      
      // Set template
      const template = templates.find(t => t.id === data.templateId) || templates[0];
      setSelectedTemplate(template);
      
      // Set personal info
      setPersonalInfo({
        name: data.personalInfo?.name || '',
        title: data.personalInfo?.title || '',
        location: data.personalInfo?.location || '',
        email: data.personalInfo?.email || '',
        phone: data.personalInfo?.phone || '',
        about: data.personalInfo?.about || '',
        photo: data.personalInfo?.photo || ''
      });
      
      // Set education
      setEducationList(data.education || []);
      
      // Set experience
      setExperienceList(data.experience || []);
      
      // Set projects
      setProjects(data.projects || []);
      
      // Set skills
      setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''));
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch builder data:', err);
      setFetchError('Failed to load resume builder data. Please try again.');
      setLoading(false);
    }
  };

  // Fetch builder data on mount
  useEffect(() => {
    fetchBuilderData();
  }, []);

  // Progress calculation
  useEffect(() => {
    setProgress(((step + 1) / totalSteps) * 100);
  }, [step]);

  // Clear PDF blob when changing templates or data
  useEffect(() => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [step, selectedTemplate, personalInfo, educationList, experienceList, projects, skills]);

  // High-quality PDF generation
  const generatePDF = async (highQuality = true) => {
    if (!resumePreviewRef.current) {
      throw new Error('Resume preview not available');
    }

    const scale = highQuality ? 3 : 2;
    const canvas = await html2canvas(resumePreviewRef.current, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  };

  // Save resume to backend
  const saveResume = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!personalInfo.name || !personalInfo.title || !personalInfo.email || !personalInfo.phone) {
        alert('Please fill in all required personal information fields.');
        return;
      }

      // Generate high-quality PDF
      const pdf = await generatePDF(true);
      const pdfData = pdf.output('datauristring');

      // Prepare payload
      const payload = {
        templateId: selectedTemplate.id,
        personalInfo: {
          name: personalInfo.name || "",
          title: personalInfo.title || "",
          location: personalInfo.location || "",
          email: personalInfo.email || "",
          phone: personalInfo.phone || "",
          about: personalInfo.about || "",
        },
        education: educationList.map(e => ({
          institution: e.institution || "",
          degree: e.degree || "",
          fieldOfStudy: e.fieldOfStudy || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          grade: e.grade || "",
          description: e.description || "",
        })),
        experience: experienceList.map(e => ({
          position: e.position || "",
          company: e.company || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          description: e.description || "",
        })),
        projects: projects.map(p => ({
          title: p.title || "",
          description: p.description || "",
          technologies: p.technologies || "",
          url: p.url || "",
        })),
        skills: Array.isArray(skills) ? skills : (typeof skills === "string" ? skills.split(',').map(s => s.trim()).filter(Boolean) : []),
        pdfData,
        setAsActiveSource: true,
      };

      await axios.put('/api/user/profile/resume-builder', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Resume saved successfully! Your builder resume is now active.');
      navigate('/profile');
    } catch (err) {
      console.error('Save resume error:', err);
      alert('Failed to save resume: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    try {
      setIsGenerating(true);
      const pdf = await generatePDF(true);
      const fileName = `${personalInfo.name || 'resume'}_${selectedTemplate.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate PDF preview for step 6
  useEffect(() => {
    if (step === 6 && !pdfBlobUrl) {
      (async () => {
        try {
          const pdf = await generatePDF(false); // Lower quality for preview
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        } catch (err) {
          console.error('PDF generation for preview failed:', err);
        }
      })();
    }
  }, [step]);

  // Form handlers
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const addEducation = () => {
    setEducationList((prev) => [...prev, { 
      institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' 
    }]);
  };

  const removeEducation = (index) => {
    setEducationList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    setEducationList((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
  };

  const addExperience = () => {
    setExperienceList((prev) => [...prev, { 
      position: '', company: '', startDate: '', endDate: '', description: '' 
    }]);
  };

  const removeExperience = (index) => {
    setExperienceList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    setExperienceList((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  const addProject = () => {
    setProjects((prev) => [...prev, { 
      title: '', description: '', technologies: '', url: '' 
    }]);
  };

  const removeProject = (index) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProject = (index, field, value) => {
    setProjects((prev) =>
      prev.map((proj, i) => (i === index ? { ...proj, [field]: value } : proj))
    );
  };

  // Navigation
  function nextStep() {
    // Basic validation for current step
    if (step === 0) {
      const newErrors = {};
      if (!personalInfo.name) newErrors.name = 'Name is required';
      if (!personalInfo.title) newErrors.title = 'Title is required';
      if (!personalInfo.email) newErrors.email = 'Email is required';
      if (!personalInfo.phone) newErrors.phone = 'Phone is required';
      if (!personalInfo.location) newErrors.location = 'Location is required';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    
    setErrors({});
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  // Render resume preview
  const renderResumePreview = () => {
    const TemplateComponent = selectedTemplate.component;
    return (
      <div ref={resumePreviewRef}>
        <TemplateComponent 
          personalInfo={personalInfo}
          educationList={educationList}
          experienceList={experienceList}
          projects={projects}
          skills={skills}
        />
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-gray-700">Loading Resume Builder...</div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-lg max-w-md">
          <h3 className="font-bold text-lg mb-2">Error Loading Resume Builder</h3>
          <p>{fetchError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">📄</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Professional Resume Builder</h1>
                <p className="text-gray-600">Create a stunning resume in minutes</p>
              </div>
            </div>
            <button
              onClick={cancelOperation}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {step + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Step 0: Personal Information */}
          {step === 0 && (
            <motion.div
              key="step0"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={personalInfo.name}
                    onChange={handlePersonalChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Senior Software Engineer"
                    value={personalInfo.title}
                    onChange={handlePersonalChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={personalInfo.email}
                    onChange={handlePersonalChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 234 567 8900"
                    value={personalInfo.phone}
                    onChange={handlePersonalChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="San Francisco, CA"
                    value={personalInfo.location}
                    onChange={handlePersonalChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                <textarea
                  name="about"
                  placeholder="Write a brief summary about yourself, your experience, and career goals..."
                  value={personalInfo.about}
                  onChange={handlePersonalChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Education */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Education</h2>
              {educationList.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
                      <input
                        type="text"
                        list="institutions"
                        placeholder="University name"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <datalist id="institutions">
                        {institutions.map((inst, idx) => (
                          <option key={idx} value={inst} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                      <input
                        type="text"
                        list="degreeOptions"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <datalist id="degreeOptions">
                        {degreeOptions.map((deg, idx) => (
                          <option key={idx} value={deg} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                      <input
                        type="text"
                        placeholder="Computer Science"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade/Percentage</label>
                      <input
                        type="text"
                        placeholder="3.8 GPA or 85%"
                        value={edu.grade}
                        onChange={(e) => updateEducation(index, "grade", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Relevant coursework, achievements, etc."
                      value={edu.description}
                      onChange={(e) => updateEducation(index, "description", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeEducation(index)}
                    className="mt-4 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove Education
                  </button>
                </div>
              ))}
              
              <button
                onClick={addEducation}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 mb-6"
              >
                Add Education
              </button>
              
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Work Experience</h2>
              {experienceList.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                      <input
                        type="text"
                        list="positions"
                        placeholder="Job title"
                        value={exp.position}
                        onChange={(e) => updateExperience(index, "position", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <datalist id="positions">
                        {positions.map((pos, idx) => (
                          <option key={idx} value={pos} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                      <input
                        type="text"
                        list="companies"
                        placeholder="Company name"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, "company", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <datalist id="companies">
                        {companies.map((comp, idx) => (
                          <option key={idx} value={comp} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Describe your responsibilities, achievements, and impact..."
                      value={exp.description}
                      onChange={(e) => updateExperience(index, "description", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeExperience(index)}
                    className="mt-4 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove Experience
                  </button>
                </div>
              ))}
              
              <button
                onClick={addExperience}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 mb-6"
              >
                Add Experience
              </button>
              
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Projects */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Projects (Optional)</h2>
              {projects.map((proj, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                      <input
                        type="text"
                        placeholder="Project name"
                        value={proj.title}
                        onChange={(e) => updateProject(index, "title", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                      <input
                        type="text"
                        placeholder="React, Node.js, MongoDB"
                        value={proj.technologies}
                        onChange={(e) => updateProject(index, "technologies", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Describe the project, your role, and outcomes..."
                      value={proj.description}
                      onChange={(e) => updateProject(index, "description", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/project"
                      value={proj.url}
                      onChange={(e) => updateProject(index, "url", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeProject(index)}
                    className="mt-4 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove Project
                  </button>
                </div>
              ))}
              
              <button
                onClick={addProject}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 mb-6"
              >
                Add Project
              </button>
              
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your skills separated by commas
                </label>
                <textarea
                  placeholder="JavaScript, React, Node.js, Python, AWS, Docker, Git, MongoDB..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Include technical skills, tools, and technologies you're proficient in
                </p>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Template Selection */}
          {step === 5 && (
            <motion.div
              key="step5"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose a Template</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${
                      selectedTemplate.id === template.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-full h-32 ${template.previewColor} ${template.textColor} rounded-lg mb-4 flex items-center justify-center`}
                    >
                      <span className="text-lg font-semibold">{template.name}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="mt-3">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Preview Resume
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Preview & Download */}
          {step === 6 && (
            <motion.div
              key="step6"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview & Download</h2>
              
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    <strong>Template:</strong> {selectedTemplate.name} • 
                    <strong> Category:</strong> {selectedTemplate.category}
                  </p>
                </div>
              </div>

              {/* Resume Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 bg-gray-50">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm text-gray-600 font-medium">Resume Preview</p>
                </div>
                <div className="p-4 overflow-auto" style={{ maxHeight: '600px' }}>
                  <div className="transform scale-75 origin-top-left" style={{ width: '133%' }}>
                    {renderResumePreview()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                  Previous
                </button>
                
                <button
                  onClick={saveResume}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Resume"}
                </button>
                
                <button
                  onClick={downloadPDF}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Download PDF"}
                </button>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Save your resume to make it active for job applications</p>
                <p>Download a high-quality PDF for offline use</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ResumeBuilderAdvanced;
