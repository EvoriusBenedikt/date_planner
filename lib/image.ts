import exifr from "exifr";

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_EDGE = 1280;

export type PhotoMetadata = {
  takenAt: string | null;
  takenHour: number | null;
  lat: number | null;
  lng: number | null;
};

export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  try {
    const parsed = (await exifr.parse(file, {
      gps: true,
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "GPSLatitude",
        "GPSLongitude",
        "GPSLatitudeRef",
        "GPSLongitudeRef",
      ],
    })) as
      | {
          DateTimeOriginal?: Date;
          CreateDate?: Date;
          latitude?: number;
          longitude?: number;
        }
      | undefined;

    if (!parsed) {
      return { takenAt: null, takenHour: null, lat: null, lng: null };
    }

    const dt = parsed.DateTimeOriginal ?? parsed.CreateDate ?? null;
    const validDate = dt instanceof Date && !Number.isNaN(dt.getTime()) ? dt : null;
    const lat =
      typeof parsed.latitude === "number" && Number.isFinite(parsed.latitude)
        ? parsed.latitude
        : null;
    const lng =
      typeof parsed.longitude === "number" && Number.isFinite(parsed.longitude)
        ? parsed.longitude
        : null;

    return {
      takenAt: validDate ? validDate.toISOString() : null,
      takenHour: validDate ? validDate.getHours() : null,
      lat,
      lng,
    };
  } catch {
    return { takenAt: null, takenHour: null, lat: null, lng: null };
  }
}

export function fitWithin(
  w: number,
  h: number,
  max = MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= max || longest <= 0) {
    return { width: Math.round(w), height: Math.round(h) };
  }
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

export function validatePhotoFile(f: {
  type: string;
  size: number;
}): string | null {
  if (!f.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (f.size > MAX_PHOTO_BYTES) {
    return "Photo must be 15 MB or smaller.";
  }
  return null;
}

export async function resizeToJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read that image");
  }

  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Couldn't read that image");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    if (!blob) {
      throw new Error("Couldn't read that image");
    }
    return blob;
  } finally {
    bitmap.close();
  }
}
