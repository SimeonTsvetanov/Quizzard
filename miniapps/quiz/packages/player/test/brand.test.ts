// The brand on the stage (ui/brand.ts): it leads to Quizzard's own address, and its logo is the app's.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUIZZARD_URL } from "../src/ui/brand.ts";

describe("the brand on the stage", () => {
  it("leads to the address of app.config.ts", () => {
    const config = readFileSync(new URL("../../../../../app.config.ts", import.meta.url), "utf8");
    expect(/^\s*url: "([^"]+)",$/m.exec(config)?.[1]).toBe(QUIZZARD_URL);
  });

  it("carries the app's own logo", () => {
    const own = readFileSync(new URL("../src/assets/logo.svg", import.meta.url), "utf8");
    expect(own).toBe(readFileSync(new URL("../../../../../app/public/logo.svg", import.meta.url), "utf8"));
  });
});
