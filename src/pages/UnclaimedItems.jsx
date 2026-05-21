import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import "./UnclaimedItems.css";
import downArrowIcon from "../assets/icons/down-arrow-icon.png";

const UnclaimedItems = () => {
  const [unclaimedReports, setUnclaimedReports] = useState([]);
  const [donationReports, setDonationReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState("all");
  const [activeTab, setActiveTab] = useState("available");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = React.useRef(null);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    oldestDays: 0
  });

  useEffect(() => {
    loadUnclaimedReports();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadUnclaimedReports = async () => {
    setLoading(true);
    const { data: allReports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'verified')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error loading reports:", error);
      setLoading(false);
      return;
    }
    
    const verified = allReports || [];
    
    const today = new Date();
    const available = [];
    const readyForDonation = [];
    
    verified.forEach(report => {
      const verifiedDate = new Date(report.verified_at || report.created_at);
      const daysOld = Math.floor((today - verifiedDate) / (1000 * 60 * 60 * 24));
      
      if (daysOld < 30) {
        available.push({ ...report, daysUnclaimed: daysOld });
      } else {
        readyForDonation.push({ ...report, daysUnclaimed: daysOld });
      }
    });
    
    setUnclaimedReports(available);
    setDonationReports(readyForDonation);
    
    const lostCount = verified.filter(r => r.type === "lost").length;
    const foundCount = verified.filter(r => r.type === "found").length;
    
    const oldest = verified.reduce((oldest, report) => {
      const reportDate = new Date(report.created_at);
      return reportDate < oldest ? reportDate : oldest;
    }, new Date());
    
    const daysOld = Math.floor((new Date() - oldest) / (1000 * 60 * 60 * 24));
    
    setSummaryStats({
      total: verified.length,
      lost: lostCount,
      found: foundCount,
      oldestDays: isNaN(daysOld) ? 0 : daysOld
    });
    
    setLoading(false);
  };

  const handleDonate = async (reportId) => {
    const confirmed = window.confirm(
      "This item has been unclaimed for 30+ days. Mark as DONATED?\n\n" +
      "This will remove it from student view and mark as resolved."
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'resolved',
          resolution_status: 'donated',
          resolution_date: new Date(),
          resolution_notes: 'Donated after 30 days unclaimed'
        })
        .eq('id', reportId);
      
      if (error) throw error;
      
      alert("Item marked as DONATED successfully!");
      await loadUnclaimedReports();
    } catch (error) {
      console.error("Error donating item:", error);
      alert("Failed to mark item as donated");
    }
  };

  const handleDelete = async (reportId) => {
    const confirmed = window.confirm("Are you sure you want to delete this report?");
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      
      if (error) throw error;
      
      alert("Report deleted successfully!");
      await loadUnclaimedReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report");
    }
  };

  const handleViewDetails = (reportId) => {
    alert("This Feature is under Maintenance.");
  };

  const getFilteredReports = () => {
    if (filterDays === "all") return unclaimedReports;
    
    const days = parseInt(filterDays);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return unclaimedReports.filter(report => {
      const reportDate = new Date(report.created_at);
      return reportDate <= cutoffDate;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysOld = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFilterLabel = () => {
    if (filterDays === "all") return "All items";
    return `${filterDays} days`;
  };

  const filteredReports = getFilteredReports();

  if (loading) {
    return (
      <div className="loading-state">
      </div>
    );
  }

  return (
    <div className="unclaimed-items">
      <div className="unclaimed-header">
        <h2>Unclaimed Items</h2>
        <div className="policy-info">
          <span className="policy-badge">30-Day Donation Policy</span>
        </div>
      </div>

      <div className="unclaimed-tabs">
        <button 
          className={`tab-btn ${activeTab === "available" ? "active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          Available for Claim ({unclaimedReports.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "donation" ? "active" : ""}`}
          onClick={() => setActiveTab("donation")}
        >
          Ready for Donation ({donationReports.length})
        </button>
      </div>

      {activeTab === "available" && (
        <>
          <div className="summary-stats">
            <div className="summary-card">
              <h4>Total Unclaimed</h4>
              <div className="summary-number">{summaryStats.total}</div>
            </div>
            <div className="summary-card">
              <h4>Lost Items</h4>
              <div className="summary-number">{summaryStats.lost}</div>
            </div>
            <div className="summary-card">
              <h4>Found Items</h4>
              <div className="summary-number">{summaryStats.found}</div>
            </div>
            <div className="summary-card warning">
              <h4>Oldest Item</h4>
              <div className="summary-number">{summaryStats.oldestDays} days</div>
              <small>Will be donated soon</small>
            </div>
          </div>

          <div className="days-filter" ref={filterDropdownRef}>
            <label>Show items older than:</label>
            <button 
              className="filter-dropdown-btn"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              {getFilterLabel()}
              <img src={downArrowIcon} alt="dropdown" className="filter-dropdown-arrow" />
            </button>
            {isFilterDropdownOpen && (
              <div className="filter-dropdown-menu">
                <button 
                  className={`filter-dropdown-item ${filterDays === "all" ? "active" : ""}`}
                  onClick={() => {
                    setFilterDays("all");
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  All items
                </button>
                <button 
                  className={`filter-dropdown-item ${filterDays === "7" ? "active" : ""}`}
                  onClick={() => {
                    setFilterDays("7");
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  7 days
                </button>
                <button 
                  className={`filter-dropdown-item ${filterDays === "14" ? "active" : ""}`}
                  onClick={() => {
                    setFilterDays("14");
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  14 days
                </button>
                <button 
                  className={`filter-dropdown-item ${filterDays === "30" ? "active" : ""}`}
                  onClick={() => {
                    setFilterDays("30");
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  30 days
                </button>
                <button 
                  className={`filter-dropdown-item ${filterDays === "60" ? "active" : ""}`}
                  onClick={() => {
                    setFilterDays("60");
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  60 days
                </button>
                <button 
                  className={`filter-dropdown-item ${filterDays === "90" ? "active" : ""}`}
                  onClick={() => {
                    setFilterDays("90");
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  90 days
                </button>
              </div>
            )}
          </div>

          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <p>No unclaimed items available</p>
            </div>
          ) : (
            <div className="unclaimed-list">
              {filteredReports.map((report) => (
                <div key={report.id} className="unclaimed-card">
                  <div className="unclaimed-card-header">
                    <div className={`type-badge ${report.type}`}>
                      {report.type.toUpperCase()}
                    </div>
                    <div className="days-remaining">
                      Donates in: {30 - report.daysUnclaimed} days
                    </div>
                  </div>
                  
                  <div className="unclaimed-card-content">
                    <div className="unclaimed-photo">
                      {report.photo_url ? (
                        <img src={report.photo_url} alt={report.title} />
                      ) : (
                        <div className="no-image">No image</div>
                      )}
                    </div>
                    
                    <div className="unclaimed-info">
                      <div className="unclaimed-title">{report.title}</div>
                      <div className="unclaimed-category">Category: {report.category}</div>
                      <div className="unclaimed-location">Location: {report.location}</div>
                      <div className="unclaimed-date">Reported: {formatDate(report.created_at)}</div>
                      <div className="unclaimed-status">Status: Available for claim</div>
                      {report.description && (
                        <div className="unclaimed-description">Description: {report.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="unclaimed-card-actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleViewDetails(report.id)}
                    >
                      View Details
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(report.id)}
                    >
                      Delete Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "donation" && (
        <>
          <div className="summary-stats">
            <div className="summary-card warning">
              <h4>Ready for Donation</h4>
              <div className="summary-number">{donationReports.length}</div>
              <small>Unclaimed for 30+ days - Action required</small>
            </div>
          </div>

          {donationReports.length === 0 ? (
            <div className="empty-state">
              <p>No items ready for donation</p>
            </div>
          ) : (
            <div className="unclaimed-list">
              {donationReports.map((report) => (
                <div key={report.id} className="unclaimed-card donation-card">
                  <div className="unclaimed-card-header">
                    <div className={`type-badge ${report.type}`}>
                      {report.type.toUpperCase()}
                    </div>
                    <div className="donation-badge">
                      Ready for Donation
                    </div>
                  </div>
                  
                  <div className="unclaimed-card-content">
                    <div className="unclaimed-photo">
                      {report.photo_url ? (
                        <img src={report.photo_url} alt={report.title} />
                      ) : (
                        <div className="no-image">No image</div>
                      )}
                    </div>
                    
                    <div className="unclaimed-info">
                      <div className="unclaimed-title">{report.title}</div>
                      <div className="unclaimed-category">Category: {report.category}</div>
                      <div className="unclaimed-location">Location: {report.location}</div>
                      <div className="unclaimed-date">Reported: {formatDate(report.created_at)}</div>
                      <div className="unclaimed-expired">
                        Unclaimed for {report.daysUnclaimed} days (30+ days)
                      </div>
                      {report.description && (
                        <div className="unclaimed-description">Description: {report.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="unclaimed-card-actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleViewDetails(report.id)}
                    >
                      View Details
                    </button>
                    <button 
                      className="donate-btn"
                      onClick={() => handleDonate(report.id)}
                    >
                      Mark as Donated
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(report.id)}
                    >
                      Delete Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UnclaimedItems;