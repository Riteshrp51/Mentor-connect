import React from 'react';
import './BrandLoader.css';

const BrandLoader = ({ fullScreen = true, style = {} }) => {
  return (
    <div
      className={fullScreen ? 'brand-loader-overlay' : 'brand-loader-inline'}
      style={style}
      role="status"
      aria-label="Loading MentorConnect"
    >
      {/* Background Radial Grid Pattern */}
      <div className="brand-loader-grid-bg" />

      {/* Ambient Center Glow */}
      <div className="brand-loader-ambient-glow" />

      {/* Central Interactive Loader Content */}
      <div className="brand-loader-content">
        <div className="brand-loader-svg-box">
          <svg
            className="brand-loader-svg"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Linear & Radial Gradients */}
              <linearGradient id="blOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0084FF" />
                <stop offset="50%" stopColor="#00B4D8" />
                <stop offset="100%" stopColor="#00F5D4" />
              </linearGradient>

              <linearGradient id="blStudentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0062E6" />
                <stop offset="100%" stopColor="#00B4D8" />
              </linearGradient>

              <linearGradient id="blMentorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B2545" />
                <stop offset="100%" stopColor="#13315C" />
              </linearGradient>

              <linearGradient id="blChatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#00F5D4" />
              </linearGradient>

              <filter id="blGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer Swirling Orbit Ring 1 (Clockwise) */}
            <path
              d="M 150, 25 A 125,125 0 1,1 149.9,25"
              stroke="url(#blOrbitGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="180 120"
              className="mc-orbit-spin mc-glow-teal"
              fill="none"
              opacity="0.9"
            />

            {/* Outer Counter-Swirling Orbit Ring 2 (Dashed Reverse) */}
            <path
              d="M 150, 38 A 112,112 0 1,0 149.9,38"
              stroke="#0084FF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40 90"
              className="mc-orbit-spin-reverse"
              fill="none"
              opacity="0.65"
            />

            {/* Orbiting Particle Node */}
            <g className="mc-orbit-spin">
              <circle cx="150" cy="25" r="7" fill="#00F5D4" className="mc-glow-teal" />
              <circle cx="150" cy="25" r="12" fill="#00F5D4" opacity="0.3" />
            </g>

            {/* Main Emblem Floating Group */}
            <g className="mc-float">
              {/* 1. CHAT BUBBLE WITH ANIMATED TYPING DOTS */}
              <g transform="translate(118, 52)">
                <path
                  d="M 12 0 C 28 0 38 9 38 22 C 38 32 30 38 18 39 C 14 44 6 47 2 48 C 5 43 7 39 6 36 C 2 32 0 27 0 22 C 0 9 12 0 22 0 Z"
                  fill="url(#blChatGrad)"
                  className="mc-glow-teal"
                />
                <circle
                  cx="13"
                  cy="20"
                  r="2.8"
                  fill="#0B2545"
                  className="mc-dot-bounce"
                  style={{ animationDelay: '0s' }}
                />
                <circle
                  cx="21"
                  cy="20"
                  r="2.8"
                  fill="#0B2545"
                  className="mc-dot-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <circle
                  cx="29"
                  cy="20"
                  r="2.8"
                  fill="#0B2545"
                  className="mc-dot-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </g>

              {/* 2. STUDENT FIGURE (LEFT) */}
              <g transform="translate(68, 92)">
                <circle cx="42" cy="28" r="22" fill="url(#blStudentGrad)" />
                <path
                  d="M 12,50 C 6,50 2,58 2,75 C 2,90 8,102 16,102 C 22,102 24,92 24,75 C 24,58 18,50 12,50 Z"
                  fill="#0052CC"
                />
                <path
                  d="M 24,65 C 24,52 38,48 55,48 C 65,48 72,55 78,65 L 90,82 C 94,87 88,94 80,92 L 56,86 C 45,83 24,80 24,65 Z"
                  fill="url(#blStudentGrad)"
                />
              </g>

              {/* 3. MENTOR FIGURE WITH GRADUATION CAP (RIGHT) */}
              <g transform="translate(150, 72)">
                <circle cx="50" cy="46" r="24" fill="#13315C" />
                <path
                  d="M 12,30 L 50,12 L 88,30 L 50,44 Z"
                  fill="#0B2545"
                  stroke="#00B4D8"
                  strokeWidth="2"
                />
                <path
                  d="M 28,37 L 28,52 C 28,58 72,58 72,52 L 72,37"
                  fill="#0B2545"
                />
                <path
                  d="M 82,31 L 86,48 L 84,52"
                  stroke="#00F5D4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="84" cy="53" r="2" fill="#00F5D4" />
                <path
                  d="M 20,86 C 20,68 36,62 50,62 C 64,62 80,68 80,86 L 80,105 L 20,105 Z"
                  fill="#13315C"
                />
                <path d="M 40,62 L 50,82 L 60,62 Z" fill="#0084FF" opacity="0.6" />
              </g>

              {/* 4. LAPTOP IN THE MIDDLE */}
              <g transform="translate(132, 160)">
                <path
                  d="M 6,0 L 52,0 C 56,0 58,3 58,7 L 54,32 L 4,32 L 0,7 C 0,3 2,0 6,0 Z"
                  fill="#0B2545"
                  stroke="#00B4D8"
                  strokeWidth="2"
                />
                <rect
                  x="6"
                  y="4"
                  width="46"
                  height="23"
                  rx="2"
                  fill="#0084FF"
                  opacity="0.8"
                  className="mc-pulse-glow"
                />
                <circle cx="29" cy="15.5" r="3.5" fill="#00F5D4" />
                <path
                  d="M -10,32 L 68,32 C 72,32 74,35 72,38 L 64,41 C 63,42 2,42 0,41 L -8,38 C -10,35 -8,32 -10,32 Z"
                  fill="#1E293B"
                  stroke="#00B4D8"
                  strokeWidth="1.5"
                />
              </g>

              {/* Bottom Connecting Arc Swoosh */}
              <path
                d="M 85,215 C 130,235 180,235 220,210"
                stroke="url(#blOrbitGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                className="mc-glow-teal"
              />
            </g>
          </svg>
        </div>

        {/* Brand Typography */}
        <div className="brand-loader-typography">
          <h2 className="brand-loader-title">
            Mentor<span className="brand-loader-accent">Connect</span>
          </h2>
          <p className="brand-loader-tagline">
            LEARN <span className="brand-loader-dot">•</span> GROW{' '}
            <span className="brand-loader-dot">•</span> SUCCEED
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandLoader;
