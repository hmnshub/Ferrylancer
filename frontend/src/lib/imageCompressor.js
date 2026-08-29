/**
 * High-quality client-side image compression.
 * Resizes photos to max 2048px (Facebook high-res standard)
 * and compresses using HTML5 Canvas WebP with quality ~0.89.
 * Preserves crisp sharpness & detail while drastically reducing payload size.
 */
export async function compressImage(file, maxDimension = 2048, quality = 0.89) {
  if (!file || !(file instanceof Blob)) return file;

  // Don't alter animated GIFs or SVGs
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const newFileName = file.name.replace(/\.[^.]+$/, "") + ".webp";
              const compressedFile = new File([blob], newFileName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function compressMultipleImages(files, onProgress) {
  const fileArray = Array.from(files || []);
  const results = [];
  for (let i = 0; i < fileArray.length; i++) {
    const compressed = await compressImage(fileArray[i]);
    results.push(compressed);
    if (onProgress) onProgress(i + 1, fileArray.length);
  }
  return results;
}

