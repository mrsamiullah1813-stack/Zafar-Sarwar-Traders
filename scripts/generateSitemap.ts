import 'dotenv/config';
import { generateDynamicSitemapXml, updateSitemapFiles, CANONICAL_DOMAIN } from '../server/sitemapGenerator.ts';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('[Build Script] Generating static production sitemap...');

  // Read cms_store_data.json if exists
  let cmsDataStore: Record<string, any> = {};
  const cmsPath = path.join(process.cwd(), 'cms_store_data.json');
  try {
    if (fs.existsSync(cmsPath)) {
      const raw = fs.readFileSync(cmsPath, 'utf-8');
      cmsDataStore = JSON.parse(raw);
      console.log('[Build Script] Loaded CMS store keys:', Object.keys(cmsDataStore));
    }
  } catch (err) {
    console.warn('[Build Script] Warning reading cms_store_data.json:', err);
  }

  // Generate XML
  const sitemapXml = await generateDynamicSitemapXml(undefined, cmsDataStore);
  
  // Persist to public/sitemap.xml, sitemap.xml, and dist/sitemap.xml
  await updateSitemapFiles(sitemapXml);

  const locMatches = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`[Build Script] Successfully generated sitemap with ${locMatches.length} URLs.`);
}

main().catch(err => {
  console.error('[Build Script] Error generating sitemap:', err);
  process.exit(1);
});
