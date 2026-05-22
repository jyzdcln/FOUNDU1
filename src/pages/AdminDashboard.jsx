import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import AdminVerifyFound from "./AdminVerifyFound";
import ReportLostItem from "../components/admin/ReportLostItem";
import ReportFoundItem from "../components/admin/ReportFoundItem";
import ViewReports from "./ViewReports";
import ClaimedItems from "./ClaimedItems";
import UnclaimedItems from "./UnclaimedItems";
import Notifications from "./AdminNotifications";
import {
  getReports,
  subscribeToNewReports,
  subscribeToStatusChanges,
  deleteReport,
} from "../services/reportService";
import { supabase } from "../services/supabase";
import AdminDashboardLayout from "./AdminDashboardLayout";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [allReports, setAllReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedReportToView, setSelectedReportToView] = useState(null);
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

  const handleMenuClick = async (menu, statusFilter = null) => {
    setIsPageLoading(true);
    setShowReportForm(false);

    if (statusFilter && menu === "overview") {
      setSelectedStatusFilter(statusFilter);
    } else if (menu !== "overview") {
      setSelectedStatusFilter("all");
    }

    setActiveMenu(menu);
    setIsNotificationOpen(false);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 300);
  };

  const handleStatCardClick = (status) => {
    setSelectedStatusFilter(status);
    setActiveMenu("overview");
    setShowReportForm(false);
    setIsNotificationOpen(false);
  };

  const handleViewReportFromKebab = (report) => {
    setSelectedReportToView(report);
    setActiveMenu("overview");
    setShowReportForm(false);
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
      .from("reports")
      .select("id, type, title, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error loading notifications:", error);
    } else if (data) {
      const formatted = data.map((report) => {
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
          read: false,
        };
      });
      setRecentNotifications(formatted);
    }
  };

  const loadRecentReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select(
        `
        id,
        title,
        category,
        type,
        status,
        created_at,
        users (
          name,
          email
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading recent reports:", error);
    } else {
      setRecentReports(data || []);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
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
    loadAllReports();
    loadRecentNotifications();
    loadRecentReports();

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const newReportSubscription = subscribeToNewReports(async (newReport) => {
      console.log("New report detected in real-time!", newReport);

      await loadAllReports();
      await loadRecentNotifications();
      await loadRecentReports();

      if (Notification.permission === "granted") {
        new Notification(`New ${newReport.type} report: ${newReport.title}`);
      }
    });

    const statusSubscription = subscribeToStatusChanges(
      async (updatedReport) => {
        console.log("Report status changed in real-time!", updatedReport);
        await loadAllReports();
        await loadRecentNotifications();
        await loadRecentReports();
      },
    );

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
    await loadRecentReports();
    return reports;
  };

  const getPageTitle = () => {
    if (showReportForm) {
      return reportType === "lost" ? "Report Lost" : "Report Found";
    }
    switch (activeMenu) {
      case "dashboard":
        return "Dashboard";
      case "overview":
        if (selectedStatusFilter !== "all") {
          return `Overview - ${selectedStatusFilter.toUpperCase()} Reports`;
        }
        return "Overview";
      case "founditems":
        return "Found Items";
      case "unclaimed":
        return "Unclaimed";
      case "resolved":
        return "Claimed Items";
      case "notifications":
        return "Notifications";
      default:
        return "Dashboard";
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

    switch (activeMenu) {
      case "dashboard":
        return <div className="content-box"></div>;
      case "overview":
        return (
          <ViewReports
            onRefresh={refreshReports}
            initialStatusFilter={selectedStatusFilter}
            selectedReportToView={selectedReportToView}
            onClearSelectedReport={() => setSelectedReportToView(null)}
          />
        );
      case "founditems":
        return <AdminVerifyFound />;
      case "unclaimed":
        return <UnclaimedItems />;
      case "resolved":
        return <ClaimedItems />;
      case "notifications":
        return <Notifications />;
      default:
        return <p>Welcome to Dashboard</p>;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "log-status-pending";
      case "verified":
        return "log-status-verified";
      case "claimed":
        return "log-status-claimed";
      case "rejected":
        return "log-status-rejected";
      case "resolved":
        return "log-status-resolved";
      default:
        return "log-status-pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "PENDING";
      case "verified":
        return "VERIFIED";
      case "claimed":
        return "CLAIMED";
      case "rejected":
        return "REJECTED";
      case "resolved":
        return "RESOLVED";
      default:
        return status.toUpperCase();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const totalReportsCount = allReports.length;
  const pendingCount = allReports.filter((r) => r.status === "pending").length;
  const verifiedCount = allReports.filter(
    (r) => r.status === "verified",
  ).length;
  const claimedCount = allReports.filter((r) => r.status === "claimed").length;
  const totalRejectedCount = allReports.filter(
    (r) => r.status === "rejected",
  ).length;
  const unclaimedCount = allReports.filter(
    (r) => r.status === "verified",
  ).length;

  const LoadingSpinner = () => (
    <div className="admin-loading-spinner-container">
      <div className="admin-loading-spinner"></div>
    </div>
  );

  const layoutProps = {
    activeMenu,
    onMenuClick: handleMenuClick,
    unclaimedCount,
    onReportLost: handleReportLost,
    onReportFound: handleReportFound,
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
    selectedStatusFilter,
    onViewReportFromKebab: handleViewReportFromKebab,
  };

  if (isPageLoading) {
    return (
      <AdminDashboardLayout
        {...layoutProps}
        isLoading={true}
        LoadingSpinner={LoadingSpinner}
      />
    );
  }

  return <AdminDashboardLayout {...layoutProps} isLoading={false} />;
};

export default AdminDashboard;
