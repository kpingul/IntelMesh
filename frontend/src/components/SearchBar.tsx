'use client';

import { Search, Sparkles, X, Command, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';
import { SearchResult } from '@/types';

interface SearchBarProps {
  onSearch: (query: string) => Promise<SearchResult | null>;
  onClearSearch: () => void;
  searchResult: SearchResult | null;
  isSearching: boolean;
}

export default function SearchBar({
  onSearch,
  onClearSearch,
  searchResult,
  isSearching
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClearSearch();
  };

  const exampleQueries = [
    { text: 'CVEs from last 7 days', icon: '🛡️' },
    { text: 'IoCs for ransomware', icon: '🎯' },
    { text: 'APT29 mentions', icon: '👤' },
    { text: 'critical vulnerabilities', icon: '🔴' },
  ];

  return (
    <div className="mb-8">
      {/* Search Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative transition-all duration-500 ${
            isFocused ? 'transform scale-[1.01]' : ''
          }`}
        >
          {/* Glow effect when focused */}
          {isFocused && (
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/20 via-accent-violet/20 to-accent-cyan/20 rounded-2xl blur-xl opacity-75 animate-pulse" />
          )}

          <div className="relative">
            {/* Search icon / Loading spinner */}
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search
                  size={20}
                  className={`transition-colors duration-300 ${
                    isFocused ? 'text-accent-cyan' : 'text-dark-200'
                  }`}
                />
              )}
            </div>

            {/* Input field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search CVEs, IoCs, threats, or ask questions in natural language..."
              className="search-input pl-14 pr-36"
              disabled={isSearching}
            />

            {/* Right side buttons */}
            <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-dark-200 hover:text-white hover:bg-dark-600/50 rounded-lg transition-all duration-200"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  query.trim() && !isSearching
                    ? 'bg-gradient-to-r from-accent-cyan to-accent-violet text-white shadow-lg shadow-accent-cyan/20 hover:shadow-xl hover:shadow-accent-cyan/30'
                    : 'bg-dark-600/50 text-dark-300 cursor-not-allowed'
                }`}
              >
                <Zap size={16} />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Example queries */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-dark-300 font-medium uppercase tracking-wide">Try:</span>
          {exampleQueries.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setQuery(example.text)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700/30 border border-dark-600/30 text-dark-100 text-sm hover:bg-dark-700/50 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all duration-200"
            >
              <span className="text-xs">{example.icon}</span>
              <span className="font-mono text-xs">{example.text}</span>
            </button>
          ))}
        </div>
      </form>

      {/* Search Result Summary */}
      {searchResult && (
        <div className="mt-6 animate-fadeInUp">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-violet opacity-20 blur-sm" />

            <div className="relative m-px rounded-2xl p-5 bg-dark-800/90 backdrop-blur-xl border border-dark-600/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20">
                      <Sparkles size={18} className="text-accent-violet" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-accent-violet">AI Analysis</span>
                      <p className="text-xs text-dark-200">Powered by intelligent search</p>
                    </div>
                  </div>

                  {/* Answer */}
                  <p className="text-white text-base leading-relaxed">{searchResult.answer_summary}</p>

                  {/* Query metadata */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {searchResult.parsed_query.query_type && (
                      <span className="tag bg-dark-600/50 text-dark-100 border-dark-500/50">
                        Type: {searchResult.parsed_query.query_type}
                      </span>
                    )}
                    {searchResult.parsed_query.time_range && (
                      <span className="tag bg-dark-600/50 text-dark-100 border-dark-500/50">
                        Time: {searchResult.parsed_query.time_range}
                      </span>
                    )}
                    {searchResult.parsed_query.cve_id && (
                      <span className="tag tag-cve">
                        {searchResult.parsed_query.cve_id}
                      </span>
                    )}
                    {searchResult.parsed_query.keywords.map((kw, i) => (
                      <span key={i} className="tag tag-ttp">
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Result count */}
                  <div className="mt-4 pt-4 border-t border-dark-600/30 flex items-center gap-2">
                    <span className="text-dark-200 text-sm">Found</span>
                    <span className="text-accent-cyan font-mono font-bold">{searchResult.result_count}</span>
                    <span className="text-dark-200 text-sm">matching items</span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClear}
                  className="p-2 text-dark-200 hover:text-white hover:bg-dark-600/50 rounded-lg transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
