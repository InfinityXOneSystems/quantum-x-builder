/**
 * Command Queue Service
 * Manages async command execution with state tracking
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class CommandQueue {
  constructor() {
    this.queuePath = null;
    this.jobs = new Map();
  }

  async init() {
    const workspaceRoot = process.env.WORKSPACE_ROOT || '/workspace';
    this.queuePath = path.join(workspaceRoot, '_OPS/COMMANDS');
    
    try {
      await fs.mkdir(this.queuePath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize command queue directory:', error);
    }

    // Load existing jobs from persistent storage
    await this.loadJobs();
  }

  async loadJobs() {
    try {
      const files = await fs.readdir(this.queuePath);
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const content = await fs.readFile(path.join(this.queuePath, file), 'utf-8');
        const job = JSON.parse(content);
        this.jobs.set(job.id, job);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }

  async enqueue(command) {
    if (!this.queuePath) {
      await this.init();
    }

    const jobId = `cmd-${uuidv4()}`;
    const job = {
      id: jobId,
      command: command.command,
      target: command.target,
      parameters: command.parameters || {},
      requestedBy: command.requestedBy,
      timestamp: command.timestamp || new Date().toISOString(),
      state: 'QUEUED',
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Store job in persistent storage
      const jobFile = path.join(this.queuePath, `${jobId}.json`);
      await fs.writeFile(jobFile, JSON.stringify(job, null, 2));

      // Store in memory
      this.jobs.set(jobId, job);

      return jobId;
    } catch (error) {
      console.error('Failed to enqueue command:', error);
      throw error;
    }
  }

  async getStatus(jobId) {
    if (!this.queuePath) {
      await this.init();
    }

    try {
      // Validate jobId format to prevent path traversal
      if (!jobId || typeof jobId !== 'string' || !/^cmd-[a-f0-9-]+$/i.test(jobId)) {
        throw new Error('Invalid job ID format');
      }

      // Try to get from memory first
      if (this.jobs.has(jobId)) {
        return this.jobs.get(jobId);
      }

      // Try to load from file - use only the filename, not arbitrary paths
      const jobFile = path.join(this.queuePath, `${jobId}.json`);
      
      // Ensure the resolved path is within queuePath
      const resolvedPath = path.resolve(jobFile);
      const resolvedQueue = path.resolve(this.queuePath);
      if (!resolvedPath.startsWith(resolvedQueue + path.sep)) {
        throw new Error('Invalid job file path');
      }
      
      const content = await fs.readFile(jobFile, 'utf-8');
      const job = JSON.parse(content);
      this.jobs.set(jobId, job);
      return job;
    } catch (error) {
      return null;
    }
  }

  async updateStatus(jobId, state, result = null) {
    if (!this.jobs.has(jobId)) {
      return false;
    }

    try {
      const job = this.jobs.get(jobId);
      job.state = state;
      if (result) {
        job.result = result;
      }
      job.updatedAt = new Date().toISOString();

      // Update persistent storage
      const jobFile = path.join(this.queuePath, `${jobId}.json`);
      await fs.writeFile(jobFile, JSON.stringify(job, null, 2));

      return true;
    } catch (error) {
      console.error('Failed to update job status:', error);
      return false;
    }
  }

  async listQueue(state = null) {
    if (!this.queuePath) {
      await this.init();
    }

    try {
      const jobs = Array.from(this.jobs.values());
      if (state) {
        return jobs.filter(j => j.state === state);
      }
      return jobs.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error('Failed to list queue:', error);
      return [];
    }
  }

  async processQueue() {
    const queuedJobs = await this.listQueue('QUEUED');
    
    for (const job of queuedJobs) {
      try {
        await this.updateStatus(job.id, 'IN_PROGRESS');

        // Simulate command execution
        // In production, this would dispatch to appropriate handler
        const result = {
          success: true,
          executedAt: new Date().toISOString(),
          output: `Command ${job.command} executed on ${job.target}`,
        };

        await this.updateStatus(job.id, 'COMPLETED', result);
      } catch (error) {
        await this.updateStatus(job.id, 'FAILED', {
          error: error.message,
        });
      }
    }
  }
}

export const commandQueue = new CommandQueue();
