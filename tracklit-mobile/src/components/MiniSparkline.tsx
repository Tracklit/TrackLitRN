import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';

interface Props {
  data: number[];
  width: number;
  height: number;
  strokeWidth?: number;
  showDots?: boolean;
}

const getSegmentColor = (value: number): string => {
  if (value >= 7.5) return '#22c55e';
  if (value >= 5) return '#3b82f6';
  if (value >= 3) return '#f97316';
  return '#ef4444';
};

export const MiniSparkline: React.FC<Props> = ({
  data,
  width,
  height,
  strokeWidth = 2,
  showDots = false,
}) => {
  if (!data || data.length < 2) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = strokeWidth;
  const innerH = height - pad * 2;
  const innerW = width - pad * 2;

  const toX = (i: number) => pad + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => pad + innerH - ((v - min) / range) * innerH;

  return (
    <Svg width={width} height={height}>
      {data.slice(0, -1).map((v, i) => {
        const segAvg = (v + data[i + 1]) / 2;
        return (
          <Line
            key={i}
            x1={toX(i)}
            y1={toY(v)}
            x2={toX(i + 1)}
            y2={toY(data[i + 1])}
            stroke={getSegmentColor(segAvg)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
      {showDots &&
        data.map((v, i) => (
          <Circle
            key={`dot-${i}`}
            cx={toX(i)}
            cy={toY(v)}
            r={strokeWidth + 0.5}
            fill={getSegmentColor(v)}
          />
        ))}
    </Svg>
  );
};
