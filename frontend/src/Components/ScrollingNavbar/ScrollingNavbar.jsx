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
    <nav className="bg-dark bg-opacity-75 border-bottom border-secondary py-2 px-3 sticky-top overflow-hidden">
      <div
        ref={scrollRef}
        className="d-flex scrolling-content gap-2"
        style={{
          whiteSpace: 'nowrap',
          animation: `scroll-left ${animationDuration}s linear infinite`,
        }}
      >
        {duplicated.map((company, idx) => {
          const positive = company.changePercent >= 0;
          const bgClass = positive ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger';
          return (
            <button
              key={`${company.symbol}-${idx}`}
              onClick={() => handleCompanyClick(company.symbol)}
              className={`d-flex flex-column align-items-center px-3 py-1 rounded btn-sm ${bgClass} border-0`}
              style={{ minWidth: '110px' }}
            >
              <span className="fw-semibold small">{company.symbol.toUpperCase()}</span>
              <span className="text-muted small">₹{company.price?.toFixed(2)}</span>
              <span className="d-flex align-items-center small">
                {positive ? <ArrowUp size={12} className="me-1" /> : <ArrowDown size={12} className="me-1" />}
                {company.changePercent?.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .scrolling-content:hover {
          animation-play-state: paused !important;
          cursor: pointer;
        }
      `}</style>
    </nav>
  );
};

export default ScrollingNavbar;
