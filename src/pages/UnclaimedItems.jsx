import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { getReports } from "../services/reportService";
import "./UnclaimedItems.css";

const UnclaimedItems = () => {
  const [unclaimedReports, setUnclaimedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState("all");
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    oldestDays: 0
  });

  useEffect(() => {
    loadUnclaimedReports();
  }, []);

  const loadUnclaimedReports = async () => {
    setLoading(true);
    const allReports = await getReports();
    const verified = allReports.filter(r => r.status === "verified");
    setUnclaimedReports(verified);
    
    // Calculate summary stats
    const lostCount = verified.filter(r => r.type === "lost").length;
    const foundCount = verified.filter(r => r.type === "found").length;
    
    // Find oldest report
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

  const handleClaim = async (reportId) => {
    const confirmed = window.confirm("Mark this item as claimed?");
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'claimed' })
        .eq('id', reportId);
      
      if (error) throw error;
      
      alert("Item marked as claimed successfully!");
      await loadUnclaimedReports();
    } catch (error) {
      console.error("Error claiming item:", error);
      alert("Failed to mark item as claimed");
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

  const filteredReports = getFilteredReports();

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading unclaimed items...</p>
      </div>
    );
  }

  return (
    <div className="unclaimed-items">
      <div className="unclaimed-header">
        <h2>Unclaimed Items</h2>
        <div className="days-filter">
          <label>Show items older than:</label>
          <select value={filterDays} onChange={(e) => setFilterDays(e.target.value)}>
            <option value="all">All items</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      </div>

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
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="empty-state">
          <p>No unclaimed items found</p>
          <p className="empty-subtext">All verified items have been claimed</p>
        </div>
      ) : (
        <div className="unclaimed-list">
          {filteredReports.map((report) => (
            <div key={report.id} className="unclaimed-card">
              <div className="unclaimed-card-header">
                <div className={`type-badge ${report.type}`}>
                  {report.type.toUpperCase()}
                </div>
                <div className="days-old">
                  {getDaysOld(report.created_at)} days old
                </div>
              </div>
              
              <div className="unclaimed-card-content">
                <div className="unclaimed-photo">
                  {report.photo_url ? (
                    <img src={report.photo_url} alt={report.title} />
                  ) : (
                    <div style={{ background: '#f0f0f0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      No image
                    </div>
                  )}
                </div>
                
                <div className="unclaimed-info">
                  <div className="unclaimed-title">{report.title}</div>
                  <div className="unclaimed-category">Category: {report.category}</div>
                  <div className="unclaimed-location">Location: {report.location}</div>
                  <div className="unclaimed-date">Reported: {formatDate(report.created_at)}</div>
                  {report.description && (
                    <div className="unclaimed-description">Description: {report.description}</div>
                  )}
                </div>
              </div>
              
              <div className="unclaimed-card-actions">
                <button 
                  className="claim-btn"
                  onClick={() => handleClaim(report.id)}
                >
                  Mark as Claimed
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
    </div>
  );
};

export default UnclaimedItems;