// src/pages/admin/AdminIndustryManagement.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaIndustry,
  FaPalette,
  FaSort,
  FaLaptopCode,
  FaStethoscope,
  FaChartLine,
  FaGraduationCap,
  FaCog,
  FaShoppingBag,
  FaBuilding,
  FaTruck,
  FaBolt,
  FaFilm,
  FaHome,
  FaBalanceScale,
  FaBriefcase,
  FaConciergeBell,
  FaSeedling,
  FaLandmark,
  FaHeart,
  FaBroadcastTower,
  FaCar,
  FaPills,
} from "react-icons/fa";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import Modal from "../../components/Modal";
import EnhancedSkeleton from "../../components/admin/EnhancedSkeleton";
import { useDebounce, usePagination, useSelection } from "../../hooks/usePerformanceOptimizations";

const AdminIndustryManagement = () => {
  // State management
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "briefcase",
    gradient: "from-gray-500 to-gray-400",
    displayOrder: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  // Performance optimizations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const pagination = usePagination(totalCount, 12);
  const selection = useSelection(industries);

  // Icon mapping function with debugging
  const getIconComponent = (iconName) => {
    const iconProps = { className: "text-xl text-white drop-shadow-sm" };
    try {
      switch (iconName) {
        case "laptop-code":
          return <FaLaptopCode {...iconProps} />;
        case "stethoscope":
          return <FaStethoscope {...iconProps} />;
        case "chart-line":
          return <FaChartLine {...iconProps} />;
        case "graduation-cap":
          return <FaGraduationCap {...iconProps} />;
        case "cog":
          return <FaCog {...iconProps} />;
        case "shopping-bag":
          return <FaShoppingBag {...iconProps} />;
        case "building":
          return <FaBuilding {...iconProps} />;
        case "truck":
          return <FaTruck {...iconProps} />;
        case "bolt":
          return <FaBolt {...iconProps} />;
        case "film":
          return <FaFilm {...iconProps} />;
        case "home":
          return <FaHome {...iconProps} />;
        case "balance-scale":
          return <FaBalanceScale {...iconProps} />;
        case "briefcase":
          return <FaBriefcase {...iconProps} />;
        case "concierge-bell":
          return <FaConciergeBell {...iconProps} />;
        case "seedling":
          return <FaSeedling {...iconProps} />;
        case "landmark":
          return <FaLandmark {...iconProps} />;
        case "heart":
          return <FaHeart {...iconProps} />;
        case "broadcast-tower":
          return <FaBroadcastTower {...iconProps} />;
        case "car":
          return <FaCar {...iconProps} />;
        case "pills":
          return <FaPills {...iconProps} />;
        default:
          console.warn(`Unknown icon: ${iconName}, using default briefcase`);
          return <FaBriefcase {...iconProps} />;
      }
    } catch (error) {
      console.error(`Error rendering icon ${iconName}:`, error);
      return <FaBriefcase {...iconProps} />;
    }
  };

  // Icon options
  const iconOptions = [
    { value: "laptop-code", label: "Technology", icon: <FaLaptopCode /> },
    { value: "stethoscope", label: "Healthcare", icon: <FaStethoscope /> },
    { value: "chart-line", label: "Finance", icon: <FaChartLine /> },
    { value: "graduation-cap", label: "Education", icon: <FaGraduationCap /> },
    { value: "cog", label: "Manufacturing", icon: <FaCog /> },
    { value: "shopping-bag", label: "Retail", icon: <FaShoppingBag /> },
    { value: "building", label: "Construction", icon: <FaBuilding /> },
    { value: "truck", label: "Transportation", icon: <FaTruck /> },
    { value: "bolt", label: "Energy", icon: <FaBolt /> },
    { value: "film", label: "Media", icon: <FaFilm /> },
    { value: "home", label: "Real Estate", icon: <FaHome /> },
    { value: "balance-scale", label: "Legal", icon: <FaBalanceScale /> },
    { value: "briefcase", label: "Consulting", icon: <FaBriefcase /> },
    { value: "concierge-bell", label: "Hospitality", icon: <FaConciergeBell /> },
    { value: "seedling", label: "Agriculture", icon: <FaSeedling /> },
    { value: "landmark", label: "Government", icon: <FaLandmark /> },
    { value: "heart", label: "Nonprofit", icon: <FaHeart /> },
    { value: "broadcast-tower", label: "Telecommunications", icon: <FaBroadcastTower /> },
    { value: "car", label: "Automotive", icon: <FaCar /> },
    { value: "pills", label: "Pharmaceuticals", icon: <FaPills /> },
  ];

  // Gradient options
  const gradientOptions = [
    "from-gray-500 to-gray-400",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
    "from-red-500 to-pink-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-green-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
  ];

  // Enhanced fetch industries with pagination support
  const fetchIndustries = useCallback(async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem("adminToken");
      const response = await axios.get("/api/industries/admin/all", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        withCredentials: true,
        params: {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          search: debouncedSearchTerm,
        },
      });

      const industriesData = response.data.data || [];
      const total = response.data.total || 0;

      console.log("✅ Fetched industries:", industriesData.length, "Total:", total);
      setIndustries(industriesData);
      setTotalCount(total);
    } catch (error) {
      console.error("❌ Error fetching industries:", error);
      // Fallback to mock data for development
      const mockData = [
        {
          _id: "1",
          name: "Technology",
          description: "Software development and IT services",
          icon: "laptop-code",
          gradient: "from-blue-500 to-cyan-500",
          isActive: true,
          displayOrder: 1,
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          name: "Healthcare",
          description: "Medical and healthcare services",
          icon: "stethoscope",
          gradient: "from-green-500 to-emerald-500",
          isActive: true,
          displayOrder: 2,
          createdAt: new Date().toISOString(),
        },
      ];
      setIndustries(mockData);
      setTotalCount(mockData.length);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, debouncedSearchTerm]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  // Filter industries based on search term (client-side for better UX)
  const filteredIndustries = industries.filter((industry) =>
    industry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    industry.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const adminToken = localStorage.getItem("adminToken");
      if (editingIndustry) {
        await axios.put(`/api/industries/${editingIndustry._id}`, formData, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });
      } else {
        await axios.post("/api/industries", formData, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });
      }
      setShowModal(false);
      setEditingIndustry(null);
      resetForm();
      fetchIndustries(); // Refetch data
      alert("Industry saved successfully!");
    } catch (error) {
      console.error("Error saving industry:", error);

      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Error saving industry. Please try again.");
      }
    }
  };

  // Handle edit
  const handleEdit = (industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      description: industry.description || "",
      icon: industry.icon,
      gradient: industry.gradient,
      displayOrder: industry.displayOrder,
      isActive: industry.isActive,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (industry) => {
    if (window.confirm(`Are you sure you want to delete "${industry.name}"?`)) {
      try {
        const adminToken = localStorage.getItem("adminToken");
        await axios.delete(`/api/industries/${industry._id}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          withCredentials: true,
        });
        fetchIndustries();
        alert("Industry deleted successfully!");
      } catch (error) {
        console.error("Error deleting industry:", error);
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert("Error deleting industry. Please try again.");
        }
      }
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (industry) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      await axios.put(
        `/api/industries/${industry._id}`,
        { isActive: !industry.isActive },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          withCredentials: true,
        }
      );
      fetchIndustries();
    } catch (error) {
      console.error("Error updating industry status:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Error updating industry status. Please try again.");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "briefcase",
      gradient: "from-gray-500 to-gray-400",
      displayOrder: 0,
      isActive: true,
    });
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingIndustry(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaIndustry className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Industry Management
              </h1>
              <p className="text-gray-600">
                Manage job industries and categories ({totalCount} total)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {pagination.totalPages > 1 && (
              <div className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            )}
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Industry</span>
            </button>
          </div>
        </div>

        {/* Search and Pagination Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.changePageSize(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>

        {/* Industries Grid */}
        {loading ? (
          <EnhancedSkeleton type="card" count={pagination.pageSize} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredIndustries.map((industry) => (
                <motion.div
                  key={industry._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white p-6 rounded-lg shadow-sm border transition-all ${
                    industry.isActive
                      ? "border-gray-200 hover:shadow-md"
                      : "border-gray-300 opacity-60"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-r ${industry.gradient} flex items-center justify-center shadow-sm`}
                        >
                          <span className="text-white drop-shadow-sm">
                            {getIconComponent(industry.icon)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {industry.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Order: {industry.displayOrder}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActiveStatus(industry)}
                          className={`p-1 rounded ${
                            industry.isActive
                              ? "text-green-600 hover:text-green-700"
                              : "text-gray-400 hover:text-gray-500"
                          }`}
                          title={industry.isActive ? "Active" : "Inactive"}
                        >
                          {industry.isActive ? <FaEye /> : <FaEyeSlash />}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {industry.description && (
                      <p className="text-sm text-gray-600">
                        {industry.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created: {new Date(industry.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={() => handleEdit(industry)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(industry)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.goToPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pageNum === pagination.currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredIndustries.length === 0 && (
          <div className="text-center py-12">
            <FaIndustry className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No industries found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first industry"}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Industry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingIndustry ? "Edit Industry" : "Add New Industry"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Industry name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Brief description of the industry (max 200 characters)"
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {formErrors.description && (
                    <p className="text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>
                <span className={`text-sm ${formData.description.length > 180 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {formData.description.length}/200
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gradient
                </label>
                <select
                  value={formData.gradient}
                  onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  {gradientOptions.map((gradient) => (
                    <option key={gradient} value={gradient}>
                      {gradient}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-r ${formData.gradient} flex items-center justify-center shadow-sm`}
                >
                  <span className="text-white drop-shadow-sm">
                    {getIconComponent(formData.icon)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {formData.name || "Industry Name"}
                  </h3>
                  {formData.description && (
                    <p className="text-sm text-gray-600">
                      {formData.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingIndustry ? "Update" : "Create"} Industry
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminIndustryManagement;
