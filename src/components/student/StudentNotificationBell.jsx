import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";
import "./StudentNotificationBell.css";
import notificationIcon from "../../assets/icons/notification-icon.png";

const StudentNotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    const { data: reports } = await supabase
      .from('reports')
      .select('id, title, status, created_at, admin_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: claims } = await supabase
      .from('claims')
      .select('id, status, claim_date, reports(title)')
      .eq('student_id', user.id)
      .order('claim_date', { ascending: false })
      .limit(10);

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
            time: formatTimeAgo(report.created_at),
            read: readNotifications.includes(`report_${report.id}`),
            type,
            link: `/item-details/${report.id}`
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
            time: formatTimeAgo(claim.claim_date),
            read: readNotifications.includes(`claim_${claim.id}`),
            type,
            link: `/item-details/${claim.report_id}`
          });
        }
      });
    }

    formattedNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    setNotifications(formattedNotifications.slice(0, 10));
    setUnreadCount(formattedNotifications.filter(n => !n.read).length);
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
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('student_read_notifications', JSON.stringify(allIds));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/student-notifications");
  };

  return (
    <div className="student-notification-bell" ref={dropdownRef}>
      <div className="student-notification-icon" onClick={() => setIsOpen(!isOpen)}>
        <img src={notificationIcon} alt="notifications" className="student-notification-icon-img" />
        {unreadCount > 0 && <span className="student-notification-badge">{unreadCount}</span>}
      </div>
      
      {isOpen && (
        <div className="student-notification-dropdown">
          <div className="student-notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="student-mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="student-notification-list">
            {notifications.length === 0 ? (
              <div className="student-notification-empty">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`student-notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="student-notification-content">
                    <p className="student-notification-message">{notification.message}</p>
                    <span className="student-notification-time">{notification.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="student-notification-footer">
            <button className="student-view-all-btn" onClick={handleViewAll}>
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotificationBell;