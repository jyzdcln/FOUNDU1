import React, { useState } from "react";
import { updateReportStatus } from "../../services/reportService";
import "./ReturnToUserModal.css";

const ReturnToUserModal = ({ report, onClose, onSuccess }) => {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      alert("Please provide feedback on what needs to be fixed.");
      return;
    }
    
    setSubmitting(true);
    const result = await updateReportStatus(report.id, "returned", note);
    setSubmitting(false);
    
    if (result) {
      alert(`Report returned to student with feedback.`);
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert("Error returning report. Please try again.");
    }
  };

  return (
    <div className="return-modal-overlay">
      <div className="return-modal-container">
        <div className="return-modal-header">
          <h2>Return Report to Student</h2>
          <button className="return-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="return-modal-body">
          <div className="report-info">
            <p><strong>Item:</strong> {report.title}</p>
            <p><strong>Reported by:</strong> {report.users?.name || report.users?.email || "Student"}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>FEEDBACK / INSTRUCTION FOR STUDENT</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Please provide the missing or corrected information..."
                rows="5"
                required
              />
              <small>This note will be visible to the student when they edit their report.</small>
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="return-btn" disabled={submitting}>
                {submitting ? "PROCESSING..." : "Return to Student"}
              </button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnToUserModal;