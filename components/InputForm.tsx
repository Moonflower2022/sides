'use client';

import { useState, useRef } from 'react';
import { parseComparisonText, mockParseComparisonText } from '@/lib/ai/parser';
import { useComparisonStore, createDefaultPreferences } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { Upload, Sparkles } from 'lucide-react';

export default function InputForm() {
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { setComparison, setApiKey: setStoreApiKey } = useComparisonStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError('Please enter some text to compare');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let parsed;
      if (apiKey.trim()) {
        parsed = await parseComparisonText(inputText, apiKey);
      } else {
        // Use mock data for testing
        parsed = mockParseComparisonText(inputText);
      }

      const comparison = {
        id: generateId(),
        title: 'My Comparison',
        items: parsed.items,
        categories: parsed.categories,
        userPreferences: createDefaultPreferences(parsed.categories),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setComparison(comparison);
      if (apiKey.trim()) {
        setStoreApiKey(apiKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const text = e.dataTransfer.getData('text');
    if (text) {
      setInputText(text);
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const loadExample = () => {
    setInputText(`I'm trying to decide between three phones:

iPhone 15 Pro - $1199
- Amazing camera quality, best in class
- Expensive but premium build
- Great performance with A17 chip
- Good battery life
- iOS ecosystem

Samsung S24 - $899
- Cheaper than iPhone
- Excellent battery life, lasts all day
- Very good camera
- Android flexibility
- One UI is feature-rich

Google Pixel 8 - $699
- Most affordable option
- Best software experience, clean Android
- Excellent camera with AI features
- Good performance
- Great for photos`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Compare Your Options
          </h2>
          <p className="text-gray-600">
            Paste your decision details below or drag & drop a text file
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Key Input */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key (optional - leave empty for demo mode)
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from: https://makersuite.google.com/app/apikey
            </p>
          </div>

          {/* Text Input Area */}
          <div>
            <label htmlFor="comparisonText" className="block text-sm font-medium text-gray-700 mb-2">
              Your Comparison Details
            </label>
            <div
              className={`relative ${isDragging ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <textarea
                id="comparisonText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your comparison here...&#10;&#10;Example:&#10;I'm deciding between Option A and Option B.&#10;Option A: Great quality but expensive...&#10;Option B: Cheaper but less features..."
                rows={12}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-600 font-medium">Drop your file here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Button */}
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <button
              type="button"
              onClick={loadExample}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Load Example
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Comparison
              </>
            )}
          </button>
        </form>

        {!apiKey.trim() && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Demo Mode:</strong> Without an API key, the app will use mock data for demonstration.
              Add your Gemini API key above for AI-powered parsing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
