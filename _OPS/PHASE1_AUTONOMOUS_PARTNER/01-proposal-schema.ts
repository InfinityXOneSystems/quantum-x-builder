/**
 * CANONICAL PROPOSAL SCHEMA
 * ========================
 *
 * This is the SINGLE SOURCE OF TRUTH for consent and governance.
 *
 * NON-NEGOTIABLE:
 * - Do not remove fields
 * - Do not add execution logic
 * - Do not auto-approve
 *
 * This object ONLY contains proposal data.
 * No side effects. No execution paths.
 */

export interface ProposalAction {
  step: number;
  description: string;
  impact?: string;
}

export interface ProposalResources {
  repos?: string[];
  files?: string[];
  accounts?: string[];
  infra?: string[];
}

export interface ProposalRisk {
  impact: 'low' | 'medium' | 'high';
  explanation: string;
  rollbackAvailable: boolean;
}

export interface Proposal {
  // Core Identity
  id: string;
  intent: string;
  summary: string;

  // Explicit Actions (Human-readable steps)
  actions: string[];

  // Code/Config Changes (Optional)
  diffs?: string[];

  // Affected Resources
  resources: {
    repos?: string[];
    files?: string[];
    accounts?: string[];
    infra?: string[];
  };

  // Risk Assessment
  risk: {
    impact: 'low' | 'medium' | 'high';
    explanation: string;
    rollbackAvailable: boolean;
  };

  // AI Recommendation (Advisory only)
  recommendation: 'proceed' | 'caution' | 'do_not_proceed';

  // Status (AWAITING_APPROVAL only at Phase 1)
  status: 'AWAITING_APPROVAL';

  // Timestamp
  createdAt: number;
}

/**
 * PROPOSAL FACTORY
 * ================
 *
 * Creates a well-formed Proposal object.
 * Pure function. No side effects.
 */
export function createProposal(params: {
  intent: string;
  summary: string;
  actions: string[];
  resources: ProposalResources;
  risk: ProposalRisk;
  recommendation: 'proceed' | 'caution' | 'do_not_proceed';
  diffs?: string[];
}): Proposal {
  const id = `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    intent: params.intent,
    summary: params.summary,
    actions: params.actions,
    diffs: params.diffs || [],
    resources: params.resources,
    risk: params.risk,
    recommendation: params.recommendation,
    status: 'AWAITING_APPROVAL',
    createdAt: Date.now(),
  };
}

/**
 * PROPOSAL VALIDATOR
 * ==================
 *
 * Ensures Proposal is well-formed.
 * Pure function. No side effects.
 */
export function validateProposal(proposal: Proposal): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!proposal.id) errors.push('Missing: id');
  if (!proposal.intent) errors.push('Missing: intent');
  if (!proposal.summary) errors.push('Missing: summary');
  if (!Array.isArray(proposal.actions) || proposal.actions.length === 0) {
    errors.push('Missing: actions (must be non-empty array)');
  }
  if (!proposal.resources) errors.push('Missing: resources');
  if (!proposal.risk) errors.push('Missing: risk assessment');
  if (!proposal.recommendation) errors.push('Missing: recommendation');
  if (proposal.status !== 'AWAITING_APPROVAL') {
    errors.push(`Invalid status: ${proposal.status} (must be AWAITING_APPROVAL)`);
  }
  if (!proposal.createdAt) errors.push('Missing: createdAt timestamp');

  return {
    valid: errors.length === 0,
    errors,
  };
}
