"""
Seed data generator for Merchant Control Dashboard.
Creates realistic demo data for 50+ checkouts over 30 days.

Deterministic: Same seed = same data for reproducible demos.
Idempotent: Safe to run multiple times.
"""

import hashlib
import json
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

from .database import init_db, get_db_session, Agent, Customer, Checkout, Mandate, CheckoutEvent, VerificationLog, AgentKey


# Seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)


# =============================================================================
# AGENT DEFINITIONS
# =============================================================================

AGENTS = [
    {
        "id": "agent_allbirds",
        "name": "Allbirds Shopping Assistant",
        "provider": "Allbirds",
        "description": "Allbirds' native AI shopping assistant",
        "logo_url": "/agents/allbirds.svg",
        "jwks_uri": "https://allbirds.com/.well-known/jwks.json",
        "trust_level": "trusted",
        "behavior": {"volume": "high", "decline_rate": 0.05, "dispute_rate": 0},
    },
    {
        "id": "agent_chatgpt_shopping",
        "name": "ChatGPT Shopping",
        "provider": "OpenAI",
        "description": "OpenAI's shopping assistant powered by GPT-4",
        "logo_url": "/agents/openai.svg",
        "jwks_uri": "https://api.openai.com/.well-known/jwks.json",
        "trust_level": "trusted",
        "behavior": {"volume": "medium", "decline_rate": 0.08, "dispute_rate": 0},
    },
]


# =============================================================================
# PRODUCT CATALOG (Allbirds-style products)
# =============================================================================

PRODUCTS = [
    {"sku": "AB-WR-001", "name": "Women's Tree Runners", "price": 98.00, "category": "shoes", "variant": "Natural White"},
    {"sku": "AB-WR-002", "name": "Women's Tree Runners", "price": 98.00, "category": "shoes", "variant": "Blizzard"},
    {"sku": "AB-MR-001", "name": "Men's Tree Runners", "price": 98.00, "category": "shoes", "variant": "Charcoal"},
    {"sku": "AB-MR-002", "name": "Men's Tree Runners", "price": 98.00, "category": "shoes", "variant": "Thunder"},
    {"sku": "AB-WD-001", "name": "Women's Tree Dashers", "price": 135.00, "category": "shoes", "variant": "Natural Black"},
    {"sku": "AB-MD-001", "name": "Men's Tree Dashers", "price": 135.00, "category": "shoes", "variant": "Flame"},
    {"sku": "AB-WL-001", "name": "Women's Wool Loungers", "price": 105.00, "category": "shoes", "variant": "Natural Grey"},
    {"sku": "AB-ML-001", "name": "Men's Wool Loungers", "price": 105.00, "category": "shoes", "variant": "Natural Black"},
    {"sku": "AB-WP-001", "name": "Women's Tree Pipers", "price": 105.00, "category": "shoes", "variant": "Calm Taupe"},
    {"sku": "AB-MP-001", "name": "Men's Tree Pipers", "price": 105.00, "category": "shoes", "variant": "Navy Night"},
    {"sku": "AB-WB-001", "name": "Women's Wool Runner-up Mizzles", "price": 145.00, "category": "shoes", "variant": "Thyme"},
    {"sku": "AB-MB-001", "name": "Men's Wool Runner-up Mizzles", "price": 145.00, "category": "shoes", "variant": "Hazy Indigo"},
    {"sku": "AB-TTE-001", "name": "Trino Tee", "price": 48.00, "category": "apparel", "variant": "Natural White"},
    {"sku": "AB-TTE-002", "name": "Trino Tee", "price": 48.00, "category": "apparel", "variant": "Heather Grey"},
    {"sku": "AB-WHD-001", "name": "Wool Hoodie", "price": 138.00, "category": "apparel", "variant": "Natural Black"},
    {"sku": "AB-WHD-002", "name": "Wool Hoodie", "price": 138.00, "category": "apparel", "variant": "Navy"},
    {"sku": "AB-TCR-001", "name": "Trino Crew Socks", "price": 18.00, "category": "accessories", "variant": "3-Pack"},
    {"sku": "AB-TCR-002", "name": "Trino Ankle Socks", "price": 16.00, "category": "accessories", "variant": "3-Pack"},
    {"sku": "AB-BAG-001", "name": "Wool Tote", "price": 65.00, "category": "accessories", "variant": "Natural Grey"},
    {"sku": "AB-BAG-002", "name": "ReGrid Backpack", "price": 98.00, "category": "accessories", "variant": "Black"},
    {"sku": "AB-SLP-001", "name": "Women's Wool Dwellers", "price": 75.00, "category": "shoes", "variant": "Natural White"},
    {"sku": "AB-SLP-002", "name": "Men's Wool Dwellers", "price": 75.00, "category": "shoes", "variant": "Charcoal"},
    {"sku": "AB-KID-001", "name": "Kids' Wool Runners", "price": 65.00, "category": "shoes", "variant": "Blizzard"},
    {"sku": "AB-KID-002", "name": "Kids' Tree Runners", "price": 65.00, "category": "shoes", "variant": "Natural Grey"},
]


# =============================================================================
# DECLINE REASONS
# =============================================================================

DECLINE_REASONS = [
    "Insufficient funds",
    "Card declined by issuer",
    "Agent verification failed - invalid signature",
    "Agent verification failed - expired nonce",
    "Agent verification failed - unknown key",
    "User cancelled transaction",
    "Suspected fraud - velocity check failed",
    "3DS authentication failed",
    "Invalid payment method",
]

CHALLENGE_TYPES = ["3ds", "otp", "merchant_confirmation"]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_uuid() -> str:
    """Generate a deterministic UUID based on random seed."""
    return str(uuid.UUID(int=random.getrandbits(128)))


def generate_hash(value: str) -> str:
    """Generate SHA-256 hash of a value."""
    return hashlib.sha256(value.encode()).hexdigest()


def generate_email_hash(email: str) -> str:
    """Generate hashed email for consumer recognition."""
    return generate_hash(email.lower().strip())


def random_date(start: datetime, end: datetime) -> datetime:
    """Generate random datetime between start and end."""
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def generate_ip() -> str:
    """Generate random IP address."""
    return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


def generate_device_fingerprint() -> Dict[str, Any]:
    """Generate realistic device fingerprint."""
    browsers = ["Chrome", "Safari", "Firefox", "Edge"]
    platforms = ["Windows", "macOS", "iOS", "Android"]
    return {
        "browser": random.choice(browsers),
        "platform": random.choice(platforms),
        "screenResolution": random.choice(["1920x1080", "2560x1440", "1440x900", "390x844"]),
        "language": "en-US",
        "timezone": random.choice(["America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"]),
    }


def generate_cart() -> tuple[List[Dict[str, Any]], float, float, float]:
    """Generate random cart with 1-4 items."""
    num_items = random.choices([1, 2, 3, 4], weights=[40, 35, 20, 5])[0]
    items = random.sample(PRODUCTS, num_items)

    cart_items = []
    subtotal = 0.0

    for product in items:
        quantity = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
        item_total = product["price"] * quantity
        cart_items.append({
            "sku": product["sku"],
            "name": product["name"],
            "quantity": quantity,
            "unit_price": product["price"],
            "total": item_total,
            "variant": product["variant"],
            "image_url": f"/products/{product['sku'].lower()}.jpg",
        })
        subtotal += item_total

    tax = round(subtotal * 0.08, 2)
    shipping = 0.0 if subtotal >= 75 else 7.95

    return cart_items, subtotal, tax, shipping


def generate_mandate_payload(
    mandate_type: str,
    checkout_id: str,
    cart_items: List[Dict],
    total: float,
    agent_id: str
) -> Dict[str, Any]:
    """Generate mandate payload based on AP2 spec."""
    if mandate_type == "cart":
        return {
            "id": f"cart_{checkout_id}",
            "user_signature_required": True,
            "payment_request": {
                "method_data": [{"supported_methods": "CARD", "data": {"payment_processor_url": "https://merchant.com/pay"}}],
                "details": {
                    "id": f"order_{checkout_id}",
                    "displayItems": [{"label": item["name"], "amount": {"currency": "USD", "value": item["total"]}} for item in cart_items],
                    "total": {"label": "Total", "amount": {"currency": "USD", "value": total}},
                },
                "options": {"requestShipping": True},
            },
        }
    elif mandate_type == "intent":
        return {
            "id": f"intent_{checkout_id}",
            "agent_id": agent_id,
            "authorized_methods": ["CARD", "BANK_TRANSFER"],
            "max_amount": {"currency": "USD", "value": total * 1.1},
            "ttl_seconds": 3600,
            "prompt_playback": f"User requested purchase of {len(cart_items)} item(s) totaling ${total:.2f}",
        }
    else:  # payment
        return {
            "payment_mandate_id": f"pm_{checkout_id}",
            "payment_details_id": f"order_{checkout_id}",
            "payment_details_total": {"label": "Total", "amount": {"currency": "USD", "value": total}, "refund_period": 30},
            "payment_response": {
                "request_id": f"order_{checkout_id}",
                "method_name": "CARD",
                "details": {"token": f"tok_{generate_uuid()[:8]}"},
            },
            "merchant_agent": "MerchantAgent",
            "timestamp": datetime.utcnow().isoformat(),
        }


# =============================================================================
# MAIN SEED FUNCTION
# =============================================================================

def seed_database():
    """
    Seed the database with realistic demo data.
    Idempotent: skips if data already exists.
    """
    # Initialize database
    init_db()
    session = get_db_session()

    # Check if already seeded
    existing_agents = session.query(Agent).count()
    if existing_agents > 0:
        print(f"Database already seeded ({existing_agents} agents found). Skipping.")
        session.close()
        return

    print("Seeding database...")

    # Reset random seed for deterministic data
    random.seed(RANDOM_SEED)

    # Time range: last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    # New agent window (last 7 days)
    new_agent_start = end_date - timedelta(days=7)

    # ==========================================================================
    # 1. CREATE AGENTS
    # ==========================================================================
    print("Creating agents...")
    agent_objects = {}
    for agent_data in AGENTS:
        behavior = agent_data.pop("behavior")
        is_new = behavior.get("new", False)

        agent = Agent(
            id=agent_data["id"],
            name=agent_data["name"],
            provider=agent_data["provider"],
            description=agent_data["description"],
            logo_url=agent_data["logo_url"],
            jwks_uri=agent_data["jwks_uri"],
            trust_level=agent_data["trust_level"],
            first_seen_at=new_agent_start if is_new else start_date - timedelta(days=random.randint(30, 180)),
            total_transactions=0,
            successful_transactions=0,
            declined_transactions=0,
            disputed_transactions=0,
        )
        agent_objects[agent.id] = {"agent": agent, "behavior": behavior}
        session.add(agent)

    session.commit()
    print(f"  Created {len(AGENTS)} agents")

    # ==========================================================================
    # 2. CREATE KNOWN CUSTOMERS
    # ==========================================================================
    print("Creating known customers...")
    customers = []
    customer_emails = [
        "john.smith@gmail.com", "sarah.johnson@yahoo.com", "mike.williams@outlook.com",
        "emma.davis@gmail.com", "chris.brown@icloud.com", "lisa.taylor@gmail.com",
        "david.anderson@yahoo.com", "jennifer.martinez@gmail.com", "robert.wilson@outlook.com",
        "amanda.thomas@gmail.com", "james.garcia@icloud.com", "ashley.jackson@yahoo.com",
        "michael.white@gmail.com", "emily.harris@outlook.com", "daniel.clark@gmail.com",
    ]

    for email in customer_emails:
        customer = Customer(
            id=generate_uuid(),
            email_hash=generate_email_hash(email),
            phone_hash=generate_hash(f"+1{random.randint(2000000000, 9999999999)}"),
            first_seen_at=start_date - timedelta(days=random.randint(30, 365)),
            total_orders=random.randint(1, 15),
            total_spent=random.uniform(100, 2000),
        )
        customers.append(customer)
        session.add(customer)

    session.commit()
    print(f"  Created {len(customers)} known customers")

    # ==========================================================================
    # 3. CREATE CHECKOUTS (60 checkouts for rich data)
    # ==========================================================================
    print("Creating checkouts...")

    # Distribution weights based on requirements
    # 75% completed, 12% declined, 8% challenged, 5% abandoned, 0% disputed
    status_weights = {
        "completed": 75,
        "declined": 12,
        "challenged": 8,
        "abandoned": 5,
    }

    # Volume distribution per agent (70% Allbirds, 30% ChatGPT)
    volume_weights = {"high": 35, "medium": 15, "low": 5}

    checkout_count = 0
    all_checkouts = []

    for agent_id, agent_info in agent_objects.items():
        agent = agent_info["agent"]
        behavior = agent_info["behavior"]

        # Determine number of checkouts for this agent
        num_checkouts = volume_weights.get(behavior["volume"], 5)

        # New agents only have recent checkouts
        if behavior.get("new"):
            agent_start = new_agent_start
        else:
            agent_start = start_date

        for _ in range(num_checkouts):
            checkout_id = generate_uuid()
            created_at = random_date(agent_start, end_date)

            # Generate cart
            cart_items, subtotal, tax, shipping = generate_cart()
            total = round(subtotal + tax + shipping, 2)

            # Determine status based on agent behavior
            if random.random() < behavior["decline_rate"]:
                status = "declined"
            else:
                # Use overall distribution for non-declined
                statuses = list(status_weights.keys())
                weights = [status_weights[s] for s in statuses]
                status = random.choices(statuses, weights=weights)[0]

            # Payment status based on checkout status
            if status == "completed":
                payment_status = "captured"
            elif status == "declined":
                payment_status = "failed"
            elif status == "challenged":
                payment_status = random.choice(["authorized", "captured"])
            else:
                payment_status = "pending"

            # ALL transactions are human-present per requirements
            modality = "human_present"

            # Consumer recognition (40% known customers)
            is_known = random.random() < 0.40
            customer = random.choice(customers) if is_known else None

            # Challenge type for challenged status
            challenge_type = random.choice(CHALLENGE_TYPES) if status == "challenged" else None

            # Decline reason for declined status
            decline_reason = random.choice(DECLINE_REASONS) if status == "declined" else None

            # No disputes in this demo
            dispute_status = "none"
            dispute_opened_at = None

            # Verification status based on trust level
            if agent.trust_level == "trusted":
                verification_status = "verified"
            elif agent.trust_level == "blocked":
                verification_status = random.choice(["failed", "skipped"])
            else:
                verification_status = random.choices(["verified", "failed"], weights=[85, 15])[0]

            checkout = Checkout(
                id=checkout_id,
                created_at=created_at,
                updated_at=created_at + timedelta(minutes=random.randint(1, 30)),
                user_id=f"user_{generate_uuid()[:8]}",
                user_email_hash=customer.email_hash if customer else generate_email_hash(f"user{random.randint(1000, 9999)}@example.com"),
                device_fingerprint=generate_device_fingerprint(),
                ip_address=generate_ip(),
                country_code=random.choice(["US", "US", "US", "CA", "GB", "DE", "AU"]),
                cart_items=cart_items,
                subtotal=subtotal,
                tax=tax,
                shipping=shipping,
                total=total,
                currency="USD",
                agent_id=agent_id,
                agent_provider=agent.provider,
                agent_verification_status=verification_status,
                modality=modality,
                status=status,
                payment_status=payment_status,
                challenge_type=challenge_type,
                decline_reason=decline_reason,
                dispute_status=dispute_status,
                dispute_opened_at=dispute_opened_at,
                customer_id=customer.id if customer else None,
                is_known_customer=is_known,
            )

            session.add(checkout)
            all_checkouts.append(checkout)

            # Update agent stats
            agent.total_transactions += 1
            agent.last_seen_at = max(agent.last_seen_at or created_at, created_at)
            if status == "completed":
                agent.successful_transactions += 1
            elif status == "declined":
                agent.declined_transactions += 1

            checkout_count += 1

    session.commit()
    print(f"  Created {checkout_count} checkouts")

    # ==========================================================================
    # CREATE EXACTLY 1 DISPUTED CHECKOUT (per requirements)
    # ==========================================================================
    print("Creating disputed checkout...")
    # Find a completed checkout to mark as disputed
    completed_checkouts = [c for c in all_checkouts if c.status == "completed"]
    if completed_checkouts:
        disputed = completed_checkouts[0]
        disputed.status = "disputed"
        disputed.dispute_status = "opened"
        disputed.dispute_opened_at = disputed.created_at + timedelta(days=random.randint(1, 5))

        # Update agent stats
        agent = agent_objects.get(disputed.agent_id)
        if agent:
            agent["agent"].successful_transactions -= 1
            agent["agent"].disputed_transactions += 1

        session.commit()
        print("  Created 1 disputed checkout")

    # ==========================================================================
    # 4. CREATE MANDATES
    # ==========================================================================
    print("Creating mandates...")
    mandate_count = 0

    for checkout in all_checkouts:
        # Cart mandate for all non-abandoned checkouts
        if checkout.status != "abandoned":
            cart_mandate = Mandate(
                id=generate_uuid(),
                type="cart",
                checkout_id=checkout.id,
                payload=generate_mandate_payload("cart", checkout.id, checkout.cart_items, checkout.total, checkout.agent_id),
                payload_hash=generate_hash(json.dumps(checkout.cart_items)),
                user_signature=f"sig_user_{generate_uuid()[:12]}" if checkout.status != "declined" else None,
                user_signature_verified=checkout.status != "declined",
                merchant_signature=f"sig_merchant_{generate_uuid()[:12]}",
                merchant_signature_verified=True,
                created_at=checkout.created_at,
                expires_at=checkout.created_at + timedelta(hours=1),
                status="used" if checkout.status == "completed" else "active",
            )
            session.add(cart_mandate)
            checkout.cart_mandate_id = cart_mandate.id
            mandate_count += 1

        # Payment mandate for completed/captured
        if checkout.payment_status in ["authorized", "captured"]:
            payment_mandate = Mandate(
                id=generate_uuid(),
                type="payment",
                checkout_id=checkout.id,
                payload=generate_mandate_payload("payment", checkout.id, checkout.cart_items, checkout.total, checkout.agent_id),
                payload_hash=generate_hash(f"payment_{checkout.id}"),
                user_signature=f"sig_user_payment_{generate_uuid()[:12]}",
                user_signature_verified=True,
                merchant_signature=f"sig_merchant_payment_{generate_uuid()[:12]}",
                merchant_signature_verified=True,
                created_at=checkout.created_at,
                status="used",
            )
            session.add(payment_mandate)
            checkout.payment_mandate_id = payment_mandate.id
            mandate_count += 1

    session.commit()
    print(f"  Created {mandate_count} mandates")

    # ==========================================================================
    # 5. CREATE CHECKOUT EVENTS (Timeline)
    # ==========================================================================
    print("Creating checkout events...")
    event_count = 0

    for checkout in all_checkouts:
        events_to_create = []
        base_time = checkout.created_at

        # Event: Agent verification
        events_to_create.append({
            "event_type": "agent_verified" if checkout.agent_verification_status == "verified" else "agent_verification_failed",
            "timestamp": base_time,
            "event_data": {"agent_id": checkout.agent_id, "status": checkout.agent_verification_status},
        })

        # Event: Cart created
        events_to_create.append({
            "event_type": "cart_created",
            "timestamp": base_time + timedelta(seconds=random.randint(1, 10)),
            "event_data": {"items": len(checkout.cart_items), "total": checkout.total},
        })

        # Event: Mandate signed (if not abandoned)
        if checkout.status != "abandoned":
            events_to_create.append({
                "event_type": "mandate_signed",
                "timestamp": base_time + timedelta(seconds=random.randint(30, 120)),
                "event_data": {"mandate_type": "cart", "user_verified": True},
            })

        # Event: Payment attempted
        if checkout.payment_status != "pending":
            events_to_create.append({
                "event_type": "payment_attempted",
                "timestamp": base_time + timedelta(seconds=random.randint(120, 180)),
                "event_data": {"method": "card", "amount": checkout.total},
            })

        # Event: Challenge (if challenged)
        if checkout.challenge_type:
            events_to_create.append({
                "event_type": "challenge_initiated",
                "timestamp": base_time + timedelta(seconds=random.randint(180, 240)),
                "event_data": {"challenge_type": checkout.challenge_type},
            })
            events_to_create.append({
                "event_type": "challenge_completed",
                "timestamp": base_time + timedelta(seconds=random.randint(240, 360)),
                "event_data": {"challenge_type": checkout.challenge_type, "success": checkout.status == "completed"},
            })

        # Event: Outcome
        if checkout.status == "completed":
            events_to_create.append({
                "event_type": "payment_captured",
                "timestamp": base_time + timedelta(seconds=random.randint(180, 300)),
                "event_data": {"amount": checkout.total, "currency": checkout.currency},
            })
            events_to_create.append({
                "event_type": "order_confirmed",
                "timestamp": base_time + timedelta(seconds=random.randint(300, 360)),
                "event_data": {"order_id": f"ORD-{checkout.id[:8].upper()}"},
            })
        elif checkout.status == "declined":
            events_to_create.append({
                "event_type": "payment_declined",
                "timestamp": base_time + timedelta(seconds=random.randint(180, 240)),
                "event_data": {"reason": checkout.decline_reason},
            })
        elif checkout.status == "abandoned":
            events_to_create.append({
                "event_type": "checkout_abandoned",
                "timestamp": base_time + timedelta(minutes=random.randint(5, 30)),
                "event_data": {"last_step": "cart_review"},
            })

        # Create event records
        for event_data in events_to_create:
            event = CheckoutEvent(
                id=generate_uuid(),
                checkout_id=checkout.id,
                timestamp=event_data["timestamp"],
                event_type=event_data["event_type"],
                event_data=event_data["event_data"],
            )
            session.add(event)
            event_count += 1

    session.commit()
    print(f"  Created {event_count} checkout events")

    # ==========================================================================
    # 6. CREATE VERIFICATION LOGS
    # ==========================================================================
    print("Creating verification logs...")
    log_count = 0

    for checkout in all_checkouts:
        # Agent signature verification
        log = VerificationLog(
            id=generate_uuid(),
            timestamp=checkout.created_at,
            agent_id=checkout.agent_id,
            checkout_id=checkout.id,
            signature_type="agent_browser_auth",
            signature_input=f'("@authority" "@path");created={int(checkout.created_at.timestamp())};keyid="key_{checkout.agent_id[:8]}"',
            signature_value=f"sig_{generate_uuid()[:16]}",
            result="pass" if checkout.agent_verification_status == "verified" else "fail",
            failure_reason=None if checkout.agent_verification_status == "verified" else random.choice([
                "Invalid signature", "Expired nonce", "Unknown key ID", "Timestamp out of range"
            ]),
            key_id=f"key_{checkout.agent_id[:8]}",
            algorithm="Ed25519",
            nonce=generate_uuid(),
            request_path="/checkout",
            request_authority="merchant.allbirds.com",
        )
        session.add(log)
        log_count += 1

        # Payment container verification (for non-abandoned)
        if checkout.status != "abandoned":
            log = VerificationLog(
                id=generate_uuid(),
                timestamp=checkout.created_at + timedelta(seconds=random.randint(60, 120)),
                agent_id=checkout.agent_id,
                checkout_id=checkout.id,
                signature_type="agent_payer_auth",
                signature_input=f'("@authority" "@path");created={int(checkout.created_at.timestamp())};tag="agent-payer-auth"',
                signature_value=f"sig_payer_{generate_uuid()[:16]}",
                result="pass",
                key_id=f"key_{checkout.agent_id[:8]}",
                algorithm="Ed25519",
                nonce=generate_uuid(),
                request_path="/api/payment",
                request_authority="merchant.allbirds.com",
            )
            session.add(log)
            log_count += 1

    session.commit()
    print(f"  Created {log_count} verification logs")

    # ==========================================================================
    # 7. CREATE AGENT KEYS
    # ==========================================================================
    print("Creating agent keys...")
    key_count = 0

    for agent_id, agent_info in agent_objects.items():
        agent = agent_info["agent"]
        key = AgentKey(
            id=generate_uuid(),
            agent_id=agent_id,
            key_id=f"key_{agent_id[:8]}",
            public_key=f"-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA{generate_uuid()[:32]}=\n-----END PUBLIC KEY-----",
            algorithm="Ed25519",
            fetched_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=agent.trust_level != "blocked",
        )
        session.add(key)
        key_count += 1

    session.commit()
    print(f"  Created {key_count} agent keys")

    # ==========================================================================
    # DONE
    # ==========================================================================
    session.close()
    print("\nDatabase seeding complete!")
    print(f"  - {len(AGENTS)} agents")
    print(f"  - {len(customers)} known customers")
    print(f"  - {checkout_count} checkouts")
    print(f"  - {mandate_count} mandates")
    print(f"  - {event_count} checkout events")
    print(f"  - {log_count} verification logs")
    print(f"  - {key_count} agent keys")


if __name__ == "__main__":
    seed_database()
