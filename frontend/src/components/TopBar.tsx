'use client';

import { RefreshCw, Upload, Clock, Trash2, Activity, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

interface TopBarProps {
  onSync: () => Promise<void>;
  onUpload: (files: File[]) => Promise<void>;
  onClear: () => Promise<void>;
  isSyncing: boolean;
  isUploading: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function TopBar({
  onSync,
  onUpload,
  onClear,
  isSyncing,
  isUploading,
  timeRange,
  onTimeRangeChange,
}: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await onUpload(files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const timeRanges = [
    { value: 'all', label: 'All Time' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

  const selectedTimeRange = timeRanges.find(t => t.value === timeRange) || timeRanges[0];

  return (
    <div className="h-20 bg-dark-800/30 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-8 relative z-10">
      {/* Left side - Actions */}
      <div className="flex items-center gap-4">
        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
            isSyncing
              ? 'bg-dark-600/50 text-dark-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-accent-cyan to-accent-violet text-white shadow-glow-cyan hover:shadow-lg hover:shadow-accent-cyan/25 hover:-translate-y-0.5'
          }`}
        >
          <RefreshCw
            size={18}
            className={`transition-transform duration-500 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
          />
          <span>{isSyncing ? 'Syncing...' : 'Sync News'}</span>

          {/* Animated border */}
          {!isSyncing && (
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-cyan bg-[length:200%_100%] opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
          )}
        </button>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm border transition-all duration-300 ${
            isUploading
              ? 'border-dark-600 text-dark-300 cursor-not-allowed bg-dark-700/30'
              : 'border-dark-500/50 text-dark-100 hover:border-accent-cyan/50 hover:text-accent-cyan hover:bg-accent-cyan/5'
          }`}
        >
          <Upload
            size={18}
            className={`transition-transform duration-300 ${isUploading ? 'animate-pulse' : 'group-hover:-translate-y-0.5'}`}
          />
          <span>{isUploading ? 'Uploading...' : 'Upload PDFs'}</span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-dark-600/50" />

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="group flex items-center gap-2 p-2.5 rounded-xl border border-transparent text-dark-200 hover:text-accent-red hover:border-accent-red/30 hover:bg-accent-red/5 transition-all duration-300"
          title="Clear all data"
        >
          <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Center - Activity indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <Activity size={16} className="text-accent-emerald animate-pulse" />
        <span className="text-sm text-dark-100 font-medium">Monitoring Active</span>
      </div>

      {/* Right side - Time range */}
      <div className="relative">
        <button
          onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-accent-cyan/30 transition-all duration-300 group"
        >
          <Clock size={16} className="text-accent-cyan" />
          <span className="text-sm text-white font-medium">{selectedTimeRange.label}</span>
          <ChevronDown
            size={16}
            className={`text-dark-200 transition-transform duration-300 ${isTimeDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {isTimeDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsTimeDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-dark-700/95 backdrop-blur-xl border border-dark-600/50 rounded-xl shadow-2xl shadow-black/50 z-50 animate-fadeInUp">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => {
                    onTimeRangeChange(range.value);
                    setIsTimeDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 ${
                    timeRange === range.value
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-dark-100 hover:bg-dark-600/50 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
