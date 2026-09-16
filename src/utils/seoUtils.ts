/**
 * SEO & Canonical Metadata Manager
 * Production Domain: https://zafarsarwartraders.shop/
 */

export interface SeoMetadata {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
}

const PRODUCTION_DOMAIN = 'https://zafarsarwartraders.shop';

export function updatePageSeo({
  title,
  description,
  canonicalPath = '/',
  ogImage,
  ogType = 'website'
}: SeoMetadata) {
  if (typeof document === 'undefined') return;

  // 1. Update Document Title
  const formattedTitle = title.includes('Zafar Sarwar Traders')
    ? title
    : `${title} | Zafar Sarwar Traders`;
  document.title = formattedTitle;

  // 2. Canonical URL
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${PRODUCTION_DOMAIN}${cleanPath === '/' ? '/' : cleanPath}`;

  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // 3. Meta Description
  const defaultDesc =
    "Pakistan's premier luxury sanitaryware, bathroom accessories, plumbing pipes, paints, and construction materials showroom in Chiniot with nationwide delivery.";
  const metaDesc = description || defaultDesc;

  let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', metaDesc);

  // 4. OpenGraph Tags
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

  if (ogImage) {
    updateMetaTag('property', 'og:image', ogImage);
  }
}

export function updateSeoMetadata({
  title,
  description,
  path = '/',
  image,
  type = 'website'
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
}) {
  updatePageSeo({
    title,
    description,
    canonicalPath: path,
    ogImage: image,
    ogType: type
  });
}
