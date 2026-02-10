#!/usr/bin/env node

/**
 * Disable GitHub Actions Workflows - Except quantum-x-builder
 * 
 * This script disables GitHub Actions workflows for all repositories 
 * in your GitHub account EXCEPT for quantum-x-builder.
 * 
 * Requirements:
 *   - Node.js 16+
 *   - GitHub Personal Access Token with 'repo' and 'workflow' scopes
 *   - No external dependencies required (uses Node.js built-ins)
 * 
 * Usage:
 *   # Dry run (preview what will be changed)
 *   node scripts/disable-workflows-except-qxb.js --dry-run
 * 
 *   # Interactive mode (confirm each repository)
 *   node scripts/disable-workflows-except-qxb.js --interactive
 * 
 *   # Automatic mode (disable all except quantum-x-builder)
 *   node scripts/disable-workflows-except-qxb.js --auto
 * 
 *   # Specify owner/org
 *   node scripts/disable-workflows-except-qxb.js --owner InfinityXOneSystems --auto
 * 
 * Environment Variables:
 *   GITHUB_TOKEN - GitHub Personal Access Token (required)
 *   GITHUB_OWNER - Default owner/org (optional, defaults to authenticated user)
 */

const https = require('https');
const readline = require('readline');

// Configuration
const EXCLUDED_REPOS = ['quantum-x-builder']; // Repository names (lowercase) to protect
const API_BASE = 'api.github.com';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

// Parse command line arguments
function parseArgs() {
  const args = {
    dryRun: false,
    interactive: false,
    auto: false,
    owner: process.env.GITHUB_OWNER || null,
    token: process.env.GITHUB_TOKEN || null,
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--dry-run' || arg === '-d') {
      args.dryRun = true;
    } else if (arg === '--interactive' || arg === '-i') {
      args.interactive = true;
    } else if (arg === '--auto' || arg === '-a') {
      args.auto = true;
    } else if (arg === '--owner' || arg === '-o') {
      args.owner = process.argv[++i];
    } else if (arg === '--token' || arg === '-t') {
      args.token = process.argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  // Default to dry-run if no mode specified
  if (!args.dryRun && !args.interactive && !args.auto) {
    args.dryRun = true;
    console.log(colorize('\n⚠️  No mode specified, defaulting to --dry-run\n', 'yellow'));
  }

  return args;
}

function printHelp() {
  console.log(`
${colorize('Disable GitHub Actions Workflows - Except quantum-x-builder', 'cyan')}

${colorize('Usage:', 'blue')}
  node scripts/disable-workflows-except-qxb.js [OPTIONS]

${colorize('Options:', 'blue')}
  --dry-run, -d        Preview changes without applying them (default)
  --interactive, -i    Confirm each repository before disabling
  --auto, -a          Automatically disable all (except quantum-x-builder)
  --owner, -o <name>   Specify GitHub owner/organization
  --token, -t <token>  GitHub Personal Access Token
  --help, -h          Show this help message

${colorize('Environment Variables:', 'blue')}
  GITHUB_TOKEN        GitHub Personal Access Token (required)
  GITHUB_OWNER        Default owner/organization

${colorize('Examples:', 'blue')}
  # Preview what will be changed
  GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --dry-run

  # Interactive mode - confirm each repo
  GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --interactive

  # Automatic mode - disable everything except quantum-x-builder
  GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --auto

  # Specify organization
  GITHUB_TOKEN=ghp_xxx node scripts/disable-workflows-except-qxb.js --owner InfinityXOneSystems --auto
`);
}

// Make GitHub API request
function githubRequest(path, method = 'GET', data = null, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: path,
      method: method,
      headers: {
        'User-Agent': 'quantum-x-builder-workflow-script/1.0',
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${parsed.message || body}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Get authenticated user info
async function getAuthenticatedUser(token) {
  return await githubRequest('/user', 'GET', null, token);
}

// List all repositories for user/org
async function listRepositories(owner, token) {
  console.log(colorize(`\n📋 Fetching repositories for: ${owner}...`, 'blue'));
  
  let allRepos = [];
  let page = 1;
  let hasMore = true;

  // Try organizations endpoint first, fall back to user endpoint
  let useOrgEndpoint = true;

  while (hasMore) {
    let path;
    if (useOrgEndpoint) {
      path = `/orgs/${owner}/repos?per_page=100&page=${page}`;
    } else {
      path = `/users/${owner}/repos?per_page=100&page=${page}`;
    }
    
    try {
      const repos = await githubRequest(path, 'GET', null, token);
      
      if (repos.length === 0) {
        hasMore = false;
      } else {
        allRepos = allRepos.concat(repos);
        page++;
      }
    } catch (err) {
      // If org endpoint fails with 404, try user endpoint
      if (useOrgEndpoint && err.message.includes('404')) {
        console.log(colorize(`  ℹ️  Not an organization, trying user endpoint...`, 'cyan'));
        useOrgEndpoint = false;
        page = 1;
        continue;
      }
      throw err;
    }
  }

  console.log(colorize(`✅ Found ${allRepos.length} repositories\n`, 'green'));
  return allRepos;
}

// Check if Actions is enabled for a repository
async function isActionsEnabled(owner, repo, token) {
  try {
    const result = await githubRequest(
      `/repos/${owner}/${repo}/actions/permissions`,
      'GET',
      null,
      token
    );
    return result.enabled === true;
  } catch (err) {
    // If we get a 404, Actions might not be configured
    if (err.message.includes('404')) {
      return false;
    }
    throw err;
  }
}

// Disable GitHub Actions for a repository
async function disableActions(owner, repo, token, dryRun = false) {
  if (dryRun) {
    console.log(colorize(`  [DRY RUN] Would disable Actions for: ${owner}/${repo}`, 'yellow'));
    return true;
  }

  try {
    await githubRequest(
      `/repos/${owner}/${repo}/actions/permissions`,
      'PUT',
      { enabled: false },
      token
    );
    console.log(colorize(`  ✅ Disabled Actions for: ${owner}/${repo}`, 'green'));
    return true;
  } catch (err) {
    console.error(colorize(`  ❌ Failed to disable Actions for ${owner}/${repo}: ${err.message}`, 'red'));
    return false;
  }
}

// Ask user for confirmation
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
    });
  });
}

// Main execution
async function main() {
  console.log(colorize('\n╔════════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║   Disable GitHub Actions - Except quantum-x-builder          ║', 'cyan'));
  console.log(colorize('╚════════════════════════════════════════════════════════════════╝\n', 'cyan'));

  const args = parseArgs();

  // Validate token
  if (!args.token) {
    console.error(colorize('❌ Error: GITHUB_TOKEN environment variable or --token argument required', 'red'));
    console.log(colorize('\nGet a token at: https://github.com/settings/tokens', 'blue'));
    console.log(colorize('Required scopes: repo, workflow\n', 'blue'));
    process.exit(1);
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(args.token);
    const owner = args.owner || user.login;
    
    console.log(colorize(`🔐 Authenticated as: ${user.login}`, 'green'));
    console.log(colorize(`📁 Target owner: ${owner}`, 'blue'));
    console.log(colorize(`🛡️  Protected repository: quantum-x-builder`, 'green'));
    console.log(colorize(`⚙️  Mode: ${args.dryRun ? 'DRY RUN' : args.interactive ? 'INTERACTIVE' : 'AUTO'}`, 'yellow'));

    // List all repositories
    const repos = await listRepositories(owner, args.token);

    // Filter out excluded repositories
    const targetRepos = repos.filter(repo => 
      !EXCLUDED_REPOS.includes(repo.name.toLowerCase())
    );

    const excludedRepos = repos.filter(repo => 
      EXCLUDED_REPOS.includes(repo.name.toLowerCase())
    );

    console.log(colorize(`\n📊 Repository Summary:`, 'blue'));
    console.log(colorize(`   Total repositories: ${repos.length}`, 'blue'));
    console.log(colorize(`   Protected (excluded): ${excludedRepos.length}`, 'green'));
    console.log(colorize(`   Will be processed: ${targetRepos.length}`, 'yellow'));

    if (excludedRepos.length > 0) {
      console.log(colorize(`\n🛡️  Protected repositories (Actions will remain enabled):`, 'green'));
      excludedRepos.forEach(repo => {
        console.log(colorize(`   ✓ ${repo.full_name}`, 'green'));
      });
    }

    if (targetRepos.length === 0) {
      console.log(colorize('\n✅ No repositories to process. All done!\n', 'green'));
      return;
    }

    // Check which repos have Actions enabled
    console.log(colorize(`\n🔍 Checking which repositories have Actions enabled...`, 'blue'));
    const reposWithActions = [];
    
    for (const repo of targetRepos) {
      try {
        const enabled = await isActionsEnabled(owner, repo.name, args.token);
        if (enabled) {
          reposWithActions.push(repo);
          console.log(colorize(`   • ${repo.full_name} - Actions ENABLED`, 'yellow'));
        } else {
          console.log(colorize(`   • ${repo.full_name} - Actions already disabled`, 'cyan'));
        }
      } catch (err) {
        console.error(colorize(`   • ${repo.full_name} - Error checking status: ${err.message}`, 'red'));
      }
    }

    if (reposWithActions.length === 0) {
      console.log(colorize('\n✅ No repositories have Actions enabled. Nothing to do!\n', 'green'));
      return;
    }

    console.log(colorize(`\n📋 Found ${reposWithActions.length} repositories with Actions enabled`, 'yellow'));

    // Confirm before proceeding (unless dry-run or auto)
    if (!args.dryRun && !args.auto) {
      const proceed = await askConfirmation(
        colorize('\n⚠️  Continue with disabling Actions? (y/N): ', 'yellow')
      );
      if (!proceed) {
        console.log(colorize('\n❌ Aborted by user\n', 'red'));
        return;
      }
    }

    // Process repositories
    console.log(colorize(`\n🔧 Processing repositories...`, 'blue'));
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const repo of reposWithActions) {
      if (args.interactive && !args.dryRun) {
        const confirm = await askConfirmation(
          colorize(`\n  Disable Actions for ${repo.full_name}? (y/N): `, 'yellow')
        );
        if (!confirm) {
          console.log(colorize(`  ⏭️  Skipped: ${repo.full_name}`, 'cyan'));
          skippedCount++;
          continue;
        }
      }

      const success = await disableActions(owner, repo.name, args.token, args.dryRun);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Rate limiting - be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log(colorize('\n╔════════════════════════════════════════════════════════════════╗', 'cyan'));
    console.log(colorize('║                    Operation Summary                          ║', 'cyan'));
    console.log(colorize('╚════════════════════════════════════════════════════════════════╝', 'cyan'));
    console.log(colorize(`\n📊 Results:`, 'blue'));
    console.log(colorize(`   ${args.dryRun ? 'Would disable' : 'Disabled'}: ${successCount}`, 'green'));
    if (failedCount > 0) {
      console.log(colorize(`   Failed: ${failedCount}`, 'red'));
    }
    if (skippedCount > 0) {
      console.log(colorize(`   Skipped: ${skippedCount}`, 'cyan'));
    }
    console.log(colorize(`   Protected: ${excludedRepos.length} (quantum-x-builder)`, 'green'));

    if (args.dryRun) {
      console.log(colorize('\n💡 This was a dry run. Use --auto or --interactive to apply changes.\n', 'yellow'));
    } else {
      console.log(colorize('\n✅ Operation completed successfully!\n', 'green'));
    }

  } catch (err) {
    console.error(colorize(`\n❌ Error: ${err.message}\n`, 'red'));
    console.error(err.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error(colorize(`\n❌ Unhandled error: ${err.message}\n`, 'red'));
    process.exit(1);
  });
}

module.exports = { main };
