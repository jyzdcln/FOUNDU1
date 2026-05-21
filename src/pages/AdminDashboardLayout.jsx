import React, { useState, useEffect } from "react";
import dashboardIcon from "../assets/icons/dashboard-icon.png";
import viewReportsIcon from "../assets/icons/view-icon.png";
import claimedIcon from "../assets/icons/claimed-icon.png";
import adminUnclaimedIcon from "../assets/icons/unclaimed-icon.png";
import adminLostIcon from "../assets/icons/admin-lost-icon.png";
import adminFoundIcon from "../assets/icons/admin-found-icon.png";
import adminUserIcon from "../assets/icons/admin-user-icon.png";
import adminDropdownIcon from "../assets/icons/admin-dropdown-icon.png";
import notificationIcon from "../assets/icons/notification-icon.png";
import verifyFoundIcon from "../assets/icons/verified-found-icon.png";
import { deleteReport } from "../services/reportService";

const AdminDashboardLayout = ({
  activeMenu,
  onMenuClick,
  unclaimedCount,
  onReportLost,
  onReportFound,
  getPageTitle,
  totalReportsCount,
  pendingCount,
  verifiedCount,
  claimedCount,
  totalRejectedCount,
  isNotificationOpen,
  toggleNotification,
  recentNotifications,
  handleMenuClick,
  isDropdownOpen,
  toggleDropdown,
  handleSettings,
  handleLogout,
  notificationRef,
  dropdownRef,
  showReportForm,
  handleStatCardClick,
  allReports,
  recentReports,
  getStatusBadgeClass,
  getStatusText,
  formatDate,
  getPageContent,
  isLoading,
  LoadingSpinner,
  selectedStatusFilter,
  onViewReportFromKebab,
}) => {
  const [openKebabId, setOpenKebabId] = useState(null);

  const toggleKebabMenu = (id) => {
    setOpenKebabId(openKebabId === id ? null : id);
  };

  const handleViewDetails = (report) => {
    setOpenKebabId(null);
    if (onViewReportFromKebab) {
      onViewReportFromKebab(report);
    } else {
      onMenuClick("overview");
    }
  };

  const handleDeleteReport = async (report) => {
    if (window.confirm(`Are you sure you want to delete "${report.title}"?`)) {
      const success = await deleteReport(report.id);
      if (success) {
        alert("Report deleted successfully!");
        window.location.reload();
      } else {
        alert("Error deleting report. Please try again.");
      }
      setOpenKebabId(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenKebabId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const sidebarContent = (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Admin</h2>
        <p>Welcome, Jayz Daclan</p>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">MAIN</div>
          <button
            className={`nav-item ${activeMenu === "dashboard" ? "active" : ""}`}
            onClick={() => onMenuClick("dashboard")}
          >
            <img src={dashboardIcon} alt="dashboard" className="nav-icon-img" />
            Dashboard
          </button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">REPORTS MANAGEMENT</div>
          <button
            className={`nav-item ${activeMenu === "overview" ? "active" : ""}`}
            onClick={() => onMenuClick("overview")}
          >
            <img
              src={viewReportsIcon}
              alt="overview"
              className="nav-icon-img"
            />
            Overview
          </button>
          <button
            className={`nav-item ${activeMenu === "founditems" ? "active" : ""}`}
            onClick={() => onMenuClick("founditems")}
          >
            <img
              src={verifyFoundIcon}
              alt="found items"
              className="nav-icon-img"
            />
            Found Items
          </button>
          <button
            className={`nav-item ${activeMenu === "unclaimed" ? "active" : ""}`}
            onClick={() => onMenuClick("unclaimed")}
          >
            <img
              src={adminUnclaimedIcon}
              alt="unclaimed"
              className="nav-icon-img"
            />
            Unclaimed
            {unclaimedCount > 0 && (
              <span className="nav-badge">{unclaimedCount}</span>
            )}
          </button>
          <button
            className={`nav-item ${activeMenu === "resolved" ? "active" : ""}`}
            onClick={() => onMenuClick("resolved")}
          >
            <img src={claimedIcon} alt="resolved" className="nav-icon-img" />
            Claimed Items
          </button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">ACTIONS</div>
          <button
            className={`nav-item ${activeMenu === "lost" ? "active" : ""}`}
            onClick={onReportLost}
          >
            <img
              src={adminLostIcon}
              alt="report lost"
              className="nav-icon-img"
            />
            Report Lost
          </button>
          <button
            className={`nav-item ${activeMenu === "found" ? "active" : ""}`}
            onClick={onReportFound}
          >
            <img
              src={adminFoundIcon}
              alt="report found"
              className="nav-icon-img"
            />
            Report Found
          </button>
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="footer-text"></div>
      </div>
    </div>
  );

  const topBarContent = (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1>{getPageTitle()}</h1>
      </div>
      <div className="top-bar-right">
        <div className="notification-bell" ref={notificationRef}>
          <div className="notification-icon" onClick={toggleNotification}>
            <img
              src={notificationIcon}
              alt="notifications"
              className="notification-icon-img"
            />
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
                      <p className="notification-message">
                        No new notifications
                      </p>
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
                <button
                  className="view-all-btn"
                  onClick={() => handleMenuClick("notifications")}
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="admin-info" ref={dropdownRef}>
          <div className="avatar" onClick={toggleDropdown}>
            <img src={adminUserIcon} alt="user" className="avatar-user-icon" />
            <img
              src={adminDropdownIcon}
              alt="dropdown"
              className="avatar-dropdown-icon"
            />
          </div>
          {isDropdownOpen && (
            <div className="avatar-dropdown-menu">
              <button className="avatar-dropdown-item" onClick={handleSettings}>
                Settings
              </button>
              <button
                className="avatar-dropdown-item logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const statsAndLogContent = (
    <>
      <div className="stats-container">
        <div
          className="stat-card"
          onClick={() => handleStatCardClick("all")}
          style={{ cursor: "pointer" }}
        >
          <h3>Total Reports</h3>
          <p className="stat-number">{totalReportsCount}</p>
        </div>
        <div
          className="stat-card"
          onClick={() => handleStatCardClick("pending")}
          style={{ cursor: "pointer" }}
        >
          <h3>Pending</h3>
          <p className="stat-number">{pendingCount}</p>
        </div>
        <div
          className="stat-card"
          onClick={() => handleStatCardClick("verified")}
          style={{ cursor: "pointer" }}
        >
          <h3>Verified</h3>
          <p className="stat-number">{verifiedCount}</p>
        </div>
        <div
          className="stat-card"
          onClick={() => handleStatCardClick("claimed")}
          style={{ cursor: "pointer" }}
        >
          <h3>Claimed</h3>
          <p className="stat-number">{claimedCount}</p>
        </div>
        <div
          className="stat-card"
          onClick={() => handleStatCardClick("rejected")}
          style={{ cursor: "pointer" }}
        >
          <h3>Rejected</h3>
          <p className="stat-number">{totalRejectedCount}</p>
        </div>
      </div>

      <div className="system-log-section">
        <div className="system-log-header">
          <h2>System Log & Recent Reports</h2>
        </div>
        <div className="system-log-table-container">
          <table className="system-log-table">
            <thead>
              <tr>
                <th>ITEM DETAILS</th>
                <th>REPORTER</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.length === 0 ? (
                <tr>
                  <td colSpan="4" className="log-empty-state">
                    No reports found
                  </td>
                </tr>
              ) : (
                recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="log-item-details">
                      <div className="log-item-title">{report.title}</div>
                      <div className="log-item-category no-bg">
                        {report.category || "Uncategorized"}
                      </div>
                    </td>
                    <td className="log-reporter">
                      <div className="log-reporter-name">
                        {report.users?.name || report.users?.email || "Unknown"}
                      </div>
                      <div className="log-item-date">
                        {formatDate(report.created_at)}
                      </div>
                    </td>
                    <td className="log-status">
                      <span
                        className={`log-status-badge ${getStatusBadgeClass(report.status)}`}
                      >
                        {getStatusText(report.status)}
                      </span>
                    </td>
                    <td className="log-action">
                      <div
                        className="kebab-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="kebab-btn"
                          onClick={() => toggleKebabMenu(report.id)}
                        >
                          ⋮
                        </button>
                        {openKebabId === report.id && (
                          <div className="kebab-dropdown">
                            <button
                              className="kebab-item"
                              onClick={() => handleViewDetails(report)}
                            >
                              View Details
                            </button>
                            <button
                              className="kebab-item delete"
                              onClick={() => handleDeleteReport(report)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        {sidebarContent}
        <div className="main-content">
          {topBarContent}
          <div className="content-area">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {sidebarContent}
      <div className="main-content">
        {topBarContent}
        {!showReportForm && activeMenu === "dashboard" && statsAndLogContent}
        <div className="content-area">{getPageContent()}</div>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
