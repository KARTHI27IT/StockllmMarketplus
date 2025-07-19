import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

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
    <div className="container mt-5">
      <h2 className="text-center mb-4">Interest Calculator</h2>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <input
            type="number"
            className="form-control"
            placeholder="Principal Amount"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="number"
            className="form-control"
            placeholder="Rate of Interest (%)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="number"
            className="form-control"
            placeholder="Time (in years)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={interestType}
            onChange={(e) => setInterestType(e.target.value)}
          >
            <option value="simple">Simple Interest</option>
            <option value="compound">Compound Interest</option>
          </select>
        </div>
        <div className="col-md-6 d-grid">
          <button onClick={calculateInterest} className="btn btn-primary">
            Calculate
          </button>
        </div>
      </div>

      {result && (
        <div className="row mt-4">
          <div className="col-md-6">
            <div className="p-3 border rounded bg-light">
              <h4>Result:</h4>
              <p><strong>Principal:</strong> ₹{result.principal.toFixed(2)}</p>
              <p><strong>Interest:</strong> ₹{result.interest.toFixed(2)}</p>
              <p><strong>Total Amount:</strong> ₹{result.total.toFixed(2)}</p>
            </div>
          </div>
          <div className="col-md-6">
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
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calc;