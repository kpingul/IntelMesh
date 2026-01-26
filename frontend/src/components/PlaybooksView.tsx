'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  ChevronRight,
  Shield,
  Skull,
  Eye,
  Target,
  GitBranch,
  Crosshair,
  Filter,
  Search,
  Lock,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { ThreatItem, Stats } from '@/types';

interface PlaybooksViewProps {
  items: ThreatItem[];
  stats: Stats | null;
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
}

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface GeneratedPlaybook {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  techniques: string[];
  sourceItem: ThreatItem;
  stepCount: number;
}

export default function PlaybooksView({
  items,
  stats,
  isLoading,
  onItemClick
}: PlaybooksViewProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate playbooks from items with rich techniques
  const playbooks = useMemo((): GeneratedPlaybook[] => {
    return items
      .filter(item => item.extracted.tags.length >= 2)
      .map(item => {
        // Determine difficulty based on complexity
        let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
        if (item.extracted.tags.length >= 4 || item.extracted.actors.length > 0) {
          difficulty = 'advanced';
        } else if (item.extracted.tags.length >= 3 || item.extracted.cves.length > 0) {
          difficulty = 'intermediate';
        }

        // Determine category
        let category = 'General';
        if (item.extracted.tags.includes('ransomware')) category = 'Ransomware';
        else if (item.extracted.tags.includes('phishing')) category = 'Phishing';
        else if (item.extracted.tags.includes('exploitation')) category = 'Exploitation';
        else if (item.extracted.tags.includes('c2')) category = 'Command & Control';
        else if (item.extracted.tags.includes('credential_theft')) category = 'Credential Theft';
        else if (item.extracted.tags.includes('lateral_movement')) category = 'Lateral Movement';

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          difficulty,
          category,
          techniques: item.extracted.tags,
          sourceItem: item,
          stepCount: Math.min(item.extracted.tags.length + 2, 6),
        };
      })
      .slice(0, 20);
  }, [items]);

  // Filter playbooks
  const filteredPlaybooks = useMemo(() => {
    let filtered = playbooks;

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.techniques.some(t => t.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [playbooks, selectedDifficulty, searchQuery]);

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'advanced':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-ink-100 text-ink-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ransomware':
        return <Lock size={16} className="text-red-500" />;
      case 'Phishing':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'Exploitation':
        return <Crosshair size={16} className="text-orange-500" />;
      case 'Command & Control':
        return <GitBranch size={16} className="text-violet-500" />;
      case 'Credential Theft':
        return <Eye size={16} className="text-blue-500" />;
      case 'Lateral Movement':
        return <ArrowRight size={16} className="text-teal-500" />;
      default:
        return <Target size={16} className="text-ink-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-paper-200 rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-paper-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Attack Playbooks
          </h1>
          <p className="text-ink-500 mt-1">
            Visual attack flows with defender guidance • {playbooks.length} playbooks available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search playbooks by title, technique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input pl-11"
          />
        </div>

        <div className="flex items-center gap-2 bg-paper-100 rounded-xl p-1">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                selectedDifficulty === difficulty
                  ? 'bg-white text-ink-900 shadow-soft'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      {/* Playbooks Grid */}
      {filteredPlaybooks.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 rounded-2xl border border-ink-100">
          <BookOpen size={48} className="mx-auto text-ink-300 mb-4" />
          <h3 className="font-display text-lg font-semibold text-ink-700 mb-2">No playbooks found</h3>
          <p className="text-ink-500">
            {searchQuery ? 'Try adjusting your search' : 'Sync news to generate attack playbooks'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPlaybooks.map((playbook, index) => (
            <div
              key={playbook.id}
              onClick={() => onItemClick(playbook.sourceItem)}
              className="bg-white rounded-2xl border border-ink-100 p-6 shadow-soft hover:shadow-card transition-all duration-300 cursor-pointer group animate-fadeInUp"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-paper-100 group-hover:bg-accent-coral/10 transition-colors">
                    {getCategoryIcon(playbook.category)}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-ink-400">{playbook.category}</span>
                    <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded border capitalize ${getDifficultyStyles(playbook.difficulty)}`}>
                      {playbook.difficulty}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-ink-300 group-hover:text-accent-coral group-hover:translate-x-1 transition-all" />
              </div>

              {/* Title */}
              <h3 className="font-display font-semibold text-ink-900 text-lg leading-snug mb-2 group-hover:text-accent-coral transition-colors line-clamp-2">
                {playbook.title}
              </h3>

              {/* Description */}
              <p className="text-ink-600 text-sm line-clamp-2 mb-4">
                {playbook.description}
              </p>

              {/* Techniques */}
              <div className="flex flex-wrap gap-2 mb-4">
                {playbook.techniques.slice(0, 4).map((technique) => (
                  <span key={technique} className="tag tag-ttp capitalize text-xs">
                    {technique.replace(/_/g, ' ')}
                  </span>
                ))}
                {playbook.techniques.length > 4 && (
                  <span className="text-xs text-ink-400">+{playbook.techniques.length - 4} more</span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-ink-100">
                <div className="flex items-center gap-4 text-xs text-ink-500">
                  <span className="flex items-center gap-1">
                    <GitBranch size={14} />
                    {playbook.stepCount} steps
                  </span>
                  {playbook.sourceItem.extracted.cves.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Shield size={14} className="text-red-500" />
                      {playbook.sourceItem.extracted.cves.length} CVE{playbook.sourceItem.extracted.cves.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-accent-coral opacity-0 group-hover:opacity-100 transition-opacity">
                  View Playbook
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-paper-50 rounded-2xl border border-ink-100 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-accent-teal/10 flex-shrink-0">
            <BookOpen size={24} className="text-accent-teal" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink-900 mb-2">About Attack Playbooks</h3>
            <p className="text-ink-600 text-sm leading-relaxed">
              Each playbook breaks down a real-world attack into visual steps, showing both the attacker's actions and
              what defenders should look for. Use these to understand attack patterns, identify detection opportunities,
              and build your defensive knowledge.
            </p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-ink-600">Beginner: Foundational concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-ink-600">Intermediate: Real-world scenarios</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-ink-600">Advanced: APT tactics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
