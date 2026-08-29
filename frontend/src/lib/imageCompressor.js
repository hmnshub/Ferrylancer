/**
 * Client-side image compression. Keep the browser fallback below the same
 * size target as the backend so direct Supabase uploads do not store large
 * originals when the API is unavailable.
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.82, maxBytes = 45 * 1024) {
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

        const encode = (targetWidth, targetHeight, targetQuality) => {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          canvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            if (blob.size <= maxBytes || (targetWidth <= 320 && targetQuality <= 0.34)) {
              const result = blob.size < file.size ? blob : file;
              if (result === file) return resolve(file);
              const newFileName = file.name.replace(/\.[^.]+$/, "") + ".webp";
              return resolve(new File([result], newFileName, { type: "image/webp", lastModified: Date.now() }));
            }

            const nextQuality = targetQuality <= 0.34 ? 0.82 : targetQuality - 0.1;
            const nextWidth = targetQuality <= 0.34 ? Math.max(320, Math.round(targetWidth * 0.75)) : targetWidth;
            const nextHeight = Math.max(1, Math.round((nextWidth / targetWidth) * targetHeight));
            encode(nextWidth, nextHeight, nextQuality);
          }, "image/webp", targetQuality);
        };

        encode(width, height, quality);
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
