import { describe, expect, it } from "vitest";
import { fitWithin, MAX_PHOTO_BYTES, validatePhotoFile } from "./image";

describe("fitWithin", () => {
  it("scales landscape images to fit within max edge while preserving aspect ratio", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 });
  });

  it("does not upscale images already smaller than max edge", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("scales portrait images to fit within max edge while preserving aspect ratio", () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 });
  });
});

describe("validatePhotoFile", () => {
  it("rejects non-image MIME types", () => {
    expect(validatePhotoFile({ type: "application/pdf", size: 1024 })).not.toBeNull();
  });

  it("rejects files larger than MAX_PHOTO_BYTES", () => {
    expect(
      validatePhotoFile({ type: "image/jpeg", size: MAX_PHOTO_BYTES + 1 }),
    ).not.toBeNull();
  });

  it("accepts a 1 MB PNG image", () => {
    expect(
      validatePhotoFile({ type: "image/png", size: 1024 * 1024 }),
    ).toBeNull();
  });
});
