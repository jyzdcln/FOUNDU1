import React, { useState } from "react";
import { supabase } from "../../services/supabase";
import "./FoundItemFormModal.css";

const FoundItemFormModal = ({ lostReport, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    finderName: "",
    finderContact: "",
    finderMessage: "",
    photoFile: null,
    photoPreview: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = async (e) => {
    alert("Photo upload is currently under maintenance.");
    e.target.value = null;
    return;
  };

  const uploadPhoto = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `found_items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('found-items')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('found-items')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.id) {
      alert("Please login first");
      setSubmitting(false);
      return;
    }

    try {
      let photoUrl = null;
      if (formData.photoFile) {
        photoUrl = await uploadPhoto(formData.photoFile);
      }

      const { data, error } = await supabase
        .from('found_lost_items')
        .insert([{
          lost_report_id: lostReport.id,
          finder_id: user.id,
          finder_name: formData.finderName || user.name || user.email,
          finder_contact: formData.finderContact,
          finder_message: formData.finderMessage,
          finder_photo_url: photoUrl,
          status: 'pending',
          submitted_at: new Date()
        }])
        .select();

      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: lostReport.user_id,
          type: 'found_item_submitted',
          message: `Someone has reported finding your item "${lostReport.title}". Admin will verify the submission.`,
          created_at: new Date()
        });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error submitting found item:", error);
      alert("Error submitting report. Please try again.");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="item-details-modal-overlay">
        <div className="item-details-modal-container">
          <h2>Thank You!</h2>
          <p>Your report has been submitted.</p>
          <button onClick={onClose} className="item-details-close-modal-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="found-item-modal-overlay">
      <div className="found-item-modal-container">
        <div className="found-item-modal-header">
          <h2>I Found This Item</h2>
          <button className="found-item-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="found-item-modal-body">
          <div className="found-item-lost-info">
            <p><strong>Lost Item:</strong> {lostReport.title}</p>
            <p><strong>Category:</strong> {lostReport.category}</p>
            <p><strong>Location:</strong> {lostReport.location}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="found-item-form-group">
              <label>YOUR NAME</label>
              <input
                type="text"
                name="finderName"
                value={formData.finderName}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="found-item-form-group">
              <label>CONTACT INFORMATION</label>
              <input
                type="text"
                name="finderContact"
                value={formData.finderContact}
                onChange={handleChange}
                placeholder="Email or phone number"
                required
              />
            </div>

            <div className="found-item-form-group">
              <label>MESSAGE TO OWNER</label>
              <textarea
                name="finderMessage"
                value={formData.finderMessage}
                onChange={handleChange}
                placeholder="Where did you find the item? When can you return it?"
                rows="4"
                required
              />
            </div>

            <div className="found-item-form-group">
              <label>UPLOAD PHOTO OF THE ITEM (OPTIONAL)</label>
              <div className="found-item-photo-upload" onClick={() => document.getElementById('found-item-photo-input').click()}>
                <input
                  type="file"
                  id="found-item-photo-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {formData.photoPreview ? (
                  <div className="found-item-photo-preview">
                    <img src={formData.photoPreview} alt="Preview" />
                  </div>
                ) : (
                  <div className="found-item-upload-area">
                    <span className="found-item-upload-icon"></span>
                    <p>Click to upload photo</p>
                    <small>Photo upload is currently under maintenance</small>
                  </div>
                )}
              </div>
            </div>

            <div className="found-item-form-buttons">
              <button type="submit" className="found-item-submit-btn" disabled={submitting}>
                {submitting ? "SUBMITTING..." : "SUBMIT REPORT"}
              </button>
              <button type="button" className="found-item-cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FoundItemFormModal;