import React, { useState, useEffect } from 'react'; 
import axios from 'axios';

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '2rem',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
  }
};

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    title: '',
    section: '',
  });
  const [expandedIndex, setExpandedIndex] = useState(null);

  const fetchArticles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/articles');
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to fetch articles', err);
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

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Articles</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Write Your First Article
        </button>
      </div>

      {articles.length === 0 ? (
        <p>No articles created yet.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem',
          }}
        >
          {articles.map((article, index) => {
            const isExpanded = expandedIndex === index;
            const sectionLines = article.section.split('\n');
            const previewSection = sectionLines.slice(0, 5).join('\n');
            const displaySection = isExpanded ? article.section : previewSection;

            return (
              <div
                key={article._id}
                onClick={() => toggleExpand(index)}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  padding: '1rem',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <h3 style={{ color: '#333' }}>{article.title}</h3>
                <p style={{ fontStyle: 'italic', color: '#555' }}>by {article.author}</p>
                <p style={{ color: '#444' }}>
                  {displaySection}
                  {!isExpanded && sectionLines.length > 5 && (
                    <span style={{ color: '#2196F3' }}>... (click to read more)</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={modalStyles.overlay} onClick={handleOverlayClick}>
          <div style={modalStyles.modal}>
            <button
              onClick={() => setShowForm(false)}
              style={modalStyles.closeBtn}
              aria-label="Close modal"
            >
              &times;
            </button>
            <h2 style={{ marginBottom: '1rem' }}>Write Your Article</h2>
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Author Name: </label><br />
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Article Title: </label><br />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Article Section (Use multiple lines): </label><br />
                <textarea
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    backgroundColor: '#ccc',
                    color: '#333',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Submit Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
