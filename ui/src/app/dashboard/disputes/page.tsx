'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { AgentTrustBadge } from '@/components/dashboard/AgentTrustBadge';

interface Dispute {
  id: string;
  checkout_id: string;
  status: 'opened' | 'represented' | 'won' | 'lost';
  opened_at: string;
  amount: number;
  agent_name: string;
  agent_id: string;
  reason?: string;
  customer_email_hash?: string;
  has_cart_mandate: boolean;
  has_intent_mandate: boolean;
  has_payment_mandate: boolean;
}

interface DisputeEvidence {
  checkout: {
    id: string;
    total: number;
    currency: string;
    created_at: string;
    status: string;
    agent_id: string;
    agent_name: string;
    modality: string;
    agent_verification_status: string;
  };
  mandates: Array<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
    user_signature_verified: boolean;
    merchant_signature_verified: boolean;
    created_at: string;
  }>;
  verification_logs: Array<{
    id: string;
    timestamp: string;
    signature_type: string;
    result: string;
    key_id: string;
  }>;
  timeline: Array<{
    id: string;
    timestamp: string;
    event_type: string;
    event_data: Record<string, unknown>;
  }>;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [evidence, setEvidence] = useState<DisputeEvidence | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const res = await fetch(`http://localhost:8000/merchant/disputes?${params}`);
      const data = await res.json();
      setDisputes(data.items || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidence = async (checkoutId: string) => {
    setLoadingEvidence(true);
    try {
      const res = await fetch(`http://localhost:8000/merchant/checkouts/${checkoutId}/evidence`);
      const data = await res.json();
      setEvidence(data);
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const updateDisputeStatus = async (checkoutId: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:8000/merchant/disputes/${checkoutId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchDisputes();
      if (selectedDispute?.checkout_id === checkoutId) {
        setSelectedDispute({ ...selectedDispute, status: newStatus as Dispute['status'] });
      }
    } catch (error) {
      console.error('Failed to update dispute status:', error);
    }
  };

  const exportEvidence = async (checkoutId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/merchant/checkouts/${checkoutId}/evidence`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${checkoutId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export evidence:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      opened: 'text-orange-600 bg-orange-50',
      represented: 'text-blue-600 bg-blue-50',
      won: 'text-green-600 bg-green-50',
      lost: 'text-red-600 bg-red-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getEvidenceStrength = (dispute: Dispute) => {
    let score = 0;
    if (dispute.has_cart_mandate) score += 1;
    if (dispute.has_intent_mandate) score += 2;
    if (dispute.has_payment_mandate) score += 2;
    return score >= 4 ? 'Strong' : score >= 2 ? 'Moderate' : 'Weak';
  };

  const getEvidenceStrengthColor = (strength: string) => {
    const colors: Record<string, string> = {
      Strong: 'text-green-600 bg-green-50',
      Moderate: 'text-yellow-600 bg-yellow-50',
      Weak: 'text-red-600 bg-red-50',
    };
    return colors[strength] || 'text-gray-600 bg-gray-50';
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
          <h1 className="text-2xl font-bold text-gray-900">Dispute Center</h1>
          <p className="text-gray-500 mt-1">
            Manage chargebacks with cryptographic evidence from VDCs
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">AP2 Protocol</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Open Disputes</p>
          <p className="text-2xl font-bold text-orange-600">
            {disputes.filter((d) => d.status === 'opened').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Represented</p>
          <p className="text-2xl font-bold text-blue-600">
            {disputes.filter((d) => d.status === 'represented').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Won</p>
          <p className="text-2xl font-bold text-green-600">
            {disputes.filter((d) => d.status === 'won').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Lost</p>
          <p className="text-2xl font-bold text-red-600">
            {disputes.filter((d) => d.status === 'lost').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Disputes List */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              {['all', 'opened', 'represented', 'won', 'lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {disputes.map((dispute) => {
              const strength = getEvidenceStrength(dispute);
              return (
                <div
                  key={dispute.id}
                  onClick={() => {
                    setSelectedDispute(dispute);
                    fetchEvidence(dispute.checkout_id);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedDispute?.id === dispute.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(dispute.amount)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {dispute.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{dispute.agent_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Opened {formatDate(dispute.opened_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEvidenceStrengthColor(strength)}`}>
                        {strength} Evidence
                      </span>
                      <div className="flex gap-1 mt-2 justify-end">
                        {dispute.has_cart_mandate && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" title="Cart Mandate"></span>
                        )}
                        {dispute.has_intent_mandate && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full" title="Intent Mandate"></span>
                        )}
                        {dispute.has_payment_mandate && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="Payment Mandate"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {disputes.length === 0 && (
              <div className="p-8 text-center text-gray-500">No disputes found.</div>
            )}
          </div>
        </div>

        {/* Evidence Panel */}
        <div className="bg-white rounded-xl border border-gray-200">
          {selectedDispute ? (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Evidence Package</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedDispute.status}
                      onChange={(e) => updateDisputeStatus(selectedDispute.checkout_id, e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="opened">Opened</option>
                      <option value="represented">Represented</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                    <button
                      onClick={() => exportEvidence(selectedDispute.checkout_id)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>

              {/* Evidence Content */}
              {loadingEvidence ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : evidence ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Transaction Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-medium">{formatCurrency(evidence.checkout.total)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2">{formatDate(evidence.checkout.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Modality:</span>
                        <span className="ml-2">{evidence.checkout.modality.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Verification:</span>
                        <span className={`ml-2 ${evidence.checkout.agent_verification_status === 'verified' ? 'text-green-600' : 'text-orange-600'}`}>
                          {evidence.checkout.agent_verification_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mandates */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Verifiable Digital Credentials ({evidence.mandates.length})
                    </h4>
                    <div className="space-y-2">
                      {evidence.mandates.map((mandate) => (
                        <div
                          key={mandate.id}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 capitalize">
                              {mandate.type} Mandate
                            </span>
                            <div className="flex gap-2">
                              {mandate.user_signature_verified && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  User ✓
                                </span>
                              )}
                              {mandate.merchant_signature_verified && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  Merchant ✓
                                </span>
                              )}
                            </div>
                          </div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32">
                            {JSON.stringify(mandate.payload, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification Logs */}
                  {evidence.verification_logs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Signature Verification Log ({evidence.verification_logs.length})
                      </h4>
                      <div className="space-y-1">
                        {evidence.verification_logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                          >
                            <span className="text-gray-600">{log.signature_type}</span>
                            <span className={log.result === 'pass' ? 'text-green-600' : 'text-red-600'}>
                              {log.result.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {evidence.timeline.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Event Timeline</h4>
                      <div className="space-y-2">
                        {evidence.timeline.slice(0, 5).map((event) => (
                          <div key={event.id} className="flex items-start gap-3 text-sm">
                            <span className="text-gray-400 w-20 flex-shrink-0">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-gray-600">
                              {event.event_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Full Checkout Link */}
                  <Link
                    href={`/dashboard/checkouts/${selectedDispute.checkout_id}`}
                    className="block text-center py-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Full Checkout Details →
                  </Link>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a dispute to view evidence
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚖️</span>
                </div>
                <p className="font-medium">Select a dispute</p>
                <p className="text-sm mt-1">View and export cryptographic evidence</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
