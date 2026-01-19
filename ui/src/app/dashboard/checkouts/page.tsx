"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bot,
  User,
  Globe,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AgentTrustBadge } from "@/components/dashboard/AgentTrustBadge";
import {
  fetchCheckouts,
  fetchAgents,
  type CheckoutResponse,
  type CheckoutListResponse,
  type AgentResponse,
} from "@/lib/dashboard/api";
import { formatPrice } from "@/lib/utils";

export default function CheckoutsPage() {
  const [checkouts, setCheckouts] = useState<CheckoutListResponse | null>(null);
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    agent_id: "",
    modality: "",
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [checkoutsData, agentsData] = await Promise.all([
          fetchCheckouts({ page, page_size: 15, ...filters }),
          fetchAgents(),
        ]);
        setCheckouts(checkoutsData);
        setAgents(agentsData);
      } catch (error) {
        console.error("Failed to load checkouts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page, filters]);

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Checkouts</h1>
        <p className="text-gray-500 mt-1">
          Browse all agentic checkout transactions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="challenged">Challenged</option>
            <option value="abandoned">Abandoned</option>
            <option value="disputed">Disputed</option>
          </select>

          <select
            value={filters.agent_id}
            onChange={(e) => {
              setFilters({ ...filters, agent_id: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white"
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <select
            value={filters.modality}
            onChange={(e) => {
              setFilters({ ...filters, modality: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white"
          >
            <option value="">All Modalities</option>
            <option value="human_present">Human Present</option>
            <option value="human_not_present">Human Not Present</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checkout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checkouts?.items.map((checkout, index) => {
                    const agent = agentMap.get(checkout.agent_id || "");
                    return (
                      <motion.tr
                        key={checkout.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {checkout.id.slice(0, 8)}...
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {agent?.name || checkout.agent_provider}
                            </span>
                            {agent && (
                              <AgentTrustBadge
                                level={agent.trust_level}
                                size="sm"
                                showLabel={false}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(checkout.total)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({checkout.cart_items.length} items)
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={checkout.status} type="checkout" />
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              checkout.modality === "human_present"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {checkout.modality === "human_present"
                              ? "Present"
                              : "Autonomous"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {checkout.is_known_customer ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <User className="w-3 h-3" /> Known
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Globe className="w-3 h-3" /> New
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(checkout.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/checkouts/${checkout.id}`}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 15 + 1} to{" "}
                {Math.min(page * 15, checkouts?.total || 0)} of{" "}
                {checkouts?.total || 0} checkouts
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(checkouts?.total_pages || 1, p + 1)
                    )
                  }
                  disabled={page >= (checkouts?.total_pages || 1)}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
