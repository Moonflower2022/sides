'use client';

import { useMemo, useState } from 'react';
import { useComparisonStore } from '@/lib/store';
import { rankItems } from '@/lib/scoring/calculator';
import { Trophy, Download, RotateCcw, Medal, Award, X, Edit2, Check } from 'lucide-react';
import ItemColumn from './ItemColumn';
import EditablePoint from './EditablePoint';
import HistoryPanel from './HistoryPanel';

export default function ComparisonTable() {
  const { comparison, reset, updatePoint, removeItem, updateTitle } = useComparisonStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const scores = useMemo(() => {
    if (!comparison || !comparison.userPreferences) return [];
    return rankItems(comparison.items, comparison.userPreferences);
  }, [comparison]);

  if (!comparison) return null;

  const winner = scores[0];

  const handleExportCSV = () => {
    if (!comparison) return;

    let csv = 'Category,';
    csv += comparison.items.map(item => item.name).join(',') + '\n';

    const allCategories = new Set<string>();
    comparison.items.forEach(item => {
      item.points.forEach(point => allCategories.add(point.category));
    });

    allCategories.forEach(category => {
      csv += category + ',';
      comparison.items.forEach(item => {
        const points = item.points.filter(p => p.category === category);
        const pointsText = points.map(p => `${p.type}: ${p.text}`).join('; ');
        csv += `"${pointsText}",`;
      });
      csv += '\n';
    });

    csv += 'Score,';
    csv += scores.map(s => s.totalScore.toFixed(1)).join(',');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparison.csv';
    a.click();
  };

  const handleTitleEdit = () => {
    setTitleInput(comparison?.title || '');
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (titleInput.trim()) {
      updateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="space-y-6">
      {/* Editable Title */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-3">
          {isEditingTitle ? (
            <>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="flex-1 text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="p-2 hover:bg-green-100 rounded transition-colors"
              >
                <Check className="w-5 h-5 text-green-600" />
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 flex-1">
                {comparison?.title || 'My Comparison'}
              </h2>
              <button
                onClick={handleTitleEdit}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Edit title"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header with Actions */}
      {!comparison.userPreferences?.hideWinner && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Winner: {comparison.items.find(i => i.id === winner?.itemId)?.name}
              </h3>
              <p className="text-sm text-gray-600">
                Score: {winner?.totalScore.toFixed(1)} based on your priorities
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <HistoryPanel />
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Comparison
            </button>
          </div>
        </div>
      )}

      {/* Action buttons when winner is hidden */}
      {comparison.userPreferences?.hideWinner && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-end">
          <div className="flex gap-2">
            <HistoryPanel />
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Comparison
            </button>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {/* Table structure for aligned comparison */}
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header Row - Item Names */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  Category
                </th>
                {comparison.items.map((item) => {
                  const score = scores.find(s => s.itemId === item.id);
                  return (
                    <th key={item.id} className="px-6 py-4 text-left border-l border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          {comparison.userPreferences?.showScores && (
                            <>
                              {score?.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                              {score?.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                              {score?.rank === 3 && <Award className="w-5 h-5 text-amber-600" />}
                            </>
                          )}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors group"
                            title="Delete this item"
                          >
                            <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 font-normal mb-3">{item.description}</p>
                      )}
                      {score && comparison.userPreferences?.showScores && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="text-xs font-medium text-gray-700">Score</div>
                          <div className="text-xl font-bold text-blue-600">
                            {score.totalScore.toFixed(1)}
                            <span className="text-xs text-gray-500 ml-1">/ 100</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Rank #{score.rank}</div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Category Rows */}
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                // Collect all unique categories
                const allCategories = new Set<string>();
                comparison.items.forEach(item => {
                  item.points.forEach(point => allCategories.add(point.category));
                });

                // Sort categories by average importance
                const categoryImportance = Array.from(allCategories).map(category => {
                  const categoryWeight = comparison.userPreferences?.categoryWeights.find(
                    cw => cw.category.toLowerCase() === category.toLowerCase()
                  );
                  return {
                    category,
                    importance: categoryWeight?.importance ?? 5
                  };
                });
                categoryImportance.sort((a, b) => b.importance - a.importance);

                return categoryImportance.map(({ category, importance }) => (
                  <tr key={category} className="hover:bg-gray-50 transition-colors">
                    {/* Category Name (Sticky Column) */}
                    <td className="px-6 py-4 align-top sticky left-0 bg-white z-10 border-r border-gray-200">
                      <div className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-1">
                        {category}
                      </div>
                      <div className="text-xs text-gray-500">
                        Priority: {importance}/10
                      </div>
                    </td>

                    {/* Points for each item in this category */}
                    {comparison.items.map((item) => {
                      const points = item.points.filter(p => p.category === category);
                      return (
                        <td key={item.id} className="px-6 py-4 align-top border-l border-gray-200">
                          <div className="space-y-2">
                            {points.length === 0 ? (
                              <div className="text-sm text-gray-400 italic">No data</div>
                            ) : (
                              points.map((point) => (
                                <EditablePoint
                                  key={point.id}
                                  point={point}
                                  itemId={item.id}
                                  userPreferences={comparison.userPreferences!}
                                  onUpdate={(pointId, updates) => updatePoint(item.id, pointId, updates)}
                                />
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Legend */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h4 className="font-medium text-gray-900 mb-3">Color Guide</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(34, 197, 94)' }} />
            <span className="text-sm text-gray-600">Pros (Green)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }} />
            <span className="text-sm text-gray-600">Cons (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(234, 179, 8)' }} />
            <span className="text-sm text-gray-600">Neutral (Yellow)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Color intensity indicates importance: Darker = More important, Lighter = Less important.
          Adjust category priorities in the left panel to personalize your view.
        </p>
      </div>
    </div>
  );
}
