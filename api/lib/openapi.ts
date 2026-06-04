/**
 * OpenAPI 3.0 Specification Generator for DigiSell REST API
 * Served at GET /api/docs/openapi.json
 */

export function generateOpenApiSpec(baseUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "DigiSell API",
      description: `
# DigiSell REST API

Willkommen bei der DigiSell API. Diese API ermöglicht den programmatischen Zugriff auf alle Funktionen der DigiSell-Plattform.

## Authentifizierung

Alle geschützten Endpunkte erfordern einen API-Schlüssel im Header:

\`\`\`
Authorization: Bearer ds_<your_api_key>
\`\`\`

API-Schlüssel können im Benutzer-Dashboard unter **Einstellungen → API-Schlüssel** erstellt werden.

## Rate Limiting

- **Öffentliche Endpunkte:** 60 Anfragen/Minute
- **Authentifizierte Endpunkte:** 300 Anfragen/Minute
- **Admin-Endpunkte:** 600 Anfragen/Minute

## Fehlerformate

Alle Fehler werden im folgenden Format zurückgegeben:

\`\`\`json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Ressource nicht gefunden."
  }
}
\`\`\`
      `.trim(),
      version: "1.0.0",
      contact: {
        name: "DigiSell Support",
        url: `${baseUrl}/support`,
      },
      license: {
        name: "Proprietär",
      },
    },
    servers: [
      { url: `${baseUrl}/api`, description: "Produktionsserver" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "API-Schlüssel aus dem Dashboard (Präfix: ds_)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "NOT_FOUND" },
                message: { type: "string", example: "Ressource nicht gefunden." },
              },
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Premium Software Lizenz" },
            description: { type: "string" },
            price: { type: "string", example: "29.99" },
            type: { type: "string", enum: ["digital", "license", "file", "service", "subscription"] },
            status: { type: "string", enum: ["active", "inactive", "draft"] },
            stock: { type: "integer", example: -1, description: "-1 = unbegrenzt" },
            soldCount: { type: "integer", example: 42 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            orderNumber: { type: "string", example: "ORD-1234567890-ABCDE" },
            customerEmail: { type: "string", format: "email" },
            status: { type: "string", enum: ["pending", "paid", "completed", "cancelled", "refunded"] },
            total: { type: "string", example: "29.99" },
            currency: { type: "string", example: "EUR" },
            paymentMethod: { type: "string", enum: ["stripe", "paypal", "crypto"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "seller", "customer"] },
            emailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Coupon: {
          type: "object",
          properties: {
            id: { type: "integer" },
            code: { type: "string", example: "SAVE20" },
            type: { type: "string", enum: ["percentage", "fixed"] },
            value: { type: "string", example: "20.00" },
            maxUses: { type: "integer", example: 100 },
            usedCount: { type: "integer" },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            isActive: { type: "boolean" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      "/products": {
        get: {
          summary: "Produkte auflisten",
          description: "Gibt eine paginierte Liste aller aktiven Produkte zurück.",
          tags: ["Produkte"],
          security: [],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "categoryId", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            "200": {
              description: "Erfolg",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                      total: { type: "integer" },
                      page: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/products/{id}": {
        get: {
          summary: "Produkt abrufen",
          tags: ["Produkte"],
          security: [],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            "200": { description: "Produkt gefunden", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
            "404": { description: "Nicht gefunden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/orders": {
        get: {
          summary: "Eigene Bestellungen abrufen",
          tags: ["Bestellungen"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          ],
          responses: {
            "200": {
              description: "Bestellliste",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Order" } },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { description: "Nicht authentifiziert" },
          },
        },
        post: {
          summary: "Bestellung erstellen",
          tags: ["Bestellungen"],
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["customerEmail", "items", "paymentMethod"],
                  properties: {
                    customerEmail: { type: "string", format: "email" },
                    customerName: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          productId: { type: "integer" },
                          quantity: { type: "integer", default: 1 },
                        },
                      },
                    },
                    paymentMethod: { type: "string", enum: ["stripe", "paypal", "crypto"] },
                    couponCode: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Bestellung erstellt",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      orderId: { type: "integer" },
                      orderNumber: { type: "string" },
                      total: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/orders/{id}/invoice": {
        get: {
          summary: "Rechnung als HTML abrufen",
          tags: ["Bestellungen"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            "200": { description: "Rechnungs-HTML", content: { "application/json": { schema: { type: "object", properties: { html: { type: "string" }, orderNumber: { type: "string" } } } } } },
            "403": { description: "Kein Zugriff" },
          },
        },
      },
      "/coupons/validate": {
        post: {
          summary: "Gutschein validieren",
          tags: ["Gutscheine"],
          security: [],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { code: { type: "string" } } } } },
          },
          responses: {
            "200": { description: "Gutschein gültig", content: { "application/json": { schema: { $ref: "#/components/schemas/Coupon" } } } },
            "404": { description: "Ungültiger Gutschein" },
          },
        },
      },
      "/tickets": {
        get: {
          summary: "Support-Tickets abrufen",
          tags: ["Support"],
          responses: {
            "200": { description: "Ticket-Liste" },
          },
        },
        post: {
          summary: "Support-Ticket erstellen",
          tags: ["Support"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["subject", "category", "message", "customerEmail"],
                  properties: {
                    subject: { type: "string", maxLength: 255 },
                    category: { type: "string", enum: ["general", "technical", "billing", "refund"] },
                    message: { type: "string" },
                    customerEmail: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Ticket erstellt", content: { "application/json": { schema: { type: "object", properties: { ticketId: { type: "integer" }, ticketNumber: { type: "string" } } } } } },
          },
        },
      },
      "/affiliate/register": {
        post: {
          summary: "Affiliate-Programm beitreten",
          tags: ["Affiliate"],
          responses: { "200": { description: "Registrierung erfolgreich" } },
        },
      },
      "/affiliate/stats": {
        get: {
          summary: "Affiliate-Statistiken abrufen",
          tags: ["Affiliate"],
          responses: { "200": { description: "Statistiken" } },
        },
      },
      "/webhooks": {
        get: {
          summary: "Webhooks auflisten",
          tags: ["Webhooks"],
          responses: { "200": { description: "Webhook-Liste" } },
        },
        post: {
          summary: "Webhook erstellen",
          tags: ["Webhooks"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "url", "events"],
                  properties: {
                    name: { type: "string" },
                    url: { type: "string", format: "uri" },
                    events: { type: "array", items: { type: "string" } },
                    secret: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Webhook erstellt" } },
        },
      },
      "/health": {
        get: {
          summary: "Health-Check",
          tags: ["System"],
          security: [],
          responses: {
            "200": {
              description: "System ist gesund",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      version: { type: "string" },
                      uptime: { type: "number" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Produkte", description: "Produktverwaltung und -suche" },
      { name: "Bestellungen", description: "Bestellerstellung und -verwaltung" },
      { name: "Gutscheine", description: "Gutscheinverwaltung" },
      { name: "Support", description: "Support-Ticket-System" },
      { name: "Affiliate", description: "Affiliate-Programm" },
      { name: "Webhooks", description: "Webhook-Verwaltung" },
      { name: "System", description: "System-Endpunkte" },
    ],
  };
}
