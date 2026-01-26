'use client';

import { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  BookOpen,
  ChevronRight,
  Edit3,
  X,
  RefreshCw,
  Star,
  Bookmark
} from 'lucide-react';
import { LearningQueueItem, ThreatItem } from '@/types';

interface LearningViewProps {
  items: ThreatItem[];
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
}

export default function LearningView({
  items,
  isLoading,
  onItemClick
}: LearningViewProps) {
  // Local state for learning queue (in a real app, this would be persisted)
  const [learningQueue, setLearningQueue] = useState<LearningQueueItem[]>(() => {
    // Initialize with some items from the threat items
    return items.slice(0, 5).map((item, index) => ({
      id: `learning-${item.id}`,
      type: 'thread' as const,
      itemId: item.id,
      title: item.title,
      status: index === 0 ? 'in_progress' as const : index < 2 ? 'not_started' as const : 'learned' as const,
      notes: index === 0 ? 'Need to understand the initial access vector better' : undefined,
      reviewLater: index === 3,
      addedAt: new Date(Date.now() - index * 86400000).toISOString(),
    }));
  });

  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'learned'>('all');

  const updateItemStatus = (id: string, status: 'not_started' | 'in_progress' | 'learned') => {
    setLearningQueue(prev =>
      prev.map(item => item.id === id ? { ...item, status } : item)
    );
  };

  const removeItem = (id: string) => {
    setLearningQueue(prev => prev.filter(item => item.id !== id));
  };

  const toggleReviewLater = (id: string) => {
    setLearningQueue(prev =>
      prev.map(item => item.id === id ? { ...item, reviewLater: !item.reviewLater } : item)
    );
  };

  const saveNotes = (id: string) => {
    setLearningQueue(prev =>
      prev.map(item => item.id === id ? { ...item, notes: noteText } : item)
    );
    setEditingNotes(null);
    setNoteText('');
  };

  const startEditingNotes = (item: LearningQueueItem) => {
    setEditingNotes(item.id);
    setNoteText(item.notes || '');
  };

  const addToQueue = (threatItem: ThreatItem) => {
    const exists = learningQueue.some(q => q.itemId === threatItem.id);
    if (!exists) {
      setLearningQueue(prev => [
        ...prev,
        {
          id: `learning-${threatItem.id}-${Date.now()}`,
          type: 'thread',
          itemId: threatItem.id,
          title: threatItem.title,
          status: 'not_started',
          reviewLater: false,
          addedAt: new Date().toISOString(),
        }
      ]);
    }
  };

  const filteredQueue = learningQueue.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const stats = {
    total: learningQueue.length,
    notStarted: learningQueue.filter(i => i.status === 'not_started').length,
    inProgress: learningQueue.filter(i => i.status === 'in_progress').length,
    learned: learningQueue.filter(i => i.status === 'learned').length,
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'not_started':
        return {
          bg: 'bg-ink-100',
          text: 'text-ink-600',
          border: 'border-l-ink-300',
          icon: <Clock size={14} />,
          label: 'Not Started'
        };
      case 'in_progress':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-l-amber-400',
          icon: <BookOpen size={14} />,
          label: 'In Progress'
        };
      case 'learned':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-l-emerald-500',
          icon: <CheckCircle size={14} />,
          label: 'Learned'
        };
      default:
        return {
          bg: 'bg-ink-100',
          text: 'text-ink-600',
          border: 'border-l-ink-300',
          icon: <Clock size={14} />,
          label: 'Unknown'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-paper-200 rounded-xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-paper-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Learning Queue
          </h1>
          <p className="text-ink-500 mt-1">
            Track what you're studying and capture your takeaways
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-all duration-200 text-left ${
            filter === 'all' ? 'bg-white border-accent-coral shadow-soft' : 'bg-paper-50 border-ink-100 hover:border-ink-200'
          }`}
        >
          <div className="text-2xl font-display font-semibold text-ink-900">{stats.total}</div>
          <div className="text-xs text-ink-500 mt-1">Total Items</div>
        </button>
        <button
          onClick={() => setFilter('not_started')}
          className={`p-4 rounded-xl border transition-all duration-200 text-left ${
            filter === 'not_started' ? 'bg-white border-accent-coral shadow-soft' : 'bg-paper-50 border-ink-100 hover:border-ink-200'
          }`}
        >
          <div className="text-2xl font-display font-semibold text-ink-600">{stats.notStarted}</div>
          <div className="text-xs text-ink-500 mt-1">Not Started</div>
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-xl border transition-all duration-200 text-left ${
            filter === 'in_progress' ? 'bg-white border-accent-coral shadow-soft' : 'bg-paper-50 border-ink-100 hover:border-ink-200'
          }`}
        >
          <div className="text-2xl font-display font-semibold text-amber-600">{stats.inProgress}</div>
          <div className="text-xs text-ink-500 mt-1">In Progress</div>
        </button>
        <button
          onClick={() => setFilter('learned')}
          className={`p-4 rounded-xl border transition-all duration-200 text-left ${
            filter === 'learned' ? 'bg-white border-accent-coral shadow-soft' : 'bg-paper-50 border-ink-100 hover:border-ink-200'
          }`}
        >
          <div className="text-2xl font-display font-semibold text-emerald-600">{stats.learned}</div>
          <div className="text-xs text-ink-500 mt-1">Learned</div>
        </button>
      </div>

      {/* Learning Queue */}
      <div className="space-y-3">
        {filteredQueue.length === 0 ? (
          <div className="text-center py-16 bg-paper-50 rounded-2xl border border-ink-100">
            <GraduationCap size={48} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-lg font-semibold text-ink-700 mb-2">
              {filter === 'all' ? 'Your learning queue is empty' : `No ${filter.replace('_', ' ')} items`}
            </h3>
            <p className="text-ink-500 mb-4">
              Add threat threads or playbooks to track your learning progress
            </p>
          </div>
        ) : (
          filteredQueue.map((item, index) => {
            const statusStyles = getStatusStyles(item.status);
            const sourceItem = items.find(i => i.id === item.itemId);

            return (
              <div
                key={item.id}
                className={`queue-item ${statusStyles.border} animate-fadeInUp`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3
                      className="font-medium text-ink-900 line-clamp-2 cursor-pointer hover:text-accent-coral transition-colors"
                      onClick={() => sourceItem && onItemClick(sourceItem)}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleReviewLater(item.id)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          item.reviewLater
                            ? 'text-accent-amber bg-accent-amber/10'
                            : 'text-ink-400 hover:text-accent-amber hover:bg-accent-amber/10'
                        }`}
                        title="Review Later"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                      {statusStyles.icon}
                      {statusStyles.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateItemStatus(item.id, 'not_started')}
                        className={`p-1.5 rounded-lg transition-all ${item.status === 'not_started' ? 'bg-ink-100 text-ink-600' : 'text-ink-300 hover:text-ink-500'}`}
                        title="Not Started"
                      >
                        <Clock size={14} />
                      </button>
                      <button
                        onClick={() => updateItemStatus(item.id, 'in_progress')}
                        className={`p-1.5 rounded-lg transition-all ${item.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'text-ink-300 hover:text-amber-500'}`}
                        title="In Progress"
                      >
                        <BookOpen size={14} />
                      </button>
                      <button
                        onClick={() => updateItemStatus(item.id, 'learned')}
                        className={`p-1.5 rounded-lg transition-all ${item.status === 'learned' ? 'bg-emerald-100 text-emerald-600' : 'text-ink-300 hover:text-emerald-500'}`}
                        title="Learned"
                      >
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {editingNotes === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add your notes and takeaways..."
                        className="w-full px-3 py-2 text-sm bg-paper-50 border border-ink-200 rounded-lg focus:outline-none focus:border-accent-coral focus:ring-1 focus:ring-accent-coral/20 resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveNotes(item.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-ink-900 text-white rounded-lg hover:bg-ink-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="px-3 py-1.5 text-xs font-medium text-ink-600 hover:text-ink-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : item.notes ? (
                    <div
                      onClick={() => startEditingNotes(item)}
                      className="text-sm text-ink-600 bg-paper-50 rounded-lg p-3 cursor-pointer hover:bg-paper-100 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <p className="italic">"{item.notes}"</p>
                        <Edit3 size={14} className="text-ink-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditingNotes(item)}
                      className="text-sm text-ink-400 hover:text-ink-600 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} />
                      Add notes
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Suggested to Add */}
      {items.length > 0 && (
        <div className="bg-paper-50 rounded-2xl border border-ink-100 p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <Star size={18} className="text-accent-amber" />
            Suggested to Learn
          </h3>
          <div className="space-y-2">
            {items
              .filter(i => !learningQueue.some(q => q.itemId === i.id))
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-ink-100"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-ink-800 line-clamp-1">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {item.extracted.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs text-ink-400 capitalize">{tag.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => addToQueue(item)}
                    className="p-2 text-accent-coral hover:bg-accent-coral/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
