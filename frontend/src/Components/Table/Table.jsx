import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Download, 
  Eye, 
  Upload, 
  FileText, 
  BarChart3,
  X,
  Camera
} from 'lucide-react';
import './Table.css';

function ReportDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [goal, setGoal] = useState('');
  const [files, setFiles] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const email = localStorage.getItem("userEmail");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.post(`${API_BASE}/user/details`, { email });
        const user = result.data.user;
        setReports(user.reports || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [email]);

  const handleDownload = (pdfPath) => {
    if (pdfPath) {
      window.open(`${API_BASE}/${pdfPath}`, '_blank');
    } else {
      alert('❌ PDF not available');
    }
  };

  const handleViewDetails = (reportId) => {
    navigate(`/stockDetails/${reportId}`);
  };

  const handleAddStocks = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGoal('');
    setFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!goal || files.length === 0) {
      alert('Please provide a goal and at least one screenshot.');
      return;
    }

    const formData = new FormData();
    formData.append('goal', goal);
    formData.append('email', email);
    files.forEach(file => formData.append('screenshots', file));

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-report`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      // Re-fetch updated reports after generating
      const updated = await axios.post(`${API_BASE}/user/details`, { email });
      const user = updated.data.user;
      setReports(user.reports || []);
      setShowModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close modal if clicking outside content
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setShowModal(false);
  };

  return (
    <div className="reports-page">
      <div className="container">
        {/* Header */}
        <div className="reports-header">
          <div className="header-content">
            <div className="header-icon">
              <BarChart3 size={32} />
            </div>
            <div>
              <h1 className="page-title">Your Reports</h1>
              <p className="page-subtitle">Manage and view your investment analysis reports</p>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-lg"
            onClick={handleAddStocks}
          >
            <Plus size={20} />
            Add New Report
          </button>
        </div>

        {/* Reports Content */}
        <div className="reports-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={64} />
              </div>
              <h3>No Reports Yet</h3>
              <p>Create your first investment analysis report by uploading portfolio screenshots.</p>
              <button 
                className="btn btn-primary"
                onClick={handleAddStocks}
              >
                <Plus size={20} />
                Create First Report
              </button>
            </div>
          ) : (
            <div className="reports-grid">
              {reports.map((report, index) => (
                <div key={index} className="report-card">
                  <div className="report-header">
                    <div className="report-icon">
                      <FileText size={24} />
                    </div>
                    <div className="report-number">#{index + 1}</div>
                  </div>
                  
                  <div className="report-content">
                    <h3 className="report-title">{report.reportName}</h3>
                    <p className="report-date">
                      Created on {new Date(report.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="report-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDownload(report.reportPdf)}
                      title="Download PDF"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleViewDetails(report._id)}
                      title="View Details"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">
                  <Camera size={24} />
                  <h2>Create New Report</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="modal-close"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="report-form">
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Investment Goal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Long-term growth, retirement planning..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Upload size={16} />
                    Portfolio Screenshots
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files))}
                      className="file-input"
                      id="file-upload"
                      required
                    />
                    <label htmlFor="file-upload" className="file-upload-label">
                      <Upload size={32} />
                      <div className="upload-text">
                        <h4>Choose Screenshots</h4>
                        <p>Select multiple images of your portfolio</p>
                      </div>
                    </label>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="selected-files">
                      <h4>Selected Files ({files.length})</h4>
                      <div className="file-list">
                        {files.map((file, index) => (
                          <div key={index} className="file-item">
                            <Camera size={16} />
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={16} />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportDashboard;