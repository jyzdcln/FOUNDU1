import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginPopup from "../components/LoginPopup";
import "../styles/global.css";
import founduLogo from "../assets/icons/foundulogo-icon.png";
import { supabase } from "../services/supabase";

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasOpenedPopup = useRef(false);
  const aboutSectionRef = useRef(null);
  const homeSectionRef = useRef(null);

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showOffice365Form, setShowOffice365Form] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [office365Email, setOffice365Email] = useState("");
  const [office365Password, setOffice365Password] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (location.state?.openLogin && !hasOpenedPopup.current) {
      hasOpenedPopup.current = true;
      window.scrollTo(0, 0);
      handleLoginClick();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  useEffect(() => {
    if (showLoginPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLoginPopup]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            setActiveSection("about");
          }
        });
      },
      { threshold: 0.3 },
    );

    if (aboutSectionRef.current) {
      observer.observe(aboutSectionRef.current);
    }

    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection("home");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      if (aboutSectionRef.current) {
        observer.unobserve(aboutSectionRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (section) => {
    setActiveSection(section);

    if (section === "home") {
      const heroElement = document.querySelector(".hero-section");
      if (heroElement) {
        heroElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } else if (section === "about") {
      const aboutElement = document.getElementById("about-section");
      if (aboutElement) {
        aboutElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else if (aboutSectionRef.current) {
        aboutSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else if (section === "contact") {
      alert("Contact page coming soon!");
    }
  };

  const handleLoginClick = () => {
    window.scrollTo(0, 0);
    setShowLoginPopup(true);
    setShowAdminForm(false);
    setShowOffice365Form(false);
    setIsClosing(false);
    setUsername("");
    setPassword("");
    setOffice365Email("");
    setOffice365Password("");
    setError("");
    setRememberMe(false);
  };

  const handleClosePopup = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowLoginPopup(false);
      setShowAdminForm(false);
      setShowOffice365Form(false);
      setIsClosing(false);
      setUsername("");
      setPassword("");
      setOffice365Email("");
      setOffice365Password("");
      setError("");
      setRememberMe(false);
    }, 300);
  };

  const handleOffice365Submit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", office365Email)
      .single();

    if (error || !data) {
      setError("Invalid email or password");
    } else if (data.password !== office365Password) {
      setError("Invalid email or password");
    } else {
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("isLoggedIn", "true");
      handleClosePopup();

      if (data.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
  };

  const handleShowOffice365Form = () => {
    setShowOffice365Form(true);
    setShowAdminForm(false);
    setError("");
  };

  const handleShowAdminForm = () => {
    setShowAdminForm(true);
    setShowOffice365Form(false);
    setError("");
  };

  const handleBackToOptions = () => {
    setShowAdminForm(false);
    setShowOffice365Form(false);
    setError("");
    setOffice365Email("");
    setOffice365Password("");
    setUsername("");
    setPassword("");
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", username)
      .single();

    if (error || !data) {
      setError("Invalid credentials");
    } else if (data.password !== password) {
      setError("Invalid credentials");
    } else if (data.role !== "admin") {
      setError("Not an admin account");
    } else {
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("isLoggedIn", "true");
      handleClosePopup();
      navigate("/admin-dashboard");
    }
  };

  const handleBrowseClick = () => {
    navigate("/browse");
  };

  const handleLostClick = () => {
    alert("Report Lost Item - Coming soon!");
  };

  const handleFoundClick = () => {
    alert("Report Found Item - Coming soon!");
  };

  const handleLearnMore = () => {
    alert(
      "STI College Lost and Found System\n\nThis system helps students and staff report lost or found items within the campus. It aims to create a more organized and efficient way of returning lost belongings to their owners.\n\nFeatures:\n• Report lost items\n• Report found items\n• Claim your lost items\n• Real-time notifications\n• Secure verification process",
    );
  };

  const handleContactUs = () => {
    alert(
      "Contact Us\n\nSTI College\nEmail: lostandfound@sti.edu\nPhone: (02) 1234-5678\nAddress: STI College Campus",
    );
  };

  return (
    <>
      <div
        className={`full-width-wrapper ${showLoginPopup ? "blur-background" : ""}`}
      >
        <header className="full-header">
          <div className="header-content">
            <div className="logo">
              <img src={founduLogo} alt="FoundU" className="logo-img" />
            </div>
            <div className="nav-center">
              <span
                className={`lang ${activeSection === "home" ? "active" : ""}`}
                onClick={() => scrollToSection("home")}
              >
                Home
              </span>
              <span
                className={`lang ${activeSection === "about" ? "active" : ""}`}
                onClick={() => scrollToSection("about")}
              >
                About
              </span>
              <span
                className={`lang ${activeSection === "contact" ? "active" : ""}`}
                onClick={() => scrollToSection("contact")}
              >
                Contact
              </span>
              <span className="lang" onClick={handleBrowseClick}>
                Browse
              </span>
            </div>
            <div className="header-actions">
              <button className="login-btn" onClick={handleLoginClick}>
                Login
              </button>
            </div>
          </div>
        </header>

        <div className="hero-section" ref={homeSectionRef}>
          <h1 className="hero-title">
            Where lost belongings find
            <br />
            their way home
          </h1>
          <p className="hero-subtitle">
            A lost & found where every item matters.
            <br />
            Report what's missing. Post what's found.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn found-btn" onClick={handleFoundClick}>
              I've found something
            </button>
            <button className="hero-btn lost-btn" onClick={handleLostClick}>
              I've lost something
            </button>
          </div>
        </div>

        <div id="about-section" className="about-section" ref={aboutSectionRef}>
          <div className="about-container">
            <h2 className="about-title">About Us</h2>
            <p className="about-text">
              STI College's Lost and Found System is dedicated to helping
              students, faculty, and staff reunite with their lost belongings.
              With technological support, FoundU aims to create a more caring
              environment, promote mutual assistance, and strengthen solidarity
              within the STI community.
            </p>
            <div className="about-buttons">
              <button className="about-btn learn-btn" onClick={handleLearnMore}>
                Learn More
              </button>
              <button
                className="about-btn contact-btn"
                onClick={handleContactUs}
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLoginPopup && (
        <LoginPopup
          isClosing={isClosing}
          handleClosePopup={handleClosePopup}
          showAdminForm={showAdminForm}
          showOffice365Form={showOffice365Form}
          handleShowAdminForm={handleShowAdminForm}
          handleShowOffice365Form={handleShowOffice365Form}
          handleBackToOptions={handleBackToOptions}
          handleAdminSubmit={handleAdminSubmit}
          handleOffice365Submit={handleOffice365Submit}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          office365Email={office365Email}
          setOffice365Email={setOffice365Email}
          office365Password={office365Password}
          setOffice365Password={setOffice365Password}
          error={error}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
        />
      )}
    </>
  );
};

export default LandingPage;
