import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import JsonLd from "./JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const { container } = render(<JsonLd data={{ "@type": "Article", name: "Hello" }} />);
    const script = container.querySelector("script");
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute("type", "application/ld+json");
  });

  it("serializes the data as JSON inside the script tag", () => {
    const { container } = render(<JsonLd data={{ name: "Hello World" }} />);
    const script = container.querySelector("script");
    expect(script.innerHTML).toContain('"name":"Hello World"');
  });

  it("escapes '<' characters so untrusted content can't break out of the script tag", () => {
    const { container } = render(
      <JsonLd data={{ title: "</script><script>alert(1)</script>" }} />
    );
    const script = container.querySelector("script");
    expect(script.innerHTML).not.toContain("</script><script>");
    expect(script.innerHTML).toContain("\\u003cscript>alert(1)\\u003c/script>");
  });
});
