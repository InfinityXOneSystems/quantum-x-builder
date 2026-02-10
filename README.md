# Quantum-X-Builder

**Status:** Private / Internal  
**Governance:** PAT (Policy-Authority-Truth)  
**Autonomy:** Enabled (Phase 5 - with active guardrails)  
**Integration:** ✓ Complete (all components identified)

Quantum-X-Builder is a governed, AI-assisted system for orchestrating
code, infrastructure, and validation pipelines using GitHub Apps,
self-hosted runners, and policy-enforced agents.

## Core Guarantees
- No destructive automation
- All write actions are PAT-gated
- Evidence is mandatory
- Autonomy is opt-in and revocable

## Phases
- Phase 3b: Locked (stable)
- Phase 4: Shadow-mode only
- Phase 5: Autonomous implementation (enabled with guardrails)

## System Integration

All components are fully integrated and identify with the system perfectly:

- ✓ **Backend** (quantum-x-builder) - Express API on port 8787
- ✓ **Frontend** (@qvizual-x/frontend) - React app with VSCode extension
- ✓ **Documentation** - Docusaurus v3 site
- ✓ **Messaging** - NATS JetStream broker
- ✓ **Operations** - _OPS governance control plane
- ✓ **Integrations** - Google Calendar, Google Tasks, GitHub, VSCode

### Quick Validation
```bash
./validate-integration.sh
```

### Documentation
- **Integration Guide:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Complete system integration documentation
- **System Manifest:** [SYSTEM_INTEGRATION_MANIFEST.json](SYSTEM_INTEGRATION_MANIFEST.json) - Component registry
- **Architecture:** [docs/SYSTEM_INTEGRATION_ARCHITECTURE.md](docs/SYSTEM_INTEGRATION_ARCHITECTURE.md)
- **Runbook:** [docs/RUNBOOK.md](docs/RUNBOOK.md) - Operational flow

## Automation

### Bulk Dependabot PR Processing

Efficiently process multiple Dependabot PRs (18+ pending PRs):

```bash
# Quick start - merge safe PRs automatically
./scripts/bulk-pr-processor.sh --safe-only
```

**Or via GitHub Actions:**
1. Go to **Actions** → **Bulk Dependabot PR Processor**
2. Click **Run workflow** (set `dry_run: false`, `safe_only: true`)

**Documentation:**
- [Complete Guide](docs/BULK_PR_PROCESSING.md) - Full documentation
- [Quick Reference](docs/BULK_PR_PROCESSING_QUICK_REF.md) - TL;DR cheat sheet
- [Scripts README](scripts/README.md) - All automation scripts

**Features:**
- Auto-merges safe PRs (GitHub Actions, patch/minor updates)
- Labels risky PRs (major version updates) for manual review
- Full audit trails with rollback tokens
- Respects kill-switch and safety guardrails
- Scheduled weekly runs (Mondays 9 AM UTC)
