import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import "./MyClaims.css";
import searchIcon from "../assets/icons/Viewreport-icons.png";
import downArrowIcon from "../assets/icons/down-arrow-icon.png";

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const parseProof = (proofText) => {
    if (!proofText || proofText === "No proof provided") {
      return { description: "", colorBrand: "", uniqueMarks: "" };
    }
    
    const parts = proofText.split(" | ");
    
    let description = "";
    let colorBrand = "";
    let uniqueMarks = "";
    
    for (const part of parts) {
      if (part.startsWith("Color/Brand:")) {
        colorBrand = part.replace("Color/Brand:", "").trim();
      } else if (part.startsWith("Marks:")) {
        uniqueMarks = part.replace("Marks:", "").trim();
      } else {
        description = part;
      }
    }
    
    return { description, colorBrand, uniqueMarks };
  };

  const filterClaims = () => {
    let filtered = [...claims];
    
    if (searchTerm) {
      filtered = filtered.filter(claim => 
        claim.reports?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.reports?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.reports?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(claim => 
        claim.reports?.category === categoryFilter
      );
    }
    
    setFilteredClaims(filtered);
  };

  const loadMyClaims = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
      setLoading(false);
      return;
    }

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
          status
        )
      `)
      .eq('student_id', user.id)
      .order('claim_date', { ascending: false });
    
    if (error) {
      console.error("Error loading claims:", error);
      setLoading(false);
      return;
    }
    
    setClaims(data || []);
    setFilteredClaims(data || []);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="myclaims-status pending">Pending</span>;
      case 'approved':
        return <span className="myclaims-status approved">Approved</span>;
      case 'rejected':
        return <span className="myclaims-status rejected">Rejected</span>;
      default:
        return <span className="myclaims-status pending">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) + " at " + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClaim(null);
  };

  const uniqueCategories = ["all", ...new Set(claims.map(c => c.reports?.category).filter(Boolean))];

  useEffect(() => {
    loadMyClaims();
  }, []);

  useEffect(() => {
    if (claims.length > 0) {
      filterClaims();
    }
  }, [searchTerm, categoryFilter, claims]);

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

  if (loading) {
    return (
      <div className="myclaims-loading">
        <div className="myclaims-spinner"></div>
        <p>Loading your claims...</p>
      </div>
    );
  }

  return (
    <div className="myclaims-container">
      <div className="myclaims-header">
        <div className="myclaims-header-left">
          <h2>My Claims</h2>
          <p className="myclaims-subtitle">Track the status of your item claims</p>
        </div>
        
        <div className="myclaims-header-right">
          <div className="myclaims-search-box">
            <img src={searchIcon} alt="search" className="myclaims-search-icon-img" />
            <input
              type="text"
              placeholder="Search claimed items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="myclaims-search-input"
            />
          </div>
          
          <div className="myclaims-category-dropdown" ref={dropdownRef}>
            <button 
              className="myclaims-category-dropdown-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {categoryFilter === "all" ? "All Categories" : categoryFilter}
              <img src={downArrowIcon} alt="dropdown" className="myclaims-dropdown-arrow-img" />
            </button>
            {isDropdownOpen && (
              <div className="myclaims-category-dropdown-menu">
                {uniqueCategories.map(cat => (
                  <button 
                    key={cat}
                    className={`myclaims-category-dropdown-item ${categoryFilter === cat ? "active" : ""}`}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="myclaims-table">
        <div className="myclaims-table-header">
          <div className="myclaims-col-item">ITEM DETAILS</div>
          <div className="myclaims-col-reporter">REPORTER & LOCATION</div>
          <div className="myclaims-col-status">CURRENT STATUS</div>
          <div className="myclaims-col-action">MANAGEMENT</div>
        </div>

        <div className="myclaims-table-body">
          {filteredClaims.length === 0 ? (
            <div className="myclaims-empty">
              <div className="myclaims-empty-icon"></div>
              <h3>No Claims Found</h3>
              <p>{claims.length === 0 ? "You haven't submitted any claims yet." : "No claims match your search criteria."}</p>
              {claims.length === 0 && (
                <button 
                  className="myclaims-browse-btn"
                  onClick={() => window.location.href = '/student-dashboard'}
                >
                  Browse Items to Claim
                </button>
              )}
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div key={claim.id} className="myclaims-table-row">
                <div className="myclaims-col-item">
                  <div className="myclaims-item-image">
                    {claim.reports?.photo_url ? (
                      <img src={claim.reports.photo_url} alt={claim.reports.title} />
                    ) : (
                      <div className="myclaims-no-image">No image</div>
                    )}
                  </div>
                  <div className="myclaims-item-info">
                    <div className="myclaims-item-name">{claim.reports?.title || "Unknown Item"}</div>
                    <div className="myclaims-item-category">
                      {claim.reports?.category || "Uncategorized"} · {claim.reports?.type === "lost" ? "Lost" : "Found"}
                    </div>
                  </div>
                </div>
                
                <div className="myclaims-col-reporter">
                  <div className="myclaims-reporter-name">{claim.users?.name || claim.users?.email || "You"}</div>
                  <div className="myclaims-reporter-location">{claim.reports?.location || "N/A"}</div>
                </div>
                
                <div className="myclaims-col-status">
                  {getStatusBadge(claim.status)}
                </div>
                
                <div className="myclaims-col-action">
                  <button 
                    className="myclaims-view-btn"
                    onClick={() => handleViewDetails(claim)}
                  >
                    Claim Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && selectedClaim && (
        <div className="myclaims-modal-overlay" onClick={closeModal}>
          <div className="myclaims-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="myclaims-modal-header">
              <h2>Claim Details</h2>
              <button className="myclaims-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="myclaims-modal-body">
              <div className="myclaims-modal-grid">
                <div className="myclaims-modal-field">
                  <span className="myclaims-modal-label">Item Title:</span>
                  <span className="myclaims-modal-value">{selectedClaim.reports?.title || "Unknown"}</span>
                </div>
                
                <div className="myclaims-modal-field">
                  <span className="myclaims-modal-label">Type:</span>
                  <span className="myclaims-modal-value">{selectedClaim.reports?.type === "lost" ? "LOST" : "FOUND"}</span>
                </div>
                
                <div className="myclaims-modal-field">
                  <span className="myclaims-modal-label">Category:</span>
                  <span className="myclaims-modal-value">{selectedClaim.reports?.category || "N/A"}</span>
                </div>
                
                <div className="myclaims-modal-field">
                  <span className="myclaims-modal-label">Location:</span>
                  <span className="myclaims-modal-value">{selectedClaim.reports?.location || "N/A"}</span>
                </div>
                
                <div className="myclaims-modal-field">
                  <span className="myclaims-modal-label">Claim Status:</span>
                  <span className="myclaims-modal-value">{selectedClaim.status === "approved" ? "Approved" : selectedClaim.status}</span>
                </div>
                
                <div className="myclaims-modal-field">
                  <span className="myclaims-modal-label">Claim Date:</span>
                  <span className="myclaims-modal-value">{formatDateTime(selectedClaim.claim_date)}</span>
                </div>
              </div>

              {(() => {
                const proof = parseProof(selectedClaim.proof_of_ownership);
                return (
                  (proof.description || proof.colorBrand || proof.uniqueMarks) && (
                    <div className="myclaims-modal-full">
                      <div className="myclaims-modal-label">Proof Provided:</div>
                      <div className="myclaims-proof-item">
                        {proof.description && (
                          <div className="myclaims-proof-row">
                            <div className="myclaims-proof-label">Description:</div>
                            <div className="myclaims-proof-value">{proof.description}</div>
                          </div>
                        )}
                        {proof.colorBrand && (
                          <div className="myclaims-proof-row">
                            <div className="myclaims-proof-label">Color/Brand:</div>
                            <div className="myclaims-proof-value">{proof.colorBrand}</div>
                          </div>
                        )}
                        {proof.uniqueMarks && (
                          <div className="myclaims-proof-row">
                            <div className="myclaims-proof-label">Marks:</div>
                            <div className="myclaims-proof-value">{proof.uniqueMarks}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                );
              })()}

              {selectedClaim.status === 'approved' && (
                <div className="myclaims-modal-full">
                  <div className="myclaims-modal-pickup">
                    <h4>Pickup Instructions</h4>
                    <p>Location: Front Desk / Student Affairs Office</p>
                    <p>Bring your Student ID for verification</p>
                    <p>Hours: Monday-Friday, 8:00 AM - 5:00 PM</p>
                    <p>Items are held for 7 days only after approval</p>
                  </div>
                </div>
              )}
              
              {selectedClaim.status === 'rejected' && (
                <div className="myclaims-modal-full">
                  <div className="myclaims-modal-rejected">
                    <h4>Claim Rejected</h4>
                    <p>Your claim was rejected. Please contact the admin for more information.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="myclaims-modal-footer">
              <button className="myclaims-modal-close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClaims;