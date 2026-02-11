/**
 * REASONING PIPELINE
 * ==================
 *
 * Pure functions that SYNTHESIZE ONLY (no execution).
 *
 * These roles DO NOT act.
 * They contribute to Proposal content via reasoning.
 *
 * INTERNAL ROLES (synthesis only):
 * - Planner: breaks intent into steps
 * - Operator: identifies resources and constraints
 * - Critic: assesses risk and rollback
 * - TAP Guardian: ensures transparency and consent
 * - User Advocate: ensures human agency preserved
 */

import { Proposal, ProposalResources, ProposalRisk, createProposal } from './01-proposal-schema';

/**
 * PLANNER ROLE
 * ============
 *
 * Breaks a human intent into explicit ACTION STEPS.
 * Returns array of human-readable steps.
 */
export function plannerSynthesizeActions(intent: string): string[] {
  // This is a stub for Phase 1.
  // In production, this would use:
  // - Task decomposition
  // - Dependency analysis
  // - Sequencing logic
  //
  // For now: return structured placeholder

  const steps = [
    `[STEP 1] Analyze intent: "${intent}"`,
    `[STEP 2] Identify atomic operations needed`,
    `[STEP 3] Sequence operations by dependency`,
    `[STEP 4] Prepare resource list`,
  ];

  return steps;
}

/**
 * OPERATOR ROLE
 * =============
 *
 * Identifies affected RESOURCES and CONSTRAINTS.
 * Returns ProposalResources object.
 */
export function operatorIdentifyResources(intent: string, actions: string[]): ProposalResources {
  // This is a stub for Phase 1.
  // In production, this would:
  // - Parse actions for resource references
  // - Scan configuration files
  // - Identify infrastructure dependencies
  // - Check account/permission scopes
  //
  // For now: return structured placeholder

  return {
    repos: [],
    files: [],
    accounts: [],
    infra: [],
  };
}

/**
 * CRITIC ROLE
 * ===========
 *
 * Assesses RISK and ROLLBACK availability.
 * Returns ProposalRisk object.
 */
export function criticAssessRisk(
  intent: string,
  actions: string[],
  resources: ProposalResources
): ProposalRisk {
  // This is a stub for Phase 1.
  // In production, this would:
  // - Analyze impact radius
  // - Check backup/snapshot availability
  // - Identify irreversible operations
  // - Score risk using risk matrix
  //
  // For now: return structured placeholder

  const riskLevel = evaluateRiskLevel(intent);

  return {
    impact: riskLevel,
    explanation: `Risk assessment for intent: "${intent}" with ${actions.length} actions affecting ${countResources(resources)} resources.`,
    rollbackAvailable: riskLevel !== 'high', // Placeholder logic
  };
}

/**
 * TAP GUARDIAN ROLE
 * =================
 *
 * Ensures TRANSPARENCY, ACCOUNTABILITY, PERMISSION.
 * Validates that consent requirements are met.
 * Returns validation result.
 */
export function tapGuardianValidateConsent(proposal: Proposal): {
  canPropose: boolean;
  reason: string;
} {
  // This is Phase 1: PREPARATION ONLY
  // Consent cannot be auto-granted.

  // Check: Is proposal well-formed?
  if (!proposal.id || !proposal.intent || !proposal.actions.length) {
    return {
      canPropose: false,
      reason: 'Proposal is malformed. Cannot seek consent.',
    };
  }

  // Check: Is status correct?
  if (proposal.status !== 'AWAITING_APPROVAL') {
    return {
      canPropose: false,
      reason: `Invalid status: ${proposal.status}. Must be AWAITING_APPROVAL.`,
    };
  }

  // Check: Is consent loop valid?
  // (In Phase 1, we only PREPARE. We never execute.)

  return {
    canPropose: true,
    reason: 'Proposal is well-formed and ready for human consent request.',
  };
}

/**
 * USER ADVOCATE ROLE
 * ==================
 *
 * Ensures HUMAN AGENCY is preserved.
 * Checks that user control is not circumvented.
 */
export function userAdvocateCheckAgency(proposal: Proposal): {
  agencyPreserved: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];

  // Check: Are actions explicit and understandable?
  if (proposal.actions.some(a => a.includes('auto-') || a.includes('automatically'))) {
    concerns.push('Some actions appear to be automatic (lacking user control point).');
  }

  // Check: Is rollback available?
  if (proposal.risk.impact === 'high' && !proposal.risk.rollbackAvailable) {
    concerns.push('High-impact action with no rollback available. User agency at risk.');
  }

  // Check: Is recommendation too strong?
  if (proposal.recommendation === 'proceed' && proposal.risk.impact === 'high') {
    concerns.push('Strong recommendation for high-impact action. Ensure user autonomy.');
  }

  return {
    agencyPreserved: concerns.length === 0,
    concerns,
  };
}

/**
 * MASTER REASONING FLOW
 * =====================
 *
 * Orchestrates all reasoning roles.
 * Returns a complete Proposal object.
 *
 * Pure function. No side effects. No execution.
 */
export function masterReasoningFlow(intent: string): Proposal {
  // Step 1: Planner synthesizes actions
  const actions = plannerSynthesizeActions(intent);

  // Step 2: Operator identifies resources
  const resources = operatorIdentifyResources(intent, actions);

  // Step 3: Critic assesses risk
  const risk = criticAssessRisk(intent, actions, resources);

  // Step 4: TAP Guardian validates consent viability
  // (In Phase 1, we always PREPARE. Consent is handled separately.)

  // Step 5: User Advocate checks agency
  const agencyCheck = userAdvocateCheckAgency({
    id: '',
    intent,
    summary: `Proposal for: ${intent}`,
    actions,
    resources,
    risk,
    recommendation: 'caution',
    status: 'AWAITING_APPROVAL',
    createdAt: Date.now(),
  });

  // Step 6: Synthesize recommendation
  const recommendation = synthesizeRecommendation(intent, risk, agencyCheck);

  // Step 7: Create Proposal
  const proposal = createProposal({
    intent,
    summary: `Proposal: ${intent}`,
    actions,
    resources,
    risk,
    recommendation,
  });

  return proposal;
}

/**
 * HELPER FUNCTIONS
 * ================
 */

function evaluateRiskLevel(intent: string): 'low' | 'medium' | 'high' {
  // Placeholder: use keyword detection
  const highRiskKeywords = [
    'delete',
    'destroy',
    'production',
    'deploy',
    'database',
    'authentication',
  ];
  const mediumRiskKeywords = ['modify', 'update', 'change', 'refactor'];

  const lowerIntent = intent.toLowerCase();

  if (highRiskKeywords.some(kw => lowerIntent.includes(kw))) {
    return 'high';
  }
  if (mediumRiskKeywords.some(kw => lowerIntent.includes(kw))) {
    return 'medium';
  }

  return 'low';
}

function countResources(resources: ProposalResources): number {
  return (
    (resources.repos?.length || 0) +
    (resources.files?.length || 0) +
    (resources.accounts?.length || 0) +
    (resources.infra?.length || 0)
  );
}

function synthesizeRecommendation(
  intent: string,
  risk: ProposalRisk,
  agencyCheck: { agencyPreserved: boolean; concerns: string[] }
): 'proceed' | 'caution' | 'do_not_proceed' {
  // Phase 1 logic: Always recommend caution.
  // In Phase 2+, this would use predictive models.

  if (!agencyCheck.agencyPreserved) {
    return 'caution';
  }

  if (risk.impact === 'high') {
    return 'caution';
  }

  if (risk.impact === 'medium' && !risk.rollbackAvailable) {
    return 'caution';
  }

  return 'caution'; // Default to caution in Phase 1
}
