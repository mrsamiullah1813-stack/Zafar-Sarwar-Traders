/**
 * SEO & Canonical Metadata Manager
 * Production Domain: https://zafarsarwartraders.shop/
 */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface SeoMetadata {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  breadcrumbs?: BreadcrumbItem[];
  jsonLd?: Record<string, any>;
  noindex?: boolean;
}

const PRODUCTION_DOMAIN = 'https://zafarsarwartraders.shop';
const DEFAULT_OG_IMAGE = `${PRODUCTION_DOMAIN}/assets/images/luxury_showroom_hero_1785655655475.jpg`;
const DEFAULT_DESCRIPTION =
  'Zafar Sarwar Traders is a leading sanitaryware and building materials shop in Chiniot, offering luxury sanitary fittings, bathroom accessories, water tanks, PPRC/UPVC pipes, and paints with delivery across Pakistan.';

export function updatePageSeo({
  title,
  description,
  canonicalPath = '/',
  ogImage,
  ogType = 'website',
  breadcrumbs,
  jsonLd,
  noindex = false
}: SeoMetadata) {
  if (typeof document === 'undefined') return;

  // 1. Update Document Title (Branded & Keyword-Rich)
  const formattedTitle = title.includes('Zafar Sarwar Traders')
    ? title
    : `${title} | Zafar Sarwar Traders`;
  document.title = formattedTitle;

  // 2. Canonical URL (Strict absolute canonical prevents duplicate indexing)
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${PRODUCTION_DOMAIN}${cleanPath === '/' ? '/' : cleanPath}`;

  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // 3. Meta Robots (Prevent indexing 404/admin, index valid pages)
  let robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (!robotsTag) {
    robotsTag = document.createElement('meta');
    robotsTag.setAttribute('name', 'robots');
    document.head.appendChild(robotsTag);
  }
  robotsTag.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

  // 4. Meta Description
  const metaDesc = description ? description.trim() : DEFAULT_DESCRIPTION;

  let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', metaDesc);

  // 5. OpenGraph & Twitter Tags
  const updateMetaTag = (attrName: string, attrValue: string, content: string) => {
    let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  updateMetaTag('property', 'og:title', formattedTitle);
  updateMetaTag('property', 'og:description', metaDesc);
  updateMetaTag('property', 'og:url', canonicalUrl);
  updateMetaTag('property', 'og:type', ogType);
  updateMetaTag('property', 'og:site_name', 'Zafar Sarwar Traders');
  updateMetaTag('property', 'og:locale', 'en_PK');

  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', formattedTitle);
  updateMetaTag('name', 'twitter:description', metaDesc);

  const resolvedImage = ogImage || DEFAULT_OG_IMAGE;
  updateMetaTag('property', 'og:image', resolvedImage);
  updateMetaTag('property', 'og:image:width', '1200');
  updateMetaTag('property', 'og:image:height', '630');
  updateMetaTag('property', 'og:image:alt', formattedTitle);
  updateMetaTag('name', 'twitter:image', resolvedImage);

  // 6. Schema.org BreadcrumbList Structured Data
  let breadcrumbScript = document.getElementById('seo-breadcrumbs-jsonld') as HTMLScriptElement | null;
  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'name': crumb.name,
        'item': crumb.path.startsWith('http')
          ? crumb.path
          : `${PRODUCTION_DOMAIN}${crumb.path.startsWith('/') ? crumb.path : `/${crumb.path}`}`
      }))
    };

    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'seo-breadcrumbs-jsonld';
      breadcrumbScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScript);
    }
    breadcrumbScript.textContent = JSON.stringify(breadcrumbLd);
  } else if (breadcrumbScript) {
    breadcrumbScript.remove();
  }

  // 7. Dynamic Page-Specific Schema.org JSON-LD
  let pageJsonLdScript = document.getElementById('seo-page-jsonld') as HTMLScriptElement | null;
  if (jsonLd && Object.keys(jsonLd).length > 0) {
    if (!pageJsonLdScript) {
      pageJsonLdScript = document.createElement('script');
      pageJsonLdScript.id = 'seo-page-jsonld';
      pageJsonLdScript.type = 'application/ld+json';
      document.head.appendChild(pageJsonLdScript);
    }
    pageJsonLdScript.textContent = JSON.stringify(jsonLd);
  } else if (pageJsonLdScript) {
    pageJsonLdScript.remove();
  }
}

export function updateSeoMetadata(params: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  breadcrumbs?: BreadcrumbItem[];
  jsonLd?: Record<string, any>;
  noindex?: boolean;
}) {
  updatePageSeo({
    title: params.title,
    description: params.description,
    canonicalPath: params.path || '/',
    ogImage: params.image,
    ogType: params.type || 'website',
    breadcrumbs: params.breadcrumbs,
    jsonLd: params.jsonLd,
    noindex: params.noindex
  });
}
