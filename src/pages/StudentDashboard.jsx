import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./StudentDashboard.css";
import "./StudentDashboardBrowse.css";
import founduLogo from "../assets/icons/foundulogo-icon.png";
import studentUserIcon from "../assets/icons/admin-user-icon.png";
import studentDropdownIcon from "../assets/icons/admin-dropdown-icon.png";
import StudentDashboardLayout from "./StudentDashboardLayout";

import {
  getReports,
  getReportsByUser,
  getStudentNotifications,
  subscribeToStatusChanges,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/reportService";
import { supabase } from "../services/supabase";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showBrowse, setShowBrowse] = useState(true);
  const [showMyClaims, setShowMyClaims] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showReportLostModal, setShowReportLostModal] = useState(false);
  const [showReportFoundModal, setShowReportFoundModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReportForEdit, setSelectedReportForEdit] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const userDropdownRef = useRef(null);
  const reportDropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const [filters, setFilters] = useState({
    keyword: "",
    category: "All Categories",
    type: "All",
  });

  useEffect(() => {
    loadReports();
    loadUserReports();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (location.state?.showBrowse !== undefined) {
      setShowBrowse(location.state.showBrowse);
      setShowMyClaims(false);
      setIsContentLoading(false);
    } else if (location.state?.showMyClaims !== undefined) {
      setShowMyClaims(location.state.showMyClaims);
      setShowBrowse(false);
      setIsContentLoading(false);
    } else if (!location.state) {
      setShowBrowse(true);
      setShowMyClaims(false);
    }
  }, [location]);

  useEffect(() => {
    if (reports.length > 0) {
      applyFilters();
    }
  }, [filters, reports]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
      if (
        reportDropdownRef.current &&
        !reportDropdownRef.current.contains(event.target)
      ) {
        setIsReportDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    const subscription = supabase
      .channel("student-reports-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reports",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("Your report status changed!", payload);

          await loadReports();
          await loadUserReports();
          await loadNotifications();

          const newStatus = payload.new.status;
          const reportTitle = payload.new.title;

          if (newStatus === "verified") {
            alert(`Good news! Your report "${reportTitle}" has been verified!`);
          } else if (newStatus === "returned") {
            alert(
              `Your report "${reportTitle}" needs attention. Please edit and resubmit.`,
            );
          } else if (newStatus === "rejected") {
            alert(
              `Your report "${reportTitle}" was rejected. Please contact admin.`,
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadReports = async () => {
    setInitialLoading(true);
    const allReports = await getReports();
    setReports(allReports);

    setTimeout(() => {
      setInitialLoading(false);
    }, 500);
  };

  const loadUserReports = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      const reports = await getReportsByUser(user.id);
      setUserReports(reports);
    }
  };

  const loadNotifications = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      const notifs = await getStudentNotifications(user.id);
      setNotifications(notifs);
    }
  };

  const applyFilters = () => {
    let filtered = reports.filter((report) => report.status === "verified");

    if (filters.keyword) {
      filtered = filtered.filter(
        (report) =>
          report.title?.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          report.description
            ?.toLowerCase()
            .includes(filters.keyword.toLowerCase()),
      );
    }

    if (filters.category !== "All Categories") {
      filtered = filtered.filter(
        (report) => report.category === filters.category,
      );
    }

    if (filters.type !== "All") {
      filtered = filtered.filter((report) => report.type === filters.type);
    }

    setFilteredReports(filtered);
  };

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/");
  };

  const handleBrowse = () => {
    setIsContentLoading(true);
    setShowBrowse(true);
    setShowMyClaims(false);
    setIsNotificationOpen(false);
    setTimeout(() => {
      setIsContentLoading(false);
    }, 300);
  };

  const handleDashboard = () => {
    setIsContentLoading(true);
    setShowBrowse(false);
    setShowMyClaims(false);
    setIsNotificationOpen(false);
    setTimeout(() => {
      setIsContentLoading(false);
    }, 300);
  };

  const handleMyClaims = () => {
    setIsContentLoading(true);
    setShowBrowse(false);
    setShowMyClaims(true);
    setIsNotificationOpen(false);
    setTimeout(() => {
      setIsContentLoading(false);
    }, 300);
  };

  const handleViewDetails = (reportId) => {
    navigate(`/item-details/${reportId}`);
  };

  const handleReportLost = () => {
    setShowReportLostModal(true);
    setIsReportDropdownOpen(false);
  };

  const handleReportFound = () => {
    setShowReportFoundModal(true);
    setIsReportDropdownOpen(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleMarkNotificationAsRead = async (id) => {
    await markNotificationAsRead(id);
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif,
      ),
    );
  };

  const handleMarkAllAsRead = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      await markAllNotificationsAsRead(user.id);
      setNotifications(
        notifications.map((notif) => ({ ...notif, read: true })),
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      keyword: "",
      category: "All Categories",
      type: "All",
    });
  };

  const uniqueCategories = [
    "All Categories",
    ...new Set(reports.map((r) => r.category).filter(Boolean)),
  ];

  const reportsNeedingAttention = userReports.filter(
    (r) => r.status === "returned" || r.status === "pending",
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleEditReport = (report) => {
    setSelectedReportForEdit(report);
    setShowEditModal(true);
  };

  if (initialLoading && reports.length === 0) {
    return (
      <div className="student-dashboard-container">
        <header className="student-full-header">
          <div className="student-header-content">
            <div className="student-logo">
              <img src={founduLogo} alt="FoundU" className="student-logo-img" />
            </div>
            <div className="student-header-actions">
              <span className="student-lang">Browse</span>
              <span className="student-lang">My Claims</span>
              <span className="student-lang">Dashboard</span>
              <div className="user-dropdown">
                <div className="user-dropdown-trigger">
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
              </div>
            </div>
          </div>
        </header>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <StudentDashboardLayout
      showMyClaims={showMyClaims}
      showBrowse={showBrowse}
      handleBrowse={handleBrowse}
      handleMyClaims={handleMyClaims}
      handleDashboard={handleDashboard}
      userReports={userReports}
      formatDate={formatDate}
      reportsNeedingAttention={reportsNeedingAttention}
      handleEditReport={handleEditReport}
      showEditModal={showEditModal}
      selectedReportForEdit={selectedReportForEdit}
      setShowEditModal={setShowEditModal}
      setSelectedReportForEdit={setSelectedReportForEdit}
      loadReports={loadReports}
      loadUserReports={loadUserReports}
      loadNotifications={loadNotifications}
      showReportLostModal={showReportLostModal}
      setShowReportLostModal={setShowReportLostModal}
      showReportFoundModal={showReportFoundModal}
      setShowReportFoundModal={setShowReportFoundModal}
      isReportDropdownOpen={isReportDropdownOpen}
      setIsReportDropdownOpen={setIsReportDropdownOpen}
      handleReportLost={handleReportLost}
      handleReportFound={handleReportFound}
      filters={filters}
      handleFilterChange={handleFilterChange}
      resetFilters={resetFilters}
      applyFilters={applyFilters}
      uniqueCategories={uniqueCategories}
      filteredReports={filteredReports}
      handleViewDetails={handleViewDetails}
      reports={reports}
      isNotificationOpen={isNotificationOpen}
      toggleNotification={toggleNotification}
      notifications={notifications}
      markNotificationAsRead={handleMarkNotificationAsRead}
      markAllAsRead={handleMarkAllAsRead}
      unreadCount={unreadCount}
      isUserDropdownOpen={isUserDropdownOpen}
      setIsUserDropdownOpen={setIsUserDropdownOpen}
      handleLogout={handleLogout}
      notificationRef={notificationRef}
      userDropdownRef={userDropdownRef}
      reportDropdownRef={reportDropdownRef}
      isContentLoading={isContentLoading}
    />
  );
};

export default StudentDashboard;
