import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
    setScreenshots(e.target.files);
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
      console.log('Fetched trades:', data); // DEBUG: See what data backend returns
      if (res.ok) {
        // Defensive check for data shape
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

      // Compose a readable report with 5 topics & explanations
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
Based on this evaluation, consider reviewing the top losers to understand what went wrong and evaluate if adjustments can improve future returns. Continue to monitor your top gainers and the most successful trades to maximize your portfolio’s growth.
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
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h2>📷 Track Trade via Screenshot</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          className="form-control"
        />
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 10 }}>
          {loading ? 'Analyzing...' : 'Upload & Analyze'}
        </button>
      </form>

      {error && <div style={{ marginTop: 20, color: 'red' }}><strong>Error:</strong> {error}</div>}

      {storeMessage && (
        <div
          style={{
            marginTop: 15,
            color: storeMessage.startsWith('✅') ? 'green' : 'red',
            fontWeight: 'bold',
          }}
        >
          {storeMessage}
        </div>
      )}

      {portfolio && (
        <div style={{ marginTop: 30 }}>
          <h3>📄 Extracted Portfolio Data</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead style={{ backgroundColor: '#f0f0f0' }}>
              <tr>
                <th>Stock Name</th>
                <th>Invested Date</th>
                <th>Invested Amount</th>
                <th>Current Value</th>
                <th>Profit or Loss</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    color:
                      item['Profit or Loss']?.startsWith('+')
                        ? 'green'
                        : item['Profit or Loss']?.startsWith('-')
                        ? 'red'
                        : 'black',
                  }}
                >
                  <td>{item['Stock Name'] || 'N/A'}</td>
                  <td>
                    <input
                      type="date"
                      value={item['Invested Date']}
                      onChange={(e) => handleDateChange(idx, e.target.value)}
                      disabled={confirmed}
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item['Invested Amount']}
                      onChange={(e) => handleAmountChange(idx, 'Invested Amount', e.target.value)}
                      disabled={confirmed}
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item['Current Value']}
                      onChange={(e) => handleAmountChange(idx, 'Current Value', e.target.value)}
                      disabled={confirmed}
                      className="form-control"
                    />
                  </td>
                  <td>{item['Profit or Loss'] || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!confirmed && (
            <button className="btn btn-success" style={{ marginTop: 20 }} onClick={handleConfirm}>
              ✅ Confirm & Save
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <h4>📊 Fetch Portfolio Summary</h4>

        {/* Quick Date Range Dropdown */}
        <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <select
            onChange={handleQuickRangeChange}
            defaultValue=""
            className="form-control"
            style={{ width: '180px', marginRight: 10 }}
          >
            <option value="" disabled>
              Select Quick Range
            </option>
            <option value="lastWeek">Last Week</option>
            <option value="last15Days">Last 15 Days</option>
            <option value="lastMonth">Last Month</option>
            <option value="lastYear">Last Year</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="form-control"
            style={{ width: '150px' }}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="form-control"
            style={{ width: '150px' }}
          />

          <button className="btn btn-info" onClick={handleSummary}>
            📈 Get Summary
          </button>

          <button className="btn btn-primary" onClick={handleFetchTrades} style={{ marginLeft: 10 }}>
            📋 Show All Trades
          </button>
        </div>

        {summary && (
          <div style={{ marginTop: 20, fontWeight: 'bold' }}>
            <div>Total Invested: ₹{summary.totalInvested}</div>
            <div>Total Current Value: ₹{summary.totalCurrentValue}</div>
            <div>Profit: ₹{summary.profit}</div>
            <div>Return %: {summary.returnPercent}%</div>
          </div>
        )}

        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}

        {/* Render all trades if available */}
        {allTrades.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h4>All Trades</h4>
            <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead style={{ backgroundColor: '#eee' }}>
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
                  // Defensive property names (try camelCase, else fallback keys)
                  const stockName = trade.stockName || trade['Stock Name'] || 'N/A';
                  const investedDate = trade.investedDate || trade['Invested Date'] || 'N/A';
                  const investedAmount = trade.investedAmount || trade['Invested Amount'] || 'N/A';
                  const currentValue = trade.currentValue || trade['Current Value'] || 'N/A';
                  const profit = trade.profit || trade['Profit'] || trade['Profit or Loss'] || 'N/A';
                  const returnPercent = trade.returnPercent || trade['Return %'] || 'N/A';

                  const profitNumber = parseFloat(profit.toString().replace(/[^0-9.-]+/g, '')) || 0;

                  return (
                    <tr key={idx} style={{ color: profitNumber >= 0 ? 'green' : 'red' }}>
                      <td>{stockName}</td>
                      <td>{investedDate}</td>
                      <td>{investedAmount}</td>
                      <td>{currentValue}</td>
                      <td>{profit}</td>
                      <td>{returnPercent}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Graph Section */}
        {graphData && combinedData.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h4>Profit/Loss by Date per Stock</h4>
            <ResponsiveContainer width="100%" height={300}>
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
        )}
      </div>

      <div style={{ marginTop: 50 }}>
        <h4>🧠 AI Portfolio Evaluation Report</h4>
        <button
          onClick={fetchEvaluationReport}
          disabled={evalLoading}
          className="btn btn-warning"
        >
          {evalLoading ? 'Generating report...' : 'Get Evaluation Report'}
        </button>

        {evalError && <div style={{ color: 'red', marginTop: 10 }}>{evalError}</div>}

        {showEvalReport && evaluationReport && (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f5f5f5',
              padding: 15,
              marginTop: 20,
              borderRadius: 5,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {evaluationReport}
          </pre>
        )}
      </div>
    </div>
  );
}

export default TrackTrade;
