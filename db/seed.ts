import { getDb } from "../api/queries/connection";
import { categories, products, shopSettings, coupons, reviews } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed categories
  const cats = await db.insert(categories).values([
    { name: "Software", slug: "software", icon: "Code", description: "Digitale Software und Tools" },
    { name: "E-Books", slug: "e-books", icon: "BookOpen", description: "Digitale Bücher und Guides" },
    { name: "Templates", slug: "templates", icon: "Layout", description: "Design und UI Templates" },
    { name: "Kurse", slug: "kurse", icon: "GraduationCap", description: "Online Kurse und Tutorials" },
    { name: "Lizenzen", slug: "lizenzen", icon: "Key", description: "Software-Lizenzen und Keys" },
    { name: "Plugins", slug: "plugins", icon: "Plug", description: "WordPress und CMS Plugins" },
  ]);
  console.log("Categories seeded");

  // Seed products
  await db.insert(products).values([
    {
      name: "Premium SEO Tool Pro",
      slug: "premium-seo-tool-pro",
      description: "Das ultimative SEO-Tool für Profis. Keyword-Recherche, Backlink-Analyse, Rank-Tracking und mehr. Erhalte wertvolle Einblicke in deine Website-Performance und optimiere deine Inhalte für bessere Rankings.",
      shortDescription: "All-in-One SEO-Tool mit Keyword-Recherche und Rank-Tracking",
      price: "49.99",
      compareAtPrice: "79.99",
      categoryId: 1,
      type: "file",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 234,
      rating: "4.8",
      reviewCount: 45,
      tags: ["SEO", "Marketing", "Tool"],
    },
    {
      name: "Social Media Masterclass",
      slug: "social-media-masterclass",
      description: "Lerne in 20+ Stunden Video-Content, wie du Social-Media-Kanäle erfolgreich aufbaust. Instagram, TikTok, YouTube – alles in einem umfassenden Kurs.",
      shortDescription: "20+ Stunden Social Media Marketing Kurs",
      price: "89.00",
      compareAtPrice: "129.00",
      categoryId: 4,
      type: "file",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 156,
      rating: "4.6",
      reviewCount: 32,
      tags: ["Social Media", "Marketing", "Kurs"],
    },
    {
      name: "UI Design System Vol. 1",
      slug: "ui-design-system-vol-1",
      description: "500+ UI-Komponenten für Figma und Sketch. Buttons, Formulare, Karten, Navigation und mehr. Alles vollständig editierbar und skalierbar.",
      shortDescription: "500+ UI-Komponenten für Figma & Sketch",
      price: "29.99",
      compareAtPrice: "49.99",
      categoryId: 3,
      type: "file",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 412,
      rating: "4.9",
      reviewCount: 89,
      tags: ["Design", "UI", "Figma"],
    },
    {
      name: "E-Book: Digitale Nomaden",
      slug: "ebook-digitale-nomaden",
      description: "Der komplette Guide für ein Leben als digitaler Nomade. Visum, Steuern, beste Orte, Remote-Arbeit finden – alles was du wissen musst.",
      shortDescription: "Der ultimative Guide für digitale Nomaden",
      price: "14.99",
      categoryId: 2,
      type: "file",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 678,
      rating: "4.7",
      reviewCount: 123,
      tags: ["E-Book", "Lifestyle", "Remote Work"],
    },
    {
      name: "Windows 11 Pro Key",
      slug: "windows-11-pro-key",
      description: "Genuine Windows 11 Pro Lizenzschlüssel. Sofortige Lieferung per Email. Lebenslange Aktivierung auf einem Gerät.",
      shortDescription: "Original Windows 11 Pro Lizenz - Lifetime",
      price: "19.99",
      compareAtPrice: "259.00",
      categoryId: 5,
      type: "license",
      image: "https://images.unsplash.com/photo-1624571409108-e9a41746af53?w=600&h=400&fit=crop",
      stock: 500,
      status: "active",
      visibility: "public",
      soldCount: 892,
      rating: "4.5",
      reviewCount: 267,
      tags: ["Windows", "Lizenz", "Software"],
    },
    {
      name: "WordPress All-in-One Plugin",
      slug: "wordpress-all-in-one-plugin",
      description: "Das einzige WordPress-Plugin das du brauchst. SEO, Caching, Sicherheit, Backup, Performance – alles in einem.",
      shortDescription: "SEO, Cache, Security & Backup in einem Plugin",
      price: "39.00",
      compareAtPrice: "69.00",
      categoryId: 6,
      type: "file",
      image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 345,
      rating: "4.4",
      reviewCount: 78,
      tags: ["WordPress", "Plugin", "Web"],
    },
    {
      name: "Notion Template Pack",
      slug: "notion-template-pack",
      description: "50+ professionelle Notion-Templates für Produktivität, Projektmanagement, Finanzen und mehr. Sofort einsatzbereit.",
      shortDescription: "50+ professionelle Notion-Templates",
      price: "24.99",
      categoryId: 3,
      type: "file",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 523,
      rating: "4.8",
      reviewCount: 134,
      tags: ["Notion", "Produktivität", "Templates"],
    },
    {
      name: "Canva Pro Design Bundle",
      slug: "canva-pro-design-bundle",
      description: "1000+ Premium Canva-Vorlagen für Social Media, Marketing, Präsentationen und Print. Einfach anpassbar.",
      shortDescription: "1000+ Premium Canva-Vorlagen",
      price: "34.99",
      compareAtPrice: "59.99",
      categoryId: 3,
      type: "file",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop",
      stock: -1,
      status: "active",
      visibility: "public",
      soldCount: 287,
      rating: "4.6",
      reviewCount: 56,
      tags: ["Canva", "Design", "Social Media"],
    },
  ]);
  console.log("Products seeded");

  // Seed shop settings
  await db.insert(shopSettings).values({
    shopName: "DigiSell",
    shopDescription: "Die führende Plattform für digitale Produkte",
    currency: "EUR",
    timezone: "Europe/Berlin",
    feePercentage: "5.00",
    theme: "dark",
  });
  console.log("Settings seeded");

  // Seed coupons
  await db.insert(coupons).values([
    { code: "WILLKOMMEN20", type: "percentage", value: "20.00", maxUses: 100, minOrderAmount: "10.00" },
    { code: "SUMMER2025", type: "percentage", value: "15.00", maxUses: -1 },
    { code: "DIGI10", type: "fixed", value: "10.00", maxUses: 500, minOrderAmount: "50.00" },
  ]);
  console.log("Coupons seeded");

  // Seed reviews
  await db.insert(reviews).values([
    { productId: 1, customerName: "Max Mustermann", rating: 5, comment: "Hervorragendes Tool, hat meine SEO-Arbeit enorm vereinfacht!" },
    { productId: 1, customerName: "Lisa Schmidt", rating: 4, comment: "Sehr gutes Tool, aber der Preis könnte etwas niedriger sein." },
    { productId: 2, customerName: "Tom Weber", rating: 5, comment: "Bester Kurs den ich je gemacht habe. Sehr empfehlenswert!" },
    { productId: 3, customerName: "Anna Müller", rating: 5, comment: "Wunderschöne Komponenten, perfekt für meine Projekte." },
    { productId: 4, customerName: "Peter Klein", rating: 4, comment: "Sehr informativ und gut geschrieben." },
  ]);
  console.log("Reviews seeded");

  console.log("Seeding complete!");
}

seed().catch(console.error);
