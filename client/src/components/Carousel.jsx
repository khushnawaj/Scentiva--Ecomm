// src/components/Carousel.jsx
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { Link } from "react-router-dom";
import { normalizeMediaUrl, getMediaType, getPlaceholder, getBackendRoot } from "../utils/media";


export default function Carousel({ slides = [], autoplay = 4500, heightClass = "h-56 sm:h-72 lg:h-96", debug = false }) {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);
  const slideCount = slides?.length || 0;
  const backendRoot = getBackendRoot();

  useEffect(() => {
    if (!autoplay || slideCount <= 1) return;
    intervalRef.current = setInterval(() => setIndex((s) => (s + 1) % slideCount), autoplay);
    return () => clearInterval(intervalRef.current);
  }, [autoplay, slideCount]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setIndex((s) => (s - 1 + slideCount) % slideCount);
      if (e.key === "ArrowRight") setIndex((s) => (s + 1) % slideCount);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slideCount]);

  if (!slides || slides.length === 0) return null;

  const placeholderImage = getPlaceholder("image");
  const placeholderVideo = getPlaceholder("video");

  // Build final absolute URL (defensive)
  const finalSrcFor = (raw) => {
    const cand = normalizeMediaUrl(raw);
    if (cand && typeof cand === "string") {
      if (cand.startsWith("/")) return `${backendRoot}${cand.replace(/^\/+/, "/")}`;
      return cand;
    }
    if (!raw) return null;
    if (typeof raw === "string") {
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.startsWith("/")) return `${backendRoot}${raw}`;
      if (raw.startsWith("uploads/")) return `${backendRoot}/${raw}`;
      return `${backendRoot}/uploads/${raw}`;
    }
    if (raw && typeof raw === "object") {
      return finalSrcFor(raw.url || raw.path || raw.filename);
    }
    return null;
  };

  const activeRaw = (() => {
    const s = slides[index];
    if (!s) return null;
    if (typeof s.image === "string") return s.image;
    if (s.image && typeof s.image === "object") return s.image.url || s.image.filename || s.image.path || null;
    return null;
  })();

  const activeSrc = finalSrcFor(activeRaw) || placeholderImage;
  if (debug) {
    // eslint-disable-next-line no-console
    console.log("[Carousel] active slide", index, { raw: activeRaw, final: activeSrc });
  }

  const heightClassFinal = heightClass || "h-56 sm:h-72 lg:h-96";

  return (
    <div className="relative w-full overflow-hidden" aria-roledescription="carousel" role="region" aria-label="Promotional carousel"
         onMouseEnter={() => intervalRef.current && clearInterval(intervalRef.current)}
         onMouseLeave={() => {
           if (!autoplay || slideCount <= 1) return;
           intervalRef.current = setInterval(() => setIndex((s) => (s + 1) % slideCount), autoplay);
         }}>
      <div className={`${heightClassFinal} relative`}>
        {/* Only render one set of slides stacked — each <figure> covers full container */}
        {slides.map((s, i) => {
          const raw = typeof s.image === "string" ? s.image : s.image && typeof s.image === "object" ? s.image.url || s.image.filename || s.image.path || null : null;
          const inferred = getMediaType(raw);
          const src = finalSrcFor(raw) || (inferred === "video" ? placeholderVideo : placeholderImage);

          return (
            <figure key={s.id ?? i}
                    className={`absolute inset-0 transition-opacity duration-600 ease-out ${i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                    aria-hidden={i === index ? "false" : "true"}>
              {inferred === "video" ? (
                <video src={src} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <img src={src} alt={s.title || `Slide ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,94,60,0.45)] via-[rgba(224,122,95,0.15)] to-[rgba(0,0,0,0.0)] pointer-events-none" />

              <figcaption className="absolute left-6 bottom-6 max-w-xl text-white z-30">
                {s.subtitle && <div className="text-sm opacity-90 mb-1">{s.subtitle}</div>}
                {s.title && <h3 className="text-xl sm:text-2xl lg:text-4xl font-bold leading-tight">{s.title}</h3>}
                {s.ctaText && (
                  <div className="mt-4 z-30">
                    {s.ctaLink && s.ctaLink.startsWith("/") ? (
                      <Link to={s.ctaLink} className="btn-primary">{s.ctaText}</Link>
                    ) : (
                      <a href={s.ctaLink || "#"} target="_blank" rel="noreferrer" className="btn-primary">{s.ctaText}</a>
                    )}
                  </div>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Controls */}
      <button aria-label="Previous slide" onClick={() => setIndex((p) => (p - 1 + slideCount) % slideCount)} className="absolute left-3 top-1/2 -translate-y-1/2 z-50 bg-white/90 rounded-full p-2 shadow hover:bg-white focus:outline-none">
        <AiOutlineLeft size={20} />
      </button>

      <button aria-label="Next slide" onClick={() => setIndex((p) => (p + 1) % slideCount)} className="absolute right-3 top-1/2 -translate-y-1/2 z-50 bg-white/90 rounded-full p-2 shadow hover:bg-white focus:outline-none">
        <AiOutlineRight size={20} />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-2 z-50">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/50"}`} />
        ))}
      </div>

      {/* Debug: show active src in DOM when debug true */}
      {debug && <div className="sr-only" aria-live="polite">{`activeSrc=${activeSrc}`}</div>}
    </div>
  );
}
