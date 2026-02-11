/**
 * CONFIRMATION PROMPT RENDERER
 * ============================
 *
 * Renders Proposal objects as human-facing consent prompts.
 *
 * FORMAT IS LOCKED - NO VARIATION, NO PARAPHRASING.
 * Silence is NOT approval.
 */

import { Proposal } from './01-proposal-schema';

/**
 * CANONICAL CONFIRMATION PROMPT FORMAT
 *
 * This is the EXACT format that must be rendered.
 * Do not modify. Do not paraphrase.
 */
export function renderConfirmationPrompt(proposal: Proposal): string {
  const resourcesStr = formatResources(proposal.resources);
  const actionsStr = formatActions(proposal.actions);

  const prompt = `
------------------------------------
INTENT:
I propose to: ${proposal.intent}

ACTIONS:
${actionsStr}

AFFECTED RESOURCES:
${resourcesStr}

RISK:
Impact: ${proposal.risk.impact}
Rollback: ${proposal.risk.rollbackAvailable ? 'available' : 'not available'}

Do you approve this action?
Type: YES or NO
------------------------------------
`;

  return prompt;
}

/**
 * DETAILED PROPOSAL RENDER
 *
 * Optional: detailed view for review/logging.
 * NOT the confirmation prompt.
 */
export function renderProposalDetail(proposal: Proposal): string {
  return `
=====================================
PROPOSAL DETAIL
=====================================

ID: ${proposal.id}
Created: ${new Date(proposal.createdAt).toISOString()}
Status: ${proposal.status}

INTENT:
${proposal.intent}

SUMMARY:
${proposal.summary}

ACTIONS:
${proposal.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

RESOURCES AFFECTED:
${formatResourcesDetail(proposal.resources)}

RISK ASSESSMENT:
Impact Level: ${proposal.risk.impact}
Rollback Available: ${proposal.risk.rollbackAvailable}
Explanation: ${proposal.risk.explanation}

RECOMMENDATION:
${proposal.recommendation.toUpperCase()}

${
  proposal.diffs && proposal.diffs.length > 0
    ? `DIFFS:
${proposal.diffs.join('\n')}`
    : ''
}

=====================================
`;
}

/**
 * CONFIRMATION RESPONSE HANDLER
 *
 * Parses user response to confirmation prompt.
 * Strict: only "YES" or "NO" are valid.
 * Silence is NOT approval.
 */
export function handleConfirmationResponse(response: string): {
  approved: boolean;
  reason: string;
} {
  const trimmed = response.trim().toUpperCase();

  if (trimmed === 'YES') {
    return {
      approved: true,
      reason: 'User approved.',
    };
  }

  if (trimmed === 'NO') {
    return {
      approved: false,
      reason: 'User declined.',
    };
  }

  // Anything else is NOT approval
  return {
    approved: false,
    reason: `Invalid response: "${response}". Only "YES" or "NO" are valid. Silence is NOT approval.`,
  };
}

/**
 * HELPER FUNCTIONS
 * ================
 */

function formatActions(actions: string[]): string {
  return actions.map((action, i) => `${i + 1}. ${action}`).join('\n');
}

function formatResources(resources: {
  repos?: string[];
  files?: string[];
  accounts?: string[];
  infra?: string[];
}): string {
  const lines: string[] = [];

  if (resources.repos && resources.repos.length > 0) {
    lines.push(`- Repos: ${resources.repos.join(', ')}`);
  } else {
    lines.push(`- Repos: [none]`);
  }

  if (resources.files && resources.files.length > 0) {
    lines.push(`- Files: ${resources.files.join(', ')}`);
  } else {
    lines.push(`- Files: [none]`);
  }

  if (resources.accounts && resources.accounts.length > 0) {
    lines.push(`- Accounts: ${resources.accounts.join(', ')}`);
  } else {
    lines.push(`- Accounts: [none]`);
  }

  if (resources.infra && resources.infra.length > 0) {
    lines.push(`- Infra: ${resources.infra.join(', ')}`);
  } else {
    lines.push(`- Infra: [none]`);
  }

  return lines.join('\n');
}

function formatResourcesDetail(resources: {
  repos?: string[];
  files?: string[];
  accounts?: string[];
  infra?: string[];
}): string {
  const lines: string[] = [];

  if (resources.repos && resources.repos.length > 0) {
    lines.push(`Repositories:`);
    resources.repos.forEach(r => lines.push(`  - ${r}`));
  }

  if (resources.files && resources.files.length > 0) {
    lines.push(`Files:`);
    resources.files.forEach(f => lines.push(`  - ${f}`));
  }

  if (resources.accounts && resources.accounts.length > 0) {
    lines.push(`Accounts:`);
    resources.accounts.forEach(a => lines.push(`  - ${a}`));
  }

  if (resources.infra && resources.infra.length > 0) {
    lines.push(`Infrastructure:`);
    resources.infra.forEach(i => lines.push(`  - ${i}`));
  }

  if (lines.length === 0) {
    return '(no resources affected)';
  }

  return lines.join('\n');
}
