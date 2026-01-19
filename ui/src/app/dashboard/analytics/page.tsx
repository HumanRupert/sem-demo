'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
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

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
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

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, funnelRes, agentsRes, trendsRes] = await Promise.all([
        fetch(`http://localhost:8000/merchant/analytics/overview?period=${period}`),
        fetch(`http://localhost:8000/merchant/analytics/funnel?period=${period}`),
        fetch(`http://localhost:8000/merchant/analytics/agents?period=${period}`),
        fetch(`http://localhost:8000/merchant/analytics/trends?period=${period}`),
      ]);

      const [overviewData, funnelData, agentsData, trendsData] = await Promise.all([
        overviewRes.json(),
        funnelRes.json(),
        agentsRes.json(),
        trendsRes.json(),
      ]);

      setOverview(overviewData);
      setFunnel(funnelData.stages || []);
      // API returns array directly, not {agents: [...]}
      setAgentPerformance(Array.isArray(agentsData) ? agentsData : agentsData.agents || []);
      setTrends(trendsData.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const maxRevenue = Math.max(...trends.map((t) => t.revenue), 1);
  const maxCheckouts = Math.max(...trends.map((t) => t.checkouts), 1);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 mt-1">Performance insights for agentic commerce</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {overview && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(overview.total_revenue)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {overview.total_checkouts} checkouts
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(overview.average_order_value)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              per completed checkout
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {formatPercent(overview.completion_rate)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {overview.completed_checkouts} completed
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Dispute Rate</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              {formatPercent(overview.dispute_rate)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              requires monitoring
            </p>
          </div>
        </div>
      )}

      {/* Modality Comparison */}
      {overview && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Modality</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👤</span>
              </div>
              <p className="text-4xl font-bold text-blue-700">{overview.human_present_count}</p>
              <p className="text-sm text-blue-600 mt-1">Human Present</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatPercent((overview.human_present_count / Math.max(overview.total_checkouts, 1)) * 100)} of total
              </p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <p className="text-4xl font-bold text-purple-700">{overview.human_not_present_count}</p>
              <p className="text-sm text-purple-600 mt-1">Human Not Present (Autonomous)</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatPercent((overview.human_not_present_count / Math.max(overview.total_checkouts, 1)) * 100)} of total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {funnel.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnel.map((stage, index) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 text-right">
                  {stage.stage.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                      {stage.count} ({formatPercent(stage.percentage)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Trend - Beautiful Line Chart */}
      {trends.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Checkouts Trend - Line Chart */}
      {trends.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Checkout Volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'checkouts') return [value, 'Total Checkouts'];
                    if (name === 'completed') return [value, 'Completed'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="checkouts"
                  name="Total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Agent Performance Comparison */}
      {agentPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Agent</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Transactions</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Success Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Dispute Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Performance</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent) => (
                  <tr key={agent.agent_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-700">{agent.agent_name}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{agent.total_checkouts}</td>
                    <td className="py-3 px-4 text-right text-gray-700 font-medium">
                      {formatCurrency(agent.total_revenue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={agent.completion_rate >= 80 ? 'text-green-600' : agent.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                        {formatPercent(agent.completion_rate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={agent.dispute_rate <= 2 ? 'text-green-600' : agent.dispute_rate <= 5 ? 'text-yellow-600' : 'text-red-600'}>
                        {formatPercent(agent.dispute_rate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${agent.completion_rate >= 80 ? 'bg-green-500' : agent.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${agent.completion_rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Insights</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Top Performing Agent</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {agentPerformance.length > 0
                ? agentPerformance.reduce((a, b) => (a.completion_rate > b.completion_rate ? a : b)).agent_name
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Based on completion rate</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Highest Revenue Agent</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              {agentPerformance.length > 0
                ? agentPerformance.reduce((a, b) => (a.total_revenue > b.total_revenue ? a : b)).agent_name
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Based on total revenue</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">Agent Requiring Attention</p>
            <p className="text-lg font-bold text-orange-600 mt-1">
              {agentPerformance.length > 0
                ? agentPerformance.reduce((a, b) => (a.dispute_rate > b.dispute_rate ? a : b)).agent_name
                : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Highest dispute rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
