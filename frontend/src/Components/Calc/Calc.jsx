import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Percent, Clock } from 'lucide-react';
import './Calc.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const Calc = () => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [interestType, setInterestType] = useState('simple');
  const [result, setResult] = useState(null);

  const calculateInterest = () => {
    const P = parseFloat(principal);
    const R = parseFloat(rate);
    const T = parseFloat(time);

    if (isNaN(P) || isNaN(R) || isNaN(T)) {
      alert('Please enter valid numbers');
      return;
    }

    let interest = 0;
    let total = 0;

    if (interestType === 'simple') {
      interest = (P * R * T) / 100;
      total = P + interest;
    } else {
      total = P * Math.pow(1 + R / 100, T);
      interest = total - P;
    }

    setResult({ principal: P, interest, total });
  };

  const pieData = result
    ? [
        { name: 'Principal', value: result.principal },
        { name: 'Interest', value: result.interest }
      ]
    : [];

  return (
    <div className="calc-page">
      <div className="container">
        <div className="calc-header">
          <div className="calc-icon">
            <Calculator size={32} />
          </div>
          <div>
            <h1 className="calc-title">Interest Calculator</h1>
            <p className="calc-subtitle">Calculate simple and compound interest with precision</p>
          </div>
        </div>

        <div className="calc-content">
          <div className="calc-form-section">
            <div className="calc-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <DollarSign size={16} />
                    Principal Amount
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter principal amount"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Percent size={16} />
                    Rate of Interest (%)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter interest rate"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Clock size={16} />
                    Time Period (years)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter time in years"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <TrendingUp size={16} />
                    Interest Type
                  </label>
                  <select
                    className="form-control"
                    value={interestType}
                    onChange={(e) => setInterestType(e.target.value)}
                  >
                    <option value="simple">Simple Interest</option>
                    <option value="compound">Compound Interest</option>
                  </select>
                </div>
              </div>

              <button onClick={calculateInterest} className="btn btn-primary btn-lg calc-button">
                <Calculator size={20} />
                Calculate Interest
              </button>
            </div>
          </div>

          {result && (
            <div className="calc-results">
              <div className="results-grid">
                <div className="result-card">
                  <div className="result-header">
                    <h3>Calculation Results</h3>
                    <span className="result-type">{interestType === 'simple' ? 'Simple' : 'Compound'} Interest</span>
                  </div>
                  
                  <div className="result-metrics">
                    <div className="metric">
                      <div className="metric-label">Principal Amount</div>
                      <div className="metric-value">₹{result.principal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    
                    <div className="metric">
                      <div className="metric-label">Interest Earned</div>
                      <div className="metric-value interest">₹{result.interest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    
                    <div className="metric total">
                      <div className="metric-label">Total Amount</div>
                      <div className="metric-value">₹{result.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Investment Breakdown</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="calculation-details">
                <h4>Calculation Details</h4>
                <div className="formula-card">
                  {interestType === 'simple' ? (
                    <div className="formula">
                      <div className="formula-title">Simple Interest Formula</div>
                      <div className="formula-text">SI = (P × R × T) / 100</div>
                      <div className="formula-breakdown">
                        <span>SI = ({principal} × {rate} × {time}) / 100 = ₹{result.interest.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="formula">
                      <div className="formula-title">Compound Interest Formula</div>
                      <div className="formula-text">A = P(1 + R/100)^T</div>
                      <div className="formula-breakdown">
                        <span>A = {principal}(1 + {rate}/100)^{time} = ₹{result.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calc;