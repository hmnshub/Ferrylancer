import { useEffect, useState } from "react";
import { Icon } from "./primitives";

/**
 * Facebook-style photo gallery grid with responsive layouts and full lightbox viewer.
 */
export function PhotoGrid({ images = [], className = "" }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const imageList = Array.isArray(images)
    ? images.filter(Boolean)
    : typeof images === "string" && images
    ? [images]
    : [];

  const count = imageList.length;

  const openLightbox = (index, e) => {
    e?.stopPropagation();
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = (e) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, count]);

  if (count === 0) return null;

  return (
    <>
      {/* Grid Container */}
      <div className={`mb-4 overflow-hidden rounded-xl border border-[#e5eeff] bg-[#f8faff] ${className}`}>
        {/* 1 Photo */}
        {count === 1 && (
          <div
            onClick={(e) => openLightbox(0, e)}
            className="group relative max-h-[520px] w-full cursor-pointer overflow-hidden bg-black/5"
          >
            <img
              src={imageList[0]}
              alt="Photo 1"
              loading="lazy"
              className="max-h-[520px] w-full object-contain transition group-hover:scale-[1.01]"
            />
          </div>
        )}

        {/* 2 Photos */}
        {count === 2 && (
          <div className="grid h-72 grid-cols-2 gap-1 sm:h-80">
            {imageList.map((src, i) => (
              <div
                key={i}
                onClick={(e) => openLightbox(i, e)}
                className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
              >
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        {/* 3 Photos: 1 big left, 2 stacked right */}
        {count === 3 && (
          <div className="grid h-80 grid-cols-2 grid-rows-2 gap-1 sm:h-96">
            <div
              onClick={(e) => openLightbox(0, e)}
              className="group relative row-span-2 h-full w-full cursor-pointer overflow-hidden bg-black/5"
            >
              <img
                src={imageList[0]}
                alt="Photo 1"
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
            <div
              onClick={(e) => openLightbox(1, e)}
              className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
            >
              <img
                src={imageList[1]}
                alt="Photo 2"
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
            <div
              onClick={(e) => openLightbox(2, e)}
              className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
            >
              <img
                src={imageList[2]}
                alt="Photo 3"
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
          </div>
        )}

        {/* 4 Photos: 2x2 grid */}
        {count === 4 && (
          <div className="grid h-80 grid-cols-2 grid-rows-2 gap-1 sm:h-96">
            {imageList.map((src, i) => (
              <div
                key={i}
                onClick={(e) => openLightbox(i, e)}
                className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
              >
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        {/* 5+ Photos: 2 top, 3 bottom with +N badge on last */}
        {count >= 5 && (
          <div className="flex h-80 flex-col gap-1 sm:h-96">
            <div className="grid h-1/2 grid-cols-2 gap-1">
              {imageList.slice(0, 2).map((src, i) => (
                <div
                  key={i}
                  onClick={(e) => openLightbox(i, e)}
                  className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
                >
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
            <div className="grid h-1/2 grid-cols-3 gap-1">
              {imageList.slice(2, 4).map((src, i) => (
                <div
                  key={i + 2}
                  onClick={(e) => openLightbox(i + 2, e)}
                  className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
                >
                  <img
                    src={src}
                    alt={`Photo ${i + 3}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
              ))}
              {/* 5th photo with overlay */}
              <div
                onClick={(e) => openLightbox(4, e)}
                className="group relative h-full w-full cursor-pointer overflow-hidden bg-black/5"
              >
                <img
                  src={imageList[4]}
                  alt="Photo 5"
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                {count > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white transition group-hover:bg-black/70">
                    +{count - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Facebook-style Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 p-4 text-white backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Header */}
          <div
            className="flex w-full items-center justify-between px-2 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Icon className="text-xl">photo_library</Icon>
              <span>
                {lightboxIndex + 1} of {count}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={imageList[lightboxIndex]}
                target="_blank"
                rel="noreferrer"
                download
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                title="Open full size"
              >
                <Icon className="text-[20px]">open_in_new</Icon>
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close"
              >
                <Icon className="text-[22px]">close</Icon>
              </button>
            </div>
          </div>

          {/* Main Image & Navigation */}
          <div
            className="relative flex flex-1 w-full items-center justify-center py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {count > 1 && (
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30"
                aria-label="Previous image"
              >
                <Icon className="text-[26px]">arrow_back_ios_new</Icon>
              </button>
            )}

            <img
              src={imageList[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-h-[82vh] max-w-[92vw] select-none rounded-md object-contain shadow-2xl transition-all duration-200"
            />

            {count > 1 && (
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30"
                aria-label="Next image"
              >
                <Icon className="text-[26px]">arrow_forward_ios</Icon>
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {count > 1 && (
            <div
              className="flex max-w-full gap-2 overflow-x-auto px-4 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {imageList.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    lightboxIndex === idx
                      ? "border-[#1877F2] ring-2 ring-[#1877F2]/50"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

