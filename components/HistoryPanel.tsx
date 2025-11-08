'use client';

import { useState, useEffect } from 'react';
import { useComparisonStore } from '@/lib/store';
import { loadHistory, PreferenceHistory } from '@/lib/storage';
import { History, X, Calendar } from 'lucide-react';

export default function HistoryPanel() {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PreferenceHistory>({ comparisons: [] });
  const { setComparison } = useComparisonStore();

  useEffect(() => {
    if (showHistory) {
      setHistory(loadHistory());
    }
  }, [showHistory]);

  const loadFromHistory = (index: number) => {
    const item = history.comparisons[index];
    if (item) {
      setComparison(item.comparison);
      setShowHistory(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!showHistory) {
    const currentHistory = loadHistory();
    return (
      <button
        onClick={() => setShowHistory(true)}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <History className="w-4 h-4" />
        History ({currentHistory.comparisons.length})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Comparison History</h2>
          </div>
          <button
            onClick={() => setShowHistory(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {history.comparisons.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comparison history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.comparisons.map((item, index) => (
                <button
                  key={index}
                  onClick={() => loadFromHistory(index)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {item.comparison.title || 'Comparison'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{item.comparison.items.length} items</span>
                    <span>•</span>
                    <span>{item.comparison.categories.length} categories</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.comparison.items.slice(0, 3).map((compItem, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {compItem.name}
                      </span>
                    ))}
                    {item.comparison.items.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{item.comparison.items.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
