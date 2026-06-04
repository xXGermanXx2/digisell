import { z } from "zod";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { productFiles, downloadLogs, orderItems, orders } from "@db/schema";
import { env } from "./lib/env";
import { Errors } from "@contracts/errors";

function getS3Client(): S3Client | null {
  if (!env.s3AccessKey || !env.s3SecretKey) return null;
  return new S3Client({
    region: env.s3Region,
    endpoint: env.s3Endpoint || undefined,
    credentials: {
      accessKeyId: env.s3AccessKey,
      secretAccessKey: env.s3SecretKey,
    },
  });
}

export const uploadRouter = createRouter({
  // ── get presigned upload URL ──
  getUploadUrl: authedQuery
    .input(z.object({
      filename: z.string().max(255),
      contentType: z.string().max(100),
      folder: z.enum(["products", "avatars", "shop"]).default("products"),
    }))
    .mutation(async ({ input, ctx }) => {
      const s3 = getS3Client();
      if (!s3) {
        // Fallback: return a local upload URL
        return {
          uploadUrl: `/api/upload/local`,
          fileUrl: `/uploads/${input.folder}/${nanoid()}-${input.filename}`,
          method: "local" as const,
        };
      }

      const ext = input.filename.split(".").pop() ?? "bin";
      const key = `${input.folder}/${ctx.user!.id}/${nanoid()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
        ContentType: input.contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const fileUrl = env.s3Endpoint
        ? `${env.s3Endpoint}/${env.s3Bucket}/${key}`
        : `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com/${key}`;

      return { uploadUrl, fileUrl, key, method: "s3" as const };
    }),

  // ── get secure download URL ──
  getDownloadUrl: authedQuery
    .input(z.object({
      orderItemId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Verify ownership
      const item = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, input.orderItemId),
        with: { order: true },
      });

      if (!item || !item.order) throw Errors.notFound("Bestellposition nicht gefunden.");
      if (item.order.customerId !== ctx.user!.id) throw Errors.forbidden("Kein Zugriff.");
      if (!["paid", "completed"].includes(item.order.status)) throw Errors.forbidden("Bestellung nicht abgeschlossen.");

      // Check download limit
      if (item.downloadLimit !== -1 && item.downloadCount >= item.downloadLimit) {
        throw Errors.forbidden("Download-Limit erreicht.");
      }

      const fileUrl = item.fileUrl;
      if (!fileUrl) throw Errors.notFound("Keine Datei verfügbar.");

      // Log download
      await db.insert(downloadLogs).values({
        orderId: item.orderId,
        orderItemId: item.id,
        userId: ctx.user!.id,
        fileUrl,
        ipAddress: ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
        userAgent: ctx.req.headers.get("user-agent") ?? "",
      });

      // Increment download count
      await db.update(orderItems)
        .set({ downloadCount: (item.downloadCount ?? 0) + 1 })
        .where(eq(orderItems.id, item.id));

      // If S3, generate signed URL
      const s3 = getS3Client();
      if (s3 && fileUrl.includes(env.s3Bucket)) {
        const key = fileUrl.split(env.s3Bucket + "/")[1];
        const command = new GetObjectCommand({ Bucket: env.s3Bucket, Key: key });
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        return { url: signedUrl, expiresIn: 300 };
      }

      return { url: fileUrl, expiresIn: null };
    }),

  // ── list product files ──
  listProductFiles: authedQuery
    .input(z.object({ productId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.productFiles.findMany({
        where: eq(productFiles.productId, input.productId),
        orderBy: (f, { asc }) => [asc(f.sortOrder)],
      });
    }),

  // ── add product file ──
  addProductFile: authedQuery
    .input(z.object({
      productId: z.number().int().positive(),
      name: z.string().max(255),
      url: z.string().max(500),
      size: z.string().optional(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(productFiles).values(input);
      return { id: Number(result[0].insertId) };
    }),

  // ── delete product file ──
  deleteProductFile: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const file = await db.query.productFiles.findFirst({ where: eq(productFiles.id, input.id) });
      if (!file) throw Errors.notFound("Datei nicht gefunden.");

      // Delete from S3 if applicable
      const s3 = getS3Client();
      if (s3 && file.url.includes(env.s3Bucket)) {
        const key = file.url.split(env.s3Bucket + "/")[1];
        await s3.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key })).catch(() => {});
      }

      await db.delete(productFiles).where(eq(productFiles.id, input.id));
      return { success: true };
    }),

  // ── download logs (admin) ──
  downloadLogs: adminQuery
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      return db.query.downloadLogs.findMany({
        with: { order: true, user: true },
        orderBy: (l, { desc }) => [desc(l.createdAt)],
        limit: input.limit,
        offset,
      });
    }),
});
