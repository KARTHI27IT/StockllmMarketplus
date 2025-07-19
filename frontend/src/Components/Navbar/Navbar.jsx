import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Home,
  Bell,
  Settings
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    setShowUserMenu(false);
    setTimeout(() => navigate('/landing-page'), 100);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/landing-page', label: 'Dashboard', icon: Home },
    { path: '/detailsTable', label: 'Portfolio', icon: BarChart3, requireAuth: true },
    { path: '/track-trade', label: 'Track Trade', icon: Camera, requireAuth: true },
    { path: '/calculator', label: 'Calculator', icon: Calculator },
    { path: '/article', label: 'Articles', icon: FileText, requireAuth: true },
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/landing-page" className="navbar-brand" onClick={closeMenu}>
            <div className="brand-icon">
              <TrendingUp size={28} />
            </div>
            <div className="brand-text">
              <span className="brand-name">StockLLM</span>
              <span className="brand-tagline">Smart Trading</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            {navItems.map((item) => {
              if (item.requireAuth && !isLoggedIn) return null;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Auth Section */}
            {!isLoggedIn ? (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  <User size={16} />
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="user-section">
                <button className="notification-btn">
                  <Bell size={18} />
                  <span className="notification-badge">3</span>
                </button>
                
                <div className="user-menu-container">
                  <button 
                    className="user-menu-trigger"
                    onClick={toggleUserMenu}
                  >
                    <div className="user-avatar">
                      <User size={16} />
                    </div>
                    <div className="user-info">
                      <span className="user-name">
                        {userEmail.split('@')[0]}
                      </span>
                      <span className="user-email">{userEmail}</span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <div className="user-avatar large">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="dropdown-name">{userEmail.split('@')[0]}</div>
                          <div className="dropdown-email">{userEmail}</div>
                        </div>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <div className="dropdown-menu">
                        <button className="dropdown-item">
                          <Settings size={16} />
                          Settings
                        </button>
                        <button className="dropdown-item" onClick={handleLogout}>
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
          <div className="mobile-nav-content">
            {navItems.map((item) => {
              if (item.requireAuth && !isLoggedIn) return null;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {!isLoggedIn ? (
              <div className="mobile-auth-section">
                <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                  <User size={20} />
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary w-full" onClick={closeMenu}>
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="mobile-user-name">{userEmail.split('@')[0]}</div>
                    <div className="mobile-user-email">{userEmail}</div>
                  </div>
                </div>
                
                <div className="mobile-user-actions">
                  <button className="mobile-nav-link">
                    <Settings size={20} />
                    Settings
                  </button>
                  <button className="mobile-nav-link logout-link" onClick={handleLogout}>
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {menuOpen && <div className="mobile-nav-overlay" onClick={closeMenu}></div>}
      {showUserMenu && <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)}></div>}
    </nav>
  );
};

export default Navbar;