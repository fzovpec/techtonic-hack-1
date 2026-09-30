"""
KBC Hackathon Challenge - Signal-to-Action Realtime Backend
Framework: FastAPI (Python 3.10+)
Persistence: JSON files in /data
"""

import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Directories & File Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SEED_DIR = BASE_DIR / "data_seed"

CLIENTS_FILE = DATA_DIR / "clients.json"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"
INTERACTIONS_FILE = DATA_DIR / "interactions.json"
CATALOG_FILE = DATA_DIR / "action_catalog.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
SEED_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# JSON Helpers
# ---------------------------------------------------------------------------
def load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default if default is not None else []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return default if default is not None else []

def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()

def find_client(client_id: str, clients: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    cid_lower = client_id.lower().strip()
    for c in clients:
        if c["id"].lower() == cid_lower:
            return c
    # Try c1 -> c-001
    if cid_lower.startswith("c") and cid_lower[1:].isdigit():
        num = int(cid_lower[1:])
        padded = f"c-{num:03d}"
        for c in clients:
            if c["id"].lower() == padded:
                return c
    # Try c-001 -> c1
    if cid_lower.startswith("c-") and cid_lower[2:].isdigit():
        num = int(cid_lower[2:])
        short = f"c{num}"
        for c in clients:
            if c["id"].lower() == short:
                return c
    return None

def get_client_id_aliases(client_id: str) -> List[str]:
    aliases = [client_id]
    cid_lower = client_id.lower().strip()
    if cid_lower.startswith("c-") and cid_lower[2:].isdigit():
        num = int(cid_lower[2:])
        aliases.append(f"c{num}")
    elif cid_lower.startswith("c") and cid_lower[1:].isdigit():
        num = int(cid_lower[1:])
        aliases.append(f"c-{num:03d}")
    return aliases

# ---------------------------------------------------------------------------
# Pydantic Data Models
# ---------------------------------------------------------------------------
class ClientSummary(BaseModel):
    id: str
    name: str
    age: int
    profession: str
    profile: str
    savings_balance: float
    monthly_income: float

class RecommendedAction(BaseModel):
    domain: Literal["banking", "insurance", "partner"]
    title: str
    description: str
    cta: str

class PredictionDetails(BaseModel):
    detected_intent: str
    confidence: float
    stage: str
    detected_signals: List[str]

class ExperienceDetails(BaseModel):
    kate_message: str
    why_am_i_seeing_this: str
    recommended_actions: List[RecommendedAction]

class ClientPredictionResponse(BaseModel):
    client: Dict[str, Any]
    prediction: PredictionDetails
    experience: ExperienceDetails

class ClientEventRequest(BaseModel):
    type: Literal["transaction", "interaction"]
    payload: Dict[str, Any]

# ---------------------------------------------------------------------------
# Prediction Engine Core Helpers & Logic
# ---------------------------------------------------------------------------
def classify_tx_intent(tx: Dict[str, Any]) -> Optional[str]:
    text = f"{tx.get('merchant', '')} {tx.get('description', '')} {tx.get('category', '')}".lower()
    amt = float(tx.get("amount", 0))
    cat = str(tx.get("category", "")).lower()

    if cat in ["refund", "reversal"] or any(kw in text for kw in ["refund", "reversal", "teruggave", "annulatie", "geannuleerd", "cancelled", "ontbinding"]):
        return "cancellation"
    if cat in ["social_contributions"] or any(kw in text for kw in ["acerta", "liantis", "xerius", "partena", "kbo", "cbe", "onderneming", "enterprise"]):
        return "freelance_entrepreneur"
    if any(kw in text for kw in ["invoice", "factuur", "consulting", "consultancy", "stripe", "payout"]) and amt > 0:
        return "freelance_entrepreneur"
    if cat in ["notary"] or any(kw in text for kw in ["notary", "notaris", "compromis", "escrow", "deed", "sales agreement", "closing"]):
        return "first_time_home_buyer"
    if cat in ["surveyor", "real_estate_platform", "renovation"] or any(kw in text for kw in ["immoweb", "zimmo", "surveyor", "epc", "aceg", "landmeter", "brico", "gamma", "hubo"]):
        return "first_time_home_buyer"
    if cat in ["investment", "pension_savings", "brokerage", "etf", "funds"] or any(kw in text for kw in ["bolero", "etf", "degiro", "keytrade", "belegging", "fund", "pensioensparen"]):
        return "wealth_accumulator"
    if cat == "savings_deposit" and abs(amt) >= 250:
        return "wealth_accumulator"
    if any(kw in text for kw in ["dreambaby", "pericles", "premaman", "creche", "kinderopvang", "nursery", "baby"]):
        return "family_expansion"
    if (cat in ["rent", "lease"] or "century 21" in text) and any(kw in text for kw in ["deposit", "waarborg", "lease", "huurwaarborg", "huurovereenkomst"]) and abs(amt) >= 1000:
        return "rental_counter"
    return None

def get_recency_weight(recency_idx: int) -> float:
    if recency_idx == 0:
        return 2.5  # Brand-new live signal just injected
    elif recency_idx == 1:
        return 2.0
    elif recency_idx == 2:
        return 1.6
    elif recency_idx <= 4:
        return 1.2
    elif recency_idx <= 8:
        return 0.8
    else:
        return max(0.35, 0.8 - (recency_idx - 8) * 0.05)

def predict_client_intent(client_id: str) -> Dict[str, Any]:
    clients = load_json(CLIENTS_FILE, [])
    client = find_client(client_id, clients)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client with ID '{client_id}' not found.")

    aliases = get_client_id_aliases(client["id"])
    all_transactions = load_json(TRANSACTIONS_FILE, [])
    all_interactions = load_json(INTERACTIONS_FILE, [])
    catalog = load_json(CATALOG_FILE, [])

    transactions = [t for t in all_transactions if t.get("client_id") in aliases]
    interactions = [i for i in all_interactions if i.get("client_id") in aliases]

    # Chronologically sort transactions
    sorted_txs = sorted(transactions, key=lambda t: str(t.get("timestamp", "")))
    N = len(sorted_txs)

    scores: Dict[str, float] = {
        "first_time_home_buyer": 0.0,
        "freelance_entrepreneur": 0.0,
        "wealth_accumulator": 0.0,
        "family_expansion": 0.0
    }
    signals_map: Dict[str, List[str]] = {
        "first_time_home_buyer": [],
        "freelance_entrepreneur": [],
        "wealth_accumulator": [],
        "family_expansion": []
    }

    # Baseline prior from profile & financial baseline
    stage_str = str(client.get("current_life_stage", "") + " " + client.get("profile", "")).lower()
    if any(k in stage_str for k in ["starter", "young", "dual_income"]):
        scores["first_time_home_buyer"] += 15.0
    if any(k in stage_str for k in ["freelance", "independent"]) or client.get("monthly_income", 0) >= 4200.0:
        scores["freelance_entrepreneur"] += 15.0
    if any(k in stage_str for k in ["wealth", "pre_retirement"]) or client.get("savings_balance", 0) >= 50000.0:
        scores["wealth_accumulator"] += 15.0
    if "family" in stage_str or "kids" in stage_str:
        scores["family_expansion"] += 20.0
        scores["wealth_accumulator"] += 10.0

    has_closing_tx = False
    has_closing_cancellation = False
    has_rental_counter = False

    closing_txs = []
    notary_txs = []
    surveyor_txs = []
    immo_txs = []
    social_txs = []
    invoice_txs = []
    invest_txs = []
    savings_txs = []
    family_txs = []

    for idx, tx in enumerate(sorted_txs):
        recency_idx = N - 1 - idx
        w = get_recency_weight(recency_idx)
        text = f"{tx.get('merchant', '')} {tx.get('description', '')} {tx.get('category', '')}".lower()
        amt = float(tx.get("amount", 0))
        cat = str(tx.get("category", "")).lower()

        # Check refund / cancellation of notary escrow or deed
        is_refund = cat in ["refund", "reversal"] or any(kw in text for kw in ["refund", "reversal", "teruggave", "annulatie", "geannuleerd", "cancelled", "ontbinding"])
        if is_refund and any(kw in text for kw in ["notary", "notaris", "escrow", "deed", "compromis", "closing", "voorschot"]):
            has_closing_cancellation = True
            scores["first_time_home_buyer"] -= 75.0 * w
            signals_map["first_time_home_buyer"].append(f"⚠️ Escrow deposit refunded / purchase deed cancelled: €{abs(amt):,.0f}")
            continue

        # Check rental counter-signal
        is_rental = (cat in ["rent", "lease"] or "century 21" in text) and any(kw in text for kw in ["deposit", "waarborg", "lease", "contract", "huurwaarborg", "huurovereenkomst"]) and abs(amt) >= 1000
        if is_rental:
            has_rental_counter = True
            scores["first_time_home_buyer"] -= 50.0 * w
            signals_map["first_time_home_buyer"].append(f"⚠️ 3-year residential rental lease contract committed: €{abs(amt):,.0f}")
            continue

        # Notary deed closing
        is_closing = any(kw in text for kw in ["deed", "sales agreement", "closing", "sales deed"]) and any(kw in text for kw in ["notary", "notaris", "escrow", "compromis"]) and amt < 0
        if is_closing:
            has_closing_tx = True
            closing_txs.append(tx)
            scores["first_time_home_buyer"] += 45.0 * w
            signals_map["first_time_home_buyer"].append(f"Notary sales deed closing fee: €{abs(amt):,.0f} to {tx.get('merchant', 'Notary Office')}")
            continue

        # Notary general
        if cat == "notary" or any(kw in text for kw in ["notary", "notaris", "compromis", "escrow"]):
            notary_txs.append(tx)
            scores["first_time_home_buyer"] += 30.0 * w
            signals_map["first_time_home_buyer"].append(f"Notary consultation / compromis deposit: €{abs(amt):,.0f} to {tx.get('merchant', 'Notary Office')}")
            continue

        # Surveyor & EPC
        if cat == "surveyor" or any(kw in text for kw in ["surveyor", "landmeter", "epc", "aceg", "expertise", "energie audit", "keuring"]):
            surveyor_txs.append(tx)
            scores["first_time_home_buyer"] += 30.0 * w
            signals_map["first_time_home_buyer"].append(f"Mandatory EPC energy / surveyor audit: €{abs(amt):,.0f} to {tx.get('merchant', 'Surveyor')}")
            continue

        # Real estate platforms
        if cat in ["real_estate_platform", "immoweb", "immovlan", "property"] or any(kw in text for kw in ["immoweb", "zimmo", "immovlan", "vastgoed", "real_estate"]):
            immo_txs.append(tx)
            scores["first_time_home_buyer"] += 15.0 * w
            signals_map["first_time_home_buyer"].append(f"Property search alert subscription: €{abs(amt):,.0f} to {tx.get('merchant', 'Immoweb')}")
            continue

        # Renovation hardware
        if cat in ["renovation"] or any(kw in text for kw in ["renovation", "brico", "gamma", "hubo", "verbouwing"]):
            scores["first_time_home_buyer"] += 15.0 * w
            signals_map["first_time_home_buyer"].append(f"Renovation / home improvement materials: €{abs(amt):,.0f}")
            continue

        # Social security / Enterprise desk
        if cat == "social_contributions" or any(kw in text for kw in ["acerta", "liantis", "xerius", "partena", "cbe", "kbo", "onderneming", "enterprise", "sociaal"]):
            social_txs.append(tx)
            scores["freelance_entrepreneur"] += 55.0 * w
            signals_map["freelance_entrepreneur"].append(f"Statutory social security/enterprise payment: €{abs(amt):,.0f} to {tx.get('merchant', 'Enterprise Fund')}")
            continue

        # Commercial Invoicing inflows
        if (any(kw in text for kw in ["invoice", "factuur", "consulting", "consultancy", "payout", "stripe", "mollie", "client payment"]) or (amt > 1000 and "invoice" in text)) and amt > 0:
            invoice_txs.append(tx)
            scores["freelance_entrepreneur"] += 50.0 * w
            signals_map["freelance_entrepreneur"].append(f"Commercial client invoicing inflow: €{abs(amt):,.0f} from {tx.get('merchant', 'Client')}")
            continue

        # Savings deposits
        if cat == "savings_deposit" and abs(amt) >= 250:
            savings_txs.append(tx)
            scores["wealth_accumulator"] += 25.0 * w
            scores["first_time_home_buyer"] += 10.0 * w
            signals_map["wealth_accumulator"].append(f"Recurring capital reserve deposit: €{abs(amt):,.0f}")
            continue

        # Investment & ETF allocations
        if cat in ["investment", "pension_savings", "brokerage", "etf", "funds"] or any(kw in text for kw in ["bolero", "etf", "fund", "degiro", "keytrade", "belegging", "pensioensparen"]):
            invest_txs.append(tx)
            scores["wealth_accumulator"] += 55.0 * w
            signals_map["wealth_accumulator"].append(f"Investment & ETF portfolio allocation: €{abs(amt):,.0f} to {tx.get('merchant', 'Broker/Fund')}")
            continue

        # Growing family / Nursery / Childcare
        if any(kw in text for kw in ["dreambaby", "pericles", "premaman", "creche", "kinderopvang", "nursery", "baby"]):
            family_txs.append(tx)
            scores["family_expansion"] += 50.0 * w
            signals_map["family_expansion"].append(f"Nursery & childcare expense: €{abs(amt):,.0f} at {tx.get('merchant', 'Retailer')}")
            continue

    # Evaluate Interactions
    mortgage_sims = [i for i in interactions if i.get("action") in ["mortgage_simulator_used", "mortgage_calculator", "loan_simulator"]]
    if mortgage_sims:
        scores["first_time_home_buyer"] += 35.0
        signals_map["first_time_home_buyer"].append(f"{len(mortgage_sims)}x visit(s) to mortgage loan simulator")

    kbo_interactions = [i for i in interactions if i.get("action") in ["kbo_search_viewed", "business_account_viewed", "freelance_guide_opened", "cbe_search_viewed"] or any(kw in str(i.get("details", "")).lower() for kw in ["cbe", "business", "freelance", "company"])]
    if kbo_interactions:
        scores["freelance_entrepreneur"] += 35.0
        signals_map["freelance_entrepreneur"].append("CBE/Company registration lookup or business account viewed")

    invest_interactions = [i for i in interactions if i.get("action") in ["investment_fund_viewed", "pension_simulator_used", "wealth_management_viewed"]]
    if invest_interactions:
        scores["wealth_accumulator"] += 35.0
        signals_map["wealth_accumulator"].append("Investment fund or pension savings simulator consulted")

    if client.get("savings_balance", 0) >= 40000.0:
        scores["wealth_accumulator"] += 20.0
        signals_map["wealth_accumulator"].append(f"Substantial savings reserve of €{client['savings_balance']:,.0f}")

    # Determine Top Intent & Runner-Up Intent
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    detected_intent, top_score = sorted_scores[0]
    second_intent, second_score = sorted_scores[1]

    # Dynamic Confidence Calculation (Decreases on competition, cancellations, or staleness)
    if top_score <= 5.0:
        confidence = 0.45
        margin_penalty = 0.0
    else:
        base_conf = 0.45 + (top_score / (top_score + 35.0)) * 0.50
        base_conf = min(0.96, max(0.40, base_conf))

        # 1. Margin penalty: when runner-up is close, confidence decreases due to ambiguity!
        margin_ratio = (top_score - second_score) / max(1.0, top_score)
        margin_penalty = 0.0
        if margin_ratio < 0.20:
            margin_penalty = (0.20 - margin_ratio) * 1.25  # up to -0.25
        elif margin_ratio < 0.40:
            margin_penalty = (0.40 - margin_ratio) * 0.5   # up to -0.10

        # 2. Cancellation / Counter penalty
        cancellation_penalty = 0.0
        if detected_intent == "first_time_home_buyer":
            if has_closing_cancellation:
                cancellation_penalty += 0.42
            elif has_rental_counter:
                cancellation_penalty += 0.28
            if client.get("savings_balance", 0) < 20000.0:
                cancellation_penalty += 0.15

        # 3. Staleness / Intent Drift penalty
        staleness_penalty = 0.0
        if N >= 2:
            recent_2 = sorted_txs[-2:]
            recent_votes = [classify_tx_intent(t) for t in recent_2]
            if detected_intent not in recent_votes and any(v in scores for v in recent_votes):
                staleness_penalty = 0.14
                competing_title = second_intent.replace('_', ' ')
                signals_map[detected_intent].append(f"⚠️ Recent transactions show emerging focus on {competing_title}")

        confidence = round(max(0.35, min(0.98, base_conf - margin_penalty - cancellation_penalty - staleness_penalty)), 2)

    # Stage Determination (Live Reactive, NOT permanently locked in action_ready)
    is_closing_active = has_closing_tx and not has_closing_cancellation and not has_rental_counter

    if detected_intent == "first_time_home_buyer":
        if is_closing_active and confidence >= 0.70 and client.get("savings_balance", 0) >= 20000.0:
            stage = "action_ready"
        elif (notary_txs or surveyor_txs or immo_txs or mortgage_sims or confidence >= 0.58) and not has_closing_cancellation:
            stage = "active_decision"
        else:
            stage = "exploring"

    elif detected_intent == "freelance_entrepreneur":
        if (len(social_txs) > 0 or (len(invoice_txs) > 0 and len(kbo_interactions) > 0)) and confidence >= 0.70:
            stage = "action_ready"
        elif kbo_interactions or len(invoice_txs) > 0 or len(social_txs) > 0 or confidence >= 0.58:
            stage = "active_decision"
        else:
            stage = "exploring"

    elif detected_intent == "wealth_accumulator":
        if (len(invest_txs) > 0 or len(savings_txs) >= 2) and client.get("savings_balance", 0) >= 40000.0 and confidence >= 0.70:
            stage = "action_ready"
        elif len(savings_txs) > 0 or invest_interactions or len(invest_txs) > 0 or client.get("savings_balance", 0) >= 25000.0 or confidence >= 0.58:
            stage = "active_decision"
        else:
            stage = "exploring"

    elif detected_intent == "family_expansion":
        if len(family_txs) >= 2 and confidence >= 0.70:
            stage = "action_ready"
        elif len(family_txs) > 0 or confidence >= 0.58:
            stage = "active_decision"
        else:
            stage = "exploring"

    else:
        stage = "exploring"

    detected_signals = signals_map[detected_intent]
    if not detected_signals:
        detected_signals.append("Standard income and expenditure pattern analyzed")

    # Dynamic Kate Message & Explainability
    first_name = client["name"].split()[0]

    if detected_intent == "first_time_home_buyer":
        merchant_name = (closing_txs[-1].get("merchant") if closing_txs else (notary_txs[-1].get("merchant") if notary_txs else (immo_txs[-1].get("merchant") if immo_txs else "the notary")))
        if has_closing_cancellation:
            kate_message = (
                f"Hi {first_name}, I noticed your escrow deposit to {merchant_name} was refunded or cancelled. "
                "I have paused active deed closing actions and updated your dossier. When you're ready, I can help you explore rental options or recalibrate your purchase timeline."
            )
        elif has_rental_counter:
            kate_message = (
                f"Hi {first_name}, I registered your new residential rental lease payment. "
                "I've switched your focus from home purchasing to managing your rental deposit and flexible tenant liability insurance."
            )
        elif stage == "action_ready":
            kate_message = (
                f"Congratulations {first_name}! Your deed closing payment to {merchant_name} is registered. "
                "I have prepared your complete dossier for the notary, including mandatory insurance policies and a 15% Dockx moving discount."
            )
        elif stage == "active_decision":
            if margin_penalty > 0:
                kate_message = (
                    f"Hi {first_name}, I noticed new independent business activity alongside your home search. "
                    "I've updated your borrowing profile to factor in both your property goals and entrepreneurial cashflow."
                )
            else:
                kate_message = (
                    f"Hi {first_name}, based on your recent property searches and calculations, you're close to deciding! "
                    "I've calculated your exact borrowing capacity and prepared rate-lock options."
                )
        else:
            kate_message = (
                f"Hi {first_name}, are you getting ready for your first home? "
                "I've calculated your maximum borrowing capacity and upfront notary expenses."
            )

    elif detected_intent == "freelance_entrepreneur":
        merchant_name = (social_txs[-1].get("merchant") if social_txs else (invoice_txs[-1].get("merchant") if invoice_txs else "social security fund"))
        if stage == "action_ready":
            kate_message = (
                f"Congratulations {first_name}! Your enterprise registration and social contributions with {merchant_name} are confirmed. "
                "Activate your KBC Business Account with automated VAT reservation and tax deductions."
            )
        elif stage == "active_decision":
            kate_message = (
                f"Hi {first_name}, looking to streamline your administration and taxes as an independent professional? "
                "Discover our KBC Business Account with automated VAT reservation and tax-deductible pension savings."
            )
        else:
            kate_message = (
                f"Hi {first_name}, stepping into independent entrepreneurship? "
                "Discover our step-by-step Acerta starter guide and explore how to separate business expenses cleanly."
            )

    elif detected_intent == "wealth_accumulator":
        merchant_name = (invest_txs[-1].get("merchant") if invest_txs else (savings_txs[-1].get("merchant") if savings_txs else "KBC"))
        if stage == "action_ready":
            kate_message = (
                f"Hi {first_name}, your capital deposit with {merchant_name} has been booked. "
                f"With €{client['savings_balance']:,.0f} in liquid reserves, put your surplus into automated goal-based investments."
            )
        elif stage == "active_decision":
            kate_message = (
                f"Hi {first_name}, looking to make your accumulated savings work harder? "
                "I've selected personalized formulas for goal-based investing and wealth protection for you."
            )
        else:
            kate_message = (
                f"Hi {first_name}, build long-term financial security with automated recurring savings plans and wealth preservation tools."
            )

    else:  # family_expansion
        merchant_name = (family_txs[-1].get("merchant") if family_txs else "Dreambaby")
        if stage == "action_ready":
            kate_message = (
                f"Congratulations {first_name}! Your milestone family expenses at {merchant_name} are recorded. "
                "I've prepared a Junior Growth portfolio and full family civil liability protection."
            )
        elif stage == "active_decision":
            kate_message = (
                f"Hi {first_name}, preparing for your family's next big step? "
                "Organize your Groeipakket child benefits and explore our family healthcare cover."
            )
        else:
            kate_message = (
                f"Hi {first_name}, welcome to family planning! Discover our junior savings formulas and family protection guide."
            )

    # Dynamic Transparency / Why Am I Seeing This Explanation
    if has_closing_cancellation:
        why_am_i_seeing_this = f"Escrow refund detected. KBC Signal-to-Action engine downgraded stage to Exploring and adjusted confidence to {int(confidence*100)}% pending buyer confirmation."
    elif has_rental_counter:
        why_am_i_seeing_this = f"Rental lease agreement detected. Home acquisition intent paused and confidence adjusted to {int(confidence*100)}%."
    elif margin_penalty > 0:
        competing_name = second_intent.replace('_', ' ').title()
        why_am_i_seeing_this = f"KBC Signal-to-Action engine detected competing signals with {competing_name}. Confidence adjusted to {int(confidence*100)}% due to mixed behavioral signals."
    elif detected_signals:
        why_am_i_seeing_this = f"KBC Signal-to-Action engine evaluated {len(detected_signals)} real-time triggers. Latest: '{detected_signals[0]}'. Confidence: {int(confidence * 100)}% based on recent transaction momentum and profile."
    else:
        why_am_i_seeing_this = "Based on your recent transactions and account behavior."

    # Domain Orchestration (Catalog matching)
    intent_catalog_aliases = {
        "first_time_home_buyer": ["buying_first_home", "first_time_home_buyer", "home_buyer"],
        "buying_first_home": ["buying_first_home", "first_time_home_buyer", "home_buyer"],
        "freelance_entrepreneur": ["freelance_entrepreneur", "freelance_business_owner", "independent_freelancer"],
        "wealth_accumulator": ["wealth_accumulator", "general_wealth", "family_protection"],
        "family_expansion": ["family_expansion", "family_with_kids", "family_protection"]
    }
    allowed_intents = intent_catalog_aliases.get(detected_intent, [detected_intent])

    domains: List[Literal["banking", "insurance", "partner"]] = ["banking", "insurance", "partner"]
    recommended_actions: List[Dict[str, Any]] = []

    for dom in domains:
        matching_actions = [
            a for a in catalog
            if a.get("domain") == dom and (a.get("target_intent") in allowed_intents or a.get("intent") in allowed_intents)
        ]
        selected = next((a for a in matching_actions if a.get("stage") == stage), None)
        if not selected and matching_actions:
            selected = matching_actions[0]
        if not selected:
            selected = next((a for a in catalog if a.get("domain") == dom), None)

        if selected:
            recommended_actions.append({
                "domain": selected["domain"],
                "title": selected["title"],
                "description": selected["description"],
                "cta": selected["cta"]
            })

    return {
        "client": {
            "id": client["id"],
            "name": client["name"],
            "savings_balance": client["savings_balance"],
            "monthly_income": client["monthly_income"]
        },
        "prediction": {
            "detected_intent": detected_intent,
            "confidence": confidence,
            "stage": stage,
            "detected_signals": detected_signals
        },
        "experience": {
            "kate_message": kate_message,
            "why_am_i_seeing_this": why_am_i_seeing_this,
            "recommended_actions": recommended_actions
        }
    }

# ---------------------------------------------------------------------------
# FastAPI Application Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="KBC Signal-to-Action Engine",
    description="Realtime prediction and hyper-personalization backend for KBC Mobile (Bank, Insurance, Partners)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "app": "KBC Signal-to-Action Engine",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "get_clients": "GET /api/clients",
            "get_client_prediction": "GET /api/clients/{id}",
            "add_client_event": "POST /api/clients/{id}/events",
            "reset_simulator": "POST /api/simulator/reset"
        }
    }

@app.get("/api/clients", response_model=List[ClientSummary])
def get_clients():
    clients = load_json(CLIENTS_FILE, [])
    return [
        ClientSummary(
            id=c["id"],
            name=c["name"],
            age=c.get("age", 30),
            profession=c.get("profession", ""),
            profile=c.get("profile", c.get("current_life_stage", "Client")),
            savings_balance=c.get("savings_balance", 0.0),
            monthly_income=c.get("monthly_income", 0.0)
        )
        for c in clients
    ]

@app.get("/api/clients/{client_id}", response_model=ClientPredictionResponse)
def get_client_prediction(client_id: str):
    return predict_client_intent(client_id)

@app.post("/api/clients/{client_id}/events", response_model=ClientPredictionResponse)
def post_client_event(client_id: str, event_req: ClientEventRequest):
    clients = load_json(CLIENTS_FILE, [])
    client = find_client(client_id, clients)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found.")

    normalized_id = client["id"]
    event_type = event_req.type
    payload = dict(event_req.payload)

    event_id = payload.get("id") or f"{'tx' if event_type == 'transaction' else 'int'}-{uuid.uuid4().hex[:8]}"
    timestamp = payload.get("timestamp") or current_iso_time()

    event_record = {
        "id": event_id,
        "client_id": normalized_id,
        "timestamp": timestamp,
        **payload
    }

    if event_type == "transaction":
        txs = load_json(TRANSACTIONS_FILE, [])
        txs.append(event_record)
        save_json(TRANSACTIONS_FILE, txs)

        # Update client's savings balance dynamically
        amt = float(payload.get("amount", 0))
        cat = str(payload.get("category", "")).lower()
        if cat in ["savings_deposit", "refund"]:
            delta = abs(amt)
            client["savings_balance"] = round(client.get("savings_balance", 0.0) + delta, 2)
            for c in clients:
                if c["id"] == normalized_id:
                    c["savings_balance"] = client["savings_balance"]
            save_json(CLIENTS_FILE, clients)
        elif cat in ["unexpected_expense", "major_outflow"]:
            delta = abs(amt)
            client["savings_balance"] = max(0.0, round(client.get("savings_balance", 0.0) - delta, 2))
            for c in clients:
                if c["id"] == normalized_id:
                    c["savings_balance"] = client["savings_balance"]
            save_json(CLIENTS_FILE, clients)
    elif event_type == "interaction":
        interactions = load_json(INTERACTIONS_FILE, [])
        interactions.append(event_record)
        save_json(INTERACTIONS_FILE, interactions)
    else:
        raise HTTPException(status_code=400, detail="Type must be either 'transaction' or 'interaction'.")

    return predict_client_intent(normalized_id)

@app.post("/api/simulator/reset")
def reset_simulator():
    seed_files = list(SEED_DIR.glob("*.json"))
    if not seed_files:
        raise HTTPException(status_code=500, detail="No seed files found in /data_seed")

    for sf in seed_files:
        shutil.copy2(sf, DATA_DIR / sf.name)

    return {
        "status": "success",
        "message": "Demo data successfully reset to clean initial state."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
