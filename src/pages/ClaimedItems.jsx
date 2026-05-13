import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import "./ClaimedItems.css";
import searchIcon from "../assets/icons/Viewreport-icons.png";
import downArrowIcon from "../assets/icons/down-arrow-icon.png";

const ClaimedItems = () => {
  const [claims, setClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        reports:report_id (
          id,
          title,
          type,
          category,
          location,
          description,
          photo_url,
          date
        ),
        users:student_id (
          id,
          email,
          name
        )
      `)
      .order('claim_date', { ascending: false });
    
    if (error) {
      console.error("Error loading claims:", error);
    } else {
      console.log("Loaded claims:", data);
      setClaims(data || []);
    }
    setLoading(false);
  };

  const updateClaimStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('claims')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (error) {
      alert("Error updating claim: " + error.message);
    } else {
      if (newStatus === "approved") {
        const claim = claims.find(c => c.id === id);
        if (claim) {
          await supabase
            .from('reports')
            .update({ status: "claimed" })
            .eq('id', claim.report_id);
        }
        alert("Claim approved! Item marked as claimed.");
      } else if (newStatus === "rejected") {
        alert("Claim rejected.");
      }
      loadClaims();
    }
  };

  const getFilteredClaims = () => {
    let filtered = claims;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.reports?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.reports?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.reports?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredClaims = getFilteredClaims();
  const pendingCount = claims.filter(c => c.status === "pending").length;
  const approvedCount = claims.filter(c => c.status === "approved").length;
  const rejectedCount = claims.filter(c => c.status === "rejected").length;

  const getStatusLabel = () => {
    switch(statusFilter) {
      case "all": return `All (${claims.length})`;
      case "pending": return `Pending (${pendingCount})`;
      case "approved": return `Approved (${approvedCount})`;
      case "rejected": return `Rejected (${rejectedCount})`;
      default: return `All (${claims.length})`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "pending": return "status-pending";
      case "approved": return "status-approved";
      case "rejected": return "status-rejected";
      default: return "status-pending";
    }
  };

  if (loading) {
    return <div className="claimed-loading">Loading claims...</div>;
  }

  return (
    <div className="claimed-container">
      <div className="claimed-header">
      </div>

      <div className="claimed-header-row">
        <div className="claimed-search-box">
          <input
            type="text"
            placeholder="Search Items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="claimed-search-input"
          />
          <img src={searchIcon} alt="search" className="claimed-search-icon" />
        </div>

        <div className="claimed-dropdown" ref={dropdownRef}>
          <button 
            className="claimed-dropdown-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {getStatusLabel()}
            <img src={downArrowIcon} alt="dropdown" className="claimed-dropdown-arrow" />
          </button>
          {isDropdownOpen && (
            <div className="claimed-dropdown-menu">
              <button 
                className={`claimed-dropdown-item ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter("all");
                  setIsDropdownOpen(false);
                }}
              >
                All ({claims.length})
              </button>
              <button 
                className={`claimed-dropdown-item ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter("pending");
                  setIsDropdownOpen(false);
                }}
              >
                Pending ({pendingCount})
              </button>
              <button 
                className={`claimed-dropdown-item ${statusFilter === "approved" ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter("approved");
                  setIsDropdownOpen(false);
                }}
              >
                Approved ({approvedCount})
              </button>
              <button 
                className={`claimed-dropdown-item ${statusFilter === "rejected" ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter("rejected");
                  setIsDropdownOpen(false);
                }}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredClaims.length === 0 ? (
        <div className="claimed-empty">
          <p>No claims found</p>
        </div>
      ) : (
        <div className="claimed-grid">
          {filteredClaims.map((claim) => (
            <div key={claim.id} className="claimed-card">
              <div className="claimed-card-header">
                <div className="claimed-badges">
                  <span className="claimed-type">{claim.reports?.type === "lost" ? "LOST" : "FOUND"}</span>
                  <span className={`claimed-status ${getStatusBadgeClass(claim.status)}`}>
                    {claim.status?.toUpperCase()}
                  </span>
                </div>
                <div className="claimed-date">
                  {formatDate(claim.claim_date)}
                </div>
              </div>
              <div className="claimed-card-body">
                <h3 className="claimed-title">{claim.reports?.title || "Unknown Item"}</h3>
                <div className="claimed-details">
                  <div className="claimed-detail-item">
                    <span className="claimed-detail-label">Claimant</span>
                    <span className="claimed-detail-value">{claim.users?.email || claim.users?.name || "Unknown"}</span>
                  </div>
                  <div className="claimed-detail-item">
                    <span className="claimed-detail-label">Category</span>
                    <span className="claimed-detail-value">{claim.reports?.category}</span>
                  </div>
                  <div className="claimed-detail-item">
                    <span className="claimed-detail-label">Location</span>
                    <span className="claimed-detail-value">{claim.reports?.location}</span>
                  </div>
                  <div className="claimed-detail-item">
                    <span className="claimed-detail-label">Date Lost/Found</span>
                    <span className="claimed-detail-value">{formatDate(claim.reports?.date)}</span>
                  </div>
                  <div className="claimed-detail-item claimed-description">
                    <span className="claimed-detail-label">Proof Provided</span>
                    <span className="claimed-detail-value">{claim.proof_of_ownership}</span>
                  </div>
                </div>
              </div>
              <div className="claimed-card-footer">
                {claim.status === "pending" && (
                  <>
                    <button 
                      className="claimed-approve-btn"
                      onClick={() => updateClaimStatus(claim.id, "approved")}
                    >
                      Approve Claim
                    </button>
                    <button 
                      className="claimed-reject-btn"
                      onClick={() => updateClaimStatus(claim.id, "rejected")}
                    >
                      Reject Claim
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimedItems;