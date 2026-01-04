import { describe, expect, it } from "vitest";
import {
  searchPexels,
  searchPixabay,
  searchUnsplash,
} from "./image-tools.image-providers";

describe.skip("image-tools.image-providers", () => {
  it("fetches Unsplash results and returns attribution on candidates", async () => {
    const candidates = await searchUnsplash({
      query: "mountains",
      orientation: "square",
    });

    expect(candidates.length).toEqual(5);
    expect(candidates[0]).toEqual({
      provider: "unsplash",
      imageUrl: expect.any(String),
      sourceUrl: expect.any(String),
      photographerName: expect.any(String),
      photographerUrl: expect.any(String),
      attribution: expect.any(String),
    });
  });

  it("fetches Pexels results and returns attribution on candidates", async () => {
    const candidates = await searchPexels({
      query: "coffee",
      orientation: "landscape",
    });

    expect(candidates.length).toEqual(5);
    expect(candidates[0]).toEqual({
      provider: "pexels",
      imageUrl: expect.any(String),
      sourceUrl: expect.any(String),
      photographerName: expect.any(String),
      photographerUrl: expect.any(String),
      attribution: expect.any(String),
    });
  });

  it("fetches Pixabay results and returns attribution on candidates", async () => {
    const candidates = await searchPixabay({
      query: "beach",
      orientation: "portrait",
    });

    expect(candidates.length).toEqual(5);
    expect(candidates[0]).toEqual({
      provider: "pixabay",
      imageUrl: expect.any(String),
      sourceUrl: expect.any(String),
      photographerName: expect.any(String),
      photographerUrl: expect.any(String),
      attribution: expect.any(String),
    });
  });
});
