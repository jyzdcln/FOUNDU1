const Header = ({ onLoginClick }) => {
  return (
    <header className="full-header">
      <div className="header-content">
        <div className="logo">FOUNDU</div>
        <div className="header-actions">
          <span className="lang">FAQ</span>
          <button className="login-btn" onClick={onLoginClick}>
            Log In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;