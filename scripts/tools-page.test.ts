import { describe, expect, it } from "vitest";
import { app } from "../app.config.ts";
import { toolsBody, toolsDescription } from "./tools-page.ts";

describe("the More free tools page", () => {
  it("lists this app first, then every other tool, each as a link with its sentence", () => {
    const body = toolsBody(app);
    expect(body.indexOf(app.url)).toBeGreaterThan(-1);
    for (const tool of app.otherTools) {
      expect(body).toContain(`href="${tool.url}"`);
      expect(body.indexOf(tool.url)).toBeGreaterThan(body.indexOf(app.url));
    }
  });

  it("escapes what it writes and names the tools in its description (within 160 characters)", () => {
    expect(toolsBody({ ...app, otherTools: [{ name: "A & <b>", url: "https://x.test/?a=1&b=2", text: "t" }] })).toContain("A &amp; &lt;b&gt;");
    const description = toolsDescription(app);
    for (const tool of app.otherTools) expect(description).toContain(tool.name);
    expect(description.length).toBeLessThanOrEqual(160);
  });
});
