/**
 * KBC Hackathon Challenge - Signal-to-Action Realtime Backend
 * Stack: Node.js & Express (ES Module)
 * Database: Pure local JSON files in ./data
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const SEED_DIR = path.join(__dirname, 'data_seed');

const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');
const CATALOG_FILE = path.join(DATA_DIR, 'action_catalog.json');
const STATES_FILE = path.join(DATA_DIR, 'client_states.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SEED_DIR)) fs.mkdirSync(SEED_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// JSON Helpers
// ---------------------------------------------------------------------------
function loadJson(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function buildDecisionMessage(client, state) {
  const templates = [
    () => `Model says ${client.name} is ${state.intent_stage.replace(/_/g, ' ')} with ${Math.round((state.confidence_score || 0) * 100)}% confidence.`,
    () => `Backend verdict: ${client.name} looks like a ${state.detected_intent.replace(/_/g, ' ')} case and the engine is leaning ${state.intent_stage.replace(/_/g, ' ')}.`,
    () => `State snapshot for ${client.name}: ${state.kate_message || 'no message'} | ${state.transparency_reason || 'no reason logged'}`,
    () => `Decision note: ${client.name} currently reads as ${state.intent_stage.replace(/_/g, ' ')} with ${state.detected_signals?.length || 0} backend signals attached.`,
  ];

  const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
  return selectedTemplate();
}

const INTENT_ALIASES = {
  buying_first_home: ['buying_first_home', 'first_time_home_buyer', 'home_buyer'],
  freelance_entrepreneur: ['freelance_entrepreneur', 'freelance_business_owner', 'independent_freelancer'],
  wealth_accumulator: ['wealth_accumulator', 'general_wealth', 'family_protection'],
};

const STAGE_PRIORITY = ['exploring', 'active_decision', 'action_ready', 'closing'];

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function includesAny(text, keywords) {
  return keywords.some(keyword => text.includes(keyword));
}

function canonicalIntent(intent) {
  const normalized = normalizeText(intent);
  if (INTENT_ALIASES.buying_first_home.includes(normalized)) return 'buying_first_home';
  if (INTENT_ALIASES.freelance_entrepreneur.includes(normalized)) return 'freelance_entrepreneur';
  return 'wealth_accumulator';
}

function catalogIntent(card) {
  return canonicalIntent(card.target_intent || card.intent || '');
}

function catalogStageScore(cardStage, intentStage) {
  const selectedStage = STAGE_PRIORITY.includes(intentStage) ? intentStage : 'exploring';
  const cardIndex = STAGE_PRIORITY.indexOf(cardStage);
  const selectedIndex = STAGE_PRIORITY.indexOf(selectedStage);

  if (cardIndex === -1 || selectedIndex === -1) return 0;
  if (cardIndex === selectedIndex) return 3;
  if (Math.abs(cardIndex - selectedIndex) === 1) return 2;
  return 1;
}

function scoreClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildProfileSignals(client) {
  const signals = [];
  const scores = {
    buying_first_home: 0,
    freelance_entrepreneur: 0,
    wealth_accumulator: 0,
  };

  const lifeStage = normalizeText(client.current_life_stage);
  const profession = normalizeText(client.profession);
  const monthlyIncome = Number(client.monthly_income || 0);
  const savingsBalance = Number(client.savings_balance || 0);
  const age = Number(client.age || 30);

  if (includesAny(lifeStage, ['young_professional_starter', 'young_starter', 'dual_income_starters'])) {
    scores.buying_first_home += 4;
    scores.wealth_accumulator += 1;
    signals.push(`Starter profile stage (${client.current_life_stage}) correlates with first property acquisition`);
  }

  if (includesAny(lifeStage, ['independent_freelancer']) || includesAny(profession, ['freelance', 'consultant', 'founder', 'self-employed'])) {
    scores.freelance_entrepreneur += 5;
    signals.push(`Independent professional career track (${client.profession})`);
  }

  if (includesAny(lifeStage, ['medical_professional']) || includesAny(profession, ['medical', 'physician', 'doctor', 'specialist'])) {
    scores.wealth_accumulator += 4;
    scores.freelance_entrepreneur += 3;
    signals.push(`High-earning medical practitioner profile (${client.profession})`);
  }

  if (includesAny(lifeStage, ['pre_retirement']) || age >= 55) {
    scores.wealth_accumulator += 6;
    signals.push(`Pre-retirement life stage (age ${age}): focus on capital preservation and succession`);
  }

  if (includesAny(lifeStage, ['family_with_kids']) || includesAny(profession, ['parent', 'family'])) {
    scores.wealth_accumulator += 2;
    scores.buying_first_home += 2;
    signals.push('Family household profile with dependent children');
  }

  if (includesAny(profession, ['architect', 'engineer'])) {
    scores.buying_first_home += 2;
    scores.freelance_entrepreneur += 2;
  }

  if (savingsBalance >= 100000) {
    scores.wealth_accumulator += 5;
    signals.push(`High-net-worth liquid savings buffer of €${savingsBalance.toLocaleString()}`);
  } else if (savingsBalance >= 45000) {
    scores.wealth_accumulator += 3;
    scores.buying_first_home += 2;
    signals.push(`Substantial savings reserve of €${savingsBalance.toLocaleString()} ready for deployment`);
  } else if (savingsBalance >= 20000) {
    scores.wealth_accumulator += 2;
    scores.buying_first_home += 2;
    signals.push(`Healthy savings buffer of €${savingsBalance.toLocaleString()}`);
  }

  if (monthlyIncome >= 5500) {
    scores.wealth_accumulator += 3;
    signals.push(`High monthly net income (€${monthlyIncome.toLocaleString()}/mo) yields significant discretionary surplus`);
  } else if (monthlyIncome >= 3500) {
    scores.wealth_accumulator += 1;
  }

  if (age <= 35) {
    scores.buying_first_home += 1;
  }

  return { signals, scores };
}

function buildTransactionSignals(transactions) {
  const signals = [];
  const scores = {
    buying_first_home: 0,
    freelance_entrepreneur: 0,
    wealth_accumulator: 0,
  };
  let hasClosingTx = false;

  const notaryTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['notaris', 'notary', 'compromis', 'escrow', 'deed']);
  });

  if (notaryTxs.length > 0) {
    for (const t of notaryTxs) {
      if (normalizeText(t.description).includes('compromis') || Math.abs(t.amount || 0) >= 5000) {
        hasClosingTx = true;
        scores.buying_first_home += 8;
        signals.push(`Escrow deposit payment of €${Math.abs(t.amount || 0).toLocaleString()} to ${t.merchant} (Compromis voorschot)`);
      } else {
        scores.buying_first_home += 3;
        scores.wealth_accumulator += 1;
        signals.push(`Notary consultation payment: ${t.merchant} (${t.description})`);
      }
    }
  }

  const surveyorTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['surveyor', 'landmeter', 'landmeetkunde', 'inspection', 'architekt', 'expertises']);
  });
  if (surveyorTxs.length > 0) {
    scores.buying_first_home += 4;
    signals.push(`${surveyorTxs.length} property appraisal / surveyor inspection transaction(s) logged`);
  }

  const immoTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['immoweb', 'zimmo', 'immovlan', 'real_estate_platform']);
  });
  if (immoTxs.length > 0) {
    scores.buying_first_home += 3;
    signals.push(`Active premium property search alert subscriptions (${immoTxs[0].merchant})`);
  }

  const renoTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['renovation', 'brico', 'gamma', 'hubo', 'fluvius', 'ikea']);
  });
  if (renoTxs.length > 0) {
    scores.buying_first_home += 2;
    signals.push(`Renovation / home improvement hardware expenses detected (${renoTxs.length} txs)`);
  }

  const rentTxs = transactions.filter(tx => normalizeText(tx.category) === 'rent');
  if (rentTxs.length > 0) {
    scores.buying_first_home += 1;
    signals.push(`Active rental housing baseline (${rentTxs[0].merchant})`);
  }

  const invoiceTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['invoice', 'sprint', 'consulting', 'consultancy', 'payout', 'stripe', 'shopify']);
  });
  if (invoiceTxs.length > 0) {
    scores.freelance_entrepreneur += 5;
    const totalInv = invoiceTxs.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
    signals.push(`Recurring commercial client invoice inflows (€${totalInv.toLocaleString()} across ${invoiceTxs.length} transactions)`);
  }

  const socialTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['social_contributions', 'acerta', 'liantis', 'xerius']);
  });
  if (socialTxs.length > 0) {
    scores.freelance_entrepreneur += 5;
    signals.push(`Social security contributions to ${socialTxs[0].merchant} registered`);
  }

  const taxTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['accounting_tax', 'fiscaal', 'kpmg', 'bdo']);
  });
  if (taxTxs.length > 0) {
    scores.freelance_entrepreneur += 3;
    signals.push(`Professional accounting and corporate fiscal filings (${taxTxs[0].merchant})`);
  }

  const saasTxs = transactions.filter(tx => {
    const text = [tx.category, tx.merchant, tx.description].map(normalizeText).join(' ');
    return includesAny(text, ['software_saas', 'coworking', 'fosbury', 'silversquare', 'wework', 'aws', 'adobe', 'mollie']);
  });
  if (saasTxs.length > 0) {
    scores.freelance_entrepreneur += 2;
    signals.push('Business operations tools and dedicated workspace memberships');
  }

  const savingsDeposits = transactions.filter(tx => normalizeText(tx.category) === 'savings_deposit');
  if (savingsDeposits.length > 0) {
    scores.wealth_accumulator += 3;
    scores.buying_first_home += 2;
    signals.push(`${savingsDeposits.length} recurring monthly savings transfer(s) detected`);
  }

  const investTxs = transactions.filter(tx => ['investment', 'pension_savings'].includes(normalizeText(tx.category)));
  if (investTxs.length > 0) {
    scores.wealth_accumulator += 5;
    signals.push(`${investTxs.length} dedicated investment/pension fund allocations detected (${investTxs[0].merchant})`);
  }

  return { signals, scores, hasClosingTx };
}

function buildInteractionSignals(interactions) {
  const signals = [];
  const scores = {
    buying_first_home: 0,
    freelance_entrepreneur: 0,
    wealth_accumulator: 0,
  };
  let hasCertificateRequest = false;

  const mortgageSimulations = interactions.filter(interaction => interaction.action === 'mortgage_simulator_used');
  if (mortgageSimulations.length > 0) {
    scores.buying_first_home += 5;
    const latest = mortgageSimulations[mortgageSimulations.length - 1]?.details || {};
    const amt = latest.simulated_amount || 0;
    const term = latest.term_years || 25;
    const mPay = latest.estimated_monthly_payment || 0;
    signals.push(`${mortgageSimulations.length}x mortgage simulation(s) consulted (latest: €${Number(amt).toLocaleString()} loan over ${term} yrs, €${Number(mPay).toLocaleString()}/mo)`);
  }

  const renoSims = interactions.filter(i => i.action === 'renovation_loan_simulator');
  if (renoSims.length > 0) {
    scores.buying_first_home += 4;
    signals.push('Green renovation loan & Flemish energy subsidy calculator consulted');
  }

  const guideInts = interactions.filter(i => i.action === 'first_home_guide_downloaded');
  if (guideInts.length > 0) {
    scores.buying_first_home += 2;
    signals.push('First-time home buyer digital guide downloaded');
  }

  const homeKeywords = ['mortgage', 'loan', 'notary', 'compromis', 'registration tax', '3%', 'interest rate', 'renovation', 'woonlening'];
  const freelanceKeywords = ['freelance', 'vapz', 'kbo', 'cbe', 'bv', 'tax', 'peppol', 'billit', 'leasing', 'acerta'];
  const wealthKeywords = ['invest', 'pension', 'succession', 'inheritance', 'bankgift', 'private bank', 'estate', 'education'];

  const kateQueries = interactions.filter(i => i.action === 'kate_query');
  for (const interaction of kateQueries) {
    const q = interaction.details?.query || '';
    const qLower = normalizeText(q);

    if (includesAny(qLower, homeKeywords)) {
      scores.buying_first_home += 4;
      signals.push(`Kate consultation on property purchasing: "${q}"`);
      if (qLower.includes('notaris') || qLower.includes('certificate')) {
        hasCertificateRequest = true;
      }
    } else if (includesAny(qLower, freelanceKeywords)) {
      scores.freelance_entrepreneur += 4;
      signals.push(`Kate consultation on freelance fiscal strategy: "${q}"`);
    } else if (includesAny(qLower, wealthKeywords)) {
      scores.wealth_accumulator += 4;
      signals.push(`Kate consultation on wealth preservation: "${q}"`);
    }
  }

  const bizInts = interactions.filter(i => ['business_account_viewed', 'kbo_search_viewed'].includes(i.action));
  if (bizInts.length > 0) {
    scores.freelance_entrepreneur += 4;
    signals.push('KBC Business Account Plus & KBO/CBE corporate registry configurator viewed');
  }

  const pensionSims = interactions.filter(i => i.action === 'pension_simulator_used');
  if (pensionSims.length > 0) {
    const planType = normalizeText(pensionSims[pensionSims.length - 1]?.details?.plan_type || '');
    if (planType.includes('vapz') || planType.includes('ipt')) {
      scores.freelance_entrepreneur += 4;
      scores.wealth_accumulator += 2;
      signals.push(`Tax-sheltered pension simulation consulted (${pensionSims[pensionSims.length - 1]?.details?.plan_type})`);
    } else {
      scores.wealth_accumulator += 4;
      signals.push('Pension capital accumulation and annuity calculator consulted');
    }
  }

  const investInts = interactions.filter(i => i.action === 'investment_fund_viewed');
  if (investInts.length > 0) {
    scores.wealth_accumulator += 4;
    const catName = investInts[investInts.length - 1]?.details?.fund_category || 'Goal-based investment';
    signals.push(`Portfolio builder explored: ${catName}`);
  }

  const insQuotes = interactions.filter(i => i.action === 'insurance_quote_viewed');
  for (const q of insQuotes) {
    const itype = normalizeText(q.details?.insurance_type || '');
    if (includesAny(itype, ['home', 'fire', 'mandatory', 'construction'])) {
      scores.buying_first_home += 3;
      signals.push(`Mandatory property insurance bundle quote viewed (${q.details?.insurance_type})`);
    } else if (includesAny(itype, ['freelance', 'continuity', 'indemnity', 'income'])) {
      scores.freelance_entrepreneur += 3;
      signals.push('Freelance income protection & continuity insurance quote viewed');
    } else if (includesAny(itype, ['family', 'estate', 'succession'])) {
      scores.wealth_accumulator += 3;
      signals.push('Family liability & estate preservation insurance quote viewed');
    }
  }

  return { signals, scores, hasCertificateRequest };
}

function chooseDetectedIntent(client, profileScores, transactionScores, interactionScores, clientTransactions, clientInteractions, hasClosingTx, hasCertReq) {
  const combinedScores = {
    buying_first_home: profileScores.buying_first_home + transactionScores.buying_first_home + interactionScores.buying_first_home,
    freelance_entrepreneur: profileScores.freelance_entrepreneur + transactionScores.freelance_entrepreneur + interactionScores.freelance_entrepreneur,
    wealth_accumulator: profileScores.wealth_accumulator + transactionScores.wealth_accumulator + interactionScores.wealth_accumulator,
  };

  const orderedIntents = Object.entries(combinedScores).sort((left, right) => right[1] - left[1]);
  const [detectedIntent, topScore] = orderedIntents[0];
  const secondScore = orderedIntents[1]?.[1] || 0;

  let intentStage = 'exploring';
  const savings = Number(client.savings_balance || 0);
  const income = Number(client.monthly_income || 0);

  if (detectedIntent === 'buying_first_home') {
    const simCount = clientInteractions.filter(i => i.action === 'mortgage_simulator_used').length;
    const hasBundleQuote = clientInteractions.some(i => i.action === 'insurance_quote_viewed' && JSON.stringify(i.details || {}).includes('bundle'));
    if (hasClosingTx || hasCertReq) {
      intentStage = 'closing';
    } else if (hasBundleQuote && savings >= 30000) {
      intentStage = 'action_ready';
    } else if ((simCount >= 2 || transactionScores.buying_first_home >= 6) && savings >= 25000) {
      intentStage = 'active_decision';
    } else {
      intentStage = 'exploring';
    }
  } else if (detectedIntent === 'freelance_entrepreneur') {
    const hasSocial = clientTransactions.some(t => t.category === 'social_contributions');
    const hasBizAction = clientInteractions.some(i => ['business_account_viewed', 'insurance_quote_viewed'].includes(i.action));
    const hasPensionSim = clientInteractions.some(i => ['pension_simulator_used', 'kbo_search_viewed'].includes(i.action));
    if (income >= 5000 && hasSocial && hasBizAction) {
      intentStage = 'action_ready';
    } else if (hasPensionSim) {
      intentStage = 'active_decision';
    } else {
      intentStage = 'exploring';
    }
  } else {
    const hasNotary = clientTransactions.some(t => t.category === 'notary');
    const hasConsult = clientInteractions.some(i => i.action === 'kate_query' && JSON.stringify(i.details || {}).includes('consult'));
    const hasPensionSim = clientInteractions.some(i => ['pension_simulator_used', 'investment_fund_viewed'].includes(i.action));
    if (savings >= 100000 && hasNotary && hasConsult) {
      intentStage = 'action_ready';
    } else if (savings >= 100000 && income >= 8000) {
      intentStage = 'action_ready';
    } else if (hasPensionSim && savings >= 30000) {
      intentStage = 'active_decision';
    } else {
      intentStage = 'exploring';
    }
  }

  let confidenceScore = 0.74;
  if (intentStage === 'closing') {
    confidenceScore = 0.98;
  } else if (intentStage === 'action_ready') {
    confidenceScore = 0.96;
  } else if (intentStage === 'active_decision') {
    confidenceScore = 0.86;
  } else {
    confidenceScore = 0.74;
  }

  return { detectedIntent, intentStage, confidenceScore, combinedScores };
}

function buildKateMessage(client, detectedIntent, intentStage) {
  const firstName = client.name.split(' ')[0];
  const savings = Number(client.savings_balance || 0).toLocaleString();

  if (detectedIntent === 'buying_first_home') {
    if (intentStage === 'closing') {
      return `Congratulations ${firstName}! Your property purchase offer has been accepted and the escrow deposit is recorded. I have finalized your mortgage dossier, coordinated with your notary, and unlocked your 15% Dockx moving discount.`;
    }
    if (intentStage === 'action_ready') {
      return `Hi ${firstName}, you are in a prime position to make a binding offer! Generate your official KBC Credit Promise in 1 click and lock in your mortgage rate discount with our bundled home insurance.`;
    }
    if (intentStage === 'active_decision') {
      return `Hi ${firstName}, your home search is gathering momentum. Based on your recent simulations, you have strong borrowing capacity. Compare notary closing fees and explore pre-approved listings today.`;
    }
    return `Hi ${firstName}, getting ready for your first home? Take advantage of the 3% Flemish registration tax rule and use our budget simulator to plan your down payment.`;
  }

  if (detectedIntent === 'freelance_entrepreneur') {
    if (intentStage === 'action_ready') {
      return `Hi ${firstName}, your independent business cashflow is thriving! Activate our automated 3-way treasury split to isolate VAT & taxes automatically, and secure comprehensive professional indemnity.`;
    }
    if (intentStage === 'active_decision') {
      return `Hi ${firstName}, maximize your freelance earnings with our KBC Business Account Plus and save up to 53% in taxes via VAPZ pension contributions.`;
    }
    return `Hi ${firstName}, stepping into independent entrepreneurship? Discover our step-by-step Acerta starter pack and explore how to separate business expenses cleanly.`;
  }

  if (intentStage === 'action_ready') {
    return `Hello ${firstName}, your accumulated capital of €${savings} provides strong wealth-building momentum. Schedule a dedicated Private Banking session to optimize Flemish inheritance succession and ESG portfolio allocations.`;
  }
  if (intentStage === 'active_decision') {
    return `Hi ${firstName}, put your discretionary cashflow to work with goal-based ESG portfolios and protect your household standard of living.`;
  }
  return `Hi ${firstName}, build long-term family security with automated recurring savings plans and check your family civil liability coverage.`;
}

function selectRecommendations(catalog, detectedIntent, intentStage) {
  const rankedCards = [];
  const fallbackIntent = canonicalIntent(detectedIntent);
  const stagePriority = STAGE_PRIORITY.includes(intentStage) ? intentStage : 'exploring';

  for (const card of catalog) {
    if (catalogIntent(card) !== fallbackIntent) continue;
    const stageScore = catalogStageScore(card.stage || 'exploring', stagePriority);
    const domainScore = ['banking', 'insurance', 'partner'].includes(card.domain) ? 1 : 0;
    rankedCards.push({ card, score: stageScore + domainScore });
  }

  rankedCards.sort((left, right) => right.score - left.score);

  const selectedCards = [];
  const selectedDomains = new Set();

  for (const entry of rankedCards) {
    if (selectedDomains.has(entry.card.domain)) continue;
    selectedCards.push(entry.card);
    selectedDomains.add(entry.card.domain);
    if (selectedCards.length === 3) break;
  }

  if (selectedCards.length < 3) {
    for (const domain of ['banking', 'insurance', 'partner']) {
      if (selectedDomains.has(domain)) continue;
      const fallbackCard = catalog.find(card => card.domain === domain && catalogIntent(card) === fallbackIntent)
        || catalog.find(card => card.domain === domain)
        || null;
      if (fallbackCard) {
        selectedCards.push(fallbackCard);
        selectedDomains.add(domain);
      }
      if (selectedCards.length === 3) break;
    }
  }

  return selectedCards.slice(0, 3);
}

function persistClientState(updatedState) {
  const allClients = loadJson(CLIENTS_FILE, []);
  const validClientIds = new Set(allClients.map(client => client.id));
  const allStates = loadJson(STATES_FILE, []).filter(state => validClientIds.has(state.client_id) || state.client_id === updatedState.client_id);
  const existingIndex = allStates.findIndex(state => state.client_id === updatedState.client_id);

  if (existingIndex >= 0) {
    allStates[existingIndex] = updatedState;
  } else {
    allStates.push(updatedState);
  }

  saveJson(STATES_FILE, allStates.filter(state => validClientIds.has(state.client_id)));
}

// ---------------------------------------------------------------------------
// Signal Engine Core Logic
// ---------------------------------------------------------------------------
export function evaluateClientSignals(clientId) {
  const clients = loadJson(CLIENTS_FILE, []);
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    const error = new Error(`Client with ID '${clientId}' not found.`);
    error.status = 404;
    throw error;
  }

  const allTransactions = loadJson(TRANSACTIONS_FILE, []);
  const allInteractions = loadJson(INTERACTIONS_FILE, []);
  const catalog = loadJson(CATALOG_FILE, []);

  const clientTransactions = allTransactions.filter(t => t.client_id === clientId);
  const clientInteractions = allInteractions.filter(i => i.client_id === clientId);

  const profileEvidence = buildProfileSignals(client);
  const transactionEvidence = buildTransactionSignals(clientTransactions);
  const interactionEvidence = buildInteractionSignals(clientInteractions);

  const detectedSignals = [
    ...profileEvidence.signals,
    ...transactionEvidence.signals,
    ...interactionEvidence.signals,
  ];

  const intentOutcome = chooseDetectedIntent(
    client,
    profileEvidence.scores,
    transactionEvidence.scores,
    interactionEvidence.scores,
    clientTransactions,
    clientInteractions,
    transactionEvidence.hasClosingTx,
    interactionEvidence.hasCertificateRequest
  );

  const detectedIntent = intentOutcome.detectedIntent;
  const intentStage = intentOutcome.intentStage;
  const confidenceScore = intentOutcome.confidenceScore;
  const kateMessage = buildKateMessage(client, detectedIntent, intentStage);

  if (detectedSignals.length === 0) {
    detectedSignals.push('No strong signals detected yet; using profile baseline and spending pattern');
  }

  const topSignalsSummary = detectedSignals.slice(0, 4).join('; ');
  const transparencyReason = `Why am I seeing this? KBC Signal Engine recognized ${detectedSignals.length} evidence indicators across banking history, interactions, and financial profile: ${topSignalsSummary}.`;
  const activeRecommendations = selectRecommendations(catalog, detectedIntent, intentStage);
  const actionRefs = activeRecommendations.map(card => card.id);

  const updatedState = {
    client_id: clientId,
    detected_intent: detectedIntent,
    confidence_score: confidenceScore,
    intent_stage: intentStage,
    last_updated: new Date().toISOString(),
    kate_message: kateMessage,
    transparency_reason: transparencyReason,
    detected_signals: detectedSignals,
    profile_signals: profileEvidence.signals,
    transaction_signals: transactionEvidence.signals,
    interaction_signals: interactionEvidence.signals,
    evidence_scores: intentOutcome.combinedScores,
    action_refs: actionRefs,
    active_recommendations: activeRecommendations
  };

  // Persist into client_states.json
  persistClientState(updatedState);

  return updatedState;
}

// ---------------------------------------------------------------------------
// Express Application Setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Request logger for hackathon demo debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /
 * Health check & endpoint summary
 */
app.get('/', (req, res) => {
  res.json({
    app: 'KBC Signal-to-Action Engine (Node.js & Express)',
    status: 'online',
    version: '1.0.0',
    documentation: 'See README or use the API endpoints below',
    endpoints: [
      'GET  /api/clients',
      'GET  /api/client-states',
      'GET  /api/transactions',
      'GET  /api/interactions',
      'GET  /api/clients/:id',
      'GET  /api/clients/:id/feed',
      'POST /api/simulator/trigger-event',
      'POST /api/simulator/reset',
      'GET  /api/simulator/events/:id',
      'GET  /api/catalog'
    ]
  });
});

/**
 * GET /api/clients
 * Returns all client personas
 */
app.get('/api/clients', (req, res) => {
  const clients = loadJson(CLIENTS_FILE, []);
  res.json(clients);
});

/**
 * GET /api/client-states
 * Returns all evaluated client states
 */
app.get('/api/client-states', (req, res) => {
  const clients = loadJson(CLIENTS_FILE, []);
  const states = clients.map(client => evaluateClientSignals(client.id));
  res.json(states.map(state => ({
    ...state,
    action_refs: state.action_refs || (state.active_recommendations || []).map(card => card.id),
  })));
});

/**
 * GET /api/transactions
 * Returns all financial transactions in the demo dataset
 */
app.get('/api/transactions', (req, res) => {
  const transactions = loadJson(TRANSACTIONS_FILE, []);
  res.json(transactions);
});

/**
 * GET /api/interactions
 * Returns all in-app interactions in the demo dataset
 */
app.get('/api/interactions', (req, res) => {
  const interactions = loadJson(INTERACTIONS_FILE, []);
  res.json(interactions);
});

/**
 * GET /api/clients/:id
 * Returns a specific client persona
 */
app.get('/api/clients/:id', (req, res) => {
  const clients = loadJson(CLIENTS_FILE, []);
  const client = clients.find(c => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }
  res.json(client);
});

/**
 * GET /api/clients/:id/feed
 * Returns the personalized mobile home feed:
 * - Client profile
 * - Detected intent & confidence score
 * - Intent stage (exploring | actively_searching | closing)
 * - Kate message
 * - 3 Personalized action cards (Banking, Insurance, Partner)
 * - "Why am I seeing this?" transparency rationale
 */
app.get('/api/clients/:id/feed', (req, res) => {
  const clientId = req.params.id;
  const clients = loadJson(CLIENTS_FILE, []);
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: `Client with ID '${clientId}' not found` });
  }

  const state = evaluateClientSignals(clientId);

  const recommendations = state.active_recommendations || [];

  res.json({
    client,
    detected_intent: state.detected_intent,
    confidence_score: state.confidence_score,
    intent_stage: state.intent_stage,
    last_updated: state.last_updated,
    kate_message: state.kate_message,
    transparency_reason: state.transparency_reason,
    detected_signals: state.detected_signals || [],
    cards: {
      banking: recommendations.find(c => c.domain === 'banking') || null,
      insurance: recommendations.find(c => c.domain === 'insurance') || null,
      partner: recommendations.find(c => c.domain === 'partner') || null,
      all: recommendations
    }
  });
});

/**
 * GET /api/clients/:id/decision
 * Returns a backend-generated decision snapshot and a randomized model message.
 */
app.get('/api/clients/:id/decision', (req, res) => {
  const clientId = req.params.id;
  const clients = loadJson(CLIENTS_FILE, []);
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: `Client with ID '${clientId}' not found` });
  }

  const state = evaluateClientSignals(clientId);
  const modelMessage = buildDecisionMessage(client, state);

  res.json({
    client,
    feed: state,
    model_message: modelMessage,
    generated_at: new Date().toISOString(),
  });
});

/**
 * POST /api/simulator/trigger-event
 * Simulates a new real-time signal from the jury control panel:
 * Body: { "client_id": "c-001", "type": "transaction" | "interaction", "data": { ... } }
 */
app.post('/api/simulator/trigger-event', (req, res) => {
  const { client_id, type, data } = req.body || {};

  if (!client_id || !type || !data) {
    return res.status(400).json({ error: 'Missing required fields: client_id, type, data' });
  }

  if (type !== 'transaction' && type !== 'interaction') {
    return res.status(400).json({ error: "Type must be either 'transaction' or 'interaction'" });
  }

  const clients = loadJson(CLIENTS_FILE, []);
  if (!clients.some(c => c.id === client_id)) {
    return res.status(404).json({ error: `Client '${client_id}' does not exist` });
  }

  const eventId = data.id || `${type === 'transaction' ? 'tx' : 'int'}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = data.timestamp || new Date().toISOString();

  const eventRecord = {
    id: eventId,
    client_id,
    timestamp,
    ...data
  };

  if (type === 'transaction') {
    const transactions = loadJson(TRANSACTIONS_FILE, []);
    transactions.push(eventRecord);
    saveJson(TRANSACTIONS_FILE, transactions);
  } else {
    const interactions = loadJson(INTERACTIONS_FILE, []);
    interactions.push(eventRecord);
    saveJson(INTERACTIONS_FILE, interactions);
  }

  // Re-evaluate client signals in real time
  const updatedState = evaluateClientSignals(client_id);

  res.json({
    status: 'success',
    message: `${type.toUpperCase()} recorded and client signals re-evaluated in real time.`,
    event_recorded: eventRecord,
    updated_state: updatedState
  });
});

/**
 * POST /api/simulator/reset
 * Resets all demo data to pristine initial hackathon state from ./data_seed
 */
app.post('/api/simulator/reset', (req, res) => {
  if (!fs.existsSync(SEED_DIR)) {
    return res.status(500).json({ error: 'Seed directory does not exist' });
  }

  const seedFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json'));
  for (const file of seedFiles) {
    const src = path.join(SEED_DIR, file);
    const dest = path.join(DATA_DIR, file);
    fs.copyFileSync(src, dest);
  }

  // Re-evaluate all clients
  const clients = loadJson(CLIENTS_FILE, []);
  for (const client of clients) {
    try {
      evaluateClientSignals(client.id);
    } catch (err) {
      console.error(`Error re-evaluating client ${client.id}:`, err.message);
    }
  }

  res.json({
    status: 'success',
    message: 'Demo dataset successfully reset to initial hackathon state.',
    clients_recalculated: clients.map(c => c.id)
  });
});

/**
 * GET /api/simulator/events/:id
 * Chronological timeline of all events (transactions & interactions) for a client
 */
app.get('/api/simulator/events/:id', (req, res) => {
  const clientId = req.params.id;
  const transactions = loadJson(TRANSACTIONS_FILE, []).filter(t => t.client_id === clientId);
  const interactions = loadJson(INTERACTIONS_FILE, []).filter(i => i.client_id === clientId);

  const timeline = [];

  for (const t of transactions) {
    timeline.push({
      type: 'transaction',
      id: t.id,
      timestamp: t.timestamp,
      title: `Transaction: ${t.merchant} (€${t.amount})`,
      details: t
    });
  }

  for (const i of interactions) {
    timeline.push({
      type: 'interaction',
      id: i.id,
      timestamp: i.timestamp,
      title: `In-App Interaction: ${i.action}`,
      details: i
    });
  }

  timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    client_id: clientId,
    total_events: timeline.length,
    events: timeline
  });
});

/**
 * GET /api/catalog
 * Returns the entire proactive action card catalog
 */
app.get('/api/catalog', (req, res) => {
  const catalog = loadJson(CATALOG_FILE, []);
  res.json(catalog);
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 KBC Signal-to-Action Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📋 API Clients: http://localhost:${PORT}/api/clients`);
  console.log(`📱 Thomas Feed: http://localhost:${PORT}/api/clients/c-001/feed`);
  console.log(`====================================================`);
});
