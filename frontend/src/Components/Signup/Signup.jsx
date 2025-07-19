import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, Check } from 'lucide-react';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    const payLoad = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password
    };

    try {
      const result = await axios.post(`${API_BASE}/user/signup`, payLoad);
      
      if (result.data.status) {
        // Success - clear form and redirect
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Show success message and redirect
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        setErrors({ general: result.data.message || 'Signup failed' });
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrors({ 
        general: err.response?.data?.message || 'Signup failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password) => {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[strength - 1] || '' };
  };

  const { strength, label } = passwordStrength(formData.password);

  return (
    <div className="signup-page">
      <div className="container">
        <div className="signup-container">
          <div className="signup-card">
            <div className="signup-header">
              <div className="signup-icon">
                <UserPlus size={32} />
              </div>
              <h1 className="signup-title">Create Account</h1>
              <p className="signup-subtitle">Join thousands of smart investors</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              {errors.general && (
                <div className="alert alert-danger">
                  {errors.general}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} />
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill strength-${strength}`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="strength-label">{label}</span>
                  </div>
                )}
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="success-message">
                    <Check size={16} />
                    Passwords match
                  </div>
                )}
                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="signup-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="signup-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="signup-benefits">
            <h3>What you'll get</h3>
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">✨</div>
                <div>
                  <h4>AI-Powered Insights</h4>
                  <p>Get intelligent analysis of your portfolio with advanced AI technology</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📊</div>
                <div>
                  <h4>Real-Time Data</h4>
                  <p>Access live market data, stock prices, and financial news</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <div>
                  <h4>Secure Platform</h4>
                  <p>Your data is protected with enterprise-grade security</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📱</div>
                <div>
                  <h4>Easy Portfolio Tracking</h4>
                  <p>Upload screenshots and track your investments effortlessly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;