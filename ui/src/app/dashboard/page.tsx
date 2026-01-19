"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bot,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { AgentTrustBadge } from "@/components/dashboard/AgentTrustBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  fetchOverviewMetrics,
  fetchAgents,
  fetchCheckouts,
  fetchTrends,
  type OverviewMetrics,
  type AgentResponse,
  type CheckoutResponse,
  type TrendDataPoint,
} from "@/lib/dashboard/api";
import { formatPrice } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [recentCheckouts, setRecentCheckouts] = useState<CheckoutResponse[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, agentsData, checkoutsData, trendsData] = await Promise.all([
          fetchOverviewMetrics(),
          fetchAgents(),
          fetchCheckouts({ page_size: 5 }),
          fetchTrends(14),
        ]);
        setMetrics(metricsData);
        setAgents(agentsData);
        setRecentCheckouts(checkoutsData.items);
        // Use revenue trend data for the chart
        setTrends(trendsData.revenue || []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Monitor agentic commerce performance and trust verification
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard
          title="Total Revenue"
          value={formatPrice(metrics?.total_revenue || 0)}
          trend={metrics?.revenue_trend}
          trendLabel="vs last 15 days"
          icon={<DollarSign className="w-5 h-5 text-gray-600" />}
          variant="success"
        />
        <MetricsCard
          title="Total Checkouts"
          value={metrics?.total_checkouts || 0}
          trend={metrics?.checkout_trend}
          trendLabel="vs last 15 days"
          icon={<ShoppingCart className="w-5 h-5 text-gray-600" />}
        />
        <MetricsCard
          title="Completion Rate"
          value={`${metrics?.completion_rate || 0}%`}
          subtitle={`${metrics?.completed_checkouts || 0} completed`}
          icon={<CheckCircle className="w-5 h-5 text-gray-600" />}
          variant="success"
        />
        <MetricsCard
          title="Dispute Rate"
          value={`${metrics?.dispute_rate || 0}%`}
          subtitle={`${metrics?.disputed_checkouts || 0} disputed`}
          icon={<AlertTriangle className="w-5 h-5 text-gray-600" />}
          variant={
            (metrics?.dispute_rate || 0) > 3 ? "danger" : "default"
          }
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricsCard
          title="Trusted Agents"
          value={`${metrics?.trusted_agents || 0} / ${metrics?.total_agents || 0}`}
          subtitle={`${metrics?.blocked_agents || 0} blocked`}
          icon={<Bot className="w-5 h-5 text-gray-600" />}
        />
        <MetricsCard
          title="Known Customers"
          value={`${metrics?.known_customer_rate || 0}%`}
          subtitle="Consumer recognition rate"
          icon={<Users className="w-5 h-5 text-gray-600" />}
        />
        <MetricsCard
          title="Challenge Rate"
          value={`${metrics?.challenge_rate || 0}%`}
          subtitle={`${metrics?.challenged_checkouts || 0} challenged`}
          icon={<XCircle className="w-5 h-5 text-gray-600" />}
        />
      </div>

      {/* Revenue Trend Chart */}
      {trends.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <p className="text-sm text-gray-500">Last 14 days performance</p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px',
                  }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#6366f1',
                    stroke: 'white',
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modality Split */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Modality
        </h2>
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Human Present</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics?.human_present_count || 0}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    ((metrics?.human_present_count || 0) /
                      (metrics?.total_checkouts || 1)) *
                    100
                  }%`,
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Human Not Present</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics?.human_not_present_count || 0}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    ((metrics?.human_not_present_count || 0) /
                      (metrics?.total_checkouts || 1)) *
                    100
                  }%`,
                }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Checkouts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Checkouts
            </h2>
            <Link
              href="/dashboard/checkouts"
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentCheckouts.map((checkout) => (
              <Link
                key={checkout.id}
                href={`/dashboard/checkouts/${checkout.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(checkout.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {checkout.agent_provider} &middot;{" "}
                      {new Date(checkout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={checkout.status} type="checkout" />
              </Link>
            ))}
          </div>
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Agent Registry
            </h2>
            <Link
              href="/dashboard/agents"
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              Manage <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {agents.slice(0, 5).map((agent) => (
              <Link
                key={agent.id}
                href={`/dashboard/agents/${agent.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {agent.total_transactions} transactions &middot;{" "}
                      {agent.success_rate}% success
                    </p>
                  </div>
                </div>
                <AgentTrustBadge level={agent.trust_level} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
