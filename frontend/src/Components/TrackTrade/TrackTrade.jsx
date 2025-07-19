import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Upload, 
  Camera, 
  FileImage, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  BarChart3,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

function TrackTrade() {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState(null);
  const [storeMessage, setStoreMessage] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [email, setEmail] = useState('sabariragu2006@gmail.com');

  const [summary, setSummary] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [graphData, setGraphData] = useState(null);

  // AI Evaluation report states
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [showEvalReport, setShowEvalReport] = useState(false);

  const [allTrades, setAllTrades] = useState([]);

  // Handle file input change
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setScreenshots(files);
    setPortfolio(null);
    setError(null);
    setStoreMessage(null);
    setConfirmed(false);
    setSummary(null);
    setEvaluationReport(null);
    setEvalError(null);
    setShowEvalReport(false);
    setAllTrades([]);
  };

  // Upload screenshots, get portfolio extracted
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPortfolio(null);
    setError(null);
    setStoreMessage(null);
    setConfirmed(false);
    setSummary(null);
    setEvaluationReport(null);
    setEvalError(null);
    setShowEvalReport(false);
    setAllTrades([]);

    if (!screenshots || screenshots.length === 0) {
      setError('Please upload at least one screenshot.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < screenshots.length; i++) {
      formData.append('screenshots', screenshots[i]);
    }

    try {
      const res = await fetch('http://localhost:5000/api/track-trade', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Server responded with status ${res.status}`);
      if (!data.text) throw new Error('Response missing portfolio data');

      const parsed = JSON.parse(data.text);
      const today = new Date().toISOString().split('T')[0];

      const updatedPortfolio = parsed.map((item) => {
        const invested = parseFloat(item['Invested Amount']?.replace(/[^0-9.-]+/g, '')) || 0;
        const current = parseFloat(item['Current Value']?.replace(/[^0-9.-]+/g, '')) || 0;
        const profit = current - invested;

        return {
          ...item,
          'Invested Date': item['Invested Date'] === 'N/A' ? today : item['Invested Date'],
          'Invested Amount': invested.toFixed(2),
          'Current Value': current.toFixed(2),
          'Profit or Loss': invested === 0 && current === 0 ? 'N/A' : (profit >= 0 ? '+' : '') + profit.toFixed(2),
        };
      });

      setPortfolio(updatedPortfolio);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to extract portfolio data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change for individual portfolio item
  const handleDateChange = (index, newDate) => {
    const updated = [...portfolio];
    updated[index]['Invested Date'] = newDate;
    setPortfolio(updated);
  };

  // Handle amount or current value change for portfolio item
  const handleAmountChange = (index, field, value) => {
    const updated = [...portfolio];
    updated[index][field] = value;

    const invested = parseFloat(updated[index]['Invested Amount']) || 0;
    const current = parseFloat(updated[index]['Current Value']) || 0;
    const profit = current - invested;

    updated[index]['Profit or Loss'] =
      invested === 0 && current === 0 ? 'N/A' : (profit >= 0 ? '+' : '') + profit.toFixed(2);

    setPortfolio(updated);
  };

  // Confirm and save portfolio to backend
  const handleConfirm = async () => {
    setConfirmed(true);
    setStoreMessage('Saving portfolio...');

    try {
      const res = await fetch('http://localhost:5000/api/save-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tradeData: portfolio }),
      });

      const data = await res.json();

      if (res.ok) {
        setStoreMessage('✅ Portfolio saved successfully!');
      } else {
        setStoreMessage('❌ Failed to save portfolio: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Save error:', err);
      setStoreMessage('❌ Error saving portfolio: ' + err.message);
    }
  };

  // Fetch summary for date range
  const handleSummary = async () => {
    setSummary(null);
    setGraphData(null);
    setEvaluationReport(null);
    setEvalError(null);
    setShowEvalReport(false);
    setAllTrades([]);

    if (!fromDate || !toDate) {
      setStoreMessage('❌ Please select both From and To dates.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/portfolio-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, from: fromDate, to: toDate }),
      });

      const data = await res.json();

      if (res.ok) {
        setSummary(data);
        setStoreMessage(null);
        fetchGraph();
      } else {
        setStoreMessage('❌ Summary error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Summary fetch error:', err);
      setStoreMessage('❌ Error fetching summary: ' + err.message);
    }
  };

  // Utility to set fromDate and toDate based on dropdown selection
  const handleQuickRangeChange = (e) => {
    const option = e.target.value;
    const today = new Date();
    let from = null;
    let to = today.toISOString().slice(0, 10);

    switch (option) {
      case 'lastWeek':
        from = new Date(today);
        from.setDate(today.getDate() - 7);
        break;
      case 'last15Days':
        from = new Date(today);
        from.setDate(today.getDate() - 15);
        break;
      case 'lastMonth':
        from = new Date(today);
        from.setMonth(today.getMonth() - 1);
        break;
      case 'lastYear':
        from = new Date(today);
        from.setFullYear(today.getFullYear() - 1);
        break;
      default:
        from = '';
        to = '';
    }

    setFromDate(from ? from.toISOString().slice(0, 10) : '');
    setToDate(to);
  };

  // Fetch all individual trades for date range
  const handleFetchTrades = async () => {
    setError(null);
    setAllTrades([]);
    if (!fromDate || !toDate) {
      setError('Please select both From and To dates to fetch trades.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/portfolio-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, from: fromDate, to: toDate }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (Array.isArray(data)) {
          setAllTrades(data);
        } else if (Array.isArray(data.allTrades)) {
          setAllTrades(data.allTrades);
        } else {
          setAllTrades([]);
          setError('Unexpected trades data format received.');
        }
      } else {
        setError(data.error || 'Error fetching trades');
        setAllTrades([]);
      }
    } catch (err) {
      setError(err.message || 'Error fetching trades');
      setAllTrades([]);
    }
  };

  // Fetch graph data
  const fetchGraph = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profit-by-date-per-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, from: fromDate, to: toDate }),
      });
      const data = await res.json();
      if (res.ok) setGraphData(data);
      else setStoreMessage('⚠️ Could not load graph data.');
    } catch (err) {
      console.error('Error loading graph:', err);
      setStoreMessage('❌ Error fetching graph data.');
    }
  };

  // Fetch AI evaluation report using Gemini (backend)
  const fetchEvaluationReport = async () => {
    setEvalLoading(true);
    setEvaluationReport(null);
    setEvalError(null);
    setShowEvalReport(false);

    if (!fromDate || !toDate) {
      setEvalError('Please select both From and To dates to get evaluation report.');
      setEvalLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/portfolio-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, from: fromDate, to: toDate }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch evaluation report.');
      }

      const data = await res.json();
      const reportText = createReadableReport(data);
      setEvaluationReport(reportText);
      setShowEvalReport(true);
    } catch (err) {
      setEvalError('Error fetching evaluation report: ' + err.message);
    } finally {
      setEvalLoading(false);
    }
  };

  const createReadableReport = (data) => {
    if (!data) return 'No evaluation data available.';

    const formatList = (arr, label) => {
      if (!Array.isArray(arr) || arr.length === 0) {
        return `No ${label.toLowerCase()} available.`;
      }
      return arr
        .map(
          (t) =>
            `- ${t.stockName}: Profit ₹${parseFloat(t.profit).toFixed(2)} (Return: ${parseFloat(t.returnPercent).toFixed(2)}%)`
        )
        .join('\n');
    };

    return `
1. Overview
The portfolio summary from ${data.from || 'N/A'} to ${data.to || 'N/A'} shows a total of ${data.totalTrades || 0} trades. The total invested amount was ₹${data.totalInvested || '0'}, and the current value is ₹${data.totalCurrentValue || '0'}. Overall profit during this period is ₹${data.profit || '0'}, resulting in an average return of ${data.averageReturnPercentage || 'N/A'}.

2. Top Gainers
${formatList(data.topGainers, 'Top Gainers')}

3. Top Losers
${formatList(data.topLosers, 'Top Losers')}

4. Most Successful Trade
${data.mostSuccessfulTrade
      ? `The trade with the highest return percentage is ${data.mostSuccessfulTrade.stockName} with a return of ${parseFloat(data.mostSuccessfulTrade.returnPercent).toFixed(2)}%. This trade shows excellent performance relative to the invested amount.`
      : 'No data on the most successful trade available.'}

5. Recommendations
Based on this evaluation, consider reviewing the top losers to understand what went wrong and evaluate if adjustments can improve future returns. Continue to monitor your top gainers and the most successful trades to maximize your portfolio's growth.
    `.trim();
  };

  // Combine graph data for all stocks by date
  const getCombinedGraphData = () => {
    if (!graphData) return [];

    const allDatesSet = new Set();
    Object.values(graphData).forEach(arr => arr.forEach(({ date }) => allDatesSet.add(date)));
    const allDates = Array.from(allDatesSet).sort();

    return allDates.map(date => {
      const obj = { date };
      for (const [stock, dataArr] of Object.entries(graphData)) {
        const point = dataArr.find(d => d.date === date);
        obj[stock] = point ? point.profit : 0;
      }
      return obj;
    });
  };

  const lineColors = [
    '#2e7d32', '#c62828', '#1565c0', '#ff8f00', '#6a1b9a', '#00897b', '#d84315',
  ];

  const combinedData = getCombinedGraphData();
  const stockNames = graphData ? Object.keys(graphData) : [];

  return (
    <div className="track-trade-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <Camera size={32} />
            </div>
            <div>
              <h1 className="page-title">Track Trade via Screenshot</h1>
              <p className="page-subtitle">Upload portfolio screenshots and get AI-powered analysis</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <section className="upload-section">
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">
                <Upload size={24} />
                Upload Portfolio Screenshots
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="upload-form">
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                    className="file-input"
                    id="screenshot-upload"
                  />
                  <label htmlFor="screenshot-upload" className="file-upload-label">
                    <FileImage size={48} />
                    <div className="upload-text">
                      <h3>Choose Screenshots</h3>
                      <p>Select multiple images of your portfolio</p>
                    </div>
                  </label>
                </div>
                
                {screenshots.length > 0 && (
                  <div className="selected-files">
                    <h4>Selected Files ({screenshots.length})</h4>
                    <div className="file-list">
                      {screenshots.map((file, index) => (
                        <div key={index} className="file-item">
                          <FileImage size={16} />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || screenshots.length === 0} 
                  className="btn btn-primary btn-lg"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Analyzing Screenshots...
                    </>
                  ) : (
                    <>
                      <BarChart3 size={20} />
                      Analyze Portfolio
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Store Message */}
        {storeMessage && (
          <div className={`alert ${storeMessage.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
            {storeMessage.startsWith('✅') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {storeMessage}
          </div>
        )}

        {/* Portfolio Results */}
        {portfolio && (
          <section className="portfolio-results">
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">
                  <BarChart3 size={24} />
                  Extracted Portfolio Data
                </h2>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Stock Name</th>
                        <th>Invested Date</th>
                        <th>Invested Amount</th>
                        <th>Current Value</th>
                        <th>Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((item, idx) => {
                        const profitLoss = item['Profit or Loss'];
                        const isProfit = profitLoss?.startsWith('+');
                        const isLoss = profitLoss?.startsWith('-');
                        
                        return (
                          <tr key={idx} className={isProfit ? 'profit-row' : isLoss ? 'loss-row' : ''}>
                            <td className="stock-name">{item['Stock Name'] || 'N/A'}</td>
                            <td>
                              <input
                                type="date"
                                value={item['Invested Date']}
                                onChange={(e) => handleDateChange(idx, e.target.value)}
                                disabled={confirmed}
                                className="form-control form-control-sm"
                              />
                            </td>
                            <td>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="number"
                                  value={item['Invested Amount']}
                                  onChange={(e) => handleAmountChange(idx, 'Invested Amount', e.target.value)}
                                  disabled={confirmed}
                                  className="form-control form-control-sm"
                                />
                              </div>
                            </td>
                            <td>
                              <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="number"
                                  value={item['Current Value']}
                                  onChange={(e) => handleAmountChange(idx, 'Current Value', e.target.value)}
                                  disabled={confirmed}
                                  className="form-control form-control-sm"
                                />
                              </div>
                            </td>
                            <td>
                              <span className={`profit-loss ${isProfit ? 'profit' : isLoss ? 'loss' : 'neutral'}`}>
                                {isProfit && <TrendingUp size={16} />}
                                {isLoss && <TrendingDown size={16} />}
                                ₹{profitLoss || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!confirmed && (
                  <div className="card-footer">
                    <button className="btn btn-success btn-lg" onClick={handleConfirm}>
                      <CheckCircle size={20} />
                      Confirm & Save Portfolio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Portfolio Analysis Section */}
        <section className="analysis-section">
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">
                <BarChart3 size={24} />
                Portfolio Analysis
              </h2>
            </div>
            <div className="card-body">
              {/* Date Range Selection */}
              <div className="date-range-section">
                <h4>Select Analysis Period</h4>
                <div className="date-controls">
                  <div className="quick-range">
                    <label className="form-label">Quick Range</label>
                    <select
                      onChange={handleQuickRangeChange}
                      defaultValue=""
                      className="form-control"
                    >
                      <option value="" disabled>Select Quick Range</option>
                      <option value="lastWeek">Last Week</option>
                      <option value="last15Days">Last 15 Days</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="lastYear">Last Year</option>
                    </select>
                  </div>

                  <div className="custom-range">
                    <div className="date-input-group">
                      <label className="form-label">From Date</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="form-control"
                      />
                    </div>
                    <div className="date-input-group">
                      <label className="form-label">To Date</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                <div className="analysis-actions">
                  <button className="btn btn-primary" onClick={handleSummary}>
                    <BarChart3 size={20} />
                    Get Summary
                  </button>
                  <button className="btn btn-outline" onClick={handleFetchTrades}>
                    <Eye size={20} />
                    Show All Trades
                  </button>
                  <button 
                    className="btn btn-warning" 
                    onClick={fetchEvaluationReport}
                    disabled={evalLoading}
                  >
                    {evalLoading ? (
                      <>
                        <div className="spinner"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={20} />
                        AI Evaluation
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Display */}
              {summary && (
                <div className="summary-section">
                  <h4>Portfolio Summary</h4>
                  <div className="summary-grid">
                    <div className="metric-card">
                      <div className="metric-icon">
                        <DollarSign size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-label">Total Invested</div>
                        <div className="metric-value">{summary.totalInvested}</div>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">
                        <TrendingUp size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-label">Current Value</div>
                        <div className="metric-value">{summary.totalCurrentValue}</div>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">
                        <BarChart3 size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-label">Profit/Loss</div>
                        <div className={`metric-value ${summary.profit.startsWith('-') ? 'loss' : 'profit'}`}>
                          {summary.profit}
                        </div>
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">
                        <TrendingUp size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-label">Return %</div>
                        <div className={`metric-value ${summary.returnPercentage.startsWith('-') ? 'loss' : 'profit'}`}>
                          {summary.returnPercentage}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Trades Table */}
              {allTrades.length > 0 && (
                <div className="trades-section">
                  <h4>All Trades</h4>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Stock Name</th>
                          <th>Invested Date</th>
                          <th>Invested Amount</th>
                          <th>Current Value</th>
                          <th>Profit</th>
                          <th>Return %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTrades.map((trade, idx) => {
                          const stockName = trade.stockName || trade['Stock Name'] || 'N/A';
                          const investedDate = trade.investedDate || trade['Invested Date'] || 'N/A';
                          const investedAmount = trade.investedAmount || trade['Invested Amount'] || 'N/A';
                          const currentValue = trade.currentValue || trade['Current Value'] || 'N/A';
                          const profit = trade.profit || trade['Profit'] || trade['Profit or Loss'] || 'N/A';
                          const returnPercent = trade.returnPercent || trade['Return %'] || 'N/A';

                          const profitNumber = parseFloat(profit.toString().replace(/[^0-9.-]+/g, '')) || 0;

                          return (
                            <tr key={idx} className={profitNumber >= 0 ? 'profit-row' : 'loss-row'}>
                              <td className="stock-name">{stockName}</td>
                              <td>{investedDate}</td>
                              <td>{investedAmount}</td>
                              <td>{currentValue}</td>
                              <td>
                                <span className={`profit-loss ${profitNumber >= 0 ? 'profit' : 'loss'}`}>
                                  {profitNumber >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                  {profit}
                                </span>
                              </td>
                              <td>
                                <span className={`profit-loss ${profitNumber >= 0 ? 'profit' : 'loss'}`}>
                                  {returnPercent}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Graph Section */}
              {graphData && combinedData.length > 0 && (
                <div className="chart-section">
                  <h4>Profit/Loss Trends</h4>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {stockNames.map((stock, idx) => (
                          <Line
                            key={stock}
                            type="monotone"
                            dataKey={stock}
                            stroke={lineColors[idx % lineColors.length]}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* AI Evaluation Report */}
              {evalError && (
                <div className="alert alert-danger">
                  <AlertCircle size={20} />
                  {evalError}
                </div>
              )}

              {showEvalReport && evaluationReport && (
                <div className="evaluation-section">
                  <h4>AI Portfolio Evaluation</h4>
                  <div className="evaluation-report">
                    <pre>{evaluationReport}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TrackTrade;