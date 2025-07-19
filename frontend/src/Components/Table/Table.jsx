import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">📊 Your Reports</h2>

      {/* Add Stocks Button */}
      <div className="text-end mb-3">
        <button className="btn btn-primary" onClick={handleAddStocks}>
          ➕ Add Stocks
        </button>
      </div>

      {loading ? (
        <p className="text-center mt-5">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-center">No reports found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>S.no</th>
                <th>Report Name</th>
                <th>Download PDF</th>
                <th>More Details</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{report.reportName}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleDownload(report.reportPdf)}
                    >
                      Download PDF
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewDetails(report._id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bootstrap Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Stock</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="goal" className="form-label">Goal</label>
                    <input
                      className="form-control"
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Long-term growth, retirement planning..."
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="formFile" className="form-label">Stock Screenshot(s)</label>
                    <input
                      className="form-control"
                      type="file"
                      id="formFile"
                      accept="image/*"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files))}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? '⏳ Generating...' : '🚀 Generate Report'}
                  </button>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportDashboard;
