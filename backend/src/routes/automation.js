/**
 * Enhanced Automation API Routes
 * Provides full GitHub repository/project/org automation capabilities
 */

import { Octokit } from '@octokit/rest';
import { requirePatFor } from '../middleware/pat.js';
import { auditService } from '../services/audit-service.js';

/**
 * Register automation routes
 * @param {object} app - Express app instance
 */
export function registerAutomationRoutes(app) {
  // GitHub API client
  const getOctokit = (req) => {
    const token = req.headers['x-github-token'] || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GitHub token required');
    }
    return new Octokit({ auth: token });
  };

  /**
   * POST /api/automation/branch/create
   * Create a new branch
   */
  app.post(
    '/api/automation/branch/create',
    requirePatFor({ action: 'automation:branch:create', scope: 'repo' }),
    async (req, res) => {
      try {
        const { owner, repo, branch, from = 'main' } = req.body;
        const octokit = getOctokit(req);

        // Get the SHA of the source branch
        const { data: ref } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${from}`,
        });

        // Create new branch
        const { data: newBranch } = await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: ref.object.sha,
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'branch.create',
          resource: `${owner}/${repo}:${branch}`,
          result: 'SUCCESS',
        });

        res.json({
          success: true,
          branch: newBranch,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/automation/pr/create
   * Create a pull request
   */
  app.post(
    '/api/automation/pr/create',
    requirePatFor({ action: 'automation:pr:create', scope: 'repo' }),
    async (req, res) => {
      try {
        const { owner, repo, title, head, base = 'main', body = '', draft = false } = req.body;
        const octokit = getOctokit(req);

        const { data: pr } = await octokit.pulls.create({
          owner,
          repo,
          title,
          head,
          base,
          body,
          draft,
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'pr.create',
          resource: `${owner}/${repo}#${pr.number}`,
          result: 'SUCCESS',
        });

        res.json({
          success: true,
          pr,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/automation/pr/merge
   * Merge a pull request
   */
  app.post(
    '/api/automation/pr/merge',
    requirePatFor({ action: 'automation:pr:merge', scope: 'repo' }),
    async (req, res) => {
      try {
        const { owner, repo, pull_number, merge_method = 'merge' } = req.body;
        const octokit = getOctokit(req);

        const { data: result } = await octokit.pulls.merge({
          owner,
          repo,
          pull_number,
          merge_method,
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'pr.merge',
          resource: `${owner}/${repo}#${pull_number}`,
          result: 'SUCCESS',
        });

        res.json({
          success: true,
          result,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/automation/issue/create
   * Create an issue
   */
  app.post(
    '/api/automation/issue/create',
    requirePatFor({ action: 'automation:issue:create', scope: 'repo' }),
    async (req, res) => {
      try {
        const { owner, repo, title, body = '', labels = [], assignees = [] } = req.body;
        const octokit = getOctokit(req);

        const { data: issue } = await octokit.issues.create({
          owner,
          repo,
          title,
          body,
          labels,
          assignees,
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'issue.create',
          resource: `${owner}/${repo}#${issue.number}`,
          result: 'SUCCESS',
        });

        res.json({
          success: true,
          issue,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/automation/workflow/dispatch
   * Trigger a workflow_dispatch event
   */
  app.post(
    '/api/automation/workflow/dispatch',
    requirePatFor({ action: 'automation:workflow:dispatch', scope: 'actions' }),
    async (req, res) => {
      try {
        const { owner, repo, workflow_id, ref = 'main', inputs = {} } = req.body;
        const octokit = getOctokit(req);

        await octokit.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id,
          ref,
          inputs,
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'workflow.dispatch',
          resource: `${owner}/${repo}:${workflow_id}`,
          result: 'SUCCESS',
        });

        res.json({
          success: true,
          message: 'Workflow dispatched successfully',
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/automation/repository/dispatch
   * Trigger a repository_dispatch event
   */
  app.post(
    '/api/automation/repository/dispatch',
    requirePatFor({ action: 'automation:repository:dispatch', scope: 'actions' }),
    async (req, res) => {
      try {
        const { owner, repo, event_type, client_payload = {} } = req.body;
        const octokit = getOctokit(req);

        await octokit.repos.createDispatchEvent({
          owner,
          repo,
          event_type,
          client_payload,
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'repository.dispatch',
          resource: `${owner}/${repo}:${event_type}`,
          result: 'SUCCESS',
        });

        res.json({
          success: true,
          message: 'Repository dispatch event sent',
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /api/automation/workflows/list
   * List all workflows in a repository
   */
  app.get(
    '/api/automation/workflows/list',
    requirePatFor({ action: 'automation:workflow:read', scope: 'actions' }),
    async (req, res) => {
      try {
        const { owner, repo } = req.query;
        const octokit = getOctokit(req);

        const { data } = await octokit.actions.listRepoWorkflows({
          owner,
          repo,
        });

        res.json({
          success: true,
          workflows: data.workflows,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /api/automation/runs/list
   * List workflow runs
   */
  app.get(
    '/api/automation/runs/list',
    requirePatFor({ action: 'automation:workflow:read', scope: 'actions' }),
    async (req, res) => {
      try {
        const { owner, repo, workflow_id, per_page = 30 } = req.query;
        const octokit = getOctokit(req);

        const { data } = await octokit.actions.listWorkflowRuns({
          owner,
          repo,
          workflow_id,
          per_page: parseInt(per_page),
        });

        res.json({
          success: true,
          runs: data.workflow_runs,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/automation/permissions/update
   * Update repository permissions (admin only)
   */
  app.post(
    '/api/automation/permissions/update',
    requirePatFor({ action: 'automation:permissions:update', scope: 'admin' }),
    async (req, res) => {
      try {
        const { owner, repo, username, permission } = req.body;
        const octokit = getOctokit(req);

        await octokit.repos.addCollaborator({
          owner,
          repo,
          username,
          permission, // 'pull', 'push', 'admin', 'maintain', 'triage'
        });

        await auditService.log({
          timestamp: new Date().toISOString(),
          actor: req.user?.id || 'system',
          action: 'permissions.update',
          resource: `${owner}/${repo}:${username}`,
          result: 'SUCCESS',
          details: { permission },
        });

        res.json({
          success: true,
          message: 'Permissions updated successfully',
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /api/automation/org/billing
   * Get organization billing information (admin only)
   */
  app.get(
    '/api/automation/org/billing',
    requirePatFor({ action: 'automation:org:billing', scope: 'admin' }),
    async (req, res) => {
      try {
        const { org } = req.query;
        const octokit = getOctokit(req);

        const [actions, packages, storage] = await Promise.all([
          octokit.billing.getGithubActionsBillingOrg({ org }),
          octokit.billing.getGithubPackagesBillingOrg({ org }),
          octokit.billing.getSharedStorageBillingOrg({ org }),
        ]);

        res.json({
          success: true,
          billing: {
            actions: actions.data,
            packages: packages.data,
            storage: storage.data,
          },
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  console.log('✓ Automation routes registered');
}
