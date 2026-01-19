'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AgentTrustBadge } from '@/components/dashboard/AgentTrustBadge';

interface Agent {
  id: string;
  name: string;
  provider: string;
  trust_level: 'trusted' | 'probation' | 'blocked';
  first_seen_at: string;
  last_seen_at: string;
  total_transactions: number;
  successful_transactions: number;
  declined_transactions: number;
  disputed_transactions: number;
  jwks_uri?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [updatingAgent, setUpdatingAgent] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    provider: '',
    jwks_uri: '',
    description: '',
  });

  useEffect(() => {
    fetchAgents();
  }, [filter]);

  const fetchAgents = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('trust_level', filter);

      const res = await fetch(`http://localhost:8000/merchant/agents?${params}`);
      const data = await res.json();
      // API returns array directly, not {items: [...]}
      setAgents(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTrustLevel = async (agentId: string, newLevel: string) => {
    setUpdatingAgent(agentId);
    try {
      await fetch(`http://localhost:8000/merchant/agents/${agentId}/trust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_level: newLevel }),
      });
      await fetchAgents();
    } catch (error) {
      console.error('Failed to update trust level:', error);
    } finally {
      setUpdatingAgent(null);
    }
  };

  const registerAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await fetch('http://localhost:8000/merchant/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      if (res.ok) {
        setShowRegisterModal(false);
        setRegisterForm({ name: '', provider: '', jwks_uri: '', description: '' });
        await fetchAgents();
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to register agent');
      }
    } catch (error) {
      console.error('Failed to register agent:', error);
    } finally {
      setRegistering(false);
    }
  };

  const getSuccessRate = (agent: Agent) => {
    if (agent.total_transactions === 0) return 0;
    return Math.round((agent.successful_transactions / agent.total_transactions) * 100);
  };

  const getDisputeRate = (agent: Agent) => {
    if (agent.total_transactions === 0) return 0;
    return ((agent.disputed_transactions / agent.total_transactions) * 100).toFixed(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'OpenAI': '🤖',
      'Google': '🔍',
      'Perplexity': '🔮',
      'Amazon': '📦',
      'Klarna': '💳',
      'Apple': '🍎',
      'Independent': '🔧',
    };
    return icons[provider] || '🤖';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Registry</h1>
          <p className="text-gray-500 mt-1">Know Your Agent (KYA) - Monitor and manage agent trust levels</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">TAP Protocol</span>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Agent
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'trusted', 'probation', 'blocked'].map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === level
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {level === 'all' ? 'All Agents' : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Agent Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  {getProviderIcon(agent.provider)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                    <AgentTrustBadge level={agent.trust_level} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Provider: {agent.provider} • First seen: {formatDate(agent.first_seen_at)}
                  </p>
                  {agent.jwks_uri && (
                    <p className="text-xs text-gray-400 mt-1 font-mono truncate max-w-md">
                      JWKS: {agent.jwks_uri}
                    </p>
                  )}
                </div>
              </div>

              {/* Trust Level Control */}
              <div className="flex items-center gap-2">
                <select
                  value={agent.trust_level}
                  onChange={(e) => updateTrustLevel(agent.id, e.target.value)}
                  disabled={updatingAgent === agent.id}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="trusted">Trusted</option>
                  <option value="probation">Probation</option>
                  <option value="blocked">Blocked</option>
                </select>
                {updatingAgent === agent.id && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-2xl font-bold text-gray-900">{agent.total_transactions}</p>
                <p className="text-xs text-gray-500">Total Transactions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{agent.successful_transactions}</p>
                <p className="text-xs text-gray-500">Successful</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{agent.declined_transactions}</p>
                <p className="text-xs text-gray-500">Declined</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{agent.disputed_transactions}</p>
                <p className="text-xs text-gray-500">Disputed</p>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-900">{getSuccessRate(agent)}%</p>
                  <span className="text-xs text-gray-500">success</span>
                </div>
                <p className="text-xs text-gray-500">{getDisputeRate(agent)}% dispute rate</p>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${(agent.successful_transactions / Math.max(agent.total_transactions, 1)) * 100}%` }}
                />
                <div
                  className="bg-red-500 h-full"
                  style={{ width: `${(agent.declined_transactions / Math.max(agent.total_transactions, 1)) * 100}%` }}
                />
                <div
                  className="bg-orange-500 h-full"
                  style={{ width: `${(agent.disputed_transactions / Math.max(agent.total_transactions, 1)) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Success
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span> Declined
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Disputed
                </span>
              </div>
            </div>

            {/* Last Activity */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Last active: {formatDate(agent.last_seen_at)}
              </span>
              <Link
                href={`/dashboard/checkouts?agent_id=${agent.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Transactions →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No agents found matching your filter.
        </div>
      )}

      {/* Register Agent Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Register New Agent</h2>
                  <p className="text-gray-300 text-sm mt-1">TAP Protocol - JWKS Verification Required</p>
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={registerAgent} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="e.g., Perplexity Shopping Assistant"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider Organization</label>
                <input
                  type="text"
                  required
                  value={registerForm.provider}
                  onChange={(e) => setRegisterForm({ ...registerForm, provider: e.target.value })}
                  placeholder="e.g., Perplexity AI"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JWKS URI
                  <span className="ml-2 text-xs text-blue-600 font-normal">(RFC 9421 - HTTP Message Signatures)</span>
                </label>
                <input
                  type="url"
                  required
                  value={registerForm.jwks_uri}
                  onChange={(e) => setRegisterForm({ ...registerForm, jwks_uri: e.target.value })}
                  placeholder="https://api.example.com/.well-known/jwks.json"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Public key endpoint for agent signature verification</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={registerForm.description}
                  onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                  placeholder="Brief description of the agent's capabilities..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">New agents start in Probation</p>
                    <p className="text-amber-700 mt-1">Review the agent&apos;s behavior before upgrading to Trusted status.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </>
                  ) : (
                    'Register Agent'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
