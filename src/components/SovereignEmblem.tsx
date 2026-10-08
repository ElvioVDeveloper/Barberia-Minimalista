import React from 'react';

interface SovereignEmblemProps {
  className?: string;
}

export const SovereignEmblem: React.FC<SovereignEmblemProps> = ({ className = 'w-14 h-14' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Emblema Sovereign Craft"
    >
      {/* Dotted outer ring */}
      <circle
        cx="100"
        cy="100"
        r="92"
        stroke="#D4AF37"
        strokeWidth="4.5"
        strokeDasharray="4.5 9.15"
      />
      {/* Solid inner ring */}
      <circle cx="100" cy="100" r="80" stroke="#D4AF37" strokeWidth="4" />

      {/* 4 Cardinal Tick Marks (Top, Right, Bottom, Left) */}
      <line
        x1="100"
        y1="43"
        x2="100"
        y2="56"
        stroke="#D4AF37"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="157"
        y1="100"
        x2="144"
        y2="100"
        stroke="#D4AF37"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="157"
        x2="100"
        y2="144"
        stroke="#D4AF37"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="43"
        y1="100"
        x2="56"
        y2="100"
        stroke="#D4AF37"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* 4 Diagonal Crossed Protruding Bars behind center circle */}
      <line
        x1="70"
        y1="63"
        x2="130"
        y2="137"
        stroke="#D4AF37"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <line
        x1="130"
        y1="63"
        x2="70"
        y2="137"
        stroke="#D4AF37"
        strokeWidth="8.5"
        strokeLinecap="round"
      />

      {/* Central Black Circle with Gold Border */}
      <circle
        cx="100"
        cy="100"
        r="28"
        fill="#121214"
        stroke="#D4AF37"
        strokeWidth="4.5"
      />

      {/* Central Crossed Shears / X inside Black Circle */}
      <line
        x1="94"
        y1="90"
        x2="106"
        y2="110"
        stroke="#D4AF37"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="106"
        y1="90"
        x2="94"
        y2="110"
        stroke="#D4AF37"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};
