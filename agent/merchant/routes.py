"""
FastAPI routes for Merchant Control Dashboard.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from .database import get_db, Checkout, Agent, Mandate, Customer, CheckoutEvent, VerificationLog
from .models import (
    CheckoutResponse, CheckoutDetail, CheckoutListResponse, CheckoutEventResponse,
    AgentResponse, AgentDetail, AgentTrustUpdate, AgentKeyResponse,
    MandateResponse, MandateExport,
    OverviewMetrics, FunnelMetrics, AgentPerformance, AnalyticsTrends, TrendDataPoint,
    DisputeResponse, DisputeStatusUpdate, EvidencePackage,
    VerificationLogResponse, CustomerResponse, CartItem,
    TrustLevel, CheckoutStatus, DisputeStatus, MandateType
)

router = APIRouter(prefix="/merchant", tags=["merchant"])


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def checkout_to_response(checkout: Checkout) -> CheckoutResponse:
    """Convert SQLAlchemy Checkout to Pydantic response."""
    return CheckoutResponse(
        id=checkout.id,
        created_at=checkout.created_at,
        updated_at=checkout.updated_at,
        user_id=checkout.user_id,
        user_email_hash=checkout.user_email_hash,
        ip_address=checkout.ip_address,
        country_code=checkout.country_code,
        cart_items=[CartItem(**item) for item in checkout.cart_items],
        subtotal=checkout.subtotal,
        tax=checkout.tax,
        shipping=checkout.shipping,
        total=checkout.total,
        currency=checkout.currency,
        agent_id=checkout.agent_id,
        agent_provider=checkout.agent_provider,
        agent_verification_status=checkout.agent_verification_status,
        modality=checkout.modality,
        status=checkout.status,
        payment_status=checkout.payment_status,
        challenge_type=checkout.challenge_type,
        decline_reason=checkout.decline_reason,
        dispute_status=checkout.dispute_status,
        dispute_opened_at=checkout.dispute_opened_at,
        is_known_customer=checkout.is_known_customer,
    )


def agent_to_response(agent: Agent) -> AgentResponse:
    """Convert SQLAlchemy Agent to Pydantic response."""
    success_rate = (agent.successful_transactions / agent.total_transactions * 100) if agent.total_transactions > 0 else 0
    dispute_rate = (agent.disputed_transactions / agent.total_transactions * 100) if agent.total_transactions > 0 else 0

    return AgentResponse(
        id=agent.id,
        name=agent.name,
        provider=agent.provider,
        description=agent.description,
        logo_url=agent.logo_url,
        jwks_uri=agent.jwks_uri,
        trust_level=agent.trust_level,
        first_seen_at=agent.first_seen_at,
        last_seen_at=agent.last_seen_at,
        total_transactions=agent.total_transactions,
        successful_transactions=agent.successful_transactions,
        declined_transactions=agent.declined_transactions,
        disputed_transactions=agent.disputed_transactions,
        created_at=agent.created_at,
        success_rate=round(success_rate, 1),
        dispute_rate=round(dispute_rate, 1),
    )


def mandate_to_response(mandate: Mandate) -> MandateResponse:
    """Convert SQLAlchemy Mandate to Pydantic response."""
    return MandateResponse(
        id=mandate.id,
        type=mandate.type,
        checkout_id=mandate.checkout_id,
        payload=mandate.payload,
        payload_hash=mandate.payload_hash,
        user_signature=mandate.user_signature,
        user_signature_verified=mandate.user_signature_verified,
        merchant_signature=mandate.merchant_signature,
        merchant_signature_verified=mandate.merchant_signature_verified,
        created_at=mandate.created_at,
        expires_at=mandate.expires_at,
        status=mandate.status,
        ttl_seconds=mandate.ttl_seconds,
        prompt_playback=mandate.prompt_playback,
    )


# =============================================================================
# CHECKOUT ENDPOINTS
# =============================================================================

@router.get("/checkouts", response_model=CheckoutListResponse)
def list_checkouts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    agent_id: Optional[str] = None,
    modality: Optional[str] = None,
    dispute_status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List checkouts with filtering and pagination."""
    query = db.query(Checkout)

    # Apply filters
    if status:
        query = query.filter(Checkout.status == status)
    if agent_id:
        query = query.filter(Checkout.agent_id == agent_id)
    if modality:
        query = query.filter(Checkout.modality == modality)
    if dispute_status:
        query = query.filter(Checkout.dispute_status == dispute_status)
    if date_from:
        query = query.filter(Checkout.created_at >= date_from)
    if date_to:
        query = query.filter(Checkout.created_at <= date_to)
    if min_amount:
        query = query.filter(Checkout.total >= min_amount)
    if max_amount:
        query = query.filter(Checkout.total <= max_amount)
    if search:
        query = query.filter(Checkout.id.contains(search) | Checkout.user_id.contains(search))

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    checkouts = query.order_by(desc(Checkout.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return CheckoutListResponse(
        items=[checkout_to_response(c) for c in checkouts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/checkouts/{checkout_id}", response_model=CheckoutDetail)
def get_checkout(checkout_id: str, db: Session = Depends(get_db)):
    """Get detailed checkout information including timeline."""
    checkout = db.query(Checkout).filter(Checkout.id == checkout_id).first()
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")

    # Get related entities
    agent = db.query(Agent).filter(Agent.id == checkout.agent_id).first() if checkout.agent_id else None
    customer = db.query(Customer).filter(Customer.id == checkout.customer_id).first() if checkout.customer_id else None
    mandates = db.query(Mandate).filter(Mandate.checkout_id == checkout_id).all()
    events = db.query(CheckoutEvent).filter(CheckoutEvent.checkout_id == checkout_id).order_by(CheckoutEvent.timestamp).all()

    return CheckoutDetail(
        **checkout_to_response(checkout).model_dump(),
        agent=agent_to_response(agent) if agent else None,
        customer=CustomerResponse.model_validate(customer) if customer else None,
        mandates=[mandate_to_response(m) for m in mandates],
        events=[CheckoutEventResponse.model_validate(e) for e in events],
        device_fingerprint=checkout.device_fingerprint,
    )


@router.get("/checkouts/{checkout_id}/evidence", response_model=EvidencePackage)
def get_checkout_evidence(checkout_id: str, db: Session = Depends(get_db)):
    """Get complete evidence package for dispute representment."""
    checkout = db.query(Checkout).filter(Checkout.id == checkout_id).first()
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")

    # Get all related data
    agent = db.query(Agent).filter(Agent.id == checkout.agent_id).first() if checkout.agent_id else None
    customer = db.query(Customer).filter(Customer.id == checkout.customer_id).first() if checkout.customer_id else None
    mandates = db.query(Mandate).filter(Mandate.checkout_id == checkout_id).all()
    events = db.query(CheckoutEvent).filter(CheckoutEvent.checkout_id == checkout_id).order_by(CheckoutEvent.timestamp).all()
    logs = db.query(VerificationLog).filter(VerificationLog.checkout_id == checkout_id).order_by(VerificationLog.timestamp).all()

    # Find specific mandates
    cart_mandate = next((m for m in mandates if m.type == "cart"), None)
    intent_mandate = next((m for m in mandates if m.type == "intent"), None)
    payment_mandate = next((m for m in mandates if m.type == "payment"), None)

    # Generate liability assessment
    if checkout.modality == "human_present" and cart_mandate and cart_mandate.user_signature_verified:
        liability_assessment = "User signed Cart Mandate confirms explicit consent. Liability shifts to user per AP2 Table 6.1."
    elif checkout.modality == "human_not_present" and intent_mandate:
        liability_assessment = "Intent Mandate signed for autonomous purchase. Verify agent actions align with mandate terms."
    else:
        liability_assessment = "Standard liability rules apply. Review verification logs for agent authentication status."

    # Generate human-readable summary
    items_desc = ", ".join([f"{item['name']} (x{item['quantity']})" for item in checkout.cart_items[:3]])
    if len(checkout.cart_items) > 3:
        items_desc += f" and {len(checkout.cart_items) - 3} more"

    summary = f"""
CHECKOUT EVIDENCE SUMMARY
========================
Checkout ID: {checkout.id}
Date: {checkout.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
Amount: ${checkout.total:.2f} {checkout.currency}

Items: {items_desc}

Agent: {agent.name if agent else 'Unknown'} ({checkout.agent_provider})
Agent Trust Level: {agent.trust_level if agent else 'N/A'}
Agent Verification: {checkout.agent_verification_status}

Modality: {checkout.modality.replace('_', ' ').title()}
Customer Status: {'Known Customer' if checkout.is_known_customer else 'New Customer'}

Payment Status: {checkout.payment_status}
Checkout Status: {checkout.status}
Dispute Status: {checkout.dispute_status}

MANDATE CHAIN:
- Cart Mandate: {'Present, User Signed' if cart_mandate and cart_mandate.user_signature else 'Missing/Unsigned'}
- Intent Mandate: {'Present' if intent_mandate else 'N/A (Human Present)'}
- Payment Mandate: {'Present' if payment_mandate else 'Missing'}

VERIFICATION LOGS: {len(logs)} entries
- All agent signatures verified: {'Yes' if all(l.result == 'pass' for l in logs) else 'No'}

LIABILITY ASSESSMENT:
{liability_assessment}
"""

    checkout_detail = CheckoutDetail(
        **checkout_to_response(checkout).model_dump(),
        agent=agent_to_response(agent) if agent else None,
        customer=CustomerResponse.model_validate(customer) if customer else None,
        mandates=[mandate_to_response(m) for m in mandates],
        events=[CheckoutEventResponse.model_validate(e) for e in events],
        device_fingerprint=checkout.device_fingerprint,
    )

    return EvidencePackage(
        checkout_id=checkout_id,
        checkout=checkout_detail,
        cart_mandate=mandate_to_response(cart_mandate) if cart_mandate else None,
        intent_mandate=mandate_to_response(intent_mandate) if intent_mandate else None,
        payment_mandate=mandate_to_response(payment_mandate) if payment_mandate else None,
        verification_logs=[VerificationLogResponse.model_validate(l) for l in logs],
        timeline=[CheckoutEventResponse.model_validate(e) for e in events],
        liability_assessment=liability_assessment,
        human_readable_summary=summary.strip(),
        exported_at=datetime.utcnow(),
    )


# =============================================================================
# AGENT ENDPOINTS
# =============================================================================

@router.get("/agents", response_model=List[AgentResponse])
def list_agents(
    trust_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all agents in the registry."""
    query = db.query(Agent)
    if trust_level:
        query = query.filter(Agent.trust_level == trust_level)
    agents = query.order_by(desc(Agent.total_transactions)).all()
    return [agent_to_response(a) for a in agents]


@router.get("/agents/{agent_id}", response_model=AgentDetail)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Get detailed agent information."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    keys = agent.keys
    recent_logs = db.query(VerificationLog).filter(
        VerificationLog.agent_id == agent_id
    ).order_by(desc(VerificationLog.timestamp)).limit(20).all()

    response = agent_to_response(agent)
    return AgentDetail(
        **response.model_dump(),
        public_key=agent.public_key,
        keys=[AgentKeyResponse.model_validate(k) for k in keys],
        recent_verifications=[VerificationLogResponse.model_validate(l) for l in recent_logs],
    )


@router.post("/agents/{agent_id}/trust", response_model=AgentResponse)
def update_agent_trust(agent_id: str, update: AgentTrustUpdate, db: Session = Depends(get_db)):
    """Update agent trust level."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.trust_level = update.trust_level.value
    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)

    return agent_to_response(agent)


# =============================================================================
# MANDATE ENDPOINTS
# =============================================================================

@router.get("/mandates", response_model=List[MandateResponse])
def list_mandates(
    type: Optional[str] = None,
    status: Optional[str] = None,
    checkout_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List mandates with filtering."""
    query = db.query(Mandate)
    if type:
        query = query.filter(Mandate.type == type)
    if status:
        query = query.filter(Mandate.status == status)
    if checkout_id:
        query = query.filter(Mandate.checkout_id == checkout_id)

    mandates = query.order_by(desc(Mandate.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    return [mandate_to_response(m) for m in mandates]


@router.get("/mandates/{mandate_id}", response_model=MandateResponse)
def get_mandate(mandate_id: str, db: Session = Depends(get_db)):
    """Get mandate details."""
    mandate = db.query(Mandate).filter(Mandate.id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    return mandate_to_response(mandate)


@router.post("/mandates/{mandate_id}/export", response_model=MandateExport)
def export_mandate(mandate_id: str, db: Session = Depends(get_db)):
    """Export mandate for dispute evidence."""
    mandate = db.query(Mandate).filter(Mandate.id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")

    # Get verification chain
    logs = db.query(VerificationLog).filter(
        VerificationLog.checkout_id == mandate.checkout_id
    ).order_by(VerificationLog.timestamp).all()

    verification_chain = [{
        "timestamp": l.timestamp.isoformat(),
        "type": l.signature_type,
        "result": l.result,
        "key_id": l.key_id,
        "algorithm": l.algorithm,
    } for l in logs]

    # Generate summary
    summary = f"""
MANDATE: {mandate.type.upper()}
ID: {mandate.id}
Created: {mandate.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
Status: {mandate.status}

User Signature: {'Verified' if mandate.user_signature_verified else 'Not Verified' if mandate.user_signature else 'None'}
Merchant Signature: {'Verified' if mandate.merchant_signature_verified else 'Not Verified' if mandate.merchant_signature else 'None'}

Payload Hash: {mandate.payload_hash}
"""

    return MandateExport(
        mandate=mandate_to_response(mandate),
        human_readable_summary=summary.strip(),
        verification_chain=verification_chain,
        exported_at=datetime.utcnow(),
    )


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics/overview", response_model=OverviewMetrics)
def get_analytics_overview(db: Session = Depends(get_db)):
    """Get dashboard overview metrics."""
    # Total counts
    total_checkouts = db.query(Checkout).count()
    total_revenue = db.query(func.sum(Checkout.total)).filter(Checkout.status == "completed").scalar() or 0

    # Status counts
    completed = db.query(Checkout).filter(Checkout.status == "completed").count()
    declined = db.query(Checkout).filter(Checkout.status == "declined").count()
    challenged = db.query(Checkout).filter(Checkout.status == "challenged").count()
    abandoned = db.query(Checkout).filter(Checkout.status == "abandoned").count()
    disputed = db.query(Checkout).filter(Checkout.status == "disputed").count()

    # Agent counts
    total_agents = db.query(Agent).count()
    trusted_agents = db.query(Agent).filter(Agent.trust_level == "trusted").count()
    blocked_agents = db.query(Agent).filter(Agent.trust_level == "blocked").count()

    # Modality counts
    human_present = db.query(Checkout).filter(Checkout.modality == "human_present").count()
    human_not_present = db.query(Checkout).filter(Checkout.modality == "human_not_present").count()

    # Known customer rate
    known_customers = db.query(Checkout).filter(Checkout.is_known_customer == True).count()
    known_rate = (known_customers / total_checkouts * 100) if total_checkouts > 0 else 0

    # Calculate trends (compare to previous 15 days)
    now = datetime.utcnow()
    mid_point = now - timedelta(days=15)

    recent_revenue = db.query(func.sum(Checkout.total)).filter(
        and_(Checkout.status == "completed", Checkout.created_at >= mid_point)
    ).scalar() or 0

    older_revenue = db.query(func.sum(Checkout.total)).filter(
        and_(Checkout.status == "completed", Checkout.created_at < mid_point)
    ).scalar() or 0

    revenue_trend = ((recent_revenue - older_revenue) / older_revenue * 100) if older_revenue > 0 else 0

    recent_checkouts = db.query(Checkout).filter(Checkout.created_at >= mid_point).count()
    older_checkouts = db.query(Checkout).filter(Checkout.created_at < mid_point).count()
    checkout_trend = ((recent_checkouts - older_checkouts) / older_checkouts * 100) if older_checkouts > 0 else 0

    return OverviewMetrics(
        total_checkouts=total_checkouts,
        total_revenue=round(total_revenue, 2),
        completed_checkouts=completed,
        declined_checkouts=declined,
        challenged_checkouts=challenged,
        abandoned_checkouts=abandoned,
        disputed_checkouts=disputed,
        completion_rate=round((completed / total_checkouts * 100) if total_checkouts > 0 else 0, 1),
        decline_rate=round((declined / total_checkouts * 100) if total_checkouts > 0 else 0, 1),
        challenge_rate=round((challenged / total_checkouts * 100) if total_checkouts > 0 else 0, 1),
        dispute_rate=round((disputed / total_checkouts * 100) if total_checkouts > 0 else 0, 1),
        total_agents=total_agents,
        trusted_agents=trusted_agents,
        blocked_agents=blocked_agents,
        known_customer_rate=round(known_rate, 1),
        human_present_count=human_present,
        human_not_present_count=human_not_present,
        revenue_trend=round(revenue_trend, 1),
        checkout_trend=round(checkout_trend, 1),
    )


@router.get("/analytics/funnel", response_model=FunnelMetrics)
def get_analytics_funnel(db: Session = Depends(get_db)):
    """Get conversion funnel metrics."""
    total = db.query(Checkout).count()
    mandates_signed = db.query(Checkout).filter(Checkout.cart_mandate_id != None).count()
    payment_attempted = db.query(Checkout).filter(Checkout.payment_status != "pending").count()
    payment_authorized = db.query(Checkout).filter(Checkout.payment_status.in_(["authorized", "captured"])).count()
    completed = db.query(Checkout).filter(Checkout.status == "completed").count()

    return FunnelMetrics(
        cart_created=total,
        mandate_signed=mandates_signed,
        payment_attempted=payment_attempted,
        payment_authorized=payment_authorized,
        completed=completed,
        mandate_rate=round((mandates_signed / total * 100) if total > 0 else 0, 1),
        payment_rate=round((payment_attempted / mandates_signed * 100) if mandates_signed > 0 else 0, 1),
        authorization_rate=round((payment_authorized / payment_attempted * 100) if payment_attempted > 0 else 0, 1),
        completion_rate=round((completed / total * 100) if total > 0 else 0, 1),
    )


@router.get("/analytics/agents", response_model=List[AgentPerformance])
def get_analytics_agents(db: Session = Depends(get_db)):
    """Get per-agent performance metrics."""
    agents = db.query(Agent).all()
    results = []

    for agent in agents:
        checkouts = db.query(Checkout).filter(Checkout.agent_id == agent.id).all()
        if not checkouts:
            continue

        total = len(checkouts)
        completed = sum(1 for c in checkouts if c.status == "completed")
        declined = sum(1 for c in checkouts if c.status == "declined")
        disputed = sum(1 for c in checkouts if c.status == "disputed")
        revenue = sum(c.total for c in checkouts if c.status == "completed")

        results.append(AgentPerformance(
            agent_id=agent.id,
            agent_name=agent.name,
            trust_level=agent.trust_level,
            total_checkouts=total,
            total_revenue=round(revenue, 2),
            completion_rate=round((completed / total * 100) if total > 0 else 0, 1),
            decline_rate=round((declined / total * 100) if total > 0 else 0, 1),
            dispute_rate=round((disputed / total * 100) if total > 0 else 0, 1),
            avg_order_value=round(revenue / completed, 2) if completed > 0 else 0,
        ))

    return sorted(results, key=lambda x: x.total_revenue, reverse=True)


@router.get("/analytics/trends", response_model=AnalyticsTrends)
def get_analytics_trends(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
):
    """Get time series trend data."""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    revenue_points = []
    checkout_points = []
    rate_points = []

    # Generate daily data points
    current = start_date
    while current <= end_date:
        next_day = current + timedelta(days=1)

        day_checkouts = db.query(Checkout).filter(
            and_(Checkout.created_at >= current, Checkout.created_at < next_day)
        ).all()

        day_revenue = sum(c.total for c in day_checkouts if c.status == "completed")
        day_total = len(day_checkouts)
        day_completed = sum(1 for c in day_checkouts if c.status == "completed")
        day_rate = (day_completed / day_total * 100) if day_total > 0 else 0

        date_str = current.strftime("%Y-%m-%d")
        revenue_points.append(TrendDataPoint(date=date_str, value=round(day_revenue, 2)))
        checkout_points.append(TrendDataPoint(date=date_str, value=day_total))
        rate_points.append(TrendDataPoint(date=date_str, value=round(day_rate, 1)))

        current = next_day

    return AnalyticsTrends(
        revenue=revenue_points,
        checkouts=checkout_points,
        completion_rate=rate_points,
    )


# =============================================================================
# DISPUTE ENDPOINTS
# =============================================================================

@router.get("/disputes", response_model=List[DisputeResponse])
def list_disputes(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List disputed checkouts."""
    query = db.query(Checkout).filter(Checkout.dispute_status != "none")
    if status:
        query = query.filter(Checkout.dispute_status == status)

    checkouts = query.order_by(desc(Checkout.dispute_opened_at)).all()
    results = []

    for checkout in checkouts:
        mandates = db.query(Mandate).filter(Mandate.checkout_id == checkout.id).all()
        logs = db.query(VerificationLog).filter(VerificationLog.checkout_id == checkout.id).all()

        results.append(DisputeResponse(
            checkout=checkout_to_response(checkout),
            mandates=[mandate_to_response(m) for m in mandates],
            verification_logs=[VerificationLogResponse.model_validate(l) for l in logs],
            evidence_summary=f"Dispute {checkout.dispute_status}: {len(mandates)} mandates, {len(logs)} verification logs available",
        ))

    return results


@router.post("/disputes/{checkout_id}/status", response_model=CheckoutResponse)
def update_dispute_status(checkout_id: str, update: DisputeStatusUpdate, db: Session = Depends(get_db)):
    """Update dispute status."""
    checkout = db.query(Checkout).filter(Checkout.id == checkout_id).first()
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")

    checkout.dispute_status = update.status.value
    if update.status == DisputeStatus.OPENED and not checkout.dispute_opened_at:
        checkout.dispute_opened_at = datetime.utcnow()
    checkout.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(checkout)

    return checkout_to_response(checkout)
