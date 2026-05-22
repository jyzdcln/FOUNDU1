import React from "react";
import "./StudentDashboard.css";
import MyClaims from "./MyClaims";
import ReportLostItemModal from "../components/student/ReportLostItemModal";
import ReportFoundItemModal from "../components/student/ReportFoundItemModal";
import StudentEditReportModal from "../components/student/StudentEditReportModal";
import locationIcon from "../assets/icons/location-icons.png";
import tagIcon from "../assets/icons/tag-icons.png";
import searchIcon from "../assets/icons/Viewreport-icons.png";
import downArrowIcon from "../assets/icons/down-arrow-icon.png";
import studentUserIcon from "../assets/icons/admin-user-icon.png";
import studentDropdownIcon from "../assets/icons/admin-dropdown-icon.png";
import notificationIcon from "../assets/icons/notification-icon.png";
import founduLogo from "../assets/icons/foundulogo-icon.png";

const StudentDashboardLayout = ({
  showMyClaims,
  showBrowse,
  handleBrowse,
  handleMyClaims,
  handleDashboard,
  userReports,
  formatDate,
  reportsNeedingAttention,
  handleEditReport,
  showEditModal,
  selectedReportForEdit,
  setShowEditModal,
  setSelectedReportForEdit,
  loadReports,
  loadUserReports,
  loadNotifications,
  showReportLostModal,
  setShowReportLostModal,
  showReportFoundModal,
  setShowReportFoundModal,
  isReportDropdownOpen,
  setIsReportDropdownOpen,
  handleReportLost,
  handleReportFound,
  filters,
  handleFilterChange,
  resetFilters,
  applyFilters,
  uniqueCategories,
  filteredReports,
  handleViewDetails,
  reports,
  isNotificationOpen,
  toggleNotification,
  notifications,
  markNotificationAsRead,
  markAllAsRead,
  unreadCount,
  isUserDropdownOpen,
  setIsUserDropdownOpen,
  handleLogout,
  notificationRef,
  userDropdownRef,
  reportDropdownRef,
  isContentLoading,
}) => {
  return (
    <div className="student-dashboard-container">
      <header className="student-full-header">
        <div className="student-header-content">
          <div className="student-logo">
            <img src={founduLogo} alt="FoundU" className="student-logo-img" />
          </div>
          <div className="student-header-actions">
            <span className="student-lang" onClick={handleBrowse}>
              Browse
            </span>
            <span className="student-lang" onClick={handleMyClaims}>
              My Claims
            </span>
            <span className="student-lang" onClick={handleDashboard}>
              Dashboard
            </span>

            <div className="notification-bell" ref={notificationRef}>
              <div className="notification-icon" onClick={toggleNotification}>
                <img
                  src={notificationIcon}
                  alt="notifications"
                  className="notification-icon-img"
                />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>
              {isNotificationOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button className="mark-all-read" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">
                            No notifications
                          </p>
                          <span className="notification-time">---</span>
                        </div>
                      </div>
                    ) : (
                      notifications.map((notif, index) => (
                        <div
                          key={index}
                          className={`notification-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => markNotificationAsRead(notif.id)}
                        >
                          <div className="notification-content">
                            <p className="notification-message">
                              {notif.message}
                            </p>
                            <span className="notification-time">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-dropdown" ref={userDropdownRef}>
              <div
                className="user-dropdown-trigger"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                <div className="user-icon">
                  <img
                    src={studentUserIcon}
                    alt="user"
                    className="user-icon-img"
                  />
                </div>
                <div className="dropdown-icon">
                  <img
                    src={studentDropdownIcon}
                    alt="dropdown"
                    className="dropdown-icon-img"
                  />
                </div>
              </div>
              {isUserDropdownOpen && (
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

      <div className="student-main-content">
        {isContentLoading ? (
          <div className="content-loading-container">
            <div className="content-loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : showMyClaims ? (
          <MyClaims />
        ) : !showBrowse ? (
          <>
            <div className="dashboard-header-wrapper">
              <div className="dashboard-title-section">
                <div className="my-dashboard-title">
                  <h2>My Dashboard</h2>
                  <p className="dashboard-subtitle">
                    Track your lost and found activity
                  </p>
                </div>
                <div className="report-dropdown" ref={reportDropdownRef}>
                  <button
                    className="report-dropdown-btn"
                    onClick={() =>
                      setIsReportDropdownOpen(!isReportDropdownOpen)
                    }
                  >
                    Report New Item
                    <img
                      src={studentDropdownIcon}
                      alt="dropdown"
                      className="report-dropdown-arrow"
                    />
                  </button>
                  {isReportDropdownOpen && (
                    <div className="report-dropdown-menu">
                      <button
                        className="report-dropdown-item"
                        onClick={handleReportLost}
                      >
                        Report Lost Item
                      </button>
                      <button
                        className="report-dropdown-item"
                        onClick={handleReportFound}
                      >
                        Report Found Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="student-stats-cards">
              <div className="student-stat-card">
                <div className="student-stat-value">
                  {userReports.filter((r) => r.type === "lost").length}
                </div>
                <div className="student-stat-label">ITEM YOU LOST</div>
              </div>
              <div className="student-stat-card">
                <div className="student-stat-value">
                  {userReports.filter((r) => r.type === "found").length}
                </div>
                <div className="student-stat-label">ITEM YOU FOUND</div>
              </div>
              <div className="student-stat-card">
                <div className="student-stat-value">{userReports.length}</div>
                <div className="student-stat-label">TOTAL REPORTS</div>
              </div>
            </div>

            <div className="my-reports-section">
              <h3>My Reports Needing Attention</h3>
              {reportsNeedingAttention.length === 0 ? (
                <div className="my-reports-empty">
                  <p>No reports needing attention.</p>
                  <p className="my-reports-empty-sub">
                    All your reports are in good standing!
                  </p>
                </div>
              ) : (
                <div className="my-reports-list">
                  {reportsNeedingAttention.map((report) => (
                    <div key={report.id} className="my-report-card">
                      <div className="my-report-info">
                        <h4>{report.title}</h4>
                        <p className="my-report-reported">
                          Reported: {formatDate(report.created_at)}
                        </p>
                        <div className="my-report-meta">
                          <span className="my-report-category">
                            {report.category || "Uncategorized"}
                          </span>
                          <span className={`my-report-status ${report.status}`}>
                            {report.status === "returned"
                              ? "RETURNED"
                              : "PENDING"}
                          </span>
                        </div>
                      </div>
                      <div className="my-report-action">
                        {report.status === "returned" && (
                          <button
                            className="edit-report-btn"
                            onClick={() => handleEditReport(report)}
                          >
                            Edit & Resubmit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="browse-layout">
            <div className="browse-sidebar">
              <div className="browse-sidebar-section">
                <h3>Search Item</h3>
              </div>

              <div className="browse-sidebar-section">
                <h3>KEYWORDS</h3>
                <div className="browse-keyword-wrapper">
                  <input
                    type="text"
                    className="browse-keyword-input"
                    placeholder="Search..."
                    value={filters.keyword}
                    onChange={(e) =>
                      handleFilterChange("keyword", e.target.value)
                    }
                  />
                  <img
                    src={searchIcon}
                    alt="search"
                    className="browse-search-icon"
                  />
                </div>
              </div>

              <div className="browse-sidebar-section">
                <h3>CATEGORY</h3>
                <div className="browse-category-wrapper">
                  <select
                    className="browse-category-select"
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <img
                    src={downArrowIcon}
                    alt="dropdown"
                    className="browse-category-icon"
                  />
                </div>
              </div>

              <div className="browse-sidebar-section">
                <h3>TYPE</h3>
                <div className="browse-type-options">
                  <label className="browse-type-option">
                    <input
                      type="radio"
                      name="type"
                      value="All"
                      checked={filters.type === "All"}
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
                    />
                    All
                  </label>
                  <label className="browse-type-option">
                    <input
                      type="radio"
                      name="type"
                      value="lost"
                      checked={filters.type === "lost"}
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
                    />
                    Lost
                  </label>
                  <label className="browse-type-option">
                    <input
                      type="radio"
                      name="type"
                      value="found"
                      checked={filters.type === "found"}
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
                    />
                    Found
                  </label>
                </div>
              </div>

              <div className="browse-sidebar-section">
                <button
                  className="browse-apply-filters-btn"
                  onClick={applyFilters}
                >
                  APPLY FILTERS
                </button>
                <button className="browse-reset-btn" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>

            <div className="browse-content-area">
              <div className="browse-results-header">
                <div className="browse-breadcrumb">
                  <span className="browse-home-link" onClick={handleDashboard}>
                    Home
                  </span>{" "}
                  / Browse Items
                </div>
                <div className="browse-results-count">
                  <strong>{filteredReports.length}</strong> items found
                </div>
              </div>

              <div className="browse-items-grid">
                {filteredReports.length === 0 ? (
                  <div className="empty-state">
                    <p>No reports found</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="browse-item-card">
                      <div className="browse-item-card-image">
                        {report.photo_url ? (
                          <img src={report.photo_url} alt={report.title} />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>
                      <div className="browse-item-card-content">
                        <div className="browse-item-card-header">
                          <div className="browse-item-type-wrapper">
                            <div
                              className={`browse-item-type-badge ${report.type}`}
                            >
                              {report.type === "lost" ? "LOST" : "FOUND"}
                            </div>
                            <div className={`status-badge ${report.status}`}>
                              {report.status === "verified"
                                ? "Verified"
                                : "Pending"}
                            </div>
                          </div>
                          <div className="browse-item-date">
                            {formatDate(report.created_at)}
                          </div>
                        </div>
                        <div className="browse-item-category">
                          <img
                            src={tagIcon}
                            alt="category"
                            className="browse-category-icon-img"
                          />
                          {report.category || "Item"}
                        </div>
                        <div className="browse-item-title">{report.title}</div>
                        <div className="browse-item-location">
                          <img
                            src={locationIcon}
                            alt="location"
                            className="browse-location-icon-img"
                          />
                          {report.location}
                        </div>
                      </div>
                      <button
                        className="browse-view-details-btn"
                        onClick={() => handleViewDetails(report.id)}
                      >
                        VIEW DETAILS
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showReportLostModal && (
        <ReportLostItemModal
          onClose={() => setShowReportLostModal(false)}
          onSuccess={() => {
            loadReports();
            loadUserReports();
            loadNotifications();
          }}
        />
      )}
      {showReportFoundModal && (
        <ReportFoundItemModal
          onClose={() => setShowReportFoundModal(false)}
          onSuccess={() => {
            loadReports();
            loadUserReports();
            loadNotifications();
          }}
        />
      )}
      {showEditModal && selectedReportForEdit && (
        <StudentEditReportModal
          report={selectedReportForEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReportForEdit(null);
          }}
          onSuccess={() => {
            loadReports();
            loadUserReports();
            loadNotifications();
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboardLayout;
