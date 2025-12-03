// Dropdown options for form fields
const institutions = [
  "Harvard University", "Stanford University", "MIT", "University of Oxford", "University of Cambridge", "IIT Bombay", "IIT Delhi", "IIT Kanpur", "IIT Kharagpur", "IIT Madras", "NIT Trichy", "NIT Surathkal", "NIT Warangal", "BITS Pilani", "Delhi University", "Mumbai University", "JNU", "Anna University", "VIT", "SRM University", "Other"
];
const degreeOptions = [
  "B.Tech", "M.Tech", "B.E.", "M.E.", "B.Sc", "M.Sc", "B.Com", "M.Com", "B.A.", "M.A.", "MBA", "PhD", "Diploma", "Other"
];
const positions = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "Product Manager", "UI/UX Designer", "DevOps Engineer", "QA Engineer", "Business Analyst", "Project Manager", "Intern", "Other"
];
const companies = [
  "Google", "Microsoft", "Amazon", "Facebook", "Apple", "Netflix", "Tesla", "TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Cognizant", "IBM", "HCL", "Other"
];
// Animation variants for step transitions
const stepVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as Yup from "yup";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Keep a curated set of 6 professional templates with distinct layouts
const templates = [
  { id: 1, name: "Classic", previewColor: "bg-white", textColor: "text-gray-900", layout: "classic" },
  { id: 2, name: "Modern", previewColor: "bg-blue-50", textColor: "text-blue-900", layout: "modern" },
  { id: 3, name: "Minimal", previewColor: "bg-gray-50", textColor: "text-gray-800", layout: "minimal" },
  { id: 4, name: "Professional", previewColor: "bg-gray-900", textColor: "text-white", layout: "professional" },
  { id: 5, name: "Sidebar", previewColor: "bg-gray-100", textColor: "text-gray-800", layout: "sidebar" },
  { id: 6, name: "Two-Column", previewColor: "bg-white", textColor: "text-gray-900", layout: "two-column" },
];

