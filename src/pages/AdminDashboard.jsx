import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

import ReportLostItem from "../components/admin/ReportLostItem";
import ReportFoundItem from "../components/admin/ReportFoundItem";
import ViewReports from "./ViewReports";
import ClaimedItems from "./ClaimedItems"; 
import UnclaimedItems from "./UnclaimedItems";
import Notifications from "./Notifications";
import { getReports, subscribeToNewReports, subscribeToStatusChanges } from "../services/reportService";
import { supabase } from "../services/supabase";

import dashboardIcon from "../assets/icons/dashboard-icon.png";
import viewReportsIcon from "../assets/icons/view-icon.png";
import claimedIcon from "../assets/icons/claimed-icon.png";
import adminUnclaimedIcon from "../assets/icons/unclaimed-icon.png";  // ADD THIS BACK
import adminLostIcon from "../assets/icons/admin-lost-icon.png";
import adminFoundIcon from "../assets/icons/admin-found-icon.png";
import adminUserIcon from "../assets/icons/admin-user-icon.png";
import adminDropdownIcon from "../assets/icons/admin-dropdown-icon.png";
import notificationIcon from "../assets/icons/notification-icon.png";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [allReports, setAllReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("rememberedUsername");
    localStorage.removeItem("user");
    alert("Logged out successfully");
    navigate("/");
  };

  const handleSettings = () => {
    alert("Settings - Coming soon");
    setIsDropdownOpen(false);
  };

  const handleMenuClick = (menu) => {
    setShowReportForm(false);
    setActiveMenu(menu);
    setIsNotificationOpen(false);
  };

  const handleReportLost = () => {
    setReportType("lost");
    setShowReportForm(true);
    setActiveMenu("lost");
    setIsNotificationOpen(false);
  };

  const handleReportFound = () => {
    setReportType("found");
    setShowReportForm(true);
    setActiveMenu("found");
    setIsNotificationOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
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

  const loadRecentNotifications = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('id, type, title, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error("Error loading notifications:", error);
    } else if (data) {
      const formatted = data.map(report => {
        let message = "";
        if (report.type === "lost") {
          message = `Student reported a lost item: ${report.title}`;
        } else if (report.type === "found") {
          message = `Student reported a found item: ${report.title}`;
        }
        
        return {
          id: report.id,
          message: message,
          time: formatTimeAgo(report.created_at),
          read: false
        };
      });
      setRecentNotifications(formatted);
    }
  };

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

  useEffect(() => {
    loadAllReports();
    loadRecentNotifications();
    
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const newReportSubscription = subscribeToNewReports(async (newReport) => {
      console.log("New report detected in real-time!", newReport);
      
      await loadAllReports();
      await loadRecentNotifications();
      
      if (Notification.permission === "granted") {
        new Notification(`New ${newReport.type} report: ${newReport.title}`);
      }
    });
    
    const statusSubscription = subscribeToStatusChanges(async (updatedReport) => {
      console.log("Report status changed in real-time!", updatedReport);
      await loadAllReports();
      await loadRecentNotifications();
    });
    
    return () => {
      newReportSubscription.unsubscribe();
      statusSubscription.unsubscribe();
    };
  }, []);

  const loadAllReports = async () => {
    const reports = await getReports();
    setAllReports(reports);
  };

  const refreshReports = async () => {
    const reports = await getReports();
    setAllReports(reports);
    await loadRecentNotifications();
    return reports;
  };

  const getPageTitle = () => {
    if (showReportForm) {
      return reportType === "lost" ? "Report Lost Item" : "Report Found Item";
    }
    switch(activeMenu) {
      case "dashboard": return "Dashboard";
      case "viewreports": return "View Reports";
      case "unclaimed": return "Unclaimed Items";  // ADD THIS BACK
      case "claimed": return "Claimed Items";
      case "notifications": return "Notifications";
      default: return "Dashboard";
    }
  };

  const getPageContent = () => {
    if (showReportForm) {
      if (reportType === "lost") {
        return <ReportLostItem />;
      } else {
        return <ReportFoundItem />;
      }
    }
    
    switch(activeMenu) {
      case "dashboard":
        return <div className="content-box"></div>;
      case "viewreports":
        return <ViewReports onRefresh={refreshReports} />;
      case "unclaimed":  // ADD THIS BACK
        return <UnclaimedItems />;
      case "claimed":
        return <ClaimedItems />;
      case "notifications":
        return <Notifications />;
      default:
        return <p>Welcome to Dashboard</p>;
    }
  };

  const pendingCount = allReports.filter(r => r.status === "pending").length;
  const verifiedCount = allReports.filter(r => r.status === "verified").length;
  const claimedCount = allReports.filter(r => r.status === "claimed").length;
  const rejectedCount = allReports.filter(r => r.status === "rejected").length;
  const unclaimedCount = allReports.filter(r => r.status === "verified").length;  // ADD THIS BACK

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <p>Welcome, Jayz Daclan</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">MAIN</div>
            <button className={`nav-item ${activeMenu === "dashboard" ? "active" : ""}`} onClick={() => handleMenuClick("dashboard")}>
              <img src={dashboardIcon} alt="dashboard" className="nav-icon-img" />
              Dashboard
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">REPORTS MANAGEMENT</div>
            <button className={`nav-item ${activeMenu === "viewreports" ? "active" : ""}`} onClick={() => handleMenuClick("viewreports")}>
              <img src={viewReportsIcon} alt="view reports" className="nav-icon-img" />
              View Reports
            </button>
            <button className={`nav-item ${activeMenu === "unclaimed" ? "active" : ""}`} onClick={() => handleMenuClick("unclaimed")}>  {/* ADD THIS BACK */}
              <img src={adminUnclaimedIcon} alt="unclaimed" className="nav-icon-img" />
              Unclaimed Items
              {unclaimedCount > 0 && <span className="nav-badge">{unclaimedCount}</span>}
            </button>
            <button className={`nav-item ${activeMenu === "claimed" ? "active" : ""}`} onClick={() => handleMenuClick("claimed")}>
              <img src={claimedIcon} alt="claimed" className="nav-icon-img" />
              Claimed Items
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">ACTIONS</div>
            <button className={`nav-item ${activeMenu === "lost" ? "active" : ""}`} onClick={handleReportLost}>
              <img src={adminLostIcon} alt="report lost" className="nav-icon-img" />
              Report Lost Item
            </button>
            <button className={`nav-item ${activeMenu === "found" ? "active" : ""}`} onClick={handleReportFound}>
              <img src={adminFoundIcon} alt="report found" className="nav-icon-img" />
              Report Found Item
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-text"></div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="top-bar-right">
            <div className="notification-bell" ref={notificationRef}>
              <div className="notification-icon" onClick={toggleNotification}>
                <img src={notificationIcon} alt="notifications" className="notification-icon-img" />
                <span className="notification-badge">{pendingCount}</span>
              </div>
              {isNotificationOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button className="mark-all-read">Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    {recentNotifications.length === 0 ? (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">No new notifications</p>
                          <span className="notification-time">---</span>
                        </div>
                      </div>
                    ) : (
                      recentNotifications.map((notif, index) => (
                        <div key={index} className="notification-item unread">
                          <div className="notification-content">
                            <p className="notification-message">{notif.message}</p>
                            <span className="notification-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="notification-footer">
                    <button className="view-all-btn" onClick={() => handleMenuClick("notifications")}>
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-info" ref={dropdownRef}>
              <div className="avatar" onClick={toggleDropdown}>
                <img src={adminUserIcon} alt="user" className="avatar-user-icon" />
                <img src={adminDropdownIcon} alt="dropdown" className="avatar-dropdown-icon" />
              </div>
              {isDropdownOpen && (
                <div className="avatar-dropdown-menu">
                  <button className="avatar-dropdown-item" onClick={handleSettings}>
                    Settings
                  </button>
                  <button className="avatar-dropdown-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!showReportForm && activeMenu === "dashboard" && (
          <div className="stats-container">
            <div className="stat-card">
              <h3>Total Reports</h3>
              <p className="stat-number">{allReports.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p className="stat-number">{pendingCount}</p>
            </div> 
            <div className="stat-card">
              <h3>Verified</h3>
              <p className="stat-number">{verifiedCount}</p>
            </div>
            <div className="stat-card">
              <h3>Claimed</h3>
              <p className="stat-number">{claimedCount}</p>
            </div>
            <div className="stat-card">
              <h3>Rejected</h3>
              <p className="stat-number">{rejectedCount}</p>
            </div>
          </div>
        )}

        <div className="content-area">
          {getPageContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;