// @ts-nocheck
import { supabase } from '../lib/supabase.js';

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
    escrow: {
        totalVolumeLocked: number;
        payoutVolumePending: number;
        averageApprovalVelocityHours: number;
        ghostingRate: number;
    };
}

/**
 * Calculate Platform-wide metrics for internal tracking
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
    const metrics: PlatformMetrics = {
        timeToCreatorSignature: { averageHours: 0, medianHours: 0, totalSigned: 0 },
        shipmentToReceipt: { averageDays: 0, totalConfirmed: 0 },
        remindersEfficiency: { totalRemindersSent: 0, deliverablesSubmittedAfterReminder: 0, lateSubmissionRateAfterReminder: 0 },
        escrow: { totalVolumeLocked: 0, payoutVolumePending: 0, averageApprovalVelocityHours: 0, ghostingRate: 0 }
    };

    try {
        // 1. Time to Creator Signature
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

        // 2. Time from Shipment to Receipt
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
                        if (statusUpper.includes('DELIVERED') || statusUpper.includes('COMPLETED')) {
                            const updatedDate = new Date(deal.updated_at);
                            if (updatedDate > reminderDate) {
                                afterReminder++;
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

        // 4. Escrow Health Metrics
        const { data: escrowDeals, error: escrowError } = await supabase
            .from('brand_deals')
            .select('status, deal_amount, updated_at, created_at')
            .not('status', 'in', '("DRAFT", "CANCELLED", "COMPLETED")');

        if (!escrowError && escrowDeals) {
            let tvl = 0;
            let pendingPayout = 0;
            
            escrowDeals.forEach(deal => {
                const status = (deal.status || '').toUpperCase();
                const amount = Number(deal.deal_amount || 0);
                if (['CONTENT_MAKING', 'CONTENT_DELIVERED', 'REVISION_REQUESTED', 'REVISION_DONE', 'CONTENT_APPROVED'].includes(status)) {
                    tvl += amount;
                }
                if (status === 'CONTENT_APPROVED') {
                    pendingPayout += amount;
                }
            });
            metrics.escrow.totalVolumeLocked = tvl;
            metrics.escrow.payoutVolumePending = pendingPayout;
        }

        // 5. Velocity & Ghosting
        const { data: escrowEvents, error: eventError } = await supabase
            .from('deal_action_logs')
            .select('deal_id, event, created_at')
            .in('event', ['PAYMENT_CAPTURED', 'CONTENT_APPROVED', 'CONTENT_DELIVERED'])
            .order('created_at', { ascending: true });

        if (!eventError && escrowEvents) {
            const dealPairs: Record<string, { captured?: Date; approved?: Date; delivered?: Date }> = {};
            escrowEvents.forEach(evt => {
                if (!dealPairs[evt.deal_id]) dealPairs[evt.deal_id] = {};
                if (evt.event === 'PAYMENT_CAPTURED') dealPairs[evt.deal_id].captured = new Date(evt.created_at);
                if (evt.event === 'CONTENT_APPROVED') dealPairs[evt.deal_id].approved = new Date(evt.created_at);
                if (evt.event === 'CONTENT_DELIVERED') dealPairs[evt.deal_id].delivered = new Date(evt.created_at);
            });

            const velocityDeltas: number[] = [];
            let ghostCount = 0;
            let totalDelivered = 0;

            Object.values(dealPairs).forEach(pair => {
                if (pair.captured && pair.approved) {
                    const hours = (pair.approved.getTime() - pair.captured.getTime()) / (1000 * 60 * 60);
                    if (hours > 0) velocityDeltas.push(hours);
                }
                if (pair.delivered) {
                    totalDelivered++;
                    const now = new Date();
                    const hoursSinceDelivery = (now.getTime() - pair.delivered.getTime()) / (1000 * 60 * 60);
                    if (hoursSinceDelivery > 72 && !pair.approved) {
                        ghostCount++;
                    }
                }
            });
            if (velocityDeltas.length > 0) {
                metrics.escrow.averageApprovalVelocityHours = velocityDeltas.reduce((a, b) => a + b, 0) / velocityDeltas.length;
            }
            metrics.escrow.ghostingRate = totalDelivered > 0 ? (ghostCount / totalDelivered) * 100 : 0;
        }

    } catch (err) {
        console.error('[InternalMetrics] Calculation error:', err);
    }

    return metrics;
}
