#!/usr/bin/env node
/**
 * Tharwah Capital — Sitemap Generator (Production-Ready)
 * يقرأ VITE_APP_URL من .env ويولد sitemap.xml مع الدومين الصحيح
 */
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');

function getAppUrl(): string {
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const match = content.match(/VITE_APP_URL=([^\n]+)/);
  return (match ? match[1].trim() : 'https://www.your-domain.com').replace(/\/$/, '');
}

const baseUrl = getAppUrl();
const pages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/services', priority: '0.9', changefreq: 'weekly' },
  { path: '/markets', priority: '0.9', changefreq: 'hourly' },
  { path: '/news', priority: '0.7', changefreq: 'daily' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}${p.path}" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${p.path}?lang=en" />
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(sitemapPath, xml);
console.log(`[Sitemap] Generated at ${baseUrl} -> ${sitemapPath}`);
