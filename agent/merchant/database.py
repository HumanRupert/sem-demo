"""
SQLAlchemy database models for Merchant Control Dashboard.
SQLite for development, Postgres-compatible schema for production.
"""

import os
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    create_engine, Column, String, Text, Integer, Float, Boolean,
    DateTime, JSON, ForeignKey, CheckConstraint, UniqueConstraint, Index
)
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from sqlalchemy.pool import StaticPool

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "merchant.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create engine with SQLite-specific settings
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Agent(Base):
    """Agent registry for KYA (Know Your Agent) module."""
    __tablename__ = "agents"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=False)
    description = Column(Text)
    logo_url = Column(String(512))
    public_key = Column(Text)
    jwks_uri = Column(String(512))
    trust_level = Column(
        String(20),
        default="probation",
        nullable=False
    )
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime)
    total_transactions = Column(Integer, default=0)
    successful_transactions = Column(Integer, default=0)
    declined_transactions = Column(Integer, default=0)
    disputed_transactions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkouts = relationship("Checkout", back_populates="agent")
    keys = relationship("AgentKey", back_populates="agent")
    verification_logs = relationship("VerificationLog", back_populates="agent")

    __table_args__ = (
        CheckConstraint(
            "trust_level IN ('trusted', 'probation', 'blocked')",
            name="check_trust_level"
        ),
    )


class Customer(Base):
    """Known customers for consumer recognition."""
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True)
    email_hash = Column(String(64), unique=True)
    phone_hash = Column(String(64))
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    checkouts = relationship("Checkout", back_populates="customer")


class Mandate(Base):
    """Verifiable Digital Credentials (VDCs) - Cart, Intent, and Payment Mandates."""
    __tablename__ = "mandates"

    id = Column(String(64), primary_key=True)
    type = Column(String(20), nullable=False)
    checkout_id = Column(String(64), ForeignKey("checkouts.id"))

    # Content
    payload = Column(JSON, nullable=False)
    payload_hash = Column(String(64), nullable=False)

    # Signatures
    user_signature = Column(Text)
    user_signature_verified = Column(Boolean)
    merchant_signature = Column(Text)
    merchant_signature_verified = Column(Boolean)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    status = Column(String(20), default="active")

    # For Intent Mandates
    ttl_seconds = Column(Integer)
    prompt_playback = Column(Text)

    # Relationships
    checkout = relationship("Checkout", back_populates="mandates", foreign_keys=[checkout_id])

    __table_args__ = (
        CheckConstraint(
            "type IN ('cart', 'intent', 'payment')",
            name="check_mandate_type"
        ),
        CheckConstraint(
            "status IN ('active', 'expired', 'revoked', 'used')",
            name="check_mandate_status"
        ),
    )


