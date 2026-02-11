#!/usr/bin/env node
/**
 * Natural Language Command Router
 * Routes and executes natural language commands for repository operations
 * Supports ChatGPT, Gemini, and GitHub mobile integrations
 */

const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');

// Natural language processing patterns
const COMMAND_PATTERNS = {
  // Branch operations
  createBranch: /create (?:a )?(?:new )?branch (?:called |named )?['"']?([^'"]+)['"']?/i,
  deleteBranch: /delete (?:the )?branch ['"']?([^'"]+)['"']?/i,
  switchBranch: /(?:switch to|checkout) (?:the )?branch ['"']?([^'"]+)['"']?/i,
  
  // Pull request operations
  createPR: /(?:create|open) (?:a )?(?:new )?(?:pull request|pr) from ([^\s]+) to ([^\s]+)(?:(?: with)? (?:title|name)[:\s]+(.+))?/i,
  mergePR: /merge (?:pull request|pr) #?(\d+)/i,
  closePR: /close (?:pull request|pr) #?(\d+)/i,
  
  // Issue operations
  createIssue: /create (?:a )?(?:an )?(?:new )?issue (?:titled |for |about |called )?(.+)/i,
  closeIssue: /close issue #?(\d+)/i,
  reopenIssue: /reopen issue #?(\d+)/i,
  addLabel: /add label ['"']?([^'"]+)['"']? to issue #?(\d+)/i,
  
  // File operations
  updateFile: /update(?: the)? (?:file )?([a-zA-Z0-9\-_\/\.]+)(?: (?:file|with))?/i,
  createFile: /create (?:a )?(?:new )?file ['"']?([^'"]+)['"']?(?: with ['"']?([^'"]+)['"']?)?/i,
  deleteFile: /delete (?:the )?file ['"']?([^'"]+)['"']?/i,
  
  // Workflow operations
  triggerWorkflow: /(?:trigger|run)(?: the)? ([a-zA-Z0-9\-_\.]+) workflow/i,
  enableWorkflow: /enable (?:the )?workflow ['"']?([^'"]+)['"']?/i,
  disableWorkflow: /disable (?:the )?workflow ['"']?([^'"]+)['"']?/i,
  
  // Repository settings
  updateDescription: /update (?:repository|repo) description (?:to )?['"']?([^'"]+)['"']?/i,
  enablePages: /enable (?:github )?pages/i,
  disablePages: /disable (?:github )?pages/i,
  updateTopics: /(?:update|set) (?:repository|repo) topics (?:to )?['"']?([^'"]+)['"']?/i,
  
  // Collaborator management
  addCollaborator: /add (?:collaborator|user) ['"']?([^'"]+)['"']?(?: with ([a-z]+) access)?/i,
  removeCollaborator: /remove (?:collaborator|user) ['"']?([^'"]+)['"']?/i,
  
  // Secret management
  listSecrets: /list (?:repository |repo )?secrets/i,
  
  // Deployment operations
  deploy: /deploy (?:to )?([a-z]+)/i,
};

async function parseCommand(command) {
  console.log(`\n📝 Parsing command: "${command}"\n`);
  
  for (const [type, pattern] of Object.entries(COMMAND_PATTERNS)) {
    const match = command.match(pattern);
    if (match) {
      console.log(`✅ Matched pattern: ${type}`);
      return {
        type,
        params: match.slice(1).filter(p => p !== undefined),
        raw: command
      };
    }
  }
  
  console.log(`⚠️ No specific pattern matched, treating as generic command`);
  return {
    type: 'generic',
    params: [command],
    raw: command
  };
}

async function executeCommand(octokit, context, parsedCommand) {
  const { type, params } = parsedCommand;
  const [owner, repo] = context.repository.split('/');
  
  console.log(`\n🚀 Executing command type: ${type}`);
  console.log(`Parameters: ${JSON.stringify(params)}`);
  
  try {
    switch (type) {
      case 'createBranch':
        return await createBranch(octokit, owner, repo, params[0]);
      
      case 'deleteBranch':
        return await deleteBranch(octokit, owner, repo, params[0]);
      
      case 'createPR':
        return await createPullRequest(octokit, owner, repo, params[0], params[1], params[2]);
      
      case 'mergePR':
        return await mergePullRequest(octokit, owner, repo, parseInt(params[0]));
      
      case 'closePR':
        return await closePullRequest(octokit, owner, repo, parseInt(params[0]));
      
      case 'createIssue':
        return await createIssue(octokit, owner, repo, params[0]);
      
      case 'closeIssue':
        return await closeIssue(octokit, owner, repo, parseInt(params[0]));
      
      case 'reopenIssue':
        return await reopenIssue(octokit, owner, repo, parseInt(params[0]));
      
      case 'addLabel':
        return await addLabel(octokit, owner, repo, parseInt(params[1]), params[0]);
      
      case 'updateFile':
        return await updateFile(octokit, owner, repo, params[0], params[1]);
      
      case 'createFile':
        return await createFile(octokit, owner, repo, params[0], params[1]);
      
      case 'deleteFile':
        return await deleteFile(octokit, owner, repo, params[0]);
      
      case 'triggerWorkflow':
        return await triggerWorkflow(octokit, owner, repo, params[0]);
      
      case 'enableWorkflow':
        return await enableWorkflow(octokit, owner, repo, params[0]);
      
      case 'disableWorkflow':
        return await disableWorkflow(octokit, owner, repo, params[0]);
      
      case 'updateDescription':
        return await updateDescription(octokit, owner, repo, params[0]);
      
      case 'enablePages':
        return await enablePages(octokit, owner, repo);
      
      case 'updateTopics':
        return await updateTopics(octokit, owner, repo, params[0].split(',').map(t => t.trim()));
      
      case 'addCollaborator':
        return await addCollaborator(octokit, owner, repo, params[0], params[1] || 'write');
      
      case 'removeCollaborator':
        return await removeCollaborator(octokit, owner, repo, params[0]);
      
      case 'listSecrets':
        return await listSecrets(octokit, owner, repo);
      
      case 'deploy':
        return await deploy(octokit, owner, repo, params[0]);
      
      case 'generic':
        return await handleGenericCommand(parsedCommand.raw);
      
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  } catch (error) {
    console.error(`❌ Error executing command: ${error.message}`);
    throw error;
  }
}

// Command implementations
async function createBranch(octokit, owner, repo, branchName) {
  console.log(`Creating branch: ${branchName}`);
  
  // Get default branch SHA
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main'
  });
  
  const sha = refData.object.sha;
  
  // Create new branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha
  });
  
  console.log(`✅ Branch '${branchName}' created successfully`);
  return { success: true, message: `Branch '${branchName}' created`, branch: branchName };
}

async function deleteBranch(octokit, owner, repo, branchName) {
  console.log(`Deleting branch: ${branchName}`);
  
  await octokit.rest.git.deleteRef({
    owner,
    repo,
    ref: `heads/${branchName}`
  });
  
  console.log(`✅ Branch '${branchName}' deleted successfully`);
  return { success: true, message: `Branch '${branchName}' deleted` };
}

async function createPullRequest(octokit, owner, repo, head, base, title) {
  console.log(`Creating PR: ${head} -> ${base}`);
  
  const prTitle = title || `Merge ${head} into ${base}`;
  
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: prTitle,
    head,
    base,
    body: `Pull request created via Natural Language Command Interface`
  });
  
  console.log(`✅ Pull request #${pr.number} created successfully`);
  return { success: true, message: `PR #${pr.number} created`, pr_number: pr.number, url: pr.html_url };
}

async function mergePullRequest(octokit, owner, repo, prNumber) {
  console.log(`Merging PR #${prNumber}`);
  
  await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: 'merge'
  });
  
  console.log(`✅ Pull request #${prNumber} merged successfully`);
  return { success: true, message: `PR #${prNumber} merged` };
}

async function closePullRequest(octokit, owner, repo, prNumber) {
  console.log(`Closing PR #${prNumber}`);
  
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    state: 'closed'
  });
  
  console.log(`✅ Pull request #${prNumber} closed successfully`);
  return { success: true, message: `PR #${prNumber} closed` };
}

async function createIssue(octokit, owner, repo, title) {
  console.log(`Creating issue: ${title}`);
  
  const { data: issue } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body: 'Issue created via Natural Language Command Interface'
  });
  
  console.log(`✅ Issue #${issue.number} created successfully`);
  return { success: true, message: `Issue #${issue.number} created`, issue_number: issue.number, url: issue.html_url };
}

async function closeIssue(octokit, owner, repo, issueNumber) {
  console.log(`Closing issue #${issueNumber}`);
  
  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed'
  });
  
  console.log(`✅ Issue #${issueNumber} closed successfully`);
  return { success: true, message: `Issue #${issueNumber} closed` };
}

async function reopenIssue(octokit, owner, repo, issueNumber) {
  console.log(`Reopening issue #${issueNumber}`);
  
  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'open'
  });
  
  console.log(`✅ Issue #${issueNumber} reopened successfully`);
  return { success: true, message: `Issue #${issueNumber} reopened` };
}

async function addLabel(octokit, owner, repo, issueNumber, label) {
  console.log(`Adding label '${label}' to issue #${issueNumber}`);
  
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: [label]
  });
  
  console.log(`✅ Label '${label}' added to issue #${issueNumber}`);
  return { success: true, message: `Label '${label}' added to issue #${issueNumber}` };
}

async function updateFile(octokit, owner, repo, path, content) {
  console.log(`Updating file: ${path}`);
  
  // Get current file to get its SHA
  let fileSha;
  try {
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });
    fileSha = fileData.sha;
  } catch (error) {
    throw new Error(`File not found: ${path}`);
  }
  
  const contentBase64 = Buffer.from(content || '# Updated via NL Command').toString('base64');
  
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `Update ${path} via Natural Language Command`,
    content: contentBase64,
    sha: fileSha
  });
  
  console.log(`✅ File '${path}' updated successfully`);
  return { success: true, message: `File '${path}' updated` };
}

async function createFile(octokit, owner, repo, path, content) {
  console.log(`Creating file: ${path}`);
  
  const contentBase64 = Buffer.from(content || '# Created via NL Command').toString('base64');
  
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `Create ${path} via Natural Language Command`,
    content: contentBase64
  });
  
  console.log(`✅ File '${path}' created successfully`);
  return { success: true, message: `File '${path}' created` };
}

async function deleteFile(octokit, owner, repo, path) {
  console.log(`Deleting file: ${path}`);
  
  // Get current file to get its SHA
  const { data: fileData } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path
  });
  
  await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message: `Delete ${path} via Natural Language Command`,
    sha: fileData.sha
  });
  
  console.log(`✅ File '${path}' deleted successfully`);
  return { success: true, message: `File '${path}' deleted` };
}

async function triggerWorkflow(octokit, owner, repo, workflowId) {
  console.log(`Triggering workflow: ${workflowId}`);
  
  await octokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id: workflowId,
    ref: 'main'
  });
  
  console.log(`✅ Workflow '${workflowId}' triggered successfully`);
  return { success: true, message: `Workflow '${workflowId}' triggered` };
}

async function enableWorkflow(octokit, owner, repo, workflowId) {
  console.log(`Enabling workflow: ${workflowId}`);
  
  await octokit.rest.actions.enableWorkflow({
    owner,
    repo,
    workflow_id: workflowId
  });
  
  console.log(`✅ Workflow '${workflowId}' enabled successfully`);
  return { success: true, message: `Workflow '${workflowId}' enabled` };
}

async function disableWorkflow(octokit, owner, repo, workflowId) {
  console.log(`Disabling workflow: ${workflowId}`);
  
  await octokit.rest.actions.disableWorkflow({
    owner,
    repo,
    workflow_id: workflowId
  });
  
  console.log(`✅ Workflow '${workflowId}' disabled successfully`);
  return { success: true, message: `Workflow '${workflowId}' disabled` };
}

async function updateDescription(octokit, owner, repo, description) {
  console.log(`Updating repository description: ${description}`);
  
  await octokit.rest.repos.update({
    owner,
    repo,
    description
  });
  
  console.log(`✅ Repository description updated successfully`);
  return { success: true, message: 'Repository description updated' };
}

async function enablePages(octokit, owner, repo) {
  console.log(`Enabling GitHub Pages`);
  
  try {
    await octokit.rest.repos.createPagesSite({
      owner,
      repo,
      source: {
        branch: 'main',
        path: '/docs'
      }
    });
    console.log(`✅ GitHub Pages enabled successfully`);
    return { success: true, message: 'GitHub Pages enabled' };
  } catch (error) {
    if (error.status === 409) {
      console.log(`⚠️ GitHub Pages already enabled`);
      return { success: true, message: 'GitHub Pages already enabled' };
    }
    throw error;
  }
}

async function updateTopics(octokit, owner, repo, topics) {
  console.log(`Updating repository topics: ${topics.join(', ')}`);
  
  await octokit.rest.repos.replaceAllTopics({
    owner,
    repo,
    names: topics
  });
  
  console.log(`✅ Repository topics updated successfully`);
  return { success: true, message: 'Repository topics updated', topics };
}

async function addCollaborator(octokit, owner, repo, username, permission) {
  console.log(`Adding collaborator: ${username} with ${permission} access`);
  
  await octokit.rest.repos.addCollaborator({
    owner,
    repo,
    username,
    permission
  });
  
  console.log(`✅ Collaborator '${username}' added successfully`);
  return { success: true, message: `Collaborator '${username}' added with ${permission} access` };
}

async function removeCollaborator(octokit, owner, repo, username) {
  console.log(`Removing collaborator: ${username}`);
  
  await octokit.rest.repos.removeCollaborator({
    owner,
    repo,
    username
  });
  
  console.log(`✅ Collaborator '${username}' removed successfully`);
  return { success: true, message: `Collaborator '${username}' removed` };
}

async function listSecrets(octokit, owner, repo) {
  console.log(`Listing repository secrets`);
  
  const { data } = await octokit.rest.actions.listRepoSecrets({
    owner,
    repo
  });
  
  const secretNames = data.secrets.map(s => s.name);
  console.log(`✅ Found ${secretNames.length} secrets`);
  return { success: true, message: `Found ${secretNames.length} secrets`, secrets: secretNames };
}

async function deploy(octokit, owner, repo, environment) {
  console.log(`Deploying to: ${environment}`);
  
  const { data: deployment } = await octokit.rest.repos.createDeployment({
    owner,
    repo,
    ref: 'main',
    environment,
    description: `Deployment to ${environment} via Natural Language Command`,
    auto_merge: false,
    required_contexts: []
  });
  
  console.log(`✅ Deployment created successfully`);
  return { success: true, message: `Deployment to ${environment} initiated`, deployment_id: deployment.id };
}

async function handleGenericCommand(command) {
  console.log(`⚠️ Generic command handling not yet implemented: ${command}`);
  return {
    success: false,
    message: `Command not recognized. Please use a more specific command format.`,
    suggestion: 'Try commands like: "create a branch called feature/new", "open a PR from develop to main", "create an issue for bug tracking"'
  };
}

// Main execution
async function main() {
  try {
    const command = process.env.COMMAND;
    const source = process.env.SOURCE || 'manual';
    const userId = process.env.USER_ID || 'system';
    const repository = process.env.REPOSITORY;
    
    if (!command) {
      throw new Error('No command provided');
    }
    
    if (!repository) {
      throw new Error('No repository specified');
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 Natural Language Command Router`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Command: ${command}`);
    console.log(`Source: ${source}`);
    console.log(`User: ${userId}`);
    console.log(`Repository: ${repository}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Initialize Octokit
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not found');
    }
    
    const octokit = new Octokit({ auth: token });
    
    // Parse command
    const parsedCommand = await parseCommand(command);
    
    // Execute command
    const result = await executeCommand(octokit, { repository }, parsedCommand);
    
    // Output result
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Command executed successfully`);
    console.log(`${'='.repeat(60)}`);
    console.log(JSON.stringify(result, null, 2));
    console.log(`${'='.repeat(60)}\n`);
    
    // Set outputs if running in GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const fs = require('fs');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `result=${JSON.stringify(result)}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `success=true\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    
    // Set outputs if running in GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const fs = require('fs');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `error=${error.message}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `success=false\n`);
    }
    
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { parseCommand, executeCommand };
