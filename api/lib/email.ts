import { env } from "./env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

async function getSMTPConfig(): Promise<SMTPConfig | null> {
  // Try env vars first, then DB settings
  if (env.smtpHost && env.smtpUser) {
    return {
      host: env.smtpHost,
      port: env.smtpPort,
      user: env.smtpUser,
      pass: env.smtpPass,
      from: env.smtpFrom || `DigiSell <noreply@digisell.app>`,
    };
  }
  return null;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const config = await getSMTPConfig();
  if (!config) {
    console.warn("[Email] SMTP not configured. Would send:", opts.subject, "to", opts.to);
    return false;
  }

  try {
    // Dynamic import to avoid issues when nodemailer not installed
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) {
      console.warn("[Email] nodemailer not installed");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: config.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

export function emailVerificationTemplate(name: string, token: string, baseUrl: string): string {
  const link = `${baseUrl}/auth/verify-email?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>E-Mail bestätigen</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f1f5f9;">
      <div style="background: #1e293b; border-radius: 12px; padding: 40px; border: 1px solid #334155;">
        <h1 style="color: #6366f1; margin-top: 0;">DigiSell</h1>
        <h2 style="color: #f1f5f9;">E-Mail-Adresse bestätigen</h2>
        <p>Hallo ${name || ""},</p>
        <p>Bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Button klickst:</p>
        <a href="${link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          E-Mail bestätigen
        </a>
        <p style="color: #94a3b8; font-size: 14px;">Dieser Link ist 24 Stunden gültig.</p>
        <p style="color: #94a3b8; font-size: 12px;">Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
      </div>
    </body>
    </html>
  `;
}

export function passwordResetTemplate(name: string, token: string, baseUrl: string): string {
  const link = `${baseUrl}/auth/reset-password?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Passwort zurücksetzen</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f1f5f9;">
      <div style="background: #1e293b; border-radius: 12px; padding: 40px; border: 1px solid #334155;">
        <h1 style="color: #6366f1; margin-top: 0;">DigiSell</h1>
        <h2 style="color: #f1f5f9;">Passwort zurücksetzen</h2>
        <p>Hallo ${name || ""},</p>
        <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den folgenden Button:</p>
        <a href="${link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          Passwort zurücksetzen
        </a>
        <p style="color: #94a3b8; font-size: 14px;">Dieser Link ist 1 Stunde gültig.</p>
        <p style="color: #94a3b8; font-size: 12px;">Falls du kein Passwort-Reset angefordert hast, kannst du diese E-Mail ignorieren.</p>
      </div>
    </body>
    </html>
  `;
}

export function orderConfirmationTemplate(orderNumber: string, items: Array<{name: string; price: string}>, total: string): string {
  const itemsHtml = items.map(i => `<tr><td style="padding: 8px; border-bottom: 1px solid #334155;">${i.name}</td><td style="padding: 8px; border-bottom: 1px solid #334155; text-align: right;">${i.price}</td></tr>`).join("");
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Bestellbestätigung</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f1f5f9;">
      <div style="background: #1e293b; border-radius: 12px; padding: 40px; border: 1px solid #334155;">
        <h1 style="color: #6366f1; margin-top: 0;">DigiSell</h1>
        <h2 style="color: #22c55e;">Bestellung bestätigt ✓</h2>
        <p>Bestellnummer: <strong>${orderNumber}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead><tr style="background: #0f172a;"><th style="padding: 8px; text-align: left;">Produkt</th><th style="padding: 8px; text-align: right;">Preis</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td style="padding: 8px; font-weight: bold;">Gesamt</td><td style="padding: 8px; text-align: right; font-weight: bold; color: #6366f1;">${total}</td></tr></tfoot>
        </table>
        <p>Deine digitalen Produkte stehen in deinem <a href="/dashboard/orders" style="color: #6366f1;">Dashboard</a> bereit.</p>
      </div>
    </body>
    </html>
  `;
}
