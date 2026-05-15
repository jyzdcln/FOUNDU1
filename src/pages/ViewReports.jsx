import React, { useState, useEffect } from "react";
import { updateReportStatus, deleteReport, getReports } from "../services/reportService";
import "./ViewReports.css";
import locationIcon from "../assets/icons/location-icons.png";
import searchIcon from "../assets/icons/Viewreport-icons.png";
import downArrowIcon from "../assets/icons/down-arrow-icon.png";
import ReturnToUserModal from "../components/admin/ReturnToUserModal";

const ViewReports = ({ onRefresh }) => {
  const [allReports, setAllReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReportForReturn, setSelectedReportForReturn] = useState(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const statusDropdownRef = React.useRef(null);
  const categoryDropdownRef = React.useRef(null);

  useEffect(() => {
    loadAllReports();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    const reports = await getReports();
    console.log("Fetched reports:", reports);
    setAllReports(reports);
    setLoading(false);
  };

  const handleVerify = async (id) => {
    await updateReportStatus(id, "verified");
    await loadAllReports();
    if (onRefresh) await onRefresh();
    alert("Report verified! It will now appear in student browse.");
    setShowDetailModal(false);
  };

  const handleReceive = async (id) => {
    await updateReportStatus(id, "received");
    await loadAllReports();
    if (onRefresh) await onRefresh();
    alert("Report marked as received.");
    setShowDetailModal(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      await deleteReport(id);
      await loadAllReports();
      if (onRefresh) await onRefresh();
      alert("Report deleted successfully");
      setShowDetailModal(false);
    }
  };

  const handleEdit = (report) => {
    alert(`Edit function coming soon!\n\nItem: ${report.title}`);
    setShowDetailModal(false);
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleReturnToUser = (report) => {
    setSelectedReportForReturn(report);
    setShowReturnModal(true);
    setShowDetailModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getFilteredReports = () => {
    let filtered = allReports;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }
    
    return filtered;
  };

  const filteredReports = getFilteredReports();
  const pendingCount = allReports.filter(r => r.status === "pending").length;
  const verifiedCount = allReports.filter(r => r.status === "verified").length;
  const rejectedCount = allReports.filter(r => r.status === "rejected").length;
  
  const uniqueCategories = ["all", ...new Set(allReports.map(r => r.category).filter(Boolean))];

  const getStatusLabel = () => {
    switch(statusFilter) {
      case "all": return `All (${allReports.length})`;
      case "pending": return `Pending (${pendingCount})`;
      case "verified": return `Verified (${verifiedCount})`;
      case "rejected": return `Rejected (${rejectedCount})`;
      default: return `All (${allReports.length})`;
    }
  };

  const getCategoryLabel = () => {
    if (categoryFilter === "all") return "All Categories";
    return categoryFilter;
  };

  if (loading) {
    return (
      <div className="vr-loading-container">
        <div className="vr-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="vr-container">
      <div className="vr-header-row">
        <div className="vr-left-section">
          <div className="vr-search-box">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="vr-search-input"
            />
            <img src={searchIcon} alt="search" className="vr-search-icon-img" />
          </div>
          
          <div className="vr-category-dropdown" ref={categoryDropdownRef}>
            <button 
              className="vr-category-dropdown-btn"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            >
              {getCategoryLabel()}
              <img src={downArrowIcon} alt="dropdown" className="vr-dropdown-arrow-img" />
            </button>
            {isCategoryDropdownOpen && (
              <div className="vr-category-dropdown-menu">
                {uniqueCategories.map(cat => (
                  <button 
                    key={cat}
                    className={`vr-category-dropdown-item ${categoryFilter === cat ? "active" : ""}`}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setIsCategoryDropdownOpen(false);
                    }}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="vr-status-dropdown" ref={statusDropdownRef}>
            <button 
              className="vr-status-dropdown-btn"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            >
              {getStatusLabel()}
              <img src={downArrowIcon} alt="dropdown" className="vr-dropdown-arrow-img" />
            </button>
            {isStatusDropdownOpen && (
              <div className="vr-status-dropdown-menu">
                <button 
                  className={`vr-status-dropdown-item ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("all");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  All ({allReports.length})
                </button>
                <button 
                  className={`vr-status-dropdown-item ${statusFilter === "pending" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("pending");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  Pending ({pendingCount})
                </button>
                <button 
                  className={`vr-status-dropdown-item ${statusFilter === "verified" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("verified");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  Verified ({verifiedCount})
                </button>
                <button 
                  className={`vr-status-dropdown-item ${statusFilter === "rejected" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("rejected");
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="vr-empty-state">
          <p>No reports found</p>
        </div>
      ) : (
        <div className="vr-reports-grid">
          {filteredReports.map((report) => (
            <div key={report.id} className="vr-report-card">
              <div className="vr-report-card-image">
                {report.photo_url ? (
                  <img src={report.photo_url} alt={report.title} />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <div className="vr-report-card-content">
                <div className="vr-report-card-header">
                  <div className={`vr-report-type-badge ${report.type}`}>
                    {report.type === "lost" ? "LOST" : "FOUND"}
                  </div>
                  <div className="vr-report-date">
                    {formatDate(report.created_at)}
                  </div>
                </div>
                <div className="vr-report-category">{report.category || "Item"}</div>
                <div className="vr-report-title">{report.title}</div>
                <div className="vr-report-location">
                  <img src={locationIcon} alt="location" className="vr-location-icon" />
                  {report.location}
                </div>
              </div>
              <button 
                className="vr-view-details-btn"
                onClick={() => handleViewDetails(report)}
              >
                VIEW DETAILS
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedReport && (
        <div className="vr-modal-overlay">
          <div className="vr-modal-container">
            <div className="vr-modal-header">
              <h2>{selectedReport.title}</h2>
              <button className="vr-modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="vr-modal-body">
              <div className="vr-modal-info">
                <p><strong>Type:</strong> {selectedReport.type?.toUpperCase()}</p>
                <p><strong>Category:</strong> {selectedReport.category}</p>
                <p><strong>Location:</strong> {selectedReport.location}</p>
                <p><strong>Date:</strong> {selectedReport.date || formatDate(selectedReport.created_at)}</p>
                <p><strong>Description:</strong> {selectedReport.description}</p>
                <p><strong>Reported by:</strong> {selectedReport.users?.name || selectedReport.users?.email || "Student"}</p>
                <p><strong>Status:</strong> <span className={`vr-status-badge vr-status-${selectedReport.status}`}>{selectedReport.status?.toUpperCase()}</span></p>
              </div>
              <div className="vr-modal-actions">
                {selectedReport.status === "pending" && (
                  <>
                    <button 
                      className="vr-modal-receive-btn"
                      onClick={() => handleReceive(selectedReport.id)}
                    >
                      Receive
                    </button>
                    <button 
                      className="vr-modal-return-btn"
                      onClick={() => handleReturnToUser(selectedReport)}
                    >
                      Return
                    </button>
                  </>
                )}
                {selectedReport.status === "received" && (
                  <>
                    <button 
                      className="vr-modal-verify-btn"
                      onClick={() => handleVerify(selectedReport.id)}
                    >
                      Verify
                    </button>
                    <button 
                      className="vr-modal-return-btn"
                      onClick={() => handleReturnToUser(selectedReport)}
                    >
                      Return to User
                    </button>
                  </>
                )}
                <button 
                  className="vr-modal-edit-btn"
                  onClick={() => handleEdit(selectedReport)}
                >
                  Edit
                </button>
                <button 
                  className="vr-modal-delete-btn"
                  onClick={() => handleDelete(selectedReport.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedReportForReturn && (
        <ReturnToUserModal
          report={selectedReportForReturn}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedReportForReturn(null);
          }}
          onSuccess={() => {
            loadAllReports();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default ViewReports;