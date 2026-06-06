import { authRouter } from "./auth-router";
import { productRouter } from "./product-router";
import { categoryRouter } from "./category-router";
import { orderRouter } from "./order-router";
import { cartRouter } from "./cart-router";
import { reviewRouter } from "./review-router";
import { couponRouter } from "./coupon-router";
import { ticketRouter } from "./ticket-router";
import { analyticsRouter } from "./analytics-router";
import { settingsRouter } from "./settings-router";
import { fraudRouter } from "./fraud-router";
import { profileRouter } from "./profile-router";
import { affiliateRouter } from "./affiliate-router";
import { subscriptionRouter } from "./subscription-router";
import { webhookRouter } from "./webhook-router";
import { adminRouter } from "./admin-router";
import { uploadRouter } from "./upload-router";
import { invoiceRouter } from "./invoice-router";
import { systemRouter } from "./system-router";
import { sellerRouter } from "./seller-router";
import { creditsRouter } from "./credits-router";
import { favoritesRouter } from "./favorites-router";
import { notificationsRouter } from "./notifications-router";
import { shopBuyerAuthRouter } from "./shop-buyer-auth-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now(), version: "2.0.0" })),
  auth: authRouter,
  product: productRouter,
  category: categoryRouter,
  order: orderRouter,
  cart: cartRouter,
  review: reviewRouter,
  coupon: couponRouter,
  ticket: ticketRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
  fraud: fraudRouter,
  profile: profileRouter,
  affiliate: affiliateRouter,
  subscription: subscriptionRouter,
  webhook: webhookRouter,
  admin: adminRouter,
  upload: uploadRouter,
  invoice: invoiceRouter,
  system: systemRouter,
  seller: sellerRouter,
  credits: creditsRouter,
  favorites: favoritesRouter,
  notifications: notificationsRouter,
  shopBuyerAuth: shopBuyerAuthRouter,
});

export type AppRouter = typeof appRouter;
