import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import "./AdminVerifyFound.css";
import searchIcon from "../assets/icons/Viewreport-icons.png";

const AdminVerifyFound = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, statusFilter, submissions]);

  const loadSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("found_lost_items")
      .select(
        `
        *,
        lost_report:lost_report_id (
          id,
          title,
          category,
          location,
          description,
          user_id,
          users:user_id (name, email)
        ),
        finder:finder_id (name, email)
      `,
      )
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error loading submissions:", error);
    } else {
      setSubmissions(data || []);
      setFilteredSubmissions(data || []);
    }
    setLoading(false);
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.lost_report?.title
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          s.finder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.finder_contact?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleApprove = async (submission) => {
    alert("This Feature is Under Maintenance.");
    return;
  };

  const handleReject = async (submission) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const confirmed = window.confirm(
      `Reject this submission?\n\n` +
        `Item: ${submission.lost_report?.title}\n` +
        `Finder: ${submission.finder_name}\n\n` +
        `Reason: ${rejectReason}`,
    );

    if (!confirmed) return;

    setIsRejecting(true);

    try {
      const { error: updateError } = await supabase
        .from("found_lost_items")
        .update({
          status: "rejected",
          reviewed_at: new Date(),
          admin_notes: rejectReason,
        })
        .eq("id", submission.id);

      if (updateError) throw updateError;

      const { error: reportUpdateError } = await supabase
        .from("reports")
        .update({
          status: "rejected",
          rejection_reason: rejectReason,
          admin_notes: rejectReason,
        })
        .eq("id", submission.lost_report_id);

      if (reportUpdateError) {
        console.error("Error updating reports table:", reportUpdateError);
      }

      await supabase.from("notifications").insert({
        user_id: submission.finder_id,
        type: "submission_rejected",
        message: `Your submission for "${submission.lost_report?.title}" was rejected. Reason: ${rejectReason}`,
        created_at: new Date(),
      });

      alert("Submission rejected. Student has been notified.");
      loadSubmissions();
      setShowModal(false);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting submission:", error);
      alert("Error rejecting submission. Please try again.");
    }

    setIsRejecting(false);
  };

  const openModal = (submission) => {
    setSelectedSubmission(submission);
    setRejectReason("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubmission(null);
    setRejectReason("");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="verify-found-status pending">Pending</span>;
      case "approved":
        return <span className="verify-found-status approved">Approved</span>;
      case "rejected":
        return <span className="verify-found-status rejected">Rejected</span>;
      default:
        return <span className="verify-found-status pending">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter(
    (s) => s.status === "approved",
  ).length;
  const rejectedCount = submissions.filter(
    (s) => s.status === "rejected",
  ).length;

  if (loading) {
    return (
      <div className="verify-found-loading">
        <div className="verify-found-spinner"></div>
      </div>
    );
  }

  return (
    <div className="verify-found-container">
      <div className="verify-found-header"></div>

      <div className="verify-found-stats">
        <div className="verify-found-stat-card">
          <div className="verify-found-stat-number">{pendingCount}</div>
          <div className="verify-found-stat-label">Pending</div>
        </div>
        <div className="verify-found-stat-card">
          <div className="verify-found-stat-number">{approvedCount}</div>
          <div className="verify-found-stat-label">Approved</div>
        </div>
        <div className="verify-found-stat-card">
          <div className="verify-found-stat-number">{rejectedCount}</div>
          <div className="verify-found-stat-label">Rejected</div>
        </div>
      </div>

      <div className="verify-found-filter-bar">
        <div className="verify-found-search-box">
          <input
            type="text"
            placeholder="Search by item or finder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="verify-found-search-input"
          />
          <img
            src={searchIcon}
            alt="search"
            className="verify-found-search-icon"
          />
        </div>

        <div className="verify-found-status-filter">
          <button
            className={`verify-found-filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({submissions.length})
          </button>
          <button
            className={`verify-found-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`verify-found-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
            onClick={() => setStatusFilter("approved")}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`verify-found-filter-btn ${statusFilter === "rejected" ? "active" : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="verify-found-empty">
          <p>No submissions found</p>
        </div>
      ) : (
        <div className="verify-found-list">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="verify-found-card">
              <div className="verify-found-card-header">
                <div className="verify-found-card-title">
                  <h3>{submission.lost_report?.title || "Unknown Item"}</h3>
                  <span className="verify-found-category">
                    {submission.lost_report?.category}
                  </span>
                </div>
                {getStatusBadge(submission.status)}
              </div>

              <div className="verify-found-card-body">
                <div className="verify-found-detail-row">
                  <span className="verify-found-detail-label">Finder:</span>
                  <span className="verify-found-detail-value">
                    {submission.finder_name}
                  </span>
                </div>
                <div className="verify-found-detail-row">
                  <span className="verify-found-detail-label">Contact:</span>
                  <span className="verify-found-detail-value">
                    {submission.finder_contact}
                  </span>
                </div>
                <div className="verify-found-detail-row">
                  <span className="verify-found-detail-label">Location:</span>
                  <span className="verify-found-detail-value">
                    {submission.lost_report?.location}
                  </span>
                </div>
                <div className="verify-found-detail-row">
                  <span className="verify-found-detail-label">Submitted:</span>
                  <span className="verify-found-detail-value">
                    {formatDate(submission.submitted_at)}
                  </span>
                </div>
                <div className="verify-found-detail-row verify-found-message">
                  <span className="verify-found-detail-label">Message:</span>
                  <span className="verify-found-detail-value">
                    {submission.finder_message}
                  </span>
                </div>
                {submission.finder_photo_url && (
                  <div className="verify-found-photo">
                    <img
                      src={submission.finder_photo_url}
                      alt="Found item proof"
                    />
                  </div>
                )}
              </div>

              <div className="verify-found-card-footer">
                {submission.status === "pending" && (
                  <button
                    className="verify-found-view-btn"
                    onClick={() => openModal(submission)}
                  >
                    Verify
                  </button>
                )}
                {submission.status !== "pending" && (
                  <button
                    className="verify-found-view-btn verify-found-view-only"
                    onClick={() => openModal(submission)}
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSubmission && (
        <div className="verify-found-modal-overlay" onClick={closeModal}>
          <div
            className="verify-found-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="verify-found-modal-header">
              <h2>Verify Found Item Submission</h2>
              <button className="verify-found-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="verify-found-modal-body">
              <div className="verify-found-modal-section">
                <h4>Lost Item Information</h4>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">Item:</span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.lost_report?.title}
                  </span>
                </div>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">Category:</span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.lost_report?.category}
                  </span>
                </div>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">
                    Location Lost:
                  </span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.lost_report?.location}
                  </span>
                </div>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">Description:</span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.lost_report?.description}
                  </span>
                </div>
              </div>

              <div className="verify-found-modal-section">
                <h4>Finder Information</h4>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">Name:</span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.finder_name}
                  </span>
                </div>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">Contact:</span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.finder_contact}
                  </span>
                </div>
                <div className="verify-found-modal-row">
                  <span className="verify-found-modal-label">Message:</span>
                  <span className="verify-found-modal-value">
                    {selectedSubmission.finder_message}
                  </span>
                </div>
                {selectedSubmission.finder_photo_url && (
                  <div className="verify-found-modal-photo">
                    <img
                      src={selectedSubmission.finder_photo_url}
                      alt="Proof"
                    />
                  </div>
                )}
              </div>

              {selectedSubmission.status === "pending" && (
                <div className="verify-found-modal-section">
                  <h4>Rejection Reason (if rejecting)</h4>
                  <textarea
                    className="verify-found-reject-reason"
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows="3"
                  />
                </div>
              )}

              {selectedSubmission.status !== "pending" && (
                <div className="verify-found-modal-section">
                  <h4>Admin Notes</h4>
                  <div className="verify-found-modal-row">
                    <span className="verify-found-modal-value verify-found-admin-note">
                      {selectedSubmission.admin_notes || "No notes"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="verify-found-modal-footer">
              {selectedSubmission.status === "pending" && (
                <>
                  <button
                    className="verify-found-modal-approve"
                    onClick={() => handleApprove(selectedSubmission)}
                  >
                    Create Report
                  </button>
                  <button
                    className="verify-found-modal-reject"
                    onClick={() => handleReject(selectedSubmission)}
                    disabled={isRejecting}
                  >
                    {isRejecting ? "Processing..." : "Reject"}
                  </button>
                </>
              )}
              <button
                className="verify-found-modal-close-btn"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifyFound;
