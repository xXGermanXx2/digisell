import { z } from "zod";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tickets, ticketMessages } from "@db/schema";
import { Errors } from "@contracts/errors";

function generateTicketNumber(): string {
  const prefix = "TKT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const attachmentSchema = z.array(z.object({
  name: z.string().max(255),
  url: z.string().max(500),
  size: z.number().int().optional().default(0),
})).optional();

export const ticketRouter = createRouter({
  // ── Admin: list tickets with search ──────────────────────────────────────
  list: adminQuery
    .input(z.object({
      status: z.enum(["open", "in_progress", "resolved", "closed", "all"]).default("all"),
      priority: z.enum(["low", "medium", "high", "all"]).default("all"),
      category: z.enum(["general", "technical", "billing", "refund", "all"]).default("all"),
      search: z.string().max(255).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const i = input ?? {};
      const conditions = [];

      if (i.status && i.status !== "all") conditions.push(eq(tickets.status, i.status));
      if (i.priority && i.priority !== "all") conditions.push(eq(tickets.priority, i.priority));
      if (i.category && i.category !== "all") conditions.push(eq(tickets.category, i.category));
      if (i.search) {
        conditions.push(or(
          like(tickets.subject, `%${i.search}%`),
          like(tickets.customerEmail, `%${i.search}%`),
          like(tickets.ticketNumber, `%${i.search}%`),
        ));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = ((i.page ?? 1) - 1) * (i.limit ?? 20);

      const [items, countResult] = await Promise.all([
        db.query.tickets.findMany({
          where,
          orderBy: [desc(tickets.updatedAt)],
          limit: i.limit ?? 20,
          offset,
          with: { messages: { orderBy: (m, { desc }) => [desc(m.createdAt)], limit: 1 } },
        }),
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(where),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: i.page ?? 1 };
    }),

  // ── Customer: list own tickets ────────────────────────────────────────────
  listByCustomer: authedQuery
    .input(z.object({
      status: z.enum(["open", "in_progress", "resolved", "closed", "all"]).default("all"),
      search: z.string().max(255).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const i = input ?? {};
      const conditions = [eq(tickets.customerId, ctx.user.id)];
      if (i.status && i.status !== "all") conditions.push(eq(tickets.status, i.status));
      if (i.search) conditions.push(or(like(tickets.subject, `%${i.search}%`), like(tickets.ticketNumber, `%${i.search}%`)));

      const offset = ((i.page ?? 1) - 1) * (i.limit ?? 20);
      const [items, countResult] = await Promise.all([
        db.query.tickets.findMany({
          where: and(...conditions),
          orderBy: [desc(tickets.updatedAt)],
          limit: i.limit ?? 20,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(and(...conditions)),
      ]);

      return { items, total: Number(countResult[0]?.count ?? 0), page: i.page ?? 1 };
    }),

  // ── Get ticket by ID ──────────────────────────────────────────────────────
  getById: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, input.id),
        with: { messages: { orderBy: (m, { asc }) => [asc(m.createdAt)] } },
      });
      if (!ticket) throw Errors.notFound("Ticket nicht gefunden.");
      if (ticket.customerId !== ctx.user.id && ctx.user.role !== "admin") throw Errors.forbidden("Kein Zugriff.");
      return ticket;
    }),

  // ── Create ticket ─────────────────────────────────────────────────────────
  create: authedQuery
    .input(z.object({
      subject: z.string().min(1).max(255),
      category: z.enum(["general", "technical", "billing", "refund"]),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      message: z.string().min(1).max(5000),
      customerEmail: z.string().email(),
      customerId: z.number().int().positive().optional(),
      orderId: z.number().int().positive().optional(),
      attachments: attachmentSchema,
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const ticketNumber = generateTicketNumber();
      const result = await db.insert(tickets).values({
        ticketNumber,
        customerId: input.customerId ?? null,
        customerEmail: input.customerEmail,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        orderId: input.orderId ?? null,
      });
      const ticketId = Number(result[0].insertId);

      await db.insert(ticketMessages).values({
        ticketId,
        senderName: input.customerEmail,
        senderRole: "customer",
        message: input.message,
        attachments: input.attachments ?? null,
      });

      return { ticketId, ticketNumber };
    }),

  // ── Guest create (no auth) ────────────────────────────────────────────────
  createGuest: publicQuery
    .input(z.object({
      subject: z.string().min(1).max(255),
      category: z.enum(["general", "technical", "billing", "refund"]),
      message: z.string().min(1).max(5000),
      customerEmail: z.string().email(),
      customerName: z.string().max(255).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const ticketNumber = generateTicketNumber();
      const result = await db.insert(tickets).values({
        ticketNumber,
        customerEmail: input.customerEmail,
        subject: input.subject,
        category: input.category,
      });
      const ticketId = Number(result[0].insertId);

      await db.insert(ticketMessages).values({
        ticketId,
        senderName: input.customerName ?? input.customerEmail,
        senderRole: "customer",
        message: input.message,
      });

      return { ticketId, ticketNumber };
    }),

  // ── Add message ───────────────────────────────────────────────────────────
  addMessage: authedQuery
    .input(z.object({
      ticketId: z.number().int().positive(),
      message: z.string().min(1).max(5000),
      senderName: z.string().max(255),
      senderRole: z.enum(["customer", "admin", "seller"]).default("customer"),
      senderId: z.number().int().positive().optional(),
      isInternal: z.boolean().default(false),
      attachments: attachmentSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, input.ticketId) });
      if (!ticket) throw Errors.notFound("Ticket nicht gefunden.");
      if (ticket.customerId !== ctx.user.id && ctx.user.role !== "admin") throw Errors.forbidden("Kein Zugriff.");
      if (ticket.status === "closed") throw Errors.badRequest("Ticket ist geschlossen.");

      await db.insert(ticketMessages).values({
        ticketId: input.ticketId,
        senderId: input.senderId ?? null,
        senderName: input.senderName,
        senderRole: input.senderRole,
        message: input.message,
        isInternal: input.isInternal,
        attachments: input.attachments ?? null,
      });

      // Reopen if customer replies to resolved ticket
      if (ticket.status === "resolved" && input.senderRole === "customer") {
        await db.update(tickets).set({ status: "open", updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
      } else {
        await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
      }

      return { success: true };
    }),

  // ── Update status ─────────────────────────────────────────────────────────
  updateStatus: adminQuery
    .input(z.object({
      ticketId: z.number().int().positive(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(tickets).set({ status: input.status, updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
      return { success: true };
    }),

  // ── Update priority ───────────────────────────────────────────────────────
  updatePriority: adminQuery
    .input(z.object({
      ticketId: z.number().int().positive(),
      priority: z.enum(["low", "medium", "high"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(tickets).set({ priority: input.priority, updatedAt: new Date() }).where(eq(tickets.id, input.ticketId));
      return { success: true };
    }),

  // ── Admin stats ───────────────────────────────────────────────────────────
  stats: adminQuery
    .query(async () => {
      const db = getDb();
      const [open, inProgress, resolved, closed, total] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(eq(tickets.status, "open")),
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(eq(tickets.status, "in_progress")),
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(eq(tickets.status, "resolved")),
        db.select({ count: sql<number>`count(*)` }).from(tickets).where(eq(tickets.status, "closed")),
        db.select({ count: sql<number>`count(*)` }).from(tickets),
      ]);
      return {
        open: Number(open[0]?.count ?? 0),
        inProgress: Number(inProgress[0]?.count ?? 0),
        resolved: Number(resolved[0]?.count ?? 0),
        closed: Number(closed[0]?.count ?? 0),
        total: Number(total[0]?.count ?? 0),
      };
    }),
});
