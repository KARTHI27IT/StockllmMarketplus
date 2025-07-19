import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import {
  Search, TrendingUp, TrendingDown, BarChart3, Calculator,
  PenTool, Briefcase, Activity, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import ScrollingNavbar from '../ScrollingNavbar/ScrollingNavbar';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animatedNumbers, setAnimatedNumbers] = useState({ nifty: 0, sensex: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [marketData, setMarketData] = useState({
    nifty: { price: 0, change: 0, changePercent: 0 },
    sensex: { price: 0, change: 0, changePercent: 0 },
    mood: 'Neutral'
  });
  const [niftyTopCompanies, setNiftyTopCompanies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // NEW: Top Gainers and Losers state
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [commodities, setCommodities] = useState([]);



  useEffect(() => {
    const animateNumbers = () => {
      const duration = 1000;
      const steps = 60;
      const stepDuration = duration / steps;
      let currentStep = 0;
      const startNifty = animatedNumbers.nifty;
      const startSensex = animatedNumbers.sensex;
      const diffNifty = marketData.nifty.price - startNifty;
      const diffSensex = marketData.sensex.price - startSensex;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        setAnimatedNumbers({
          nifty: Math.floor(startNifty + diffNifty * progress),
          sensex: Math.floor(startSensex + diffSensex * progress),
        });
        if (currentStep >= steps) clearInterval(timer);
      }, stepDuration);
    };
    animateNumbers();
  }, [marketData]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch('http://localhost:5000/market-data');
        const data = await res.json();
        setMarketData(data);
      } catch (err) {
        console.error("❌ Failed to fetch market data:", err);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/search-stock?query=${searchTerm}`);
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.slice(0, 5));
      } catch (error) {
        console.error("❌ Failed to fetch stock suggestions:", error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
    const fetchTopCompanies = async () => {
      try {
        const res = await fetch('http://localhost:5000/nifty-top-companies');
        const data = await res.json();
        setNiftyTopCompanies(data);
      } catch (err) {
        console.error("❌ Failed to fetch NIFTY top companies:", err);
      }
    };

    fetchTopCompanies();
  }, []);

  // NEW: Fetch top movers (gainers and losers)
  useEffect(() => {
    const fetchTopMovers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/top-movers');
        if (!res.ok) throw new Error('Failed to fetch top movers');
        const data = await res.json();
        setTopGainers(data.topGainers);
        setTopLosers(data.topLosers);
      } catch (err) {
        console.error('❌ Failed to fetch top movers:', err);
      }
    };

    fetchTopMovers();
    const interval = setInterval(fetchTopMovers, 30000); // Refresh every 30 sec
    return () => clearInterval(interval);
  }, []);

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'Bullish': return 'text-success';
      case 'Bearish': return 'text-danger';
      default: return 'text-warning';
    }
  };

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'Bullish': return <TrendingUp size={20} />;
      case 'Bearish': return <TrendingDown size={20} />;
      default: return <Minus size={20} />;
    }
  };

  const fixSymbol = (symbol) => {
    if (!symbol.includes('.')) {
      return symbol.toUpperCase() + '.NS';
    }
    return symbol.toUpperCase();
  };

  const handleSuggestionClick = (symbol) => {
    setSearchTerm('');
    setSuggestions([]);
    navigate(`/stock/${fixSymbol(symbol)}`);
  };

  const handleCompanyClick = (symbol) => {
    navigate(`/stock/${fixSymbol(symbol)}`);
  };
  useEffect(() => {
  const fetchCommodities = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/top-commodities');
      const data = await res.json();
      setCommodities(data.topCommodities || []);
    } catch (err) {
      console.error('❌ Failed to fetch commodities:', err);
    }
  };

  fetchCommodities();
  const interval = setInterval(fetchCommodities, 60000); // refresh every 1 min
  return () => clearInterval(interval);
}, []);


  return (
    <div className="min-vh-100 bg-dark text-white overflow-hidden p-4">
      <div className="container">
        <ScrollingNavbar
          niftyTopCompanies={niftyTopCompanies}
          handleCompanyClick={handleCompanyClick}
          scrollSpeed={200}
        />

        <header className="text-center mb-5">
          <h1 className="display-1 fw-bold text-primary">MarketPulse</h1>
          <p className="fs-4">Your Gateway to Smart Investing</p>
        </header>

        <section className="mb-5">
          <h2 className="fs-2 fw-bold text-center mb-4">📈 Real-Time Market Data</h2>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card bg-secondary p-4 shadow">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="text-primary">NIFTY 50</h3>
                  <BarChart3 />
                </div>
                <h2>₹{animatedNumbers.nifty.toLocaleString('en-IN')}</h2>
                <div className={`d-flex align-items-center ${marketData.nifty.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {marketData.nifty.changePercent >= 0 ? <ArrowUp /> : <ArrowDown />}
                  <span className="ms-2">
                    {marketData.nifty.change.toFixed(2)} ({marketData.nifty.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card bg-secondary p-4 shadow">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="text-success">SENSEX</h3>
                  <BarChart3 />
                </div>
                <h2>₹{animatedNumbers.sensex.toLocaleString('en-IN')}</h2>
                <div className={`d-flex align-items-center ${marketData.sensex.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {marketData.sensex.changePercent >= 0 ? <ArrowUp /> : <ArrowDown />}
                  <span className="ms-2">
                    {marketData.sensex.change.toFixed(2)} ({marketData.sensex.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center mb-5">
          <div className="d-inline-flex align-items-center gap-3 p-3 border rounded-pill bg-secondary">
            <span className="fw-medium">Market Mood:</span>
            <div className={`d-flex align-items-center gap-2 ${getMoodColor(marketData.mood)}`}>
              {getMoodIcon(marketData.mood)}
              <span className="fw-bold">{marketData.mood}</span>
            </div>
          </div>
        </section>

        {/* NEW: Top Gainers and Losers Section */}
        <section className="mb-5">
          <h2 className="fs-2 fw-bold text-center mb-4">🔥 Top Market Movers</h2>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card bg-secondary p-4 shadow">
                <h3 className="text-success mb-3">Top Gainers</h3>
                {topGainers.length === 0 ? (
                  <p>No data available</p>
                ) : (
                  <ul className="list-unstyled">
                    {topGainers.map((stock, idx) => (
                      <li
                        key={idx}
                        className="mb-2 cursor-pointer"
                        onClick={() => navigate(`/stock/${fixSymbol(stock.symbol)}`)}
                      >
                        <strong>{stock.name}</strong> ({stock.symbol}) - ₹{stock.price.toLocaleString('en-IN')} {' '}
                        <span className="text-success">+{stock.changePercent.toFixed(2)}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="card bg-secondary p-4 shadow">
                <h3 className="text-danger mb-3">Top Losers</h3>
                {topLosers.length === 0 ? (
                  <p>No data available</p>
                ) : (
                  <ul className="list-unstyled">
                    {topLosers.map((stock, idx) => (
                      <li
                        key={idx}
                        className="mb-2 cursor-pointer"
                        onClick={() => navigate(`/stock/${fixSymbol(stock.symbol)}`)}
                      >
                        <strong>{stock.name}</strong> ({stock.symbol}) - ₹{stock.price.toLocaleString('en-IN')} {' '}
                        <span className="text-danger">{stock.changePercent.toFixed(2)}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 text-center">
          <h2 className="fs-2 fw-bold mb-4">🚀 Powerful Tools</h2>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Track Portfolio</button>
            <button className="btn btn-success" onClick={() => navigate('/track-trade')}>Track Trade</button>
            <button className="btn btn-warning" onClick={() => navigate('/calculator')}>Return Calculator</button>
            <button className="btn btn-info" onClick={() => navigate('/article')}>Articles</button>
          </div>
        </section>

        <section className="mb-5">
          <div className="position-relative">
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3" />
              <input
                type="text"
                placeholder="Search by stock (Minimum 5 letters)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control ps-5"
              />
            </div>

            {searchTerm && suggestions.length > 0 && (
              <div className="position-absolute bg-light border rounded w-100 mt-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 border-bottom hover-bg-secondary cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion.symbol)}
                  >
                    <strong>{suggestion.symbol}</strong><br />
                    <small>{suggestion.name} ({suggestion.exchDisp})</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-3">
          {niftyTopCompanies.map((company, index) => (
            <div key={index} className="col" onClick={() => navigate(`/stock/${fixSymbol(company.symbol)}`)}>
              <div className="card bg-dark text-white border-secondary shadow-sm" style={{ cursor: 'pointer' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h6>{company.name}</h6>
                    <span className="badge bg-secondary">{company.symbol.toUpperCase()}</span>
                  </div>
                  <h5>₹{company.price?.toFixed(2)}</h5>
                  <div className={`fw-semibold ${company.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                    {company.changePercent >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />} {company.change?.toFixed(2)} ({company.changePercent?.toFixed(2)}%)
                  </div>
                  <div className="pt-2">
                    <small className="text-muted">Click for details</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-5">
  <h2 className="fs-2 fw-bold text-center mb-4">🌍 Top Commodities</h2>
  <div className="row g-4">
    {commodities.length === 0 ? (
      <div className="text-center">No commodities data available</div>
    ) : (
      commodities.map((item, idx) => (
        <div key={idx} className="col-md-6 col-lg-4">
          <div className="card bg-secondary p-4 shadow h-100">
            <h4 className="fw-bold">{item.name}</h4>
            <p className="mb-2 text-muted">{item.symbol}</p>
            <h5>₹{item.price.toLocaleString('en-IN')}</h5>
            <div className={`fw-semibold ${item.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {item.changePercent >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              {Math.abs(item.change).toFixed(2)} ({Math.abs(item.changePercent).toFixed(2)}%)
            </div>
          </div>
        </div>
      ))
    )}
  </div>
</section>


        <footer className="text-center py-4 border-top mt-5">
          <p>© 2025 MarketPulse. Empowering your investment journey with real-time insights.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
