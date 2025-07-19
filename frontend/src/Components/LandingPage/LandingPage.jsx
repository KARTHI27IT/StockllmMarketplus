import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import {
  Search, TrendingUp, TrendingDown, BarChart3, Calculator,
  PenTool, Briefcase, Activity, ArrowUp, ArrowDown, Minus,
  Star, Shield, Zap, Target, Users, Award
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
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
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
    const interval = setInterval(fetchTopMovers, 30000);
    return () => clearInterval(interval);
  }, []);

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
    const interval = setInterval(fetchCommodities, 60000);
    return () => clearInterval(interval);
  }, []);

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'Bullish': return 'status-positive';
      case 'Bearish': return 'status-negative';
      default: return 'status-neutral';
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

  const features = [
    {
      icon: <BarChart3 size={24} />,
      title: "Real-time Market Data",
      description: "Get live updates on NIFTY, SENSEX, and top stocks with real-time price movements."
    },
    {
      icon: <Camera size={24} />,
      title: "Portfolio Tracking",
      description: "Upload screenshots of your portfolio and get AI-powered analysis and insights."
    },
    {
      icon: <Calculator size={24} />,
      title: "Return Calculator",
      description: "Calculate compound interest, simple interest, and investment returns with ease."
    },
    {
      icon: <FileText size={24} />,
      title: "Market Articles",
      description: "Read and write articles about market trends, investment strategies, and financial insights."
    },
    {
      icon: <Shield size={24} />,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security and reliable infrastructure."
    },
    {
      icon: <Zap size={24} />,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations and analysis powered by advanced AI technology."
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading market data...</p>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="container">
        {/* Scrolling Ticker */}
        <ScrollingNavbar
          niftyTopCompanies={niftyTopCompanies}
          handleCompanyClick={handleCompanyClick}
          scrollSpeed={200}
        />

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <Star size={16} />
              <span>India's Leading Stock Analysis Platform</span>
            </div>
            <h1 className="hero-title">
              Smart Investing with
              <span className="gradient-text"> AI-Powered Insights</span>
            </h1>
            <p className="hero-description">
              Track your portfolio, analyze market trends, and make informed investment decisions 
              with our comprehensive suite of financial tools powered by artificial intelligence.
            </p>
            <div className="hero-actions">
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
              </button>
              <button 
                className="btn btn-outline btn-lg"
                onClick={() => navigate('/track-trade')}
              >
                Try Demo
              </button>
            </div>
          </div>
        </section>

        {/* Market Overview */}
        <section className="market-overview">
          <h2 className="section-title">Market Overview</h2>
          <div className="market-cards">
            <div className="metric-card">
              <div className="metric-header">
                <BarChart3 size={24} />
                <span>NIFTY 50</span>
              </div>
              <div className="metric-value">₹{animatedNumbers.nifty.toLocaleString('en-IN')}</div>
              <div className={`metric-change ${marketData.nifty.changePercent >= 0 ? 'status-positive' : 'status-negative'}`}>
                {marketData.nifty.changePercent >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span>{marketData.nifty.change.toFixed(2)} ({marketData.nifty.changePercent.toFixed(2)}%)</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <BarChart3 size={24} />
                <span>SENSEX</span>
              </div>
              <div className="metric-value">₹{animatedNumbers.sensex.toLocaleString('en-IN')}</div>
              <div className={`metric-change ${marketData.sensex.changePercent >= 0 ? 'status-positive' : 'status-negative'}`}>
                {marketData.sensex.changePercent >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span>{marketData.sensex.change.toFixed(2)} ({marketData.sensex.changePercent.toFixed(2)}%)</span>
              </div>
            </div>

            <div className="metric-card mood-card">
              <div className="metric-header">
                <Activity size={24} />
                <span>Market Mood</span>
              </div>
              <div className={`mood-indicator ${getMoodColor(marketData.mood)}`}>
                {getMoodIcon(marketData.mood)}
                <span>{marketData.mood}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="search-section">
          <h2 className="section-title">Search Stocks</h2>
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search stocks by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control search-input"
              />
            </div>

            {searchTerm && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="search-suggestion"
                    onClick={() => handleSuggestionClick(suggestion.symbol)}
                  >
                    <div className="suggestion-symbol">{suggestion.symbol}</div>
                    <div className="suggestion-name">{suggestion.name}</div>
                    <div className="suggestion-exchange">{suggestion.exchDisp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Top Movers */}
        <section className="top-movers">
          <h2 className="section-title">Top Market Movers</h2>
          <div className="movers-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="text-success">
                  <TrendingUp size={20} />
                  Top Gainers
                </h3>
              </div>
              <div className="card-body">
                {topGainers.length === 0 ? (
                  <p className="text-gray-500">No data available</p>
                ) : (
                  <div className="movers-list">
                    {topGainers.map((stock, idx) => (
                      <div
                        key={idx}
                        className="mover-item cursor-pointer"
                        onClick={() => navigate(`/stock/${fixSymbol(stock.symbol)}`)}
                      >
                        <div className="mover-info">
                          <div className="mover-name">{stock.name}</div>
                          <div className="mover-symbol">{stock.symbol}</div>
                        </div>
                        <div className="mover-price">
                          <div className="price">₹{stock.price.toLocaleString('en-IN')}</div>
                          <div className="change status-positive">+{stock.changePercent.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-danger">
                  <TrendingDown size={20} />
                  Top Losers
                </h3>
              </div>
              <div className="card-body">
                {topLosers.length === 0 ? (
                  <p className="text-gray-500">No data available</p>
                ) : (
                  <div className="movers-list">
                    {topLosers.map((stock, idx) => (
                      <div
                        key={idx}
                        className="mover-item cursor-pointer"
                        onClick={() => navigate(`/stock/${fixSymbol(stock.symbol)}`)}
                      >
                        <div className="mover-info">
                          <div className="mover-name">{stock.name}</div>
                          <div className="mover-symbol">{stock.symbol}</div>
                        </div>
                        <div className="mover-price">
                          <div className="price">₹{stock.price.toLocaleString('en-IN')}</div>
                          <div className="change status-negative">{stock.changePercent.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2 className="section-title">Get Started</h2>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => navigate('/track-trade')}
            >
              <Camera size={32} />
              <h3>Track Portfolio</h3>
              <p>Upload screenshots and get AI analysis</p>
            </button>
            <button 
              className="action-card"
              onClick={() => navigate('/calculator')}
            >
              <Calculator size={32} />
              <h3>Calculate Returns</h3>
              <p>Use our investment calculators</p>
            </button>
            <button 
              className="action-card"
              onClick={() => navigate('/article')}
            >
              <PenTool size={32} />
              <h3>Read Articles</h3>
              <p>Stay updated with market insights</p>
            </button>
          </div>
        </section>

        {/* Top Companies Grid */}
        <section className="companies-section">
          <h2 className="section-title">NIFTY 50 Companies</h2>
          <div className="companies-grid">
            {niftyTopCompanies.slice(0, 12).map((company, index) => (
              <div 
                key={index} 
                className="company-card cursor-pointer" 
                onClick={() => navigate(`/stock/${fixSymbol(company.symbol)}`)}
              >
                <div className="company-header">
                  <div className="company-name">{company.name}</div>
                  <div className="company-symbol">{company.symbol.toUpperCase()}</div>
                </div>
                <div className="company-price">₹{company.price?.toFixed(2)}</div>
                <div className={`company-change ${company.changePercent >= 0 ? 'status-positive' : 'status-negative'}`}>
                  {company.changePercent >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  <span>{company.change?.toFixed(2)} ({company.changePercent?.toFixed(2)}%)</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/detailsTable')}
            >
              View All Companies
            </button>
          </div>
        </section>

        {/* Commodities Section */}
        <section className="commodities-section">
          <h2 className="section-title">Top Commodities</h2>
          <div className="commodities-grid">
            {commodities.length === 0 ? (
              <div className="text-center">
                <p className="text-gray-500">No commodities data available</p>
              </div>
            ) : (
              commodities.slice(0, 6).map((item, idx) => (
                <div key={idx} className="commodity-card">
                  <h4 className="commodity-name">{item.name}</h4>
                  <p className="commodity-symbol">{item.symbol}</p>
                  <div className="commodity-price">₹{item.price.toLocaleString('en-IN')}</div>
                  <div className={`commodity-change ${item.changePercent >= 0 ? 'status-positive' : 'status-negative'}`}>
                    {item.changePercent >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{Math.abs(item.change).toFixed(2)} ({Math.abs(item.changePercent).toFixed(2)}%)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <TrendingUp size={24} />
              <span>StockLLM</span>
            </div>
            <p className="footer-text">
              Empowering your investment journey with AI-powered insights and real-time market data.
            </p>
            <div className="footer-stats">
              <div className="stat">
                <Users size={20} />
                <span>10,000+ Users</span>
              </div>
              <div className="stat">
                <Award size={20} />
                <span>Trusted Platform</span>
              </div>
              <div className="stat">
                <Shield size={20} />
                <span>Secure & Reliable</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 StockLLM. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;