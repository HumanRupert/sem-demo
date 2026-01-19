'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AgentTrustBadge } from '@/components/dashboard/AgentTrustBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

interface Agent {
  id: string;
  name: string;
  provider: string;
  description?: string;
  trust_level: 'trusted' | 'probation' | 'blocked';
  first_seen_at: string;
  last_seen_at: string;
  total_transactions: number;
  successful_transactions: number;
  declined_transactions: number;
  disputed_transactions: number;
  jwks_uri?: string;
  logo_url?: string;
}

interface Checkout {
  id: string;
  created_at: string;
  total: number;
  currency: string;
  status: string;
  payment_status: string;
  modality: string;
}

interface VerificationLog {
  id: string;
  timestamp: string;
  signature_type: string;
  result: string;
  failure_reason?: string;
  key_id?: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [recentCheckouts, setRecentCheckouts] = useState<Checkout[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTrust, setUpdatingTrust] = useState(false);

  useEffect(() => {
    fetchAgentData();
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      const [agentRes, checkoutsRes] = await Promise.all([
        fetch(`http://localhost:8000/merchant/agents/${agentId}`),
        fetch(`http://localhost:8000/merchant/checkouts?agent_id=${agentId}&limit=10`),
      ]);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgent(agentData);
      }

      if (checkoutsRes.ok) {
        const checkoutsData = await checkoutsRes.json();
        setRecentCheckouts(checkoutsData.items || []);
      }

      // Fetch verification logs for this agent
      const logsRes = await fetch(`http://localhost:8000/merchant/agents/${agentId}/logs`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setVerificationLogs(logsData.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTrustLevel = async (newLevel: string) => {
    setUpdatingTrust(true);
    try {
      await fetch(`http://localhost:8000/merchant/agents/${agentId}/trust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_level: newLevel }),
      });
      setAgent((prev) => (prev ? { ...prev, trust_level: newLevel as Agent['trust_level'] } : null));
    } catch (error) {
      console.error('Failed to update trust level:', error);
    } finally {
      setUpdatingTrust(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSuccessRate = () => {
    if (!agent || agent.total_transactions === 0) return 0;
    return Math.round((agent.successful_transactions / agent.total_transactions) * 100);
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'Allbirds': '🌿',
      'OpenAI': '🤖',
      'Google': '🔍',
      'Perplexity': '🔮',
      'Amazon': '📦',
      'Klarna': '💳',
      'Apple': '🍎',
    };
    return icons[provider] || '🤖';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Agent not found</p>
        <Link href="/dashboard/agents" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/dashboard/agents" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
        ← Back to Agent Registry
      </Link>

      {/* Agent Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
              {getProviderIcon(agent.provider)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                <AgentTrustBadge level={agent.trust_level} />
              </div>
              <p className="text-gray-500 mt-1">Provider: {agent.provider}</p>
              {agent.description && (
                <p className="text-sm text-gray-400 mt-1">{agent.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                First seen: {formatDate(agent.first_seen_at)} • Last active: {formatDate(agent.last_seen_at)}
              </p>
            </div>
          </div>

          {/* Trust Level Control */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Trust Level:</label>
            <select
              value={agent.trust_level}
              onChange={(e) => updateTrustLevel(e.target.value)}
              disabled={updatingTrust}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="trusted">Trusted</option>
              <option value="probation">Probation</option>
              <option value="blocked">Blocked</option>
            </select>
            {updatingTrust && (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{agent.total_transactions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{agent.successful_transactions}</p>
          <p className="text-xs text-gray-500 mt-1">{getSuccessRate()}% success rate</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Declined</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{agent.declined_transactions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Disputed</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{agent.disputed_transactions}</p>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Performance</h2>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 h-full transition-all duration-500"
            style={{ width: `${(agent.successful_transactions / Math.max(agent.total_transactions, 1)) * 100}%` }}
          />
          <div
            className="bg-red-500 h-full transition-all duration-500"
            style={{ width: `${(agent.declined_transactions / Math.max(agent.total_transactions, 1)) * 100}%` }}
          />
          <div
            className="bg-orange-500 h-full transition-all duration-500"
            style={{ width: `${(agent.disputed_transactions / Math.max(agent.total_transactions, 1)) * 100}%` }}
          />
        </div>
        <div className="flex gap-6 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Successful ({agent.successful_transactions})
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Declined ({agent.declined_transactions})
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            Disputed ({agent.disputed_transactions})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* JWKS Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Public Key Configuration</h2>
          {agent.jwks_uri ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">JWKS URI</p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 break-all">{agent.jwks_uri}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-600">Public key active and verified</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No JWKS URI configured</p>
          )}
        </div>

        {/* Verification Logs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Verifications</h2>
          {verificationLogs.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {verificationLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <span className="text-gray-600">{log.signature_type}</span>
                    <span className="text-gray-400 ml-2">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <span className={log.result === 'pass' ? 'text-green-600' : 'text-red-600'}>
                    {log.result.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No verification logs found</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link
            href={`/dashboard/checkouts?agent_id=${agent.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        {recentCheckouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Modality</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {recentCheckouts.map((checkout) => (
                  <tr key={checkout.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(checkout.created_at)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(checkout.total)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="checkout" status={checkout.status} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge type="payment" status={checkout.payment_status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {checkout.modality === 'human_present' ? '👤 Human' : '🤖 Auto'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/checkouts/${checkout.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No transactions found</p>
        )}
      </div>
    </div>
  );
}
