// @ts-nocheck
import { supabase } from '../index.js';

export interface PlatformMetrics {
    timeToCreatorSignature: {
        averageHours: number;
        medianHours: number;
        totalSigned: number;
    };
    shipmentToReceipt: {
        averageDays: number;
        totalConfirmed: number;
    };
    remindersEfficiency: {
        totalRemindersSent: number;
        deliverablesSubmittedAfterReminder: number;
        lateSubmissionRateAfterReminder: number;
    };
}

/**
 * Calculate Platform-wide metrics for internal tracking
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
    const metrics: PlatformMetrics = {
        timeToCreatorSignature: { averageHours: 0, medianHours: 0, totalSigned: 0 },
        shipmentToReceipt: { averageDays: 0, totalConfirmed: 0 },
        remindersEfficiency: { totalRemindersSent: 0, deliverablesSubmittedAfterReminder: 0, lateSubmissionRateAfterReminder: 0 }
    };

    try {
        // 1. Time to Creator Signature
        // Strategy: Join BRAND_SIGNED and CREATOR_SIGNED events for the same deal
        const { data: signatureEvents, error: sigError } = await supabase
            .from('deal_action_logs')
            .select('deal_id, event, created_at')
            .in('event', ['BRAND_SIGNED', 'CREATOR_SIGNED'])
            .order('created_at', { ascending: true });

        if (!sigError && signatureEvents) {
            const dealPairs: Record<string, { brandSigned?: Date; creatorSigned?: Date }> = {};

            signatureEvents.forEach(evt => {
                if (!dealPairs[evt.deal_id]) dealPairs[evt.deal_id] = {};
                if (evt.event === 'BRAND_SIGNED') dealPairs[evt.deal_id].brandSigned = new Date(evt.created_at);
                if (evt.event === 'CREATOR_SIGNED') dealPairs[evt.deal_id].creatorSigned = new Date(evt.created_at);
            });

            const deltas: number[] = [];
            Object.values(dealPairs).forEach(pair => {
                if (pair.brandSigned && pair.creatorSigned) {
                    const deltaInHours = (pair.creatorSigned.getTime() - pair.brandSigned.getTime()) / (1000 * 60 * 60);
                    if (deltaInHours > 0) deltas.push(deltaInHours);
                }
            });

            if (deltas.length > 0) {
                metrics.timeToCreatorSignature.averageHours = deltas.reduce((a, b) => a + b, 0) / deltas.length;
                metrics.timeToCreatorSignature.totalSigned = deltas.length;

                const sorted = [...deltas].sort((a, b) => a - b);
                metrics.timeToCreatorSignature.medianHours = sorted[Math.floor(sorted.length / 2)];
            }
        }

        // 2. Time from Shipment to Receipt (Barter)
        const { data: shippingEvents, error: shipError } = await supabase
            .from('deal_action_logs')
            .select('deal_id, event, created_at')
            .in('event', ['shipping_marked_shipped', 'shipping_confirmed_delivered'])
            .order('created_at', { ascending: true });

        if (!shipError && shippingEvents) {
            const dealPairs: Record<string, { shipped?: Date; delivered?: Date }> = {};
            shippingEvents.forEach(evt => {
                if (!dealPairs[evt.deal_id]) dealPairs[evt.deal_id] = {};
                if (evt.event === 'shipping_marked_shipped') dealPairs[evt.deal_id].shipped = new Date(evt.created_at);
                if (evt.event === 'shipping_confirmed_delivered') dealPairs[evt.deal_id].delivered = new Date(evt.created_at);
            });

            const deltas: number[] = [];
            Object.values(dealPairs).forEach(pair => {
                if (pair.shipped && pair.delivered) {
                    const deltaInDays = (pair.delivered.getTime() - pair.shipped.getTime()) / (1000 * 60 * 60 * 24);
                    if (deltaInDays > 0) deltas.push(deltaInDays);
                }
            });

            if (deltas.length > 0) {
                metrics.shipmentToReceipt.averageDays = deltas.reduce((a, b) => a + b, 0) / deltas.length;
                metrics.shipmentToReceipt.totalConfirmed = deltas.length;
            }
        }

        // 3. Efficiency of Reminders
        const { data: reminderEvents, error: remError } = await supabase
            .from('deal_action_logs')
            .select('deal_id, event, created_at')
            .eq('event', 'CREATOR_DELIVERABLE_DUE_REMINDER_SENT');

        if (!remError && reminderEvents) {
            metrics.remindersEfficiency.totalRemindersSent = reminderEvents.length;

            // Check how many of these deals had a submission after the reminder
            // Deliverable submission isn't explicitly logged in deal_action_logs yet, 
            // but 'SIGNED_CONTRACT_UPLOADED' is a proxy for some deals, 
            // however better to track 'CONTENT_SUBMITTED' which we should add.

            // For now, let's just count deals that moved to Content Delivered status after a reminder
            const { data: submissions, error: subError } = await supabase
                .from('brand_deals')
                .select('id, updated_at, status, due_date')
                .in('id', reminderEvents.map(r => r.deal_id));

            if (!subError && submissions) {
                let afterReminder = 0;
                let lateAfterReminder = 0;

                submissions.forEach(deal => {
                    const reminder = reminderEvents.find(r => r.deal_id === deal.id);
                    if (reminder) {
                        const reminderDate = new Date(reminder.created_at);
                        const statusUpper = (deal.status || '').toUpperCase();

                        // If deal reached a terminal delivery state
                        if (statusUpper.includes('DELIVERED') || statusUpper.includes('COMPLETED')) {
                            const updatedDate = new Date(deal.updated_at);
                            if (updatedDate > reminderDate) {
                                afterReminder++;

                                // Was it late relative to its own due_date?
                                if (deal.due_date && updatedDate > new Date(deal.due_date)) {
                                    lateAfterReminder++;
                                }
                            }
                        }
                    }
                });

                metrics.remindersEfficiency.deliverablesSubmittedAfterReminder = afterReminder;
                metrics.remindersEfficiency.lateSubmissionRateAfterReminder =
                    afterReminder > 0 ? (lateAfterReminder / afterReminder) * 100 : 0;
            }
        }

    } catch (err) {
        console.error('[InternalMetrics] Calculation error:', err);
    }

    return metrics;
}
