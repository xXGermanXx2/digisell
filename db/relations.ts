import { relations } from "drizzle-orm";
import {
  users, products, categories, orders, orderItems, cartItems,
  reviews, coupons, tickets, ticketMessages, shopSettings, fraudRules,
  licenseKeys, apiKeys, refreshTokens, productVariants, productFiles,
  affiliates, affiliateClicks, affiliateCommissions, affiliatePayouts,
  subscriptions, webhooks, webhookLogs, systemLogs, paymentLogs,
  downloadLogs, deliveryLogs, blocklists, userWarnings,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  reviews: many(reviews),
  tickets: many(tickets),
  apiKeys: many(apiKeys),
  refreshTokens: many(refreshTokens),
  affiliate: one(affiliates, { fields: [users.id], references: [affiliates.userId] }),
  subscriptions: many(subscriptions),
  webhooks: many(webhooks),
  warnings: many(userWarnings, { relationName: "userWarnings" }),
  issuedWarnings: many(userWarnings, { relationName: "adminWarnings" }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  seller: one(users, { fields: [products.sellerId], references: [users.id] }),
  orderItems: many(orderItems),
  reviews: many(reviews),
  licenseKeys: many(licenseKeys),
  variants: many(productVariants),
  files: many(productFiles),
  subscriptions: many(subscriptions),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productFilesRelations = relations(productFiles, ({ one }) => ({
  product: one(products, { fields: [productFiles.productId], references: [products.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, { fields: [orders.customerId], references: [users.id] }),
  items: many(orderItems),
  paymentLogs: many(paymentLogs),
  downloadLogs: many(downloadLogs),
  deliveryLogs: many(deliveryLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
  downloadLogs: many(downloadLogs),
  deliveryLogs: many(deliveryLogs),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const licenseKeysRelations = relations(licenseKeys, ({ one }) => ({
  product: one(products, { fields: [licenseKeys.productId], references: [products.id] }),
  order: one(orders, { fields: [licenseKeys.orderId], references: [orders.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  customer: one(users, { fields: [reviews.customerId], references: [users.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(users, { fields: [tickets.customerId], references: [users.id] }),
  order: one(orders, { fields: [tickets.orderId], references: [orders.id] }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketMessages.ticketId], references: [tickets.id] }),
  sender: one(users, { fields: [ticketMessages.senderId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, { fields: [affiliates.userId], references: [users.id] }),
  clicks: many(affiliateClicks),
  commissions: many(affiliateCommissions),
  payouts: many(affiliatePayouts),
}));

export const affiliateClicksRelations = relations(affiliateClicks, ({ one }) => ({
  affiliate: one(affiliates, { fields: [affiliateClicks.affiliateId], references: [affiliates.id] }),
}));

export const affiliateCommissionsRelations = relations(affiliateCommissions, ({ one }) => ({
  affiliate: one(affiliates, { fields: [affiliateCommissions.affiliateId], references: [affiliates.id] }),
  order: one(orders, { fields: [affiliateCommissions.orderId], references: [orders.id] }),
}));

export const affiliatePayoutsRelations = relations(affiliatePayouts, ({ one }) => ({
  affiliate: one(affiliates, { fields: [affiliatePayouts.affiliateId], references: [affiliates.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  customer: one(users, { fields: [subscriptions.customerId], references: [users.id] }),
  product: one(products, { fields: [subscriptions.productId], references: [products.id] }),
  order: one(orders, { fields: [subscriptions.orderId], references: [orders.id] }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  user: one(users, { fields: [webhooks.userId], references: [users.id] }),
  logs: many(webhookLogs),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  webhook: one(webhooks, { fields: [webhookLogs.webhookId], references: [webhooks.id] }),
}));

export const paymentLogsRelations = relations(paymentLogs, ({ one }) => ({
  order: one(orders, { fields: [paymentLogs.orderId], references: [orders.id] }),
}));

export const downloadLogsRelations = relations(downloadLogs, ({ one }) => ({
  order: one(orders, { fields: [downloadLogs.orderId], references: [orders.id] }),
  orderItem: one(orderItems, { fields: [downloadLogs.orderItemId], references: [orderItems.id] }),
  user: one(users, { fields: [downloadLogs.userId], references: [users.id] }),
}));

export const deliveryLogsRelations = relations(deliveryLogs, ({ one }) => ({
  order: one(orders, { fields: [deliveryLogs.orderId], references: [orders.id] }),
  orderItem: one(orderItems, { fields: [deliveryLogs.orderItemId], references: [orderItems.id] }),
}));

export const blocklistsRelations = relations(blocklists, ({ one }) => ({
  creator: one(users, { fields: [blocklists.createdBy], references: [users.id] }),
}));

export const userWarningsRelations = relations(userWarnings, ({ one }) => ({
  user: one(users, { fields: [userWarnings.userId], references: [users.id], relationName: "userWarnings" }),
  admin: one(users, { fields: [userWarnings.adminId], references: [users.id], relationName: "adminWarnings" }),
}));
