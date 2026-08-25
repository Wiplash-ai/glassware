import { describe, expect, it } from "vitest";
import { warpPoint } from "../src/lib/photo-lab";
import type { ImageWarp } from "../src/lib/model";

const warp = (patch: Partial<ImageWarp>): ImageWarp => ({
  mode: "none",
  amount: 0,
  perspectiveX: 0,
  perspectiveY: 0,
  ...patch,
});

describe("Photo Lab image warp", () => {
  it("leaves points unchanged when warp is disabled", () => {
    expect(warpPoint(0.31, 0.72, warp({}))).toEqual({ x: 0.31, y: 0.72 });
  });

  it("maps perspective controls into a bounded quadrilateral", () => {
    const settings = warp({ mode: "perspective", perspectiveX: 0.8, perspectiveY: -0.55 });
    const topLeft = warpPoint(0, 0, settings);
    const bottomRight = warpPoint(1, 1, settings);
    expect(topLeft.x).toBeGreaterThan(0);
    expect(bottomRight.y).toBeLessThan(1);
    expect([topLeft.x, topLeft.y, bottomRight.x, bottomRight.y].every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  it("pushes mid-radius pixels outward for bulge and inward for pinch", () => {
    const bulged = warpPoint(0.65, 0.5, warp({ mode: "bulge", amount: 0.9 }));
    const pinched = warpPoint(0.65, 0.5, warp({ mode: "pinch", amount: 0.9 }));
    expect(bulged.x).toBeGreaterThan(0.65);
    expect(pinched.x).toBeLessThan(0.65);
  });

  it("keeps wave output inside normalized image bounds", () => {
    const result = warpPoint(0.98, 0.24, warp({ mode: "wave", amount: 1 }));
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x).toBeLessThanOrEqual(1);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeLessThanOrEqual(1);
  });
});
