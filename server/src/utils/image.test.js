import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { compressImage } from "./image.js";

const makeJpeg = (width, height) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 120, b: 200 },
    },
  })
    .jpeg({ quality: 100 })
    .withMetadata({ exif: { IFD0: { Artist: "test" } } })
    .toBuffer();

describe("compressImage", () => {
  it("scales large photos down and re-encodes them as WebP", async () => {
    const buffer = await makeJpeg(4000, 3000);
    const result = await compressImage({
      buffer,
      originalname: "holiday.photo.jpg",
      mimetype: "image/jpeg",
    });

    expect(result.mimetype).toBe("image/webp");
    expect(result.filename).toBe("holiday.photo.webp");
    expect(result.buffer.length).toBeLessThan(buffer.length);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2048);
    expect(meta.height).toBe(1536);
    expect(meta.exif).toBeUndefined();
  });

  it("returns the original file when it cannot be decoded", async () => {
    const buffer = Buffer.from("not an image");
    const result = await compressImage({
      buffer,
      originalname: "broken.png",
      mimetype: "image/png",
    });

    expect(result).toEqual({
      buffer,
      filename: "broken.png",
      mimetype: "image/png",
    });
  });

  it("leaves non-image files untouched", async () => {
    const buffer = Buffer.from("%PDF-1.4");
    const result = await compressImage({
      buffer,
      originalname: "doc.pdf",
      mimetype: "application/pdf",
    });

    expect(result.buffer).toBe(buffer);
    expect(result.mimetype).toBe("application/pdf");
  });
});