class Checkout(Base):
    """Central checkout/transaction table."""
    __tablename__ = "checkouts"

    id = Column(String(64), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User context
    user_id = Column(String(64))
    user_email_hash = Column(String(64))
    device_fingerprint = Column(JSON)
    ip_address = Column(String(45))
    country_code = Column(String(2))

    # Cart
    cart_items = Column(JSON, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    shipping = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")

    # Agent context
    agent_id = Column(String(64), ForeignKey("agents.id"))
    agent_provider = Column(String(255))
    agent_verification_status = Column(String(20), default="pending")
    modality = Column(String(30), default="human_present")

    # Mandate references
    cart_mandate_id = Column(String(64))
    intent_mandate_id = Column(String(64))
    payment_mandate_id = Column(String(64))

    # Outcome
    status = Column(String(20), default="pending")
    payment_status = Column(String(20), default="pending")
    challenge_type = Column(String(50))
    decline_reason = Column(Text)

    # Dispute
    dispute_status = Column(String(20), default="none")
    dispute_opened_at = Column(DateTime)

    # Consumer recognition
    customer_id = Column(String(64), ForeignKey("customers.id"))
    is_known_customer = Column(Boolean, default=False)

    # Relationships
    agent = relationship("Agent", back_populates="checkouts")
    customer = relationship("Customer", back_populates="checkouts")
    mandates = relationship("Mandate", back_populates="checkout", foreign_keys=[Mandate.checkout_id])
    events = relationship("CheckoutEvent", back_populates="checkout")
    verification_logs = relationship("VerificationLog", back_populates="checkout")

    __table_args__ = (
        CheckConstraint(
            "agent_verification_status IN ('verified', 'failed', 'skipped', 'pending')",
            name="check_verification_status"
        ),
        CheckConstraint(
            "modality IN ('human_present', 'human_not_present')",
            name="check_modality"
        ),
        CheckConstraint(
            "status IN ('pending', 'completed', 'declined', 'challenged', 'abandoned', 'disputed')",
            name="check_checkout_status"
        ),
        CheckConstraint(
            "payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')",
            name="check_payment_status"
        ),
        CheckConstraint(
            "dispute_status IN ('none', 'opened', 'represented', 'won', 'lost')",
            name="check_dispute_status"
        ),
        Index("idx_checkouts_created", "created_at"),
        Index("idx_checkouts_agent", "agent_id"),
        Index("idx_checkouts_status", "status"),
    )


class CheckoutEvent(Base):
    """Timeline events for checkout lifecycle."""
    __tablename__ = "checkout_events"

    id = Column(String(64), primary_key=True)
    checkout_id = Column(String(64), ForeignKey("checkouts.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSON)

    # Relationships
    checkout = relationship("Checkout", back_populates="events")

    __table_args__ = (
        Index("idx_events_checkout", "checkout_id"),
        Index("idx_events_timestamp", "timestamp"),
    )


class VerificationLog(Base):
    """Signature verification audit log."""
    __tablename__ = "verification_logs"

    id = Column(String(64), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    agent_id = Column(String(64), ForeignKey("agents.id"))
    checkout_id = Column(String(64), ForeignKey("checkouts.id"))

    # Verification details
    signature_type = Column(String(50), nullable=False)
    signature_input = Column(Text)
    signature_value = Column(Text)

    # Result
    result = Column(String(10), nullable=False)
    failure_reason = Column(Text)

    # Key info
    key_id = Column(String(255))
    algorithm = Column(String(20))
    nonce = Column(String(255))

    # Request context
    request_path = Column(String(512))
    request_authority = Column(String(255))

    # Relationships
    agent = relationship("Agent", back_populates="verification_logs")
    checkout = relationship("Checkout", back_populates="verification_logs")

    __table_args__ = (
        CheckConstraint(
            "result IN ('pass', 'fail')",
            name="check_verification_result"
        ),
        Index("idx_verification_timestamp", "timestamp"),
        Index("idx_verification_agent", "agent_id"),
    )


class AgentKey(Base):
    """Agent public key cache for signature verification."""
    __tablename__ = "agent_keys"

    id = Column(String(64), primary_key=True)
    agent_id = Column(String(64), ForeignKey("agents.id"))
    key_id = Column(String(255), nullable=False)
    public_key = Column(Text, nullable=False)
    algorithm = Column(String(20), nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

    # Relationships
    agent = relationship("Agent", back_populates="keys")

    __table_args__ = (
        UniqueConstraint("agent_id", "key_id", name="uq_agent_key"),
    )


class Nonce(Base):
    """Nonce replay detection (8-minute window per TAP spec)."""
    __tablename__ = "nonces"

    nonce = Column(String(255), primary_key=True)
    agent_id = Column(String(64), ForeignKey("agents.id"))
    used_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_nonces_used_at", "used_at"),
    )


def init_db():
    """Initialize database and create all tables."""
    # Ensure data directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    Base.metadata.create_all(bind=engine)
    return engine


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session():
    """Get a direct database session (for non-generator contexts)."""
    return SessionLocal()
