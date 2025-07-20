import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { PenTool, X, User, Calendar, FileText, Plus, Eye, EyeOff } from 'lucide-react';
import './Articles.css';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    title: '',
    section: '',
  });
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/articles');
      setArticles(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch articles', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formData.author && formData.title && formData.section) {
      try {
        await axios.post('http://localhost:5000/articles', formData);
        fetchArticles();
        setFormData({ author: '', title: '', section: '' });
        setShowForm(false);
      } catch (err) {
        console.error('Failed to post article', err);
        setError('Failed to create article. Please try again.');
      }
    }
  };

  const toggleExpand = (index) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  // Close modal if clicking outside content
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setShowForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="articles-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="articles-page">
      <div className="container">
        {/* Header */}
        <div className="articles-header">
          <div className="header-content">
            <div className="header-icon">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="page-title">Market Articles</h1>
              <p className="page-subtitle">Share insights and read expert analysis on market trends</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-lg"
          >
            <Plus size={20} />
            Write Article
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Articles Grid */}
        <div className="articles-content">
          {articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={64} />
              </div>
              <h3>No Articles Yet</h3>
              <p>Be the first to share your market insights and analysis.</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <Plus size={20} />
                Write First Article
              </button>
            </div>
          ) : (
            <div className="articles-grid">
              {articles.map((article, index) => {
                const isExpanded = expandedIndex === index;
                const sectionLines = article.section.split('\n');
                const previewSection = sectionLines.slice(0, 3).join('\n');
                const displaySection = isExpanded ? article.section : previewSection;
                const hasMore = sectionLines.length > 3;

                return (
                  <article key={article._id} className="article-card">
                    <div className="article-header">
                      <h3 className="article-title">{article.title}</h3>
                      <div className="article-meta">
                        <div className="author-info">
                          <User size={16} />
                          <span>{article.author}</span>
                        </div>
                        <div className="date-info">
                          <Calendar size={16} />
                          <span>{formatDate(article.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="article-content">
                      <p className="article-text">{displaySection}</p>
                      
                      {hasMore && (
                        <button
                          onClick={() => toggleExpand(index)}
                          className="expand-btn"
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff size={16} />
                              Show Less
                            </>
                          ) : (
                            <>
                              <Eye size={16} />
                              Read More
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Article Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">
                  <PenTool size={24} />
                  <h2>Write New Article</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="modal-close"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="article-form">
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    Author Name
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Article Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="Enter article title"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <PenTool size={16} />
                    Article Content
                  </label>
                  <textarea
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    required
                    rows={8}
                    className="form-control"
                    placeholder="Write your article content here..."
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <PenTool size={16} />
                    Publish Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Articles;