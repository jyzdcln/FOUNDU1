import React, { useState } from "react";
import { saveReport } from "../../services/reportService";
import reportLostIcon from "../../assets/icons/report-lost-icon.png";
import "./ReportModal.css";

const ReportLostItemModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemTitle: "",
    category: "",
    dateLost: "",
    location: "",
    description: "",
    photo: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;
          const maxHeight = 800;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setIsSubmitting(true);
      try {
        const compressedImage = await compressImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, photo: reader.result }));
          setIsSubmitting(false);
        };
        reader.readAsDataURL(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        setIsSubmitting(false);
      }
    } else if (file) {
      alert("File size must be less than 5MB");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const reportData = {
      type: "lost",
      itemTitle: formData.itemTitle,
      category: formData.category,
      date: formData.dateLost,
      location: formData.location,
      description: formData.description,
      photo: formData.photo
    };
    
    const result = await saveReport(reportData, 'student');
    setIsSubmitting(false);
    
    if (result) {
      alert("Report submitted! Waiting for admin verification.");
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert("Error saving report. Please try again.");
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-container">
        <div className="report-modal-header">
          <img src={reportLostIcon} alt="report icon" className="report-modal-header-icon" />
          <div className="report-modal-header-content">
            <h2>Report Lost Item</h2>
            <div className="report-modal-subtitle-row">
              <span className="report-modal-subtitle-label">REPORTING AS STUDENT</span>
              <p className="report-modal-subtitle-text">Help the community find lost items.</p>
            </div>
          </div>
          <button className="report-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="report-modal-body">
          <form onSubmit={handleSubmit}>
            <div className="report-modal-form-group report-modal-full-width">
              <label>ITEM TITLE</label>
              <input
                type="text"
                name="itemTitle"
                placeholder="e.g. Silver Dell Laptop, Red Umbrella"
                value={formData.itemTitle}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="report-modal-form-row">
              <div className="report-modal-form-group">
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

              <div className="report-modal-form-group">
                <label>DATE LOST</label>
                <input type="date" name="dateLost" value={formData.dateLost} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="report-modal-form-group report-modal-full-width">
              <label>LOCATION</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Library Rooftop, STI Building Room 201"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="report-modal-form-group report-modal-full-width">
              <label>DETAILED DESCRIPTION</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe the item's unique features, color, brand, condition, etc."
                value={formData.description}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <div className="report-modal-form-group report-modal-full-width">
              <label>UPLOAD PHOTO (OPTIONAL)</label>
              <div className="report-modal-photo-upload" onClick={() => document.getElementById('report-photo-input').click()}>
                <input
                  type="file"
                  id="report-photo-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <div className="report-modal-upload-icon"></div>
                <p>Click or drop image here</p>
                <span className="report-modal-upload-hint">Max file size: 5 MB</span>
                {formData.photo && (
                  <div className="report-modal-selected-file">
                    Photo uploaded
                  </div>
                )}
                {isSubmitting && <div className="report-modal-loading">Processing image...</div>}
              </div>
            </div>

            <div className="report-modal-buttons">
              <button type="submit" className="report-modal-submit" disabled={isSubmitting}>
                {isSubmitting ? "SUBMITTING..." : "SUBMIT REPORT"}
              </button>
              <button type="button" className="report-modal-cancel" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportLostItemModal;