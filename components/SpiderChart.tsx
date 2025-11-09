'use client';

import { useMemo } from 'react';
import { ComparisonItem, UserPreferences } from '@/types/comparison';

interface SpiderChartProps {
  items: ComparisonItem[];
  userPreferences: UserPreferences;
}

const ITEM_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function getItemColor(itemId: string, allItems: ComparisonItem[]): string {
  const index = allItems.findIndex(item => item.id === itemId);
  return ITEM_COLORS[index % ITEM_COLORS.length];
}

export default function SpiderChart({ items, userPreferences }: SpiderChartProps) {
  const chartData = useMemo(() => {
    const allCategories = new Set<string>();
    items.forEach(item => {
      item.points.forEach(point => allCategories.add(point.category));
    });

    const categories = Array.from(allCategories);

    const itemScores = items.map(item => {
      const categoryScores = categories.map(category => {
        const points = item.points.filter(p => p.category === category);
        const categoryWeight = userPreferences.categoryWeights.find(
          cw => cw.category.toLowerCase() === category.toLowerCase()
        );
        const categoryImportance = categoryWeight?.importance ?? 5;

        let score = 0;
        points.forEach(point => {
          const polarityMultiplier = point.type === 'pro' ? 1 : point.type === 'con' ? -1 : 0;
          const finalWeight = (point.weight * categoryImportance) / 10;
          score += finalWeight * polarityMultiplier;
        });

        const normalized = Math.max(0, Math.min(10, (score + 10) / 2));
        return normalized;
      });

      return { name: item.name, scores: categoryScores };
    });

    return { categories, itemScores };
  }, [items, userPreferences]);

  const size = 250;
  const center = size / 2;
  const radius = size / 2 - 60;
  const numCategories = chartData.categories.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numCategories - Math.PI / 2;
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
        {[2, 4, 6, 8, 10].map(level => {
          const points = chartData.categories.map((_, i) => getPoint(i, level)).map(p => `${p.x},${p.y}`).join(' ');
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {chartData.categories.map((_, i) => {
          const point = getPoint(i, 10);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {chartData.itemScores.map((item, itemIndex) => {
          const points = item.scores.map((score, i) => getPoint(i, score)).map(p => `${p.x},${p.y}`).join(' ');
          const color = getItemColor(items[itemIndex].id, items);
          return (
            <g key={item.name}>
              <polygon
                points={points}
                fill={color}
                fillOpacity="0.2"
                stroke={color}
                strokeWidth="2"
              />
            </g>
          );
        })}

        {chartData.categories.map((category, i) => {
          const point = getPoint(i, 11.5);
          const textAnchor =
            point.x < center - 5 ? 'end' :
            point.x > center + 5 ? 'start' :
            'middle';

          return (
            <text
              key={category}
              x={point.x}
              y={point.y}
              textAnchor={textAnchor}
              className="fill-gray-700"
              style={{ fontSize: '6px', fontWeight: '500' }}
            >
              {category}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {chartData.itemScores.map((item, i) => {
          const color = getItemColor(items[i].id, items);
          return (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700 font-medium">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
