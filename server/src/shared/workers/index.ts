/**
 * Job Processors
 * 
 * Worker processors for background jobs.
 * 
 * @module shared/workers
 */

import { Job } from 'bullmq';
import { JobResult, SendEmailJobData, GenerateContractJobData, ProcessInvoiceJobData, SendNotificationJobData } from '../lib/queue';

/**
 * Email job processor
 */
export async function processEmailJob(job: Job<SendEmailJobData>): Promise<JobResult> {
  const { to, subject, template, data, attachments } = job.data;
  
  try {
    // Import email service dynamically to avoid circular dependencies
    const { sendEmail } = await import('./emailWorker');
    
    const result = await sendEmail({
      to,
      subject,
      template,
      data,
      attachments,
    });
    
    return {
      success: true,
      data: { messageId: result.messageId },
    };
  } catch (error: any) {
    console.error('Email job failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Contract generation job processor
 */
export async function processContractJob(job: Job<GenerateContractJobData>): Promise<JobResult> {
  const { collaborationId, userId, format } = job.data;
  
  try {
    // Import contract service dynamically
    const { generateContract } = await import('./contractWorker');
    
    const result = await generateContract({
      collaborationId,
      userId,
      format,
    });
    
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Contract generation job failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Invoice processing job processor
 */
export async function processInvoiceJob(job: Job<ProcessInvoiceJobData>): Promise<JobResult> {
  const { invoiceId, action } = job.data;
  
  try {
    // Import invoice service dynamically
    const { processInvoice } = await import('./invoiceWorker');
    
    const result = await processInvoice({
      invoiceId,
      action,
    });
    
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Invoice processing job failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Notification job processor
 */
export async function processNotificationJob(job: Job<SendNotificationJobData>): Promise<JobResult> {
  const { userId, type, title, message, data } = job.data;
  
  try {
    // Import notification service dynamically
    const { sendNotification } = await import('./notificationWorker');
    
    const result = await sendNotification({
      userId,
      type,
      title,
      message,
      data,
    });
    
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Notification job failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Initialize all workers
 */
export async function initializeWorkers(): Promise<void> {
  const { QueueManager, QUEUES } = await import('../lib/queue');
  const manager = QueueManager.getInstance();
  
  // Register email worker
  manager.registerWorker(QUEUES.EMAIL, processEmailJob, {
    concurrency: 5,
  });
  
  // Register contract worker
  manager.registerWorker(QUEUES.CONTRACTS, processContractJob, {
    concurrency: 2,
  });
  
  // Register invoice worker
  manager.registerWorker(QUEUES.INVOICES, processInvoiceJob, {
    concurrency: 3,
  });
  
  // Register notification worker
  manager.registerWorker(QUEUES.NOTIFICATIONS, processNotificationJob, {
    concurrency: 10,
  });
  
  console.log('All workers initialized');
}

export default {
  processEmailJob,
  processContractJob,
  processInvoiceJob,
  processNotificationJob,
  initializeWorkers,
};
