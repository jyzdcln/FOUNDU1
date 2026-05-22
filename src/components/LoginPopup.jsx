import React from "react";
import "./LoginPopup.css";

const LoginPopup = ({
  isClosing,
  handleClosePopup,
  showAdminForm,
  showOffice365Form,
  handleShowAdminForm,
  handleShowOffice365Form,
  handleBackToOptions,
  handleAdminSubmit,
  handleOffice365Submit,
  username,
  setUsername,
  password,
  setPassword,
  office365Email,
  setOffice365Email,
  office365Password,
  setOffice365Password,
  error,
  rememberMe,
  setRememberMe,
}) => {
  return (
    <div className={`popup-overlay ${isClosing ? "closing" : ""}`}>
      <div className="popup-container">
        <div className="popup-header">
          <h2>
            {showOffice365Form
              ? "Office 365 Login"
              : showAdminForm
                ? "Admin Login"
                : "Log in"}
          </h2>
          <button className="close-btn" onClick={handleClosePopup}>
            ×
          </button>
        </div>

        <div className="form-switch-wrapper">
          {!showAdminForm && !showOffice365Form ? (
            <div className="login-options">
              <button
                className="office365-btn"
                onClick={handleShowOffice365Form}
              >
                <span className="office-icon"></span>
                Login with Office 365
              </button>
              <button className="admin-link" onClick={handleShowAdminForm}>
                Admin Login
              </button>
            </div>
          ) : showOffice365Form ? (
            <form onSubmit={handleOffice365Submit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={office365Email}
                  onChange={(e) => setOffice365Email(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={office365Password}
                  onChange={(e) => setOffice365Password(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="student-submit-btn">
                Login
              </button>
              <button
                type="button"
                className="back-btn"
                onClick={handleBackToOptions}
              >
                Back
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <div className="form-options">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="admin-submit-btn">
                Login
              </button>
              <button
                type="button"
                className="back-btn"
                onClick={handleBackToOptions}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
