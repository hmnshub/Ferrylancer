const STANDARD_RATIOS = {
  square: 1,
  portrait: 4 / 5,
  landscape: 1.91,
};

export const CROP_OPTIONS = [
  { id: "square", label: "Square", ratio: STANDARD_RATIOS.square, icon: "crop_square" },
  { id: "portrait", label: "Portrait", ratio: STANDARD_RATIOS.portrait, icon: "crop_portrait" },
  { id: "landscape", label: "Landscape", ratio: STANDARD_RATIOS.landscape, icon: "crop_landscape" },
];

export function closestCropOption(width, height) {
  const inputRatio = width / height;
  return CROP_OPTIONS.reduce((closest, option) =>
    Math.abs(Math.log(inputRatio / option.ratio)) < Math.abs(Math.log(inputRatio / closest.ratio)) ? option : closest
  );
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read image")); };
    image.src = url;
  });
}

export async function cropImageToAspect(file, targetRatio) {
  const image = await loadImage(file);
  const sourceRatio = image.width / image.height;
  const cropWidth = sourceRatio > targetRatio ? Math.round(image.height * targetRatio) : image.width;
  const cropHeight = sourceRatio > targetRatio ? image.height : Math.round(image.width / targetRatio);
  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, Math.round((image.width - cropWidth) / 2), Math.round((image.height - cropHeight) / 2), cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Unable to crop image");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg", { type: "image/jpeg" });
}
