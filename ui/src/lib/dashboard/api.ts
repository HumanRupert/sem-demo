/**
 * Dashboard API client for Merchant Control Dashboard.
 */

const API_BASE = "http://localhost:8000/merchant";

// =============================================================================
// TYPES
// =============================================================================

export interface CartItem {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  image_url?: string;
  variant?: string;
}

export interface CheckoutResponse {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  user_email_hash?: string;
  ip_address?: string;
  country_code?: string;
  cart_items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  agent_id?: string;
  agent_provider?: string;
  agent_verification_status: string;
  modality: string;
  status: string;
  payment_status: string;
  challenge_type?: string;
  decline_reason?: string;
  dispute_status: string;
  dispute_opened_at?: string;
  is_known_customer: boolean;
}

export interface CheckoutListResponse {
  items: CheckoutResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AgentResponse {
  id: string;
  name: string;
  provider: string;
  description?: string;
  logo_url?: string;
  jwks_uri?: string;
  trust_level: string;
  first_seen_at: string;
  last_seen_at?: string;
  total_transactions: number;
  successful_transactions: number;
  declined_transactions: number;
  disputed_transactions: number;
  created_at: string;
  success_rate: number;
  dispute_rate: number;
}

export interface OverviewMetrics {
  total_checkouts: number;
  total_revenue: number;
  completed_checkouts: number;
  declined_checkouts: number;
  challenged_checkouts: number;
  abandoned_checkouts: number;
  disputed_checkouts: number;
  completion_rate: number;
  decline_rate: number;
  challenge_rate: number;
  dispute_rate: number;
  total_agents: number;
  trusted_agents: number;
  blocked_agents: number;
  known_customer_rate: number;
  human_present_count: number;
  human_not_present_count: number;
  revenue_trend: number;
  checkout_trend: number;
}

export interface FunnelMetrics {
  cart_created: number;
  mandate_signed: number;
  payment_attempted: number;
  payment_authorized: number;
  completed: number;
  mandate_rate: number;
  payment_rate: number;
  authorization_rate: number;
  completion_rate: number;
}

export interface AgentPerformance {
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

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsTrends {
  revenue: TrendDataPoint[];
  checkouts: TrendDataPoint[];
  completion_rate: TrendDataPoint[];
}

export interface CheckoutEvent {
  id: string;
  checkout_id: string;
  timestamp: string;
  event_type: string;
  event_data?: Record<string, unknown>;
}

export interface MandateResponse {
  id: string;
  type: string;
  checkout_id?: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  user_signature?: string;
  user_signature_verified?: boolean;
  merchant_signature?: string;
  merchant_signature_verified?: boolean;
  created_at: string;
  expires_at?: string;
  status: string;
  ttl_seconds?: number;
  prompt_playback?: string;
}

export interface CheckoutDetail extends CheckoutResponse {
  agent?: AgentResponse;
  customer?: {
    id: string;
    email_hash?: string;
    total_orders: number;
    total_spent: number;
  };
  mandates: MandateResponse[];
  events: CheckoutEvent[];
  device_fingerprint?: Record<string, unknown>;
}

export interface EvidencePackage {
  checkout_id: string;
  checkout: CheckoutDetail;
  cart_mandate?: MandateResponse;
  intent_mandate?: MandateResponse;
  payment_mandate?: MandateResponse;
  verification_logs: unknown[];
  timeline: CheckoutEvent[];
  liability_assessment: string;
  human_readable_summary: string;
  exported_at: string;
}

export interface DisputeResponse {
  checkout: CheckoutResponse;
  mandates: MandateResponse[];
  verification_logs: unknown[];
  evidence_summary: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Checkouts
export async function fetchCheckouts(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  agent_id?: string;
  modality?: string;
}): Promise<CheckoutListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size) searchParams.set("page_size", params.page_size.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.agent_id) searchParams.set("agent_id", params.agent_id);
  if (params?.modality) searchParams.set("modality", params.modality);

  const query = searchParams.toString();
  return fetchApi(`/checkouts${query ? `?${query}` : ""}`);
}

export async function fetchCheckout(id: string): Promise<CheckoutDetail> {
  return fetchApi(`/checkouts/${id}`);
}

export async function fetchCheckoutEvidence(id: string): Promise<EvidencePackage> {
  return fetchApi(`/checkouts/${id}/evidence`);
}

// Agents
export async function fetchAgents(trustLevel?: string): Promise<AgentResponse[]> {
  const query = trustLevel ? `?trust_level=${trustLevel}` : "";
  return fetchApi(`/agents${query}`);
}

export async function fetchAgent(id: string): Promise<AgentResponse> {
  return fetchApi(`/agents/${id}`);
}

export async function updateAgentTrust(
  id: string,
  trustLevel: string
): Promise<AgentResponse> {
  return fetchApi(`/agents/${id}/trust`, {
    method: "POST",
    body: JSON.stringify({ trust_level: trustLevel }),
  });
}

// Analytics
export async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  return fetchApi("/analytics/overview");
}

export async function fetchFunnelMetrics(): Promise<FunnelMetrics> {
  return fetchApi("/analytics/funnel");
}

export async function fetchAgentPerformance(): Promise<AgentPerformance[]> {
  return fetchApi("/analytics/agents");
}

export async function fetchTrends(days?: number): Promise<AnalyticsTrends> {
  const query = days ? `?days=${days}` : "";
  return fetchApi(`/analytics/trends${query}`);
}

// Disputes
export async function fetchDisputes(status?: string): Promise<DisputeResponse[]> {
  const query = status ? `?status=${status}` : "";
  return fetchApi(`/disputes${query}`);
}

export async function updateDisputeStatus(
  checkoutId: string,
  status: string
): Promise<CheckoutResponse> {
  return fetchApi(`/disputes/${checkoutId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

// Mandates
export async function fetchMandates(params?: {
  type?: string;
  checkout_id?: string;
}): Promise<MandateResponse[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.checkout_id) searchParams.set("checkout_id", params.checkout_id);

  const query = searchParams.toString();
  return fetchApi(`/mandates${query ? `?${query}` : ""}`);
}
