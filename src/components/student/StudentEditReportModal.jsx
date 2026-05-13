import React, { useState } from "react";
import { updateReportWithEdit } from "../../services/reportService";
import "./StudentEditReportModal.css";

const StudentEditReportModal = ({ report, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: report.title,
    category: report.category,
    description: report.description,
    location: report.location,
    date: report.date,
    photo: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(report.photo_url);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("File size must be less than 5MB");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const updatedData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      date: formData.date,
      photo_url: formData.photo || report.photo_url
    };
    
    const result = await updateReportWithEdit(report.id, updatedData);
    setSubmitting(false);
    
    if (result) {
      alert("Report updated and resubmitted for admin review!");
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert("Error updating report. Please try again.");
    }
  };

  return (
    <div className="student-edit-modal-overlay">
      <div className="student-edit-modal-container">
        <div className="student-edit-modal-header">
          <h2>Edit Report</h2>
          {report.admin_notes && (
            <div className="admin-feedback">
              <strong>Admin Feedback:</strong>
              <p>{report.admin_notes}</p>
            </div>
          )}
          <button className="student-edit-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="student-edit-modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ITEM TITLE</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Silver Dell Laptop, Red Umbrella"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CATEGORY</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Documents">Documents</option>
                  <option value="Bags">Bags</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>DATE</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>LOCATION</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Library Rooftop, STI Building Room 201"
                required
              />
            </div>

            <div className="form-group">
              <label>DETAILED DESCRIPTION</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the item's unique features, color, brand, condition, etc."
                required
              />
            </div>

            <div className="form-group">
              <label>UPLOAD PHOTO (OPTIONAL)</label>
              <div className="photo-upload-area" onClick={() => document.getElementById('edit-photo-input').click()}>
                <input
                  type="file"
                  id="edit-photo-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                    <p>Click to change photo</p>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon"></div>
                    <p>Click or drop image here</p>
                    <span className="upload-hint">Max file size: 5 MB</span>
                  </>
                )}
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "SUBMITTING..." : "RESUBMIT REPORT"}
              </button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentEditReportModal;