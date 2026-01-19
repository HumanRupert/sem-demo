"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  ShieldCheck,
  Globe,
  CreditCard,
  Package,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AgentTrustBadge } from "@/components/dashboard/AgentTrustBadge";
import {
  fetchCheckout,
  fetchCheckoutEvidence,
  type CheckoutDetail,
  type EvidencePackage,
} from "@/lib/dashboard/api";
import { formatPrice } from "@/lib/utils";

const eventIcons: Record<string, React.ElementType> = {
  agent_verified: ShieldCheck,
  agent_verification_failed: XCircle,
  cart_created: Package,
  mandate_signed: FileText,
  payment_attempted: CreditCard,
  payment_captured: CheckCircle,
  payment_declined: XCircle,
  challenge_initiated: AlertTriangle,
  challenge_completed: CheckCircle,
  checkout_abandoned: XCircle,
  order_confirmed: CheckCircle,
  dispute_opened: AlertTriangle,
  dispute_represented: Clock,
  dispute_won: CheckCircle,
  dispute_lost: XCircle,
};

export default function CheckoutDetailPage() {
  const params = useParams();
  const checkoutId = params.id as string;

  const [checkout, setCheckout] = useState<CheckoutDetail | null>(null);
  const [evidence, setEvidence] = useState<EvidencePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchCheckout(checkoutId);
        setCheckout(data);
      } catch (error) {
        console.error("Failed to load checkout:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [checkoutId]);

  const handleExportEvidence = async () => {
    try {
      const data = await fetchCheckoutEvidence(checkoutId);
      setEvidence(data);
      setShowEvidence(true);
    } catch (error) {
      console.error("Failed to export evidence:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Checkout not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back button */}
      <Link
        href="/dashboard/checkouts"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Checkouts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Checkout Details
            <StatusBadge status={checkout.status} type="checkout" />
          </h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{checkout.id}</p>
        </div>
        <button
          onClick={handleExportEvidence}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Evidence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cart Items
            </h2>
            <div className="space-y-3">
              {checkout.cart_items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.variant} &middot; SKU: {item.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.total)}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatPrice(checkout.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">{formatPrice(checkout.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900">{formatPrice(checkout.shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t text-gray-900">
                <span>Total</span>
                <span>{formatPrice(checkout.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Checkout Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {checkout.events.map((event, i) => {
                  const Icon =
                    eventIcons[event.event_type] || Clock;
                  const isSuccess =
                    event.event_type.includes("completed") ||
                    event.event_type.includes("verified") ||
                    event.event_type.includes("confirmed") ||
                    event.event_type.includes("captured") ||
                    event.event_type === "dispute_won";
                  const isError =
                    event.event_type.includes("failed") ||
                    event.event_type.includes("declined") ||
                    event.event_type.includes("abandoned") ||
                    event.event_type === "dispute_lost";

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative pl-10"
                    >
                      <div
                        className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isSuccess
                            ? "bg-green-100"
                            : isError
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isSuccess
                              ? "text-green-600"
                              : isError
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {event.event_type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {event.event_data && (
                          <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                            {JSON.stringify(event.event_data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mandates */}
          {checkout.mandates.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Verifiable Digital Credentials (VDCs)
              </h2>
              <div className="space-y-3">
                {checkout.mandates.map((mandate) => (
                  <div
                    key={mandate.id}
                    className="p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 uppercase">
                        {mandate.type} Mandate
                      </span>
                      <StatusBadge
                        status={mandate.status}
                        type="verification"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">User Signature:</span>{" "}
                        <span
                          className={
                            mandate.user_signature_verified
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        >
                          {mandate.user_signature_verified
                            ? "Verified"
                            : mandate.user_signature
                            ? "Unverified"
                            : "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          Merchant Signature:
                        </span>{" "}
                        <span
                          className={
                            mandate.merchant_signature_verified
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        >
                          {mandate.merchant_signature_verified
                            ? "Verified"
                            : mandate.merchant_signature
                            ? "Unverified"
                            : "None"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <code className="text-xs text-gray-500 font-mono">
                        Hash: {mandate.payload_hash.slice(0, 32)}...
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Agent</h3>
            {checkout.agent ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <Link
                    href={`/dashboard/agents/${checkout.agent.id}`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    {checkout.agent.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <AgentTrustBadge
                      level={checkout.agent.trust_level}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Unknown agent</p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Verification</span>
                <StatusBadge
                  status={checkout.agent_verification_status}
                  type="verification"
                />
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Transaction Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Modality</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    checkout.modality === "human_present"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {checkout.modality === "human_present"
                    ? "Human Present"
                    : "Autonomous"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment Status</span>
                <StatusBadge
                  status={checkout.payment_status}
                  type="payment"
                />
              </div>
              {checkout.challenge_type && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Challenge</span>
                  <span className="text-yellow-600 uppercase text-xs font-medium">
                    {checkout.challenge_type}
                  </span>
                </div>
              )}
              {checkout.decline_reason && (
                <div className="text-sm">
                  <span className="text-gray-500">Decline Reason:</span>
                  <p className="text-red-600 mt-1 text-xs">
                    {checkout.decline_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Consumer Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Consumer</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {checkout.is_known_customer ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <User className="w-4 h-4" /> Known Customer
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Globe className="w-4 h-4" /> New Customer
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Country: {checkout.country_code || "Unknown"}</p>
                <p>IP: {checkout.ip_address || "Hidden"}</p>
              </div>
              {checkout.device_fingerprint && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Device:</p>
                  <code className="text-xs text-gray-600">
                    {checkout.device_fingerprint.browser} /{" "}
                    {checkout.device_fingerprint.platform}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Dispute Info */}
          {checkout.dispute_status !== "none" && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-sm font-medium text-red-700 mb-3">
                Dispute
              </h3>
              <StatusBadge status={checkout.dispute_status} type="dispute" />
              {checkout.dispute_opened_at && (
                <p className="text-xs text-red-600 mt-2">
                  Opened:{" "}
                  {new Date(checkout.dispute_opened_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Modal */}
      {showEvidence && evidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Evidence Package
              </h2>
              <button
                onClick={() => setShowEvidence(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-xs font-mono whitespace-pre-wrap">
                {evidence.human_readable_summary}
              </pre>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Liability Assessment
                </h3>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                  {evidence.liability_assessment}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
