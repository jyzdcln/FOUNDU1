import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./ItemDetails.css";
import "./StudentDashboard.css";
import founduLogo from "../assets/icons/foundulogo-icon.png";

const PublicItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItemDetails();
  }, [id]);

  const loadItemDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error("Error loading item:", error);
      setItem(null);
    }
    setLoading(false);
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

  const handleLoginClick = () => {
    window.scrollTo(0, 0);
    navigate("/", { state: { openLogin: true } });
  };

  if (loading) {
    return (
      <div className="item-details-container">
        <header className="student-full-header">
          <div className="student-header-content">
            <div className="student-logo">
              <img src={founduLogo} alt="FoundU" className="student-logo-img" />
            </div>
            <div className="student-header-actions">
              <span className="student-lang" onClick={() => navigate("/")}>Home</span>
              <span className="student-lang" onClick={() => navigate("/browse")}>Browse</span>
            </div>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading item details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-details-container">
        <header className="student-full-header">
          <div className="student-header-content">
            <div className="student-logo">
              <img src={founduLogo} alt="FoundU" className="student-logo-img" />
            </div>
            <div className="student-header-actions">
              <span className="student-lang" onClick={() => navigate("/")}>Home</span>
              <span className="student-lang" onClick={() => navigate("/browse")}>Browse</span>
            </div>
          </div>
        </header>
        <div className="item-details-main">
          <div className="empty-state">Item not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="item-details-container">
      <header className="student-full-header">
        <div className="student-header-content">
          <div className="student-logo">
            <img src={founduLogo} alt="FoundU" className="student-logo-img" />
          </div>
          <div className="student-header-actions">
            <span className="student-lang" onClick={() => navigate("/")}>Home</span>
            <span className="student-lang" onClick={() => navigate("/browse")}>Browse</span>
          </div>
        </div>
      </header>

      <div className="item-details-main">
        <div className="item-details-breadcrumb">
          <button className="back-arrow-btn" onClick={() => navigate("/browse")}>
            ← Back to Browse Items
          </button>
        </div>

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

          <div className="item-details-claim-section">
            <div className="item-details-reported-by">
              <span className="item-details-reported-label">REPORTED BY</span>
              <p className="item-details-reported-name">Administrator</p>
            </div>
            <p className="item-details-claim-message">
              Are you the owner of this item?
            </p>
            <button className="item-details-login-to-claim-btn" onClick={handleLoginClick}>
              Login to Claim This Item
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
        </div>
      </div>
    </div>
  );
};

export default PublicItemDetails;