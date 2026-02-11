# Autonomous Multi-Agent System

This directory contains the autonomous agent system that maintains and improves the repository 24/7.

## Overview

The system consists of four intelligent agents working together:

1. **Autonomous Code Agent** - Runs every 30 minutes
2. **Validation Agent** - Runs hourly + on PR events  
3. **Healing Agent** - Runs every 2 hours
4. **PR Auto-Fix Agent** - Runs every 4 hours

## Agents Description

### Autonomous Code Agent
Automatically applies code formatting and linting fixes to the main codebase.

### Validation Agent
Validates code quality with ESLint, Prettier, TypeScript, and security checks.

### Healing Agent
Attempts to heal validation failures by applying fixes and running tests.

### PR Auto-Fix Agent
**NEW**: Automatically fixes and heals open PRs with no assignee by:
- Finding all unassigned PRs (`is:pr is:open no:assignee`)
- Checking out each PR branch
- Applying auto-fixes (lint, format, security patches)
- Committing and pushing fixes with rollback tokens
- Labeling PRs appropriately
- Creating detailed audit trails

## Rate Limit Protection

- Autonomous: Every 30 minutes (48 runs/day)
- Validation: Hourly (24 runs/day) + on-demand
- Healing: Every 2 hours (12 runs/day)
- PR Auto-Fix: Every 4 hours (6 runs/day)
- Total: ~90 scheduled runs/day (well within free tier)

## Emergency Stop

Create `_OPS/SAFETY/KILL_SWITCH.json` with `{"active": true}` or `{"kill_switch": "ARMED"}` to stop all agents immediately.

## Configuration

Edit `config.json` to customize schedules, auto-merge policies, and thresholds.
