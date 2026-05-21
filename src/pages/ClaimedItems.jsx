import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import "./ClaimedItems.css";
import searchIcon from "../assets/icons/Viewreport-icons.png";
import downArrowIcon from "../assets/icons/down-arrow-icon.png";

const ClaimedItems = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [searchTerm, statusFilter, claims]);

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

  const loadClaims = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("claims")
      .select(
        `
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
      `,
      )
      .order("claim_date", { ascending: false });

    if (error) {
      console.error("Error loading claims:", error);
    } else {
      console.log("Loaded claims:", data);
      setClaims(data || []);
      setFilteredClaims(data || []);
    }
    setLoading(false);
  };

  const filterClaims = () => {
    let filtered = [...claims];

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.reports?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.reports?.category
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          c.reports?.location
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          c.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredClaims(filtered);
  };

  const updateClaimStatus = async (id, newStatus) => {
    setIsProcessing(true);
    const { error } = await supabase
      .from("claims")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error updating claim: " + error.message);
    } else {
      const claim = claims.find((c) => c.id === id);
      if (claim) {
        if (newStatus === "approved") {
          await supabase
            .from("reports")
            .update({ status: "claimed" })
            .eq("id", claim.report_id);
          alert("Claim approved! Item marked as claimed.");
          loadClaims();
          setShowModal(false);
        } else if (newStatus === "rejected") {
          await supabase
            .from("reports")
            .update({
              status: "rejected",
              rejection_reason: "Claim was rejected by admin",
              admin_notes:
                "Claim rejected - insufficient proof or invalid claim",
            })
            .eq("id", claim.report_id);
          alert("Claim rejected. Report status updated to rejected.");
          loadClaims();
          setShowModal(false);
        }
      }
    }
    setIsProcessing(false);
  };

  const confirmPickup = async (claimId, reportId, studentId, itemTitle) => {
    if (
      !window.confirm(
        `Confirm that "${itemTitle}" has been returned to the student?`,
      )
    ) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: claimError } = await supabase
        .from("claims")
        .update({
          status: "completed",
          completed_at: new Date(),
        })
        .eq("id", claimId);

      if (claimError) throw claimError;

      const { error: reportError } = await supabase
        .from("reports")
        .update({
          status: "resolved",
          resolved_at: new Date(),
          admin_notes: "Item returned to student",
        })
        .eq("id", reportId);

      if (reportError) throw reportError;

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: studentId,
          type: "item_returned",
          message: `✅ Item Returned: "${itemTitle}" has been successfully returned to you. Thank you for using FoundU!`,
          created_at: new Date(),
          read: false,
        });

      if (notifError) {
        console.error("Notification error:", notifError);
      }

      alert(
        `"${itemTitle}" has been marked as returned. Student has been notified.`,
      );
      loadClaims();
      setShowModal(false);
    } catch (error) {
      console.error("Error confirming pickup:", error);
      alert("Error updating pickup status. Please try again.");
    }

    setIsProcessing(false);
  };

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClaim(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "completed":
        return "status-completed";
      default:
        return "status-pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "PENDING";
      case "approved":
        return "APPROVED";
      case "rejected":
        return "REJECTED";
      case "completed":
        return "COMPLETED";
      default:
        return status.toUpperCase();
    }
  };

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;
  const completedCount = claims.filter((c) => c.status === "completed").length;

  const getStatusLabel = () => {
    switch (statusFilter) {
      case "all":
        return `All (${claims.length})`;
      case "pending":
        return `Pending (${pendingCount})`;
      case "approved":
        return `Approved (${approvedCount})`;
      case "rejected":
        return `Rejected (${rejectedCount})`;
      case "completed":
        return `Completed (${completedCount})`;
      default:
        return `All (${claims.length})`;
    }
  };

  if (loading) {
    return <div className="claimed-loading"></div>;
  }

  return (
    <div className="claimed-container">
      <div className="claimed-header"></div>

      <div className="claimed-header-row">
        <div className="claimed-search-box">
          <input
            type="text"
            placeholder="Search claims..."
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
            <img
              src={downArrowIcon}
              alt="dropdown"
              className="claimed-dropdown-arrow"
            />
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
              <button
                className={`claimed-dropdown-item ${statusFilter === "completed" ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter("completed");
                  setIsDropdownOpen(false);
                }}
              >
                Completed ({completedCount})
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
        <div className="claimed-list">
          {filteredClaims.map((claim) => (
            <div key={claim.id} className="claimed-item">
              <div className="claimed-item-header">
                <div className="claimed-item-badges">
                  <span className={`claimed-item-type ${claim.reports?.type}`}>
                    {claim.reports?.type === "lost" ? "LOST" : "FOUND"}
                  </span>
                  <span
                    className={`claimed-item-status ${getStatusBadgeClass(claim.status)}`}
                  >
                    {getStatusText(claim.status)}
                  </span>
                </div>
                <div className="claimed-item-date-right">
                  {formatDate(claim.claim_date)}
                </div>
              </div>

              <div className="claimed-item-content">
                <div className="claimed-item-image">
                  {claim.reports?.photo_url ? (
                    <img
                      src={claim.reports.photo_url}
                      alt={claim.reports.title}
                    />
                  ) : (
                    <div className="claimed-no-image">No image</div>
                  )}
                </div>

                <div className="claimed-item-info">
                  <h3 className="claimed-item-title">
                    {claim.reports?.title || "Unknown Item"}
                  </h3>
                  <div className="claimed-item-meta">
                    {claim.reports?.category || "Uncategorized"} ·{" "}
                    {claim.reports?.type === "lost" ? "Lost" : "Found"}
                  </div>
                  <div className="claimed-item-detail">
                    <span className="claimed-detail-label">Claimant:</span>
                    <span>
                      {claim.users?.email || claim.users?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="claimed-item-detail">
                    <span className="claimed-detail-label">Location:</span>
                    <span>{claim.reports?.location || "N/A"}</span>
                  </div>
                </div>

                <div className="claimed-item-action">
                  <button
                    className="claimed-view-btn"
                    onClick={() => handleViewDetails(claim)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedClaim && (
        <div className="claimed-modal-overlay" onClick={closeModal}>
          <div
            className="claimed-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="claimed-modal-header">
              <h2>Claim Details</h2>
              <button className="claimed-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="claimed-modal-body">
              <div className="claimed-modal-section">
                <div className="claimed-modal-section-title">
                  ITEM INFORMATION
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Item Title:</span>
                  <span className="claimed-modal-value">
                    {selectedClaim.reports?.title || "Unknown"}
                  </span>
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Type:</span>
                  <span className="claimed-modal-value">
                    {selectedClaim.reports?.type === "lost" ? "LOST" : "FOUND"}
                  </span>
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Category:</span>
                  <span className="claimed-modal-value">
                    {selectedClaim.reports?.category || "N/A"}
                  </span>
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Location:</span>
                  <span className="claimed-modal-value">
                    {selectedClaim.reports?.location || "N/A"}
                  </span>
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Description:</span>
                  <span className="claimed-modal-value">
                    {selectedClaim.reports?.description || "No description"}
                  </span>
                </div>
              </div>

              <div className="claimed-modal-section">
                <div className="claimed-modal-section-title">
                  CLAIM INFORMATION
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Claimant:</span>
                  <span className="claimed-modal-value">
                    {selectedClaim.users?.email ||
                      selectedClaim.users?.name ||
                      "Unknown"}
                  </span>
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Claim Date:</span>
                  <span className="claimed-modal-value">
                    {formatFullDate(selectedClaim.claim_date)}
                  </span>
                </div>
                <div className="claimed-modal-row">
                  <span className="claimed-modal-label">Status:</span>
                  <span className="claimed-modal-value">
                    {getStatusText(selectedClaim.status)}
                  </span>
                </div>
              </div>

              <div className="claimed-modal-section">
                <div className="claimed-modal-section-title">
                  PROOF PROVIDED
                </div>
                {(() => {
                  const proof = parseProof(selectedClaim.proof_of_ownership);
                  return (
                    <>
                      {proof.description && (
                        <div className="claimed-modal-row">
                          <span className="claimed-modal-label">
                            Description:
                          </span>
                          <span className="claimed-modal-value">
                            {proof.description}
                          </span>
                        </div>
                      )}
                      {proof.colorBrand && (
                        <div className="claimed-modal-row">
                          <span className="claimed-modal-label">
                            Color/Brand:
                          </span>
                          <span className="claimed-modal-value">
                            {proof.colorBrand}
                          </span>
                        </div>
                      )}
                      {proof.uniqueMarks && (
                        <div className="claimed-modal-row">
                          <span className="claimed-modal-label">Marks:</span>
                          <span className="claimed-modal-value">
                            {proof.uniqueMarks}
                          </span>
                        </div>
                      )}
                      {!proof.description &&
                        !proof.colorBrand &&
                        !proof.uniqueMarks && (
                          <div className="claimed-modal-row">
                            <span className="claimed-modal-value">
                              {selectedClaim.proof_of_ownership ||
                                "No proof provided"}
                            </span>
                          </div>
                        )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="claimed-modal-footer">
              {selectedClaim.status === "pending" && (
                <div className="claimed-modal-buttons">
                  <button
                    className="claimed-modal-approve"
                    onClick={() =>
                      updateClaimStatus(selectedClaim.id, "approved")
                    }
                    disabled={isProcessing}
                  >
                    Approve
                  </button>
                  <button
                    className="claimed-modal-reject"
                    onClick={() =>
                      updateClaimStatus(selectedClaim.id, "rejected")
                    }
                    disabled={isProcessing}
                  >
                    Reject
                  </button>
                </div>
              )}
              {selectedClaim.status === "approved" && (
                <button
                  className="claimed-modal-pickup"
                  onClick={() =>
                    confirmPickup(
                      selectedClaim.id,
                      selectedClaim.report_id,
                      selectedClaim.student_id,
                      selectedClaim.reports?.title,
                    )
                  }
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Mark as Returned"}
                </button>
              )}
              {(selectedClaim.status === "rejected" ||
                selectedClaim.status === "completed") && (
                <button
                  className="claimed-modal-close-btn"
                  onClick={closeModal}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimedItems;
