/**
 * Reminder Email Utilities
 * Sends subscription renewal reminders and pending order reminders
 */

import { sendEmail } from "./email";
import { getDb } from "../queries/connection";
import { subscriptions, orders, users } from "@db/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";

/**
 * Send subscription renewal reminders for subscriptions expiring in the next N days.
 * Should be called by a scheduled job (e.g. daily cron).
 */
export async function sendSubscriptionRenewalReminders(daysAhead = 3): Promise<number> {
  const db = getDb();
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  const expiring = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.status, "active"),
      lte(subscriptions.currentPeriodEnd, future),
      gte(subscriptions.currentPeriodEnd, now),
    ),
    with: {
      customer: true,
      product: true,
    },
  });

  let sent = 0;
  for (const sub of expiring) {
    if (!sub.customer?.email) continue;
    const renewalDate = new Date(sub.currentPeriodEnd).toLocaleDateString("de-DE", {
      year: "numeric", month: "long", day: "numeric",
    });

    try {
      await sendEmail({
        to: sub.customer.email,
        subject: `Ihr Abonnement wird am ${renewalDate} verlängert`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2>Abonnement-Erinnerung</h2>
            <p>Hallo ${sub.customer.name ?? ""},</p>
            <p>Ihr Abonnement für <strong>${sub.product?.name ?? "Ihr Produkt"}</strong> wird am <strong>${renewalDate}</strong> automatisch verlängert.</p>
            <p>Falls Sie das Abonnement nicht verlängern möchten, können Sie es jederzeit in Ihrem Dashboard kündigen.</p>
            <p><a href="${process.env.APP_URL ?? ""}/subscriptions" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Abonnements verwalten</a></p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px;">Diese E-Mail wurde automatisch gesendet.</p>
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`[REMINDER] Failed to send renewal reminder to ${sub.customer.email}:`, err);
    }
  }

  return sent;
}

/**
 * Cancel expired subscriptions that are past their period end.
 * Should be called by a scheduled job.
 */
export async function expireSubscriptions(): Promise<number> {
  const db = getDb();
  const now = new Date();

  const result = await db
    .update(subscriptions)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, now),
        eq(subscriptions.cancelAtPeriodEnd, true),
      )
    );

  return (result[0] as any)?.affectedRows ?? 0;
}

/**
 * Send reminders for orders that have been pending for more than N minutes.
 */
export async function sendPendingOrderReminders(pendingMinutes = 30): Promise<number> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - pendingMinutes);

  const pendingOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.status, "pending"),
      lte(orders.createdAt, cutoff),
    ),
    limit: 50,
  });

  let sent = 0;
  for (const order of pendingOrders) {
    try {
      await sendEmail({
        to: order.customerEmail,
        subject: `Ihre Bestellung ${order.orderNumber} wartet auf Zahlung`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2>Bestellung ausstehend</h2>
            <p>Hallo,</p>
            <p>Ihre Bestellung <strong>${order.orderNumber}</strong> über <strong>${order.currency} ${order.total}</strong> wartet noch auf die Zahlung.</p>
            <p>Bitte schließen Sie die Zahlung ab, um Ihre Produkte zu erhalten.</p>
            <p><a href="${process.env.APP_URL ?? ""}/checkout/complete/${order.orderNumber}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Zahlung abschließen</a></p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px;">Diese Erinnerung wurde automatisch gesendet.</p>
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`[REMINDER] Failed to send order reminder for ${order.orderNumber}:`, err);
    }
  }

  return sent;
}
