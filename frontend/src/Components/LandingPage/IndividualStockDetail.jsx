import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const IndividualStockDetail = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 30);
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(pastDate.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/stock-details?symbol=${symbol}`);
        setStockData(res.data);
      } catch (err) {
        setError('❌ Failed to load stock data.');
        console.error(err);
      }
    };
    if (symbol) fetchStock();
  }, [symbol]);

  const fetchChartData = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both From and To dates.');
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/stock-history`, {
        params: { symbol, from: fromDate, to: toDate }
      });
      setChartData(res.data);
    } catch (err) {
      console.error('❌ Failed to load chart data:', err);
      setChartData([]);
    }
  };

  useEffect(() => {
    if (symbol && fromDate && toDate) fetchChartData();
  }, [symbol, fromDate, toDate]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stockData) return <div className="text-center">Loading...</div>;

  const formatKey = (key) =>
    key.replace(/([a-z])([A-Z])/g, '$1 $2')
       .replace(/_/g, ' ')
       .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatValue = (value) => {
    if (typeof value === 'number') return value.toLocaleString('en-IN');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value || 'N/A';
  };

  const Section = ({ title, keys }) => (
    <div className="mb-4">
      <h5 className="border-bottom pb-1 mb-3">{title}</h5>
      <div className="list-group">
        {keys.map((key) =>
          key in stockData ? (
            <div key={key} className="list-group-item list-group-item-action d-flex justify-content-between">
              <strong>{formatKey(key)}</strong>
              <span>{formatValue(stockData[key])}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );

  return (
    <div className="container py-5">
      <h2 className="mb-4">{stockData.longName || stockData.shortName}</h2>

      <Section title="Basic Info" keys={["symbol", "longName", "shortName", "currency", "exchange"]} />
      <Section title="Price Info" keys={["regularMarketPrice", "regularMarketChange", "regularMarketChangePercent", "previousClose", "open"]} />
      <Section title="Day Range" keys={["regularMarketDayLow", "regularMarketDayHigh"]} />

      {/* Date Range Picker */}
      <div className="mb-4">
        <label className="me-2"><strong>From:</strong></label>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-control d-inline-block w-auto me-3" />
        <label className="me-2"><strong>To:</strong></label>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-control d-inline-block w-auto me-3" />
        <button className="btn btn-primary" onClick={fetchChartData}>📈 Fetch Data</button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mb-5">
          <h5>📊 Stock Price Chart ({fromDate} to {toDate})</h5>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#007BFF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <Section title="52 Week Range" keys={["fiftyTwoWeekLow", "fiftyTwoWeekHigh"]} />
      <Section title="Valuation" keys={["marketCap", "trailingPE", "forwardPE", "epsTrailingTwelveMonths"]} />
      <Section title="Dividend Info" keys={["dividendRate", "dividendYield", "exDividendDate"]} />
      <Section title="Performance" keys={["fiftyDayAverage", "twoHundredDayAverage"]} />
    </div>
  );
};

export default IndividualStockDetail;