import React from 'react';

export function StopwatchBackground() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 w-full h-full -z-10 opacity-20"
    >
      {/* Outer Ring */}
      <circle cx="150" cy="150" r="145" fill="none" stroke="#000" strokeWidth="2" />
      
      {/* Stopwatch Body */}
      <circle cx="150" cy="150" r="135" fill="none" stroke="#000" strokeWidth="4" />
      
      {/* Ticks for minutes/seconds */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 6) * (Math.PI / 180);
        const isMainTick = i % 5 === 0;
        const tickLength = isMainTick ? 15 : 7;
        const strokeWidth = isMainTick ? 2 : 1;
        const x1 = 150 + 120 * Math.sin(angle);
        const y1 = 150 - 120 * Math.cos(angle);
        const x2 = 150 + (120 - tickLength) * Math.sin(angle);
        const y2 = 150 - (120 - tickLength) * Math.cos(angle);
        
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#333"
            strokeWidth={strokeWidth}
          />
        );
      })}
      
      {/* Main numbers */}
      {[0, 3, 6, 9].map((num, i) => {
        const angle = (i * 90) * (Math.PI / 180);
        const x = 150 + 95 * Math.sin(angle);
        const y = 150 - 95 * Math.cos(angle);
        
        return (
          <text
            key={i}
            x={x}
            y={y + 6} // Adjust for vertical centering
            fontSize="18"
            fontWeight="bold"
            fill="#222"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {num === 0 ? 12 : num}
          </text>
        );
      })}
      
      {/* Secondary numbers */}
      {[1, 2, 4, 5, 7, 8, 10, 11].map((num, i) => {
        const realIndex = i < 2 ? i : i < 4 ? i + 1 : i < 6 ? i + 2 : i + 3;
        const angle = (realIndex * 30) * (Math.PI / 180);
        const x = 150 + 95 * Math.sin(angle);
        const y = 150 - 95 * Math.cos(angle);
        
        return (
          <text
            key={i}
            x={x}
            y={y + 5} // Adjust for vertical centering
            fontSize="14"
            fill="#444"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {num}
          </text>
        );
      })}
      
      {/* Top button */}
      <circle cx="150" cy="45" r="10" fill="#444" />
      <rect x="145" y="45" width="10" height="25" fill="#444" />
      
      {/* Side buttons */}
      <circle cx="50" cy="150" r="8" fill="#555" />
      <circle cx="30" cy="150" r="8" fill="#555" />
      
      {/* Center pin */}
      <circle cx="150" cy="150" r="8" fill="#666" />
      <circle cx="150" cy="150" r="4" fill="#333" />
    </svg>
  );
}