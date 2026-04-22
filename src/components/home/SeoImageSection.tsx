import Image from "next/image";

interface SeoImageSectionProps {
  src: string;
  alt: string;
  title: string;
  caption: string;
  description: string;
  /** Flip layout: image on right, text on left */
  reverse?: boolean;
  /** Priority loading (use for above-fold images) */
  priority?: boolean;
}

/**
 * A production-grade, fully-responsive SEO image section.
 * Renders a large hero-style image with structured caption + description
 * optimised for Google Image Search, Core Web Vitals, and accessibility.
 */
export default function SeoImageSection({
  src,
  alt,
  title,
  caption,
  description,
  reverse = false,
  priority = false,
}: SeoImageSectionProps) {
  return (
    <section className="seo-image-section" aria-label={title}>
      <div className={`seo-image-section__inner ${reverse ? "seo-image-section__inner--reverse" : ""}`}>
        {/* ── Image ─────────────────────────────────────────── */}
        <figure className="seo-image-section__figure">
          <div className="seo-image-section__img-wrapper">
            <Image
              src={src}
              alt={alt}
              title={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 60vw"
              className="seo-image-section__img"
              priority={priority}
            />
          </div>
          <figcaption className="seo-image-section__caption">
            {caption}
          </figcaption>
        </figure>

        {/* ── SEO Description ──────────────────────────────── */}
        <div className="seo-image-section__content">
          <p className="seo-image-section__description">{description}</p>
        </div>
      </div>
    </section>
  );
}
