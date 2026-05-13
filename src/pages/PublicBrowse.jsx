import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import { supabase } from "../services/supabase";
import founduLogo from "../assets/icons/foundulogo-icon.png";
import locationIcon from "../assets/icons/location-icons.png";
import tagIcon from "../assets/icons/tag-icons.png";

const PublicBrowse = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    keyword: "",
    category: "All Categories",
    type: "All"
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      applyFilters();
    }
  }, [filters, reports]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, type, title, category, description, location, date, photo_url, status, created_at')
        .eq('status', 'verified')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      setReports([]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...reports];
    
    if (filters.keyword) {
      filtered = filtered.filter(report => 
        report.title?.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        report.description?.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }
    
    if (filters.category !== "All Categories") {
      filtered = filtered.filter(report => report.category === filters.category);
    }
    
    if (filters.type !== "All") {
      filtered = filtered.filter(report => report.type === filters.type);
    }
    
    setFilteredReports(filtered);
  };

  const handleViewDetails = (reportId) => {
    navigate(`/public-item-details/${reportId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      keyword: "",
      category: "All Categories",
      type: "All"
    });
  };

  const uniqueCategories = ["All Categories", ...new Set(reports.map(r => r.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="student-dashboard-container">
        <header className="student-full-header">
          <div className="student-header-content">
            <div className="student-logo">
              <img src={founduLogo} alt="FoundU" className="student-logo-img" />
            </div>
            <div className="student-header-actions">
              <span className="student-lang" onClick={() => navigate("/")}>Home</span>
              <span className="student-lang" onClick={() => navigate("/browse")}>Browse</span>
            </div>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      <header className="student-full-header">
        <div className="student-header-content">
          <div className="student-logo">
            <img src={founduLogo} alt="FoundU" className="student-logo-img" />
          </div>
          <div className="student-header-actions">
            <span className="student-lang" onClick={() => navigate("/")}>Home</span>
            <span className="student-lang" onClick={() => navigate("/browse")}>Browse</span>
          </div>
        </div>
      </header>

      <div className="student-main-content">
        <div className="browse-layout">
          <div className="browse-sidebar">
            <div className="browse-sidebar-section">
              <h3>Search Item</h3>
            </div>
            
            <div className="browse-sidebar-section">
              <h3>KEYWORDS</h3>
              <input 
                type="text" 
                className="browse-keyword-input"
                placeholder="Search..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
              />
            </div>
            
            <div className="browse-sidebar-section">
              <h3>CATEGORY</h3>
              <select 
                className="browse-category-select"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="browse-sidebar-section">
              <h3>TYPE</h3>
              <div className="browse-type-options">
                <label className="browse-type-option">
                  <input 
                    type="radio" 
                    name="type" 
                    value="All" 
                    checked={filters.type === "All"}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  />
                  All
                </label>
                <label className="browse-type-option">
                  <input 
                    type="radio" 
                    name="type" 
                    value="lost" 
                    checked={filters.type === "lost"}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  />
                  Lost
                </label>
                <label className="browse-type-option">
                  <input 
                    type="radio" 
                    name="type" 
                    value="found" 
                    checked={filters.type === "found"}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  />
                  Found
                </label>
              </div>
            </div>
            
            <div className="browse-sidebar-section">
              <button className="browse-apply-filters-btn" onClick={applyFilters}>
                APPLY FILTERS
              </button>
              <button className="browse-reset-btn" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
          
          <div className="browse-content-area">
            <div className="browse-results-header">
              <div className="browse-breadcrumb">
                <span>Home</span> / Browse Items
              </div>
              <div className="browse-results-count">
                <strong>{filteredReports.length}</strong> items found
              </div>
            </div>
            
            <div className="browse-items-grid">
              {filteredReports.length === 0 ? (
                <div className="empty-state">
                  <p>No items found</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} className="browse-item-card">
                    <div className="browse-item-card-image">
                      {report.photo_url ? (
                        <img src={report.photo_url} alt={report.title} />
                      ) : (
                        <span>No image</span>
                      )}
                    </div>
                    <div className="browse-item-card-content">
                      <div className="browse-item-card-header">
                        <div className="browse-item-type-wrapper">
                          <div className={`browse-item-type-badge ${report.type}`}>
                            {report.type === "lost" ? "LOST" : "FOUND"}
                          </div>
                          <div className={`status-badge ${report.status}`}>
                            VERIFIED
                          </div>
                        </div>
                        <div className="browse-item-date">
                          {formatDate(report.created_at)}
                        </div>
                      </div>
                      <div className="browse-item-category">
                        <img src={tagIcon} alt="category" className="browse-category-icon-img" />
                        {report.category || "Item"}
                      </div>
                      <div className="browse-item-title">{report.title}</div>
                      <div className="browse-item-location">
                        <img src={locationIcon} alt="location" className="browse-location-icon-img" />
                        {report.location}
                      </div>
                    </div>
                    <button 
                      className="browse-view-details-btn"
                      onClick={() => handleViewDetails(report.id)}
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBrowse;