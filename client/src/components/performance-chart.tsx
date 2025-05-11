import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { ArrowUp, ArrowRight } from 'lucide-react';
import { Result } from '@shared/schema';
import { formatResult } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Register Chart.js components
Chart.register(...registerables);

interface PerformanceChartProps {
  title: string;
  event: string;
  results: Result[];
  improving?: boolean;
  stable?: boolean;
}

export function PerformanceChart({ 
  title, 
  event, 
  results, 
  improving = false,
  stable = false
}: PerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Sort results by date
    const sortedResults = [...results].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Get numeric values and labels (dates)
    const values = sortedResults.map(r => r.result);
    const labels = sortedResults.map(r => {
      const date = new Date(r.createdAt);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Determine if lower is better (e.g. for time-based events)
      const lowerIsBetter = event.includes('m') && !event.includes('Jump');
      
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: event,
                data: values,
                fill: false,
                borderColor: event.includes('Sprint') ? '#3D68FF' : '#FF5A5F',
                tension: 0.3,
                borderWidth: 3,
                pointBackgroundColor: event.includes('Sprint') ? '#FF5A5F' : '#3D68FF',
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                suggestedMin: lowerIsBetter ? Math.min(...values) * 0.98 : undefined, 
                suggestedMax: lowerIsBetter ? undefined : Math.max(...values) * 1.02,
                grid: {
                  color: 'rgba(200, 200, 200, 0.2)',
                },
                ticks: {
                  callback: function(value) {
                    return formatResult(value as number, event).replace('s', '');
                  },
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return formatResult(context.parsed.y, event);
                  },
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [event, results]);

  // Calculate statistics
  const bestResult = results.length > 0 
    ? Math.min(...results.map(r => r.result)) 
    : 0;
  const lastResult = results.length > 0 
    ? results[results.length - 1].result 
    : 0;
  const average = results.length > 0 
    ? results.reduce((sum, r) => sum + r.result, 0) / results.length 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">{title}</h4>
        {improving && (
          <div className="flex items-center space-x-1 text-success text-sm">
            <ArrowUp className="h-4 w-4" />
            <span>Improving</span>
          </div>
        )}
        {stable && (
          <div className="flex items-center space-x-1 text-warning text-sm">
            <ArrowRight className="h-4 w-4" />
            <span>Stable</span>
          </div>
        )}
      </div>
      
      <div className="h-[180px] md:h-[250px] relative">
        <canvas ref={chartRef} />
      </div>
      
      <div className="flex items-center justify-between mt-4 text-sm">
        <div>
          <p className="text-darkGray">Best {event.includes('Jump') ? 'jump' : 'time'}</p>
          <p className="font-bold text-lg">{formatResult(bestResult, event)}</p>
        </div>
        <div>
          <p className="text-darkGray">Last {event.includes('Jump') ? 'jump' : 'time'}</p>
          <p className="font-semibold">{formatResult(lastResult, event)}</p>
        </div>
        <div>
          <p className="text-darkGray">Average</p>
          <p className="font-semibold">{formatResult(average, event)}</p>
        </div>
      </div>
    </div>
  );
}
