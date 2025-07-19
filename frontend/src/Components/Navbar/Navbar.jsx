import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  User, 
  LogOut, 
  Menu, 
  X, 
  BarChart3, 
  Calculator, 
  FileText, 
  Camera,
  Home
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserEmail('');
    setMenuOpen(false);
    setTimeout(() => navigate('/landing-page'), 100);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/landing-page" className="navbar-brand" onClick={closeMenu}>
            <TrendingUp size={24} />
            <span>StockLLM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            {!isLoggedIn ? (
              <>
                <Link to="/landing-page" className="nav-link">
                  <Home size={18} />
                  Dashboard
                </Link>
                <Link to="/login" className="nav-link">
                  <User size={18} />
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link to="/landing-page" className="nav-link">
                  <Home size={18} />
                  Dashboard
                </Link>
                <Link to="/detailsTable" className="nav-link">
                  <BarChart3 size={18} />
                  Portfolio
                </Link>
                <Link to="/track-trade" className="nav-link">
                  <Camera size={18} />
                  Track Trade
                </Link>
                <Link to="/calculator" className="nav-link">
                  <Calculator size={18} />
                  Calculator
                </Link>
                <Link to="/article" className="nav-link">
                  <FileText size={18} />
                  Articles
                </Link>
                
                {/* User Menu */}
                <div className="user-menu">
                  <div className="user-info">
                    <User size={18} />
                    <span className="user-email">{userEmail}</span>
                  </div>
                  <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${menuOpen ? 'mobile-nav-open' : ''}`}>
          {!isLoggedIn ? (
            <>
              <Link to="/landing-page" className="mobile-nav-link" onClick={closeMenu}>
                <Home size={18} />
                Dashboard
              </Link>
              <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                <User size={18} />
                Login
              </Link>
              <Link to="/signup" className="mobile-nav-link" onClick={closeMenu}>
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link to="/landing-page" className="mobile-nav-link" onClick={closeMenu}>
                <Home size={18} />
                Dashboard
              </Link>
              <Link to="/detailsTable" className="mobile-nav-link" onClick={closeMenu}>
                <BarChart3 size={18} />
                Portfolio
              </Link>
              <Link to="/track-trade" className="mobile-nav-link" onClick={closeMenu}>
                <Camera size={18} />
                Track Trade
              </Link>
              <Link to="/calculator" className="mobile-nav-link" onClick={closeMenu}>
                <Calculator size={18} />
                Calculator
              </Link>
              <Link to="/article" className="mobile-nav-link" onClick={closeMenu}>
                <FileText size={18} />
                Articles
              </Link>
              
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <User size={18} />
                  <span>{userEmail}</span>
                </div>
                <button onClick={handleLogout} className="mobile-nav-link logout-link">
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;