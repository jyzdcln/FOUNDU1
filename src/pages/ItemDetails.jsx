import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./ItemDetails.css";
import "./StudentDashboard.css";
import founduLogo from "../assets/icons/foundulogo-icon.png";
import studentUserIcon from "../assets/icons/admin-user-icon.png";
import studentDropdownIcon from "../assets/icons/admin-dropdown-icon.png";
import notificationIcon from "../assets/icons/notification-icon.png";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = React.useRef(null);
  const notificationRef = React.useRef(null);

  useEffect(() => {
    loadItemDetails();
    loadNotifications();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadItemDetails = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error loading item:", error);
    } else {
      setItem(data);
    }
  };

  const loadNotifications = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    try {
      const { data: reports } = await supabase
        .from('reports')
        .select('id, title, status, created_at, admin_notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      const notifs = [];
      
      for (const report of reports) {
        if (report.status === 'returned' && report.admin_notes) {
          notifs.push({
            id: `${report.id}_returned`,
            message: `Report "${report.title}" needs your attention: ${report.admin_notes}`,
            time: formatTimeAgo(report.created_at),
            read: false,
            type: 'returned'
          });
        } else if (report.status === 'verified') {
          notifs.push({
            id: `${report.id}_verified`,
            message: `Your report "${report.title}" has been verified and is now visible!`,
            time: formatTimeAgo(report.created_at),
            read: false,
            type: 'verified'
          });
        }
      }
      
      const { data: claims } = await supabase
        .from('claims')
        .select('*, reports(title)')
        .eq('student_id', user.id)
        .order('claim_date', { ascending: false })
        .limit(20);
      
      for (const claim of claims) {
        if (claim.status === 'approved') {
          notifs.push({
            id: `${claim.id}_approved`,
            message: `Your claim for "${claim.reports?.title}" has been approved! You can now pick up your item.`,
            time: formatTimeAgo(claim.claim_date),
            read: false,
            type: 'approved'
          });
        } else if (claim.status === 'rejected') {
          notifs.push({
            id: `${claim.id}_rejected`,
            message: `Your claim for "${claim.reports?.title}" was rejected. Please contact admin for more info.`,
            time: formatTimeAgo(claim.claim_date),
            read: false,
            type: 'rejected'
          });
        }
      }
      
      notifs.sort((a, b) => {
        if (a.time.includes('seconds') && !b.time.includes('seconds')) return -1;
        if (!a.time.includes('seconds') && b.time.includes('seconds')) return 1;
        return 0;
      });
      
      setNotifications(notifs.slice(0, 10));
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error("Get notifications error:", error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
           " at " + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/");
  };

  const handleClaimClick = () => {
    setShowClaimForm(true);
  };

  const goToBrowse = () => {
    navigate('/student-dashboard', { state: { showBrowse: true } });
  };

  const goToDashboard = () => {
    navigate('/student-dashboard', { state: { showBrowse: false } });
  };

  const goToMyClaims = () => {
    navigate('/student-dashboard', { state: { showMyClaims: true } });
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  return (
    <div className="item-details-container">
      <header className="student-full-header">
        <div className="student-header-content">
          <div className="student-logo">
            <img src={founduLogo} alt="FoundU" className="student-logo-img" />
          </div>
          <div className="student-header-actions">
            <span className="student-lang" onClick={goToBrowse}>Browse</span>
            <span className="student-lang" onClick={goToMyClaims}>My Claims</span>
            <span className="student-lang" onClick={goToDashboard}>Dashboard</span>
            
            <div className="notification-bell" ref={notificationRef}>
              <div className="notification-icon" onClick={toggleNotification}>
                <img src={notificationIcon} alt="notifications" className="notification-icon-img" />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
              {isNotificationOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">No notifications</p>
                          <span className="notification-time">---</span>
                        </div>
                      </div>
                    ) : (
                      notifications.map((notif, index) => (
                        <div 
                          key={index} 
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => markNotificationAsRead(notif.id)}
                        >
                          <div className="notification-content">
                            <p className="notification-message">{notif.message}</p>
                            <span className="notification-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-dropdown" ref={dropdownRef}>
              <div 
                className="user-dropdown-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="user-icon">
                  <img src={studentUserIcon} alt="user" className="user-icon-img" />
                </div>
                <div className="dropdown-icon">
                  <img src={studentDropdownIcon} alt="dropdown" className="dropdown-icon-img" />
                </div>
              </div>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="item-details-main">
        <div className="item-details-breadcrumb">
          <button className="back-arrow-btn" onClick={goToBrowse}>
            ← Back to Browse Items
          </button>
        </div>

        {item && (
          <div className="item-details-card">
            <div className="item-details-card-header">
              <h1 className="item-details-title">{item.title}</h1>
              <span className="item-details-id">ID: #{item.id.slice(0, 8)}</span>
            </div>

            <div className="item-details-content">
              {item.photo_url && (
                <div className="item-details-image">
                  <img src={item.photo_url} alt={item.title} />
                </div>
              )}

              <div className="item-details-info">
                <div className="item-details-info-row">
                  <div className="item-details-info-box">
                    <label>CATEGORY</label>
                    <p>{item.category || "Uncategorized"}</p>
                  </div>
                  <div className="item-details-info-box">
                    <label>DATE REPORTED</label>
                    <p>{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <div className="item-details-info-row">
                  <div className="item-details-info-box">
                    <label>LOCATION</label>
                    <p>{item.location}</p>
                  </div>
                </div>
                <div className="item-details-info-box item-details-info-box-full">
                  <label>DESCRIPTION</label>
                  <p>{item.description || "No description provided"}</p>
                </div>
              </div>
            </div>

            {item.type === "found" && (
              <div className="item-details-claim-section">
                <div className="item-details-reported-by">
                  <span className="item-details-reported-label">REPORTED BY</span>
                  <p className="item-details-reported-name">Administrator</p>
                </div>
                <p className="item-details-claim-message">
                  Are you the owner of this item? Submit your proof to claim it back.
                </p>
                <button className="item-details-claim-btn" onClick={handleClaimClick}>
                  Claim This Item
                </button>
                <p className="item-details-posted-date">
                  Posted on {formatDateTime(item.created_at)}
                </p>
                <p className="item-details-security-notice">
                  Security Notice: All items are securely stored and inventoried. 
                  They are kept for strictly 30 days before being donated to local 
                  charities or disposed of according to SIIT policy.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showClaimForm && item && (
        <ClaimFormModal item={item} onClose={() => setShowClaimForm(false)} />
      )}
    </div>
  );
};

const ClaimFormModal = ({ item, onClose }) => {
  const [formData, setFormData] = useState({
    description: "",
    colorBrand: "",
    uniqueMarks: "",
    proofFile: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, proofFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log("User object:", user);
    console.log("Item ID:", item.id);
    
    if (!user.id) {
      alert("Please login first");
      setSubmitting(false);
      return;
    }
    
    const claimData = {
      report_id: item.id,
      student_id: user.id,
      proof_of_ownership: `${formData.description} | Color/Brand: ${formData.colorBrand} | Marks: ${formData.uniqueMarks}`,
      claim_date: new Date().toISOString(),
      status: 'pending'
    };
    
    console.log("Submitting claim:", claimData);
    
    try {
      const { data, error } = await supabase
        .from('claims')
        .insert([claimData])
        .select();
      
      console.log("Response:", { data, error });
      
      if (error) {
        alert("Error: " + error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error submitting claim: " + err.message);
    }
    
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="item-details-modal-overlay">
        <div className="item-details-modal-container">
          <h2>Claim Submitted!</h2>
          <p>Your claim has been submitted. Admin will review it shortly.</p>
          <button onClick={onClose} className="item-details-close-modal-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-details-modal-overlay">
      <div className="item-details-modal-container">
        <div className="item-details-modal-header">
          <h2>Submit Claim Request</h2>
          <button className="item-details-modal-close" onClick={onClose}>×</button>
        </div>
        <p className="item-details-modal-subtitle">
          To prevent fake claims, please provide accurate details that only the owner would know.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="item-details-form-group">
            <label>DETAILED DESCRIPTION</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe specific details of the item..."
              required
            />
          </div>
          
          <div className="item-details-form-group">
            <label>COLOR / BRAND</label>
            <input
              type="text"
              name="colorBrand"
              value={formData.colorBrand}
              onChange={handleChange}
              placeholder="e.g. Silver / Apple"
              required
            />
          </div>
          
          <div className="item-details-form-group">
            <label>UNIQUE MARKS / FEATURES</label>
            <input
              type="text"
              name="uniqueMarks"
              value={formData.uniqueMarks}
              onChange={handleChange}
              placeholder="Scratches, specific stickers, contents inside, etc."
              required
            />
          </div>
          
          <div className="item-details-form-group">
            <label>UPLOAD ID OR PROOF (OPTIONAL)</label>
            <div className="item-details-file-wrapper">
              <input type="file" onChange={handleFileChange} accept="image/*" id="proof-file" />
              <label htmlFor="proof-file" className="item-details-file-label">Choose File</label>
              <span className="item-details-file-name">{formData.proofFile ? formData.proofFile.name : "No file chosen"}</span>
            </div>
            <small className="item-details-form-small">Receipt, photo of you with the item, or Student ID.</small>
          </div>
          
          <button type="submit" disabled={submitting} className="item-details-submit-btn">
            {submitting ? "Submitting..." : "SUBMIT PROOF & CLAIM"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ItemDetails;