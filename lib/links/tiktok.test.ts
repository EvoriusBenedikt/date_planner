import { describe, expect, it } from "vitest";
import { canonicalUrl, extractUrl, isSafeImageUrl, parseTikTokId, resolveFinalUrl } from "./tiktok";

describe("extractUrl", () => {
  it("pulls the link out of share text", () => {
    expect(extractUrl("cute cafe https://vm.tiktok.com/abc/ wow")).toBe("https://vm.tiktok.com/abc/");
  });
  it("handles link only and no link", () => {
    expect(extractUrl("https://www.tiktok.com/@a/video/1")).toBe("https://www.tiktok.com/@a/video/1");
    expect(extractUrl("just text")).toBeNull();
  });
});

describe("resolveFinalUrl", () => {
  it("returns full urls without fetching", async () => {
    const u = await resolveFinalUrl("https://www.tiktok.com/@a/video/123", async () => {
      throw new Error("should not fetch");
    });
    expect(parseTikTokId(u)).toBe("123");
  });
  it("follows a short link", async () => {
    const u = await resolveFinalUrl("https://vm.tiktok.com/x", async () => ({
      location: "https://www.tiktok.com/@a/video/42?x=1",
    }));
    expect(canonicalUrl(u, "42")).toBe("https://www.tiktok.com/@a/video/42");
  });
  it("rejects foreign hosts and http", async () => {
    await expect(resolveFinalUrl("https://evil.com/x")).rejects.toThrow();
    await expect(resolveFinalUrl("http://www.tiktok.com/x")).rejects.toThrow();
  });
  it("rejects redirects to foreign hosts", async () => {
    await expect(
      resolveFinalUrl("https://vm.tiktok.com/x", async () => ({ location: "https://evil.com/" })),
    ).rejects.toThrow();
  });
  it("caps redirects", async () => {
    await expect(
      resolveFinalUrl("https://vm.tiktok.com/x", async () => ({ location: "https://vm.tiktok.com/y" })),
    ).rejects.toThrow("Too many");
  });
});

describe("parseTikTokId", () => {
  it("returns null without a video id", () => {
    expect(parseTikTokId(new URL("https://www.tiktok.com/@a"))).toBeNull();
  });
});

describe("isSafeImageUrl", () => {
  it("blocks ip literals, http, localhost", () => {
    expect(isSafeImageUrl("https://127.0.0.1/a.jpg")).toBe(false);
    expect(isSafeImageUrl("http://p16.tiktokcdn.com/a.jpg")).toBe(false);
    expect(isSafeImageUrl("https://localhost/a.jpg")).toBe(false);
    expect(isSafeImageUrl("https://p16.tiktokcdn.com/a.jpg")).toBe(true);
  });
});
