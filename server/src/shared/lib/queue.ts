// @ts-nocheck
/**
 * Background Job Queue
 * 
 * BullMQ-based job queue for background processing.
 * 
 * @module shared/lib/queue
 */

import Queue, { Queue as QueueType, Job, Worker, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';

/**
 * Queue configuration
 */
interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

/**
 * Job types
 */
export type JobType = 
  | 'send_email'
  | 'generate_contract'
  | 'process_invoice'
  | 'send_notification'
  | 'sync_influencer_data'
  | 'cleanup_expired_sessions'
  | 'generate_analytics_report';

/**
 * Job data interfaces
 */
export interface SendEmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface GenerateContractJobData {
  collaborationId: string;
  userId: string;
  format: 'pdf' | 'docx';
}

export interface ProcessInvoiceJobData {
  invoiceId: string;
  action: 'generate' | 'send' | 'mark_paid';
}

export interface SendNotificationJobData {
  userId: string;
  type: 'push' | 'email' | 'in_app';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface SyncInfluencerDataJobData {
  userId: string;
  platforms: string[];
  forceRefresh: boolean;
}

export interface CleanupJobData {
  olderThan: string; // ISO date string
  batchSize: number;
}

export interface AnalyticsReportJobData {
  reportId: string;
  userId: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
}

/**
 * All job data types
 */
export type JobData = 
  | SendEmailJobData
  | GenerateContractJobData
  | ProcessInvoiceJobData
  | SendNotificationJobData
  | SyncInfluencerDataJobData
  | CleanupJobData
  | AnalyticsReportJobData;

/**
 * Job result interface
 */
export interface JobResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Queue manager class
 */
export class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, QueueType> = new Map();
  private workers: Map<string, Worker> = new Map();
  private connection: Redis;
  private config: QueueConfig;

  private constructor(config: QueueConfig) {
    this.config = config;
    this.connection = new Redis({
      host: config.connection.host,
      port: config.connection.port,
      password: config.connection.password,
      db: config.connection.db || 0,
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: QueueConfig): QueueManager {
    if (!QueueManager.instance) {
      const defaultConfig: QueueConfig = config || {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      };
      QueueManager.instance = new QueueManager(defaultConfig);
    }
    return QueueManager.instance;
  }

  /**
   * Get or create a queue
   */
  getQueue(name: string): QueueType {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: this.config.defaultJobOptions,
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  /**
   * Add a job to a queue
   */
  async addJob(
    queueName: string,
    jobName: string,
    data: JobData,
    options?: {
      priority?: number;
      delay?: number;
      jobId?: string;
    }
  ): Promise<Job> {
    const queue = this.getQueue(queueName);
    return queue.add(jobName, data, options);
  }

  /**
   * Register a worker for a queue
   */
  registerWorker(
    queueName: string,
    processor: (job: Job) => Promise<JobResult>,
    options?: WorkerOptions
  ): Worker {
    if (this.workers.has(queueName)) {
      console.warn(`Worker for queue "${queueName}" already exists. Skipping registration.`);
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(queueName, processor, {
      connection: this.connection,
      ...options,
    });

    worker.on('completed', (job: Job, result: JobResult) => {
      console.log(`Job ${job.id} completed with result:`, result);
    });

    worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Job ${job?.id} failed:`, error);
    });

    worker.on('error', (error: Error) => {
      console.error('Worker error:', error);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Close all queues and workers
   */
  async close(): Promise<void> {
    // Close all workers first
    for (const [name, worker] of this.workers) {
      await worker.close();
      console.log(`Worker "${name}" closed`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      console.log(`Queue "${name}" closed`);
    }

    // Close Redis connection
    await this.connection.quit();
    console.log('Redis connection closed');
  }
}

/**
 * Predefined queue names
 */
export const QUEUES = {
  EMAIL: 'email',
  CONTRACTS: 'contracts',
  INVOICES: 'invoices',
  NOTIFICATIONS: 'notifications',
  SYNC: 'sync',
  CLEANUP: 'cleanup',
  ANALYTICS: 'analytics',
} as const;

/**
 * Helper function to add email job
 */
export async function queueEmail(data: SendEmailJobData): Promise<Job> {
  const manager = QueueManager.getInstance();
  return manager.addJob(QUEUES.EMAIL, 'send', data);
}

/**
 * Helper function to add contract generation job
 */
export async function queueContractGeneration(data: GenerateContractJobData): Promise<Job> {
  const manager = QueueManager.getInstance();
  return manager.addJob(QUEUES.CONTRACTS, 'generate', data);
}

/**
 * Helper function to add invoice processing job
 */
export async function queueInvoiceProcessing(data: ProcessInvoiceJobData): Promise<Job> {
  const manager = QueueManager.getInstance();
  return manager.addJob(QUEUES.INVOICES, 'process', data);
}

/**
 * Helper function to add notification job
 */
export async function queueNotification(data: SendNotificationJobData): Promise<Job> {
  const manager = QueueManager.getInstance();
  return manager.addJob(QUEUES.NOTIFICATIONS, 'send', data);
}

export default QueueManager;