// ResumePreview function (ensure all case blocks are inside the switch)
function ResumePreview({ selectedTemplate, personalInfo, educationList, experienceList, projects, skills, cancelOperation }) {
  // ...existing code...
  switch (selectedTemplate) {
    // ...existing cases...
    // (case blocks go here)
  }

  return (
    <div className="max-w-5xl mx-auto my-10 p-8 bg-gradient-to-br from-gray-50 to-gray-200 shadow-2xl rounded-2xl border border-gray-200">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {personalInfo.photo && (
            <img src={personalInfo.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400" />
          )}
          <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            Advanced Resume Builder
          </h2>
        </div>
        <button
          onClick={cancelOperation}
          className="bg-red-500 hover:bg-red-600 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
        >
          Cancel
        </button>
      </header>



      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name *"
                  value={personalInfo.name}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="title"
                  placeholder="Professional Title *"
                  value={personalInfo.title}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="location"
                  placeholder="Location *"
                  value={personalInfo.location}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={personalInfo.email}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  value={personalInfo.phone}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <textarea
                  name="about"
                  placeholder="About You *"
                  value={personalInfo.about}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-32"
                />
                {errors.about && (
                  <p className="text-red-500 text-sm mt-1">{errors.about}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelOperation}
                className="bg-red-500 hover:bg-red-600 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Education</h3>
            {educationList.map((edu, index) => (
              <div
                key={index}
                className="border p-6 rounded-lg bg-white shadow-md space-y-4"
              >
                <div>
                  <label className="font-semibold text-gray-700">Institution *</label>
                  <input
                    type="text"
                    list="institutions"
                    placeholder="Select or type institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="institutions">
                    {institutions.map((inst, idx) => (
                      <option key={idx} value={inst} />
                    ))}
                  </datalist>
                  {errors.education?.institution && (
                    <p className="text-red-500 text-sm mt-1">{errors.education.institution}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Degree *</label>
                  <input
                    type="text"
                    list="degreeOptions"
                    placeholder="Select or type degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="degreeOptions">
                    {degreeOptions.map((deg, idx) => (
                      <option key={idx} value={deg} />
                    ))}
                  </datalist>
                  {errors.education?.degree && (
                    <p className="text-red-500 text-sm mt-1">{errors.education.degree}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Field of Study *</label>
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={edu.fieldOfStudy}
                    onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  {errors.education?.fieldOfStudy && (
                    <p className="text-red-500 text-sm mt-1">{errors.education.fieldOfStudy}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Start Date *</label>
                    <input
                      type="month"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.education?.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.education.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">End Date *</label>
                    <input
                      type="month"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.education?.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.education.endDate}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Grade/Percentage</label>
                  <input
                    type="text"
                    placeholder="Grade/Percentage"
                    value={edu.grade}
                    onChange={(e) => updateEducation(index, "grade", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Description</label>
                  <textarea
                    placeholder="Description"
                    value={edu.description}
                    onChange={(e) => updateEducation(index, "description", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-24"
                  />
                </div>
                <button
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove Education
                </button>
              </div>
            ))}
            <button
              onClick={addEducation}
              className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Add Education
            </button>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Experience</h3>
            {experienceList.map((exp, index) => (
              <div
                key={index}
                className="border p-6 rounded-lg bg-white shadow-md space-y-4"
              >
                <div>
                  <label className="font-semibold text-gray-700">Position *</label>
                  <input
                    type="text"
                    list="positions"
                    placeholder="Select or type position"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="positions">
                    {positions.map((pos, idx) => (
                      <option key={idx} value={pos} />
                    ))}
                  </datalist>
                  {errors.experience?.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.experience.position}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Company *</label>
                  <input
                    type="text"
                    list="companies"
                    placeholder="Select or type company"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="companies">
                    {companies.map((comp, idx) => (
                      <option key={idx} value={comp} />
                    ))}
                  </datalist>
                  {errors.experience?.company && (
                    <p className="text-red-500 text-sm mt-1">{errors.experience.company}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Start Date *</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.experience?.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.experience.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">End Date *</label>
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.experience?.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.experience.endDate}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Description</label>
                  <textarea
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-24"
                  />
                </div>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove Experience
                </button>
              </div>
            ))}
            <button
              onClick={addExperience}
              className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Add Experience
            </button>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Projects (Optional)</h3>
            {projects.map((proj, index) => (
              <div
                key={index}
                className="border p-6 rounded-lg bg-white shadow-md space-y-4"
              >
                <input
                  type="text"
                  placeholder="Project Title"
                  value={proj.title}
                  onChange={(e) => updateProject(index, "title", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                <textarea
                  placeholder="Project Description"
                  value={proj.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-24"
                />
                <input
                  type="text"
                  placeholder="Technologies Used"
                  value={proj.technologies}
                  onChange={(e) => updateProject(index, "technologies", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                <input
                  type="url"
                  placeholder="Project URL (Optional)"
                  value={proj.url}
                  onChange={(e) => updateProject(index, "url", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                <button
                  onClick={() => removeProject(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove Project
                </button>
              </div>
            ))}
            <button
              onClick={addProject}
              className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Add Project
            </button>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 4 && (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Skills</h3>
            <input
              type="text"
              placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js) *"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
            />
            {errors.skills && (
              <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
            )}
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 5 && (
          <motion.div
            key="step5"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Select a Resume Template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`cursor-pointer border p-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 ${
                    selectedTemplate.id === template.id
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  <div
                    className={`w-full h-32 ${template.previewColor} ${template.textColor} flex items-center justify-center text-center rounded-t-lg`}
                  >
                    {template.name}
                  </div>
                  <p className="text-center mt-2 text-gray-700">{template.name}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 6 && (
          <motion.div
            key="step6"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Preview & Download</h3>
            <div
              className="border rounded-lg overflow-hidden shadow-lg bg-white"
              style={{ width: "210mm", margin: "0 auto" }}
              ref={resumePreviewRef}
            >
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="Resume Preview"
                />
              ) : (
                <ResumePreview
                  selectedTemplate={selectedTemplate}
                  personalInfo={personalInfo}
                  educationList={educationList}
                  experienceList={experienceList}
                  projects={projects}
                  skills={skills}
                  cancelOperation={cancelOperation}
                />
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={downloadPDF}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                {isGenerating ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResumeBuilderAdvanced() {
  const navigate = useNavigate();
  // Cancel operation
  const cancelOperation = () => navigate('/profile');
  // State for PDF preview
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const saveResume = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        // Optionally generate PDF data for backend
        // Validate and format payload for backend
        const formattedPersonalInfo = {
          name: personalInfo.name || "",
          title: personalInfo.title || "",
          location: personalInfo.location || "",
          email: personalInfo.email || "",
          phone: personalInfo.phone || "",
          about: personalInfo.about || "",
        };
        const formattedEducation = educationList.map(e => ({
          institution: e.institution || "",
          degree: e.degree || "",
          fieldOfStudy: e.fieldOfStudy || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          grade: e.grade || "",
          description: e.description || "",
        }));
        const formattedExperience = experienceList.map(e => ({
          position: e.position || "",
          company: e.company || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          description: e.description || "",
        }));
        const formattedProjects = projects.map(p => ({
          title: p.title || "",
          description: p.description || "",
          technologies: p.technologies || "",
          url: p.url || "",
        }));
        const formattedSkills = Array.isArray(skills)
          ? skills
          : (typeof skills === "string" ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);
        // Generate PDF data with PNG for best quality
        let pdfData = "";
        try {
          const pdf = await generatePDF();
          pdfData = pdf.output("dataurlstring");
        } catch (err) {
          // PDF generation failed, continue without pdfData
          pdfData = "";
        }
        const payload = {
          templateId: selectedTemplate.id,
          personalInfo: formattedPersonalInfo,
          education: formattedEducation,
          experience: formattedExperience,
          projects: formattedProjects,
          skills: formattedSkills,
          pdfData,
          setAsActiveSource: true,
        };
        await axios.put('/api/user/profile/resume-builder', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refetch profile to update ResumeSection and active resume
        await fetchProfile();
        alert('Resume saved successfully!');
        navigate('/profile');
      } catch (err) {
        console.error('Save resume error:', err);
        alert('Failed to save resume: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
  // State and refs
  const [step, setStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState({ name: '', title: '', location: '', email: '', phone: '', about: '', photo: '' });
  const [educationList, setEducationList] = useState([]);
  const [experienceList, setExperienceList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const totalSteps = 7;
  const resumePreviewRef = useRef(null);

  // Generate PDF function: render the resume preview into a PDF and return the jsPDF instance
  const generatePDF = async (scale = 2) => {
    if (!resumePreviewRef.current) throw new Error("No resume preview element");
    // Use html2canvas to render the preview element
    const canvas = await html2canvas(resumePreviewRef.current, { scale, useCORS: true, logging: false });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 inner height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Use the resume-builder endpoint to get builder state (includes template and builder resume info)
      const res = await axios.get('/api/user/profile/resume-builder', { headers: { Authorization: `Bearer ${token}` } });

      const data = res.data || {};
      // personalInfo returned nested under personalInfo
      const p = data.personalInfo || {};
      setPersonalInfo({
        name: p.name || '',
        title: p.title || '',
        location: p.location || '',
        email: p.email || '',
        phone: p.phone || '',
        about: p.about || '',
        photo: p.photo || ''
      });

      setEducationList(Array.isArray(data.education) ? data.education : []);
      setExperienceList(Array.isArray(data.experience) ? data.experience : []);
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || []).join ? data.skills.join(', ') : (data.skills || '').toString());

      // templateId -> select matching template
      const templateId = data.templateId || (templates[0] && templates[0].id);
      const found = templates.find(t => t.id === templateId);
      if (found) setSelectedTemplate(found);

      // If backend has a previously saved builder PDF, point preview iframe to it
      const builderResumeUrl = data.resumePreferences?.builderResume?.url;
      if (builderResumeUrl) {
        // Make sure we clear any generated blob URL to avoid confusion
        if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
        setPdfBlobUrl(builderResumeUrl);
      } else {
        setPdfBlobUrl(null);
      }

      setLoading(false);
    } catch (err) {
      setFetchError('Failed to fetch profile.');
      setLoading(false);
    }
  };

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Progress calculation
  useEffect(() => {
    setProgress(((step + 1) / totalSteps) * 100);
  }, [step]);

  // Generate PDF blob for preview when step 6
  useEffect(() => {
    if (step === 6 && !pdfBlobUrl) {
      (async () => {
        try {
          const pdf = await generatePDF();
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        } catch (err) {
          console.error('PDF generation for preview failed:', err);
        }
      })();
    }
  }, [step]);

  // Handlers (add, remove, update for each section)
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({ ...prev, [name]: value }));
  };

  const addEducation = () => {
    setEducationList((prev) => [...prev, { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' }]);
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
    setExperienceList((prev) => [...prev, { position: '', company: '', startDate: '', endDate: '', description: '' }]);
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
    setProjects((prev) => [...prev, { title: '', description: '', technologies: '', url: '' }]);
  };

  const removeProject = (index) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProject = (index, field, value) => {
    setProjects((prev) =>
      prev.map((proj, i) => (i === index ? { ...proj, [field]: value } : proj))
    );
  };

  // Validation logic (Yup schemas)
  const personalInfoSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    title: Yup.string().required("Title is required"),
    location: Yup.string().required("Location is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
    about: Yup.string().required("About section is required"),
  });

  const educationSchema = Yup.object().shape({
    institution: Yup.string().required("Institution is required"),
    degree: Yup.string().required("Degree is required"),
    fieldOfStudy: Yup.string().required("Field of study is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date().required("End date is required"),
    grade: Yup.string(),
    description: Yup.string(),
  });

  const experienceSchema = Yup.object().shape({
    position: Yup.string().required("Position is required"),
    company: Yup.string().required("Company is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date().required("End date is required"),
    description: Yup.string(),
  });

  const projectSchema = Yup.object().shape({
    title: Yup.string().required("Project title is required"),
    description: Yup.string(),
    technologies: Yup.string(),
    url: Yup.string().url("Invalid URL"),
  });

  const skillsSchema = Yup.object().shape({
    skills: Yup.string().required("Skills are required"),
  });

  // PDF download logic
  const downloadPDF = async () => {
    try {
      setIsGenerating(true);
      const pdf = await generatePDF(2);
      pdf.save("resume.pdf");
    } catch (err) {
      console.error("Download PDF failed:", err);
      alert("Failed to generate PDF for download.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Render preview based on selected template layout
  const renderPreviewTemplate = () => {
    const skillsString = Array.isArray(skills) ? skills.join(', ') : skills || '';
    const photoEl = personalInfo.photo ? (
      <img src={personalInfo.photo} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
    ) : null;

    const accent = (() => {
      switch ((selectedTemplate && selectedTemplate.layout) || 'classic') {
        case 'modern': return 'text-blue-800';
        case 'minimal': return 'text-gray-800';
        case 'professional': return 'text-indigo-800';
        case 'sidebar': return 'text-green-800';
        case 'two-column': return 'text-purple-800';
        default: return 'text-gray-900';
      }
    })();

    const commonHeader = (
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0">{photoEl}</div>
        <div>
          <h1 className={`text-3xl font-bold ${accent}`}>{personalInfo.name}</h1>
          <p className="text-lg text-gray-700">{personalInfo.title}</p>
          <p className="text-sm text-gray-600">{personalInfo.email} • {personalInfo.phone} • {personalInfo.location}</p>
        </div>
      </div>
    );

    switch ((selectedTemplate && selectedTemplate.layout) || "classic") {
      case "modern":
        return (
          <div className="p-10" style={{ width: "210mm", minHeight: "297mm" }}>
            <div className="flex items-start gap-6">
              <div className="w-2/3">
                {commonHeader}
                <section className="mb-6">
                  <h2 className="text-xl font-bold border-b pb-1">About</h2>
                  <p>{personalInfo.about}</p>
                </section>
                <section className="mb-6">
                  <h2 className="text-xl font-bold border-b pb-1">Experience</h2>
                  {experienceList.map((exp, index) => (
                    <div key={index} className="mb-3">
                      <h3 className="font-semibold">{exp.position} — {exp.company}</h3>
                      <p className="text-sm">{exp.startDate} — {exp.endDate}</p>
                      <p>{exp.description}</p>
                    </div>
                  ))}
                </section>
                <section className="mb-6">
                  <h2 className="text-xl font-bold border-b pb-1">Projects</h2>
                  {projects && projects.length ? projects.map((proj, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="font-semibold">{proj.title}</div>
                      <div className="text-sm">{proj.technologies}</div>
                      <p className="text-sm text-gray-600">{proj.description}</p>
                    </div>
                  )) : <p className="text-sm text-gray-600">-</p>}
                </section>
              </div>
              <aside className="w-1/3 bg-gray-100 p-4 rounded">
                <h3 className="font-bold mb-2">Education</h3>
                {educationList.map((edu, i) => (
                  <div key={i} className="mb-2">
                    <div className="font-semibold">{edu.institution}</div>
                    <div className="text-sm">{edu.degree} — {edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
                <h3 className="font-bold mt-4 mb-2">Skills</h3>
                <div className="text-sm text-gray-700">{skillsString || '-'}</div>
              </aside>
            </div>
          </div>
        );
      case "minimal":
        return (
          <div className="p-10" style={{ width: "210mm", minHeight: "297mm", color: '#222' }}>
            {commonHeader}
            <div className="mb-6">
              <h2 className="font-bold">About</h2>
              <p>{personalInfo.about}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold">Experience</h3>
                {experienceList.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="font-semibold">{exp.position} — {exp.company}</div>
                    <div className="text-sm">{exp.startDate} - {exp.endDate}</div>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-bold">Education & Skills</h3>
                {educationList.map((edu, i) => (
                  <div key={i} className="mb-2">
                    <div className="font-semibold">{edu.institution}</div>
                    <div className="text-sm">{edu.degree}</div>
                  </div>
                ))}
                <div className="mt-4 text-sm text-gray-700">{skillsString || '-'}</div>
              </div>
            </div>
          </div>
        );
      case "professional":
        return (
          <div className="p-8" style={{ width: "210mm", minHeight: "297mm", backgroundColor: '#f9fafb' }}>
            {commonHeader}
            <div className="mb-4">
              <h2 className="font-bold">Summary</h2>
              <p>{personalInfo.about}</p>
            </div>
            <div className="mb-4">
              <h2 className="font-bold">Experience</h2>
              {experienceList.map((exp, idx) => (
                <div key={idx} className="mb-2">
                  <div className="font-semibold">{exp.position} at {exp.company}</div>
                  <div className="text-sm">{exp.startDate} - {exp.endDate}</div>
                  <p className="text-sm text-gray-700">{exp.description}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-6">
              <div className="w-1/2">
                <h3 className="font-bold">Education</h3>
                {educationList.map((edu,i)=>(<div key={i}><div className="font-semibold">{edu.institution}</div><div className="text-sm">{edu.degree}</div></div>))}
              </div>
              <div className="w-1/2">
                <h3 className="font-bold">Skills</h3>
                <div className="text-sm text-gray-700">{skillsString || '-'}</div>
                <h3 className="font-bold mt-4">Projects</h3>
                {projects && projects.length ? projects.map((p, idx) => (
                  <div key={idx} className="mb-2"><div className="font-semibold">{p.title}</div><div className="text-sm text-gray-700">{p.technologies}</div></div>
                )) : <div className="text-sm text-gray-600">-</div>}
              </div>
            </div>
          </div>
        );
      case "sidebar":
        return (
          <div className="flex" style={{ width: "210mm", minHeight: "297mm" }}>
            <aside className="w-1/3 bg-gray-100 p-6 flex flex-col items-center gap-4">
              {photoEl}
              <h2 className="font-bold">Contact</h2>
              <p className="text-sm text-gray-700">{personalInfo.email}</p>
              <p className="text-sm text-gray-700">{personalInfo.phone}</p>
              <h3 className="font-bold mt-4">Skills</h3>
              <div className="text-sm text-gray-700">{skillsString || '-'}</div>
              <h3 className="font-bold mt-4">Education</h3>
              <div className="w-full">
                {educationList.map((edu,i)=>(<div key={i} className="mb-2"><div className="font-semibold">{edu.institution}</div><div className="text-sm">{edu.degree}</div></div>))}
              </div>
            </aside>
            <main className="flex-1 p-8">
              <h1 className={`text-2xl font-bold ${accent}`}>{personalInfo.name}</h1>
              <p className="mb-4 text-gray-700">{personalInfo.title}</p>
              <h3 className="font-bold">Experience</h3>
              {experienceList.map((exp,i)=>(<div key={i} className="mb-3"><div className="font-semibold">{exp.position} — {exp.company}</div><div className="text-sm">{exp.startDate} - {exp.endDate}</div><p className="text-sm text-gray-700">{exp.description}</p></div>))}
              <h3 className="font-bold mt-4">Projects</h3>
              {projects && projects.length ? projects.map((p, idx) => (<div key={idx} className="mb-2"><div className="font-semibold">{p.title}</div><div className="text-sm text-gray-700">{p.description}</div></div>)) : <div className="text-sm text-gray-600">-</div>}
            </main>
          </div>
        );
      case "two-column":
        return (
          <div style={{ width: "210mm", minHeight: "297mm" }} className="p-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h1 className={`text-2xl font-bold ${accent}`}>{personalInfo.name}</h1>
                <p className="text-gray-700">{personalInfo.title}</p>
                <div className="mt-4">
                  <h3 className="font-bold">Experience</h3>
                  {experienceList.map((e,i)=>(<div key={i} className="mb-2"><div className="font-semibold">{e.position}</div><div className="text-sm text-gray-700">{e.company} • {e.startDate} - {e.endDate}</div><p className="text-sm text-gray-700">{e.description}</p></div>))}
                </div>
              </div>
              <div>
                <h3 className="font-bold">Education</h3>
                {educationList.map((edu,i)=>(<div key={i} className="mb-2"><div className="font-semibold">{edu.institution}</div><div className="text-sm text-gray-700">{edu.degree}</div></div>))}
                <h3 className="font-bold mt-4">Skills</h3>
                <div className="text-sm text-gray-700">{skillsString || '-'}</div>
                <h3 className="font-bold mt-4">Projects</h3>
                {projects && projects.length ? projects.map((p, idx) => (<div key={idx} className="mb-2"><div className="font-semibold">{p.title}</div><div className="text-sm text-gray-700">{p.technologies}</div></div>)) : <div className="text-sm text-gray-600">-</div>}
              </div>
            </div>
          </div>
        );
      case "classic":
      default:
        return (
          <div className="p-8 bg-white text-black" style={{ width: "210mm", minHeight: "297mm" }}>
            {commonHeader}
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black pb-1">About</h2>
              <p className="text-sm text-gray-700">{personalInfo.about}</p>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black pb-1">Education</h2>
              {educationList.map((edu, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold">{edu.institution}</h3>
                  <p>{edu.degree} in {edu.fieldOfStudy}</p>
                  <p>{edu.startDate} - {edu.endDate}</p>
                  <p>{edu.grade}</p>
                  <p>{edu.description}</p>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black pb-1">Experience</h2>
              {experienceList.map((exp, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold">{exp.position} at {exp.company}</h3>
                  <p>{exp.startDate} - {exp.endDate}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black pb-1">Projects</h2>
              {projects && projects.length ? projects.map((proj, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold">{proj.title}</h3>
                  <p className="text-sm text-gray-700">{proj.description}</p>
                  <p className="text-sm text-gray-600">Technologies: {proj.technologies}</p>
                  {proj.url && <p className="text-sm text-blue-700">{proj.url}</p>}
                </div>
              )) : <p className="text-sm text-gray-600">-</p>}
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black pb-1">Skills</h2>
              <p className="text-sm text-gray-700">{Array.isArray(skills) ? skills.join(', ') : skills}</p>
            </div>
          </div>
        );
    }
  };

  // UI rendering (stepper, forms, preview, etc.)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-700">Loading your profile...</div>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-lg">{fetchError}</div>
      </div>
    );
  }

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  return (
    <div className="max-w-5xl mx-auto my-10 p-8 bg-gradient-to-br from-gray-50 to-gray-200 shadow-2xl rounded-2xl border border-gray-200">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {personalInfo.photo && (
            <img src={personalInfo.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400" />
          )}
          <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">Advanced Resume Builder</h2>
        </div>
        <button className="bg-red-500 hover:bg-red-600 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md">Cancel</button>
      </header>
      <div className="mb-6">
        <div className="w-full bg-gray-300 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Step {step + 1} of {totalSteps} ({Math.round(progress)}%)</p>
      </div>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name *"
                  value={personalInfo.name}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="title"
                  placeholder="Professional Title *"
                  value={personalInfo.title}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="location"
                  placeholder="Location *"
                  value={personalInfo.location}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={personalInfo.email}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  value={personalInfo.phone}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <textarea
                  name="about"
                  placeholder="About You *"
                  value={personalInfo.about}
                  onChange={handlePersonalChange}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-32"
                />
                {errors.about && (
                  <p className="text-red-500 text-sm mt-1">{errors.about}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelOperation}
                className="bg-red-500 hover:bg-red-600 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Education</h3>
            {educationList.map((edu, index) => (
              <div
                key={index}
                className="border p-6 rounded-lg bg-white shadow-md space-y-4"
              >
                <div>
                  <label className="font-semibold text-gray-700">Institution *</label>
                  <input
                    type="text"
                    list="institutions"
                    placeholder="Select or type institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="institutions">
                    {institutions.map((inst, idx) => (
                      <option key={idx} value={inst} />
                    ))}
                  </datalist>
                  {errors.education?.institution && (
                    <p className="text-red-500 text-sm mt-1">{errors.education.institution}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Degree *</label>
                  <input
                    type="text"
                    list="degreeOptions"
                    placeholder="Select or type degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="degreeOptions">
                    {degreeOptions.map((deg, idx) => (
                      <option key={idx} value={deg} />
                    ))}
                  </datalist>
                  {errors.education?.degree && (
                    <p className="text-red-500 text-sm mt-1">{errors.education.degree}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Field of Study *</label>
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={edu.fieldOfStudy}
                    onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  {errors.education?.fieldOfStudy && (
                    <p className="text-red-500 text-sm mt-1">{errors.education.fieldOfStudy}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Start Date *</label>
                    <input
                      type="month"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.education?.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.education.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">End Date *</label>
                    <input
                      type="month"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.education?.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.education.endDate}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Grade/Percentage</label>
                  <input
                    type="text"
                    placeholder="Grade/Percentage"
                    value={edu.grade}
                    onChange={(e) => updateEducation(index, "grade", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Description</label>
                  <textarea
                    placeholder="Description"
                    value={edu.description}
                    onChange={(e) => updateEducation(index, "description", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-24"
                  />
                </div>
                <button
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove Education
                </button>
              </div>
            ))}
            <button
              onClick={addEducation}
              className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Add Education
            </button>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Experience</h3>
            {experienceList.map((exp, index) => (
              <div
                key={index}
                className="border p-6 rounded-lg bg-white shadow-md space-y-4"
              >
                <div>
                  <label className="font-semibold text-gray-700">Position *</label>
                  <input
                    type="text"
                    list="positions"
                    placeholder="Select or type position"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="positions">
                    {positions.map((pos, idx) => (
                      <option key={idx} value={pos} />
                    ))}
                  </datalist>
                  {errors.experience?.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.experience.position}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Company *</label>
                  <input
                    type="text"
                    list="companies"
                    placeholder="Select or type company"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                  />
                  <datalist id="companies">
                    {companies.map((comp, idx) => (
                      <option key={idx} value={comp} />
                    ))}
                  </datalist>
                  {errors.experience?.company && (
                    <p className="text-red-500 text-sm mt-1">{errors.experience.company}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-700">Start Date *</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.experience?.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.experience.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">End Date *</label>
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                      className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                    />
                    {errors.experience?.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.experience.endDate}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Description</label>
                  <textarea
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-24"
                  />
                </div>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove Experience
                </button>
              </div>
            ))}
            <button
              onClick={addExperience}
              className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Add Experience
            </button>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Projects (Optional)</h3>
            {projects.map((proj, index) => (
              <div
                key={index}
                className="border p-6 rounded-lg bg-white shadow-md space-y-4"
              >
                <input
                  type="text"
                  placeholder="Project Title"
                  value={proj.title}
                  onChange={(e) => updateProject(index, "title", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                <textarea
                  placeholder="Project Description"
                  value={proj.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm h-24"
                />
                <input
                  type="text"
                  placeholder="Technologies Used"
                  value={proj.technologies}
                  onChange={(e) => updateProject(index, "technologies", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                <input
                  type="url"
                  placeholder="Project URL (Optional)"
                  value={proj.url}
                  onChange={(e) => updateProject(index, "url", e.target.value)}
                  className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
                />
                <button
                  onClick={() => removeProject(index)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove Project
                </button>
              </div>
            ))}
            <button
              onClick={addProject}
              className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Add Project
            </button>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 4 && (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Skills</h3>
            <input
              type="text"
              placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js) *"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 w-full rounded-lg bg-white shadow-sm"
            />
            {errors.skills && (
              <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
            )}
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 5 && (
          <motion.div
            key="step5"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Select a Resume Template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`cursor-pointer border p-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 ${
                    selectedTemplate.id === template.id
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  <div
                    className={`w-full h-32 ${template.previewColor} ${template.textColor} flex items-center justify-center text-center rounded-t-lg`}
                  >
                    {template.name}
                  </div>
                  <p className="text-center mt-2 text-gray-700">{template.name}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        {step === 6 && (
          <motion.div
            key="step6"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-800">Preview & Download</h3>
            <div className="mb-6 p-4 bg-blue-100 rounded-lg">
              <h4 className="text-xl font-bold text-blue-800">Resume Score</h4>
              {/* Resume score removed as per user request */}
            </div>
            <div
              className="border rounded-lg overflow-hidden shadow-lg bg-white"
              style={{ width: "210mm", margin: "0 auto" }}
              ref={resumePreviewRef}
            >
              {renderPreviewTemplate()}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="bg-gray-600 hover:bg-gray-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Previous
              </button>
              <button
                onClick={saveResume}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md mr-2"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={downloadPDF}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 transition duration-200 text-white px-6 py-2 rounded-lg shadow-md"
              >
                {isGenerating ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ResumeBuilderAdvanced;
