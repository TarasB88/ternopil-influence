import { describe, it, expect } from "vitest";
import { num, territorial, intensityLevel } from "./metrics";

describe("metrics rules", () => {
  it("keeps missing values distinct from zero", () => {
    expect(num(null)).toBeNull();
    expect(num("0")).toBe(0);
    expect(num("265,3")).toBe(265.3);
  });
  it("excludes the total row from territorial data", () => {
    const rows = [{ record_type: "district" }, { record_type: "city" }, { record_type: "total" }];
    expect(territorial(rows).length).toBe(2);
  });
  it("reports no data when thresholds are missing", () => {
    expect(intensityLevel({ incidence_per_100k: "265,3" })).toBe("nodata");
    expect(
      intensityLevel({
        incidence_per_100k: "361,9",
        intensity_low_threshold: "681,3",
        intensity_medium_threshold: "729,8",
        intensity_high_threshold: "1139,6",
      }),
    ).toBe("below");
  });
});
