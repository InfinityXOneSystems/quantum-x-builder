# Copilot repository instructions (override for this repo)

This repository instructs the Copilot agent to operate in a way that ensures changes to repository configuration and automation are always made via pull requests and pushed by the agent autonomously, rather than requiring manual local application by contributors.

Policy (applies to repo-scoped copilot tasks)
- When proposing changes to repository files (including CI, tooling, or repository instruction files), the Copilot agent MUST:
  1. Create a new feature branch in this repository (naming convention: `copilot/automerge/<short-description>`).
  2. Commit the proposed changes to that branch.
  3. Push the branch to the repository remote.
  4. Open a pull request against the repository default branch with a clear, descriptive title and body describing:
     - What changed
     - Why it changed
     - How to test and validate
     - Any non-obvious safety constraints (e.g., non-destructive by default)
  5. Mark the PR as WIP/ready according to the repository norms, and include any requested labels used for automation.
- The agent SHOULD NOT instruct maintainers to apply patches locally or perform manual git apply steps as the primary workflow; the PR-based flow is the canonical path.
- If the agent needs additional input (secrets, elevated permissions, or decisions altering policy), it must ask explicitly in the PR or the conversation before pushing.
- The agent must follow existing repository CONTRIBUTING.md or governance files — this instruction augments them only where the repo lacks explicit guidance.

Safety notes
- The Copilot agent must ensure proposed code or automation changes are non-destructive by default. If a change could modify many files, the agent must document the risk clearly in the PR description and keep modifications disabled by default (e.g., codemod transformations commented out).
- The agent must avoid making policy changes that remove human review requirements without explicit human approval.

By confirming below, you authorize the Copilot agent to create a branch, push the change above, and open the PR in this repository following the policy described.
