'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OverviewMetrics {
  total_checkouts: number;
  completed_checkouts: number;
  total_revenue: number;
  average_order_value: number;
  completion_rate: number;
  dispute_rate: number;
  human_present_count: number;
  human_not_present_count: number;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  trust_level: string;
  total_checkouts: number;
  total_revenue: number;
  completion_rate: number;
  decline_rate: number;
  dispute_rate: number;
  avg_order_value: number;
}

interface TrendData {
  date: string;
  checkouts: number;
  revenue: number;
  completed: number;
}

const PERIODS = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const getDays = (p: string) => PERIODS.find(x => x.key === p)?.days || 30;

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = getDays(period);
      const [overviewRes, agentsRes, trendsRes] = await Promise.all([
        fetch('http://localhost:8000/merchant/analytics/overview'),
        fetch('http://localhost:8000/merchant/analytics/agents'),
        fetch(`http://localhost:8000/merchant/analytics/trends?days=${days}`),
      ]);

      const [overviewData, agentsData, trendsData] = await Promise.all([
        overviewRes.json(),
        agentsRes.json(),
        trendsRes.json(),
      ]);

      setOverview(overviewData);
      setAgentPerformance(Array.isArray(agentsData) ? agentsData : agentsData.agents || []);
      setTrends(trendsData.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-6 bg-gray-100 rounded w-32 animate-pulse" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === p.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {overview && (
        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-tight">
              {formatFullCurrency(overview.total_revenue)}
            </p>
            <p className="text-sm text-gray-400">{overview.completed_checkouts} orders</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Avg Order</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-tight">
              {formatFullCurrency(overview.average_order_value)}
            </p>
            <p className="text-sm text-gray-400">per checkout</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Completion</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-tight">
              {overview.completion_rate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400">{overview.total_checkouts} total</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Disputes</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-tight">
              {overview.dispute_rate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400">of completed</p>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {trends.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-gray-900">Revenue</h2>
            <span className="text-xs text-gray-400">Last {getDays(period)} days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" stopOpacity={0.08}/>
                    <stop offset="100%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  labelStyle={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}
                  itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 500 }}
                  formatter={(value: number) => [formatFullCurrency(value), '']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#000"
                  strokeWidth={1.5}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Checkouts Chart */}
      {trends.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-gray-900">Checkouts</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-900" />
                Total
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Completed
              </span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="checkoutsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" stopOpacity={0.05}/>
                    <stop offset="100%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  labelStyle={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}
                  itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 500 }}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="checkouts"
                  stroke="#000"
                  strokeWidth={1.5}
                  fill="url(#checkoutsGradient)"
                  dot={false}
                  name="Total"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modality Split */}
      {overview && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Human Present</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overview.human_present_count}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full"
                style={{ width: `${(overview.human_present_count / Math.max(overview.total_checkouts, 1)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {((overview.human_present_count / Math.max(overview.total_checkouts, 1)) * 100).toFixed(0)}% of transactions
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Autonomous</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {overview.human_not_present_count}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full"
                style={{ width: `${(overview.human_not_present_count / Math.max(overview.total_checkouts, 1)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {((overview.human_not_present_count / Math.max(overview.total_checkouts, 1)) * 100).toFixed(0)}% of transactions
            </p>
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {agentPerformance.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900">Agent Performance</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left py-3 px-6 font-medium">Agent</th>
                <th className="text-right py-3 px-6 font-medium">Transactions</th>
                <th className="text-right py-3 px-6 font-medium">Revenue</th>
                <th className="text-right py-3 px-6 font-medium">Success</th>
                <th className="text-right py-3 px-6 font-medium">Disputes</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.map((agent, i) => (
                <tr
                  key={agent.agent_id}
                  className={i !== agentPerformance.length - 1 ? 'border-b border-gray-50' : ''}
                >
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-gray-900">{agent.agent_name}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-sm text-gray-600">{agent.total_checkouts}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatFullCurrency(agent.total_revenue)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-sm text-gray-600">
                      {agent.completion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm ${agent.dispute_rate > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                      {agent.dispute_rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
