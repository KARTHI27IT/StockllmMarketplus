import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import './ScrollingNavbar.css';

const ScrollingNavbar = ({
  niftyTopCompanies = [],
  handleCompanyClick,
  scrollSpeed = 150 // pixels per second
}) => {
  const scrollRef = useRef(null);
  const [animationDuration, setAnimationDuration] = useState(30); // fallback duration

  useEffect(() => {
    if (!scrollRef.current || niftyTopCompanies.length === 0) return;
    const scrollWidth = scrollRef.current.scrollWidth / 2;
    const duration = scrollWidth / scrollSpeed;
    setAnimationDuration(duration);
  }, [niftyTopCompanies, scrollSpeed]);

  const duplicated = [...niftyTopCompanies, ...niftyTopCompanies];

  return (
    <div className="scrolling-navbar">
      <div className="scrolling-container">
        <div
          ref={scrollRef}
          className="scrolling-content"
          style={{
            animation: `scroll-left ${animationDuration}s linear infinite`,
          }}
        >
          {duplicated.map((company, idx) => {
            const positive = company.changePercent >= 0;
            const statusClass = positive ? 'positive' : 'negative';
            
            return (
              <button
                key={`${company.symbol}-${idx}`}
                onClick={() => handleCompanyClick(company.symbol)}
                className={`company-ticker ${statusClass}`}
              >
                <div className="ticker-symbol">{company.symbol.toUpperCase()}</div>
                <div className="ticker-price">₹{company.price?.toFixed(2)}</div>
                <div className="ticker-change">
                  {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  <span>{Math.abs(company.changePercent)?.toFixed(2)}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScrollingNavbar;