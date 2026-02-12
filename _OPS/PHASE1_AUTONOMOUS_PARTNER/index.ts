/**
 * PHASE 1 AUTONOMOUS PARTNER PROPOSAL ENGINE
 * ==========================================
 *
 * Entry point for proposal creation and consent workflow.
 *
 * This module exports the core API for Phase 1:
 * - Prepare proposals (reasoning only)
 * - Render confirmation prompts (locked format)
 * - Handle user consent (strict YES/NO)
 */

// Schema
export {
  Proposal,
  ProposalAction,
  ProposalResources,
  ProposalRisk,
  createProposal,
  validateProposal,
} from './01-proposal-schema';

// Reasoning Pipeline
export {
  plannerSynthesizeActions,
  operatorIdentifyResources,
  criticAssessRisk,
  tapGuardianValidateConsent,
  userAdvocateCheckAgency,
  masterReasoningFlow,
} from './02-reasoning-pipeline';

// Confirmation & Consent
export {
  renderConfirmationPrompt,
  renderProposalDetail,
  handleConfirmationResponse,
} from './03-confirmation-renderer';

/**
 * PHASE 1 API
 * ===========
 *
 * Public interface for Phase 1 operations.
 */

import { masterReasoningFlow } from './02-reasoning-pipeline';
import { renderConfirmationPrompt, handleConfirmationResponse } from './03-confirmation-renderer';
import { validateProposal } from './01-proposal-schema';

/**
 * Main entry point: Convert human intent to Proposal
 */
export async function createProposalFromIntent(intent: string) {
  console.log(`\n📋 PHASE 1: Preparing proposal for intent...`);
  console.log(`   Intent: "${intent}"\n`);

  // Step 1: Reasoning pipeline
  const proposal = masterReasoningFlow(intent);

  // Step 2: Validate
  const validation = validateProposal(proposal);
  if (!validation.valid) {
    throw new Error(`Proposal validation failed:\n${validation.errors.join('\n')}`);
  }

  console.log(`✅ Proposal prepared (ID: ${proposal.id})`);
  return proposal;
}

/**
 * Main entry point: Request user consent
 */
export async function requestUserConsent(proposal: any) {
  console.log(`\n🔔 PHASE 1: Requesting user consent...\n`);

  const prompt = renderConfirmationPrompt(proposal);
  console.log(prompt);

  // In a real system, this would wait for stdin.
  // For now, return the prompt for manual inspection.
  return prompt;
}

/**
 * Main entry point: Process user response
 */
export async function processUserResponse(response: string, proposal: any) {
  const result = handleConfirmationResponse(response);

  console.log(`\n📝 User Response: ${response}`);
  console.log(`   Approved: ${result.approved}`);
  console.log(`   Reason: ${result.reason}\n`);

  if (result.approved) {
    console.log(`✅ PROPOSAL APPROVED (ID: ${proposal.id})`);
    console.log(`   ⏳ Awaiting Phase 2 execution instruction...\n`);
  } else {
    console.log(`❌ PROPOSAL DECLINED (ID: ${proposal.id})`);
    console.log(`   🛑 Proposal halted.\n`);
  }

  return result;
}

/**
 * PHASE 1 STATE
 * =============
 *
 * (For debugging/logging)
 */
export const PHASE1_STATE = {
  phase: 1,
  mode: 'PREPARATION_ONLY',
  executionEnabled: false,
  consentRequired: true,
  autoApprovalAllowed: false,
  status: 'ACTIVE',
  timestamp: Date.now(),
};

console.log(`
╔════════════════════════════════════════════════════════╗
║        PHASE 1: AUTONOMOUS PARTNER PROPOSAL ENGINE     ║
║              PREPARATION ONLY - EXECUTION DISABLED     ║
╚════════════════════════════════════════════════════════╝

Status: ACTIVE
Mode: Governance + Consent Contract

No execution. No side effects. No auto-approval.

Human consent is MANDATORY.
`);
