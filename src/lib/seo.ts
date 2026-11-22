function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

export interface SeoInput {
  title: string
  description: string
  image?: string
}

export function applySeo({ title, description, image }: SeoInput) {
  document.title = title
  setMetaTag('name', 'description', description)
  setMetaTag('property', 'og:title', title)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:url', window.location.href)
  setMetaTag('name', 'twitter:title', title)
  setMetaTag('name', 'twitter:description', description)
  if (image && /^https?:/.test(image)) {
    setMetaTag('property', 'og:image', image)
    setMetaTag('name', 'twitter:image', image)
  }
}
