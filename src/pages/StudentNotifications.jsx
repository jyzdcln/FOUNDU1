import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "./StudentNotifications.css";
import founduLogo from "../assets/icons/foundulogo-icon.png";
import studentUserIcon from "../assets/icons/admin-user-icon.png";
import studentDropdownIcon from "../assets/icons/admin-dropdown-icon.png";

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    loadAllNotifications();
  }, []);

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

  const loadAllNotifications = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
      setLoading(false);
      return;
    }

    const { data: reports } = await supabase
      .from('reports')
      .select('id, title, status, created_at, admin_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: claims } = await supabase
      .from('claims')
      .select('id, status, claim_date, reports(title, id)')
      .eq('student_id', user.id)
      .order('claim_date', { ascending: false });

    const readNotifications = JSON.parse(localStorage.getItem('student_read_notifications') || '[]');
    const formattedNotifications = [];

    if (reports) {
      reports.forEach(report => {
        let message = "";
        let type = "";
        
        if (report.status === "returned") {
          message = `Your report "${report.title}" was returned. Please edit and resubmit.`;
          type = "returned";
        } else if (report.status === "verified") {
          message = `Your report "${report.title}" has been verified and is now visible.`;
          type = "verified";
        } else if (report.status === "rejected") {
          message = `Your report "${report.title}" was rejected. Reason: ${report.admin_notes || "Please contact admin"}`;
          type = "rejected";
        }

        if (message) {
          formattedNotifications.push({
            id: `report_${report.id}`,
            message,
            time: formatDateTime(report.created_at),
            date: report.created_at,
            read: readNotifications.includes(`report_${report.id}`),
            type,
            link: `/item-details/${report.id}`,
            itemTitle: report.title
          });
        }
      });
    }

    if (claims) {
      claims.forEach(claim => {
        let message = "";
        let type = "";
        
        if (claim.status === "approved") {
          message = `Your claim for "${claim.reports?.title}" has been approved! You can now pick up your item.`;
          type = "claim_approved";
        } else if (claim.status === "rejected") {
          message = `Your claim for "${claim.reports?.title}" was rejected. Please contact admin for more information.`;
          type = "claim_rejected";
        }

        if (message) {
          formattedNotifications.push({
            id: `claim_${claim.id}`,
            message,
            time: formatDateTime(claim.claim_date),
            date: claim.claim_date,
            read: readNotifications.includes(`claim_${claim.id}`),
            type,
            link: `/item-details/${claim.reports?.id}`,
            itemTitle: claim.reports?.title
          });
        }
      });
    }

    formattedNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    setNotifications(formattedNotifications);
    setLoading(false);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
           " at " + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  const markAsRead = (id) => {
    const readNotifications = JSON.parse(localStorage.getItem('student_read_notifications') || '[]');
    if (!readNotifications.includes(id)) {
      readNotifications.push(id);
      localStorage.setItem('student_read_notifications', JSON.stringify(readNotifications));
    }
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('student_read_notifications', JSON.stringify(allIds));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    const readNotifications = JSON.parse(localStorage.getItem('student_read_notifications') || '[]');
    const filtered = readNotifications.filter(n => n !== id);
    localStorage.setItem('student_read_notifications', JSON.stringify(filtered));
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="student-notifications-page">
        <header className="student-full-header">
          <div className="student-header-content">
            <div className="student-logo">
              <img src={founduLogo} alt="FoundU" className="student-logo-img" />
            </div>
            <div className="student-header-actions">
              <span className="student-lang" onClick={() => navigate("/student-dashboard")}>Dashboard</span>
              <div className="user-dropdown" ref={dropdownRef}>
                <div className="user-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <div className="user-icon">
                    <img src={studentUserIcon} alt="user" className="user-icon-img" />
                  </div>
                  <div className="dropdown-icon">
                    <img src={studentDropdownIcon} alt="dropdown" className="dropdown-icon-img" />
                  </div>
                </div>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="loading-container">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="student-notifications-page">
      <header className="student-full-header">
        <div className="student-header-content">
          <div className="student-logo">
            <img src={founduLogo} alt="FoundU" className="student-logo-img" />
          </div>
          <div className="student-header-actions">
            <span className="student-lang" onClick={() => navigate("/student-dashboard")}>Dashboard</span>
            <div className="user-dropdown" ref={dropdownRef}>
              <div className="user-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="user-icon">
                  <img src={studentUserIcon} alt="user" className="user-icon-img" />
                </div>
                <div className="dropdown-icon">
                  <img src={studentDropdownIcon} alt="dropdown" className="dropdown-icon-img" />
                </div>
              </div>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="student-notifications-container">
        <div className="student-notifications-header">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications yet</p>
            <p className="empty-subtext">When your reports are verified or claims are updated, you'll see them here</p>
          </div>
        ) : (
          <div className="student-notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`student-notification-card ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="student-notification-card-content">
                  <div className="student-notification-icon">
                    {notification.type === 'returned' && '📝'}
                    {notification.type === 'verified' && '✅'}
                    {notification.type === 'rejected' && '❌'}
                    {notification.type === 'claim_approved' && '🎉'}
                    {notification.type === 'claim_rejected' && '⚠️'}
                  </div>
                  <div className="student-notification-details">
                    <p className="student-notification-message">{notification.message}</p>
                    <div className="student-notification-meta">
                      <span className="student-notification-time">{formatTimeAgo(notification.date)}</span>
                      {!notification.read && <span className="unread-dot">●</span>}
                    </div>
                  </div>
                </div>
                <div className="student-notification-actions">
                  {!notification.read && (
                    <button className="mark-read-btn" onClick={() => markAsRead(notification.id)}>
                      Mark as read
                    </button>
                  )}
                  <button className="view-details-btn" onClick={() => navigate(notification.link)}>
                    View Details
                  </button>
                  <button className="delete-notif-btn" onClick={() => deleteNotification(notification.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;