"""
Pydantic models for Merchant Control Dashboard API.
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from enum import Enum


# Enums
class TrustLevel(str, Enum):
    TRUSTED = "trusted"
    PROBATION = "probation"
    BLOCKED = "blocked"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    FAILED = "failed"
    SKIPPED = "skipped"
    PENDING = "pending"


class Modality(str, Enum):
    HUMAN_PRESENT = "human_present"
    HUMAN_NOT_PRESENT = "human_not_present"


class CheckoutStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    DECLINED = "declined"
    CHALLENGED = "challenged"
    ABANDONED = "abandoned"
    DISPUTED = "disputed"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class DisputeStatus(str, Enum):
    NONE = "none"
    OPENED = "opened"
    REPRESENTED = "represented"
    WON = "won"
    LOST = "lost"


class MandateType(str, Enum):
    CART = "cart"
    INTENT = "intent"
    PAYMENT = "payment"


class MandateStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    USED = "used"


# Cart Item
class CartItem(BaseModel):
    sku: str
    name: str
    quantity: int
    unit_price: float
    total: float
    image_url: Optional[str] = None
    variant: Optional[str] = None


# Agent Models
class AgentBase(BaseModel):
    name: str
    provider: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    jwks_uri: Optional[str] = None


class AgentResponse(AgentBase):
    id: str
    trust_level: TrustLevel
    first_seen_at: datetime
    last_seen_at: Optional[datetime]
    total_transactions: int
    successful_transactions: int
    declined_transactions: int
    disputed_transactions: int
    created_at: datetime

    # Computed fields
    success_rate: float = 0.0
    dispute_rate: float = 0.0

    class Config:
        from_attributes = True


class AgentDetail(AgentResponse):
    public_key: Optional[str] = None
    keys: List["AgentKeyResponse"] = []
    recent_verifications: List["VerificationLogResponse"] = []


class AgentTrustUpdate(BaseModel):
    trust_level: TrustLevel


class AgentRegisterRequest(BaseModel):
    """
    Request to register a new agent (TAP protocol).
    Agents must provide a JWKS URI for public key verification.
    """
    name: str = Field(..., description="Display name of the agent")
    provider: str = Field(..., description="Organization that operates the agent")
    jwks_uri: str = Field(..., description="JWKS endpoint for public key verification (RFC 9421)")
    description: Optional[str] = Field(None, description="Optional description of the agent")


class AgentRegisterResponse(BaseModel):
    """Response after registering an agent."""
    agent: AgentResponse
    key_fetched: bool
    message: str


# Customer Models
class CustomerResponse(BaseModel):
    id: str
    email_hash: Optional[str]
    phone_hash: Optional[str]
    first_seen_at: datetime
    total_orders: int
    total_spent: float

    class Config:
        from_attributes = True


# Mandate Models
class MandateBase(BaseModel):
    type: MandateType
    payload: Dict[str, Any]


class MandateResponse(BaseModel):
    id: str
    type: MandateType
    checkout_id: Optional[str]
    payload: Dict[str, Any]
    payload_hash: str
    user_signature: Optional[str]
    user_signature_verified: Optional[bool]
    merchant_signature: Optional[str]
    merchant_signature_verified: Optional[bool]
    created_at: datetime
    expires_at: Optional[datetime]
    status: MandateStatus
    ttl_seconds: Optional[int]
    prompt_playback: Optional[str]

    class Config:
        from_attributes = True


class MandateExport(BaseModel):
    """Export format for dispute evidence."""
    mandate: MandateResponse
    human_readable_summary: str
    verification_chain: List[Dict[str, Any]]
    exported_at: datetime


# Checkout Models
class CheckoutBase(BaseModel):
    user_id: Optional[str]
    cart_items: List[CartItem]
    subtotal: float
    tax: float
    shipping: float = 0.0
    total: float
    currency: str = "USD"


class CheckoutResponse(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    # User context
    user_id: Optional[str]
    user_email_hash: Optional[str]
    ip_address: Optional[str]
    country_code: Optional[str]

    # Cart
    cart_items: List[CartItem]
    subtotal: float
    tax: float
    shipping: float
    total: float
    currency: str

    # Agent context
    agent_id: Optional[str]
    agent_provider: Optional[str]
    agent_verification_status: VerificationStatus
    modality: Modality

    # Outcome
    status: CheckoutStatus
    payment_status: PaymentStatus
    challenge_type: Optional[str]
    decline_reason: Optional[str]

    # Dispute
    dispute_status: DisputeStatus
    dispute_opened_at: Optional[datetime]

    # Consumer recognition
    is_known_customer: bool

    class Config:
        from_attributes = True


class CheckoutDetail(CheckoutResponse):
    """Full checkout detail with related entities."""
    agent: Optional[AgentResponse] = None
    customer: Optional[CustomerResponse] = None
    mandates: List[MandateResponse] = []
    events: List["CheckoutEventResponse"] = []
    device_fingerprint: Optional[Dict[str, Any]] = None


class CheckoutListResponse(BaseModel):
    """Paginated checkout list."""
    items: List[CheckoutResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Checkout Event Models
class CheckoutEventResponse(BaseModel):
    id: str
    checkout_id: str
    timestamp: datetime
    event_type: str
    event_data: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


# Verification Log Models
class VerificationLogResponse(BaseModel):
    id: str
    timestamp: datetime
    agent_id: Optional[str]
    checkout_id: Optional[str]
    signature_type: str
    result: str
    failure_reason: Optional[str]
    key_id: Optional[str]
    algorithm: Optional[str]
    request_path: Optional[str]
    request_authority: Optional[str]

    class Config:
        from_attributes = True


# Agent Key Models
class AgentKeyResponse(BaseModel):
    id: str
    agent_id: Optional[str]
    key_id: str
    algorithm: str
    fetched_at: datetime
    expires_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True


# Analytics Models
class OverviewMetrics(BaseModel):
    """Dashboard overview metrics."""
    total_checkouts: int
    total_revenue: float
    average_order_value: float
    completed_checkouts: int
    declined_checkouts: int
    challenged_checkouts: int
    abandoned_checkouts: int
    disputed_checkouts: int

    # Rates
    completion_rate: float
    decline_rate: float
    challenge_rate: float
    dispute_rate: float

    # Agent metrics
    total_agents: int
    trusted_agents: int
    blocked_agents: int

    # Consumer metrics
    known_customer_rate: float

    # Modality split
    human_present_count: int
    human_not_present_count: int

    # Trends (vs previous period)
    revenue_trend: float
    checkout_trend: float


class FunnelMetrics(BaseModel):
    """Conversion funnel metrics."""
    cart_created: int
    mandate_signed: int
    payment_attempted: int
    payment_authorized: int
    completed: int

    # Conversion rates
    mandate_rate: float
    payment_rate: float
    authorization_rate: float
    completion_rate: float


class AgentPerformance(BaseModel):
    """Per-agent performance metrics."""
    agent_id: str
    agent_name: str
    trust_level: TrustLevel
    total_checkouts: int
    total_revenue: float
    completion_rate: float
    decline_rate: float
    dispute_rate: float
    avg_order_value: float


class TrendDataPoint(BaseModel):
    """Single data point for time series."""
    date: str
    value: float
    label: Optional[str] = None


class AnalyticsTrends(BaseModel):
    """Time series trend data."""
    revenue: List[TrendDataPoint]
    checkouts: List[TrendDataPoint]
    completion_rate: List[TrendDataPoint]


# Dispute Models
class DisputeResponse(BaseModel):
    """Dispute with related checkout info."""
    checkout: CheckoutResponse
    mandates: List[MandateResponse]
    verification_logs: List[VerificationLogResponse]
    evidence_summary: str


class DisputeStatusUpdate(BaseModel):
    status: DisputeStatus


class EvidencePackage(BaseModel):
    """Complete evidence package for representment."""
    checkout_id: str
    checkout: CheckoutDetail
    cart_mandate: Optional[MandateResponse]
    intent_mandate: Optional[MandateResponse]
    payment_mandate: Optional[MandateResponse]
    verification_logs: List[VerificationLogResponse]
    timeline: List[CheckoutEventResponse]
    liability_assessment: str
    human_readable_summary: str
    exported_at: datetime


# Update forward references
AgentDetail.model_rebuild()
CheckoutDetail.model_rebuild()
