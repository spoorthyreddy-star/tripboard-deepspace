import React from 'react'

export function Seo({
  title,
  description,
  origin,
  path,
  ogImage,
  type = 'website',
  noindex = false,
}) {
  const canonical = origin && path ? `${origin}${path}` : undefined
  const image = ogImage ? (ogImage.startsWith('/') && origin ? `${origin}${ogImage}` : ogImage) : undefined
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:type" content={type} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </>
  )
}
