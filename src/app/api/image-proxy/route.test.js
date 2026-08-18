import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockLookup = vi.fn();
vi.mock("node:dns/promises", () => ({
  default: { lookup: (...args) => mockLookup(...args) },
  lookup: (...args) => mockLookup(...args),
}));

const mockAgent = vi.fn(function Agent(options) {
  this.options = options;
});
vi.mock("undici", () => ({
  Agent: mockAgent,
}));

const { GET } = await import("./route");

function makeRequest(qs) {
  return new NextRequest(`http://localhost/api/image-proxy?${qs}`);
}

function makeFetchResponse({ ok = true, status = 200, contentType = "image/jpeg", body = "binary" } = {}) {
  return {
    ok,
    status,
    statusText: "",
    headers: { get: (h) => (h === "content-type" ? contentType : null) },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  };
}

function makeRedirectResponse(location, status = 301) {
  return {
    ok: false,
    status,
    statusText: "",
    headers: { get: (h) => (h === "location" ? location : null) },
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

describe("GET /api/image-proxy", () => {
  beforeEach(() => {
    mockLookup.mockReset();
    mockLookup.mockResolvedValue([{ address: "93.184.216.34" }]); // public IP by default
    mockAgent.mockClear();
  });

  it("rejects a missing url param", async () => {
    const res = await GET(makeRequest(""));

    expect(res.status).toBe(400);
  });

  it("rejects localhost as a hostname", async () => {
    const res = await GET(makeRequest("url=http://localhost/secret.png"));

    expect(res.status).toBe(400);
  });

  it("rejects a direct private IPv4 address (SSRF protection)", async () => {
    const res = await GET(makeRequest(`url=${encodeURIComponent("http://169.254.169.254/latest/meta-data")}`));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid image URL");
  });

  it.each([
    ["127.0.0.1", "loopback"],
    ["10.1.2.3", "10.x private"],
    ["172.16.0.1", "172.16-31.x private"],
    ["192.168.1.1", "192.168.x private"],
    ["0.0.0.5", "0.x"],
  ])("rejects a direct private IPv4 address %s (%s)", async (ip) => {
    const res = await GET(makeRequest(`url=${encodeURIComponent(`http://${ip}/x.png`)}`));
    expect(res.status).toBe(400);
  });

  it("allows a 172.x address outside the private range (172.32.x is public)", async () => {
    global.fetch.mockResolvedValue(makeFetchResponse());
    const res = await GET(makeRequest(`url=${encodeURIComponent("http://172.32.0.1/x.png")}`));
    expect(res.status).toBe(200);
  });

  it.each([
    ["::1", "IPv6 loopback"],
    ["fe80::1", "IPv6 link-local"],
    ["fc00::1", "IPv6 unique-local (fc)"],
    ["fd12::1", "IPv6 unique-local (fd)"],
  ])("rejects a direct private IPv6 address %s (%s)", async (ip) => {
    const res = await GET(makeRequest(`url=${encodeURIComponent(`http://[${ip}]/x.png`)}`));
    expect(res.status).toBe(400);
  });

  it("allows a public IPv6 address", async () => {
    global.fetch.mockResolvedValue(makeFetchResponse());
    const res = await GET(makeRequest(`url=${encodeURIComponent("http://[2606:4700:4700::1111]/x.png")}`));
    expect(res.status).toBe(200);
  });

  it("fails closed on a DNS answer that isn't a recognizable IP address", async () => {
    mockLookup.mockResolvedValue([{ address: "not-an-ip" }]);
    const res = await GET(makeRequest("url=http://weird.example.com/x.png"));
    expect(res.status).toBe(400);
  });

  it("rejects a hostname that resolves to a private IP via DNS", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.0.5" }]);

    const res = await GET(makeRequest("url=http://internal.example.com/image.png"));

    expect(res.status).toBe(400);
  });

  it("rejects a non-http(s) protocol", async () => {
    const res = await GET(makeRequest(`url=${encodeURIComponent("file:///etc/passwd")}`));

    expect(res.status).toBe(400);
  });

  it("proxies a valid image successfully", async () => {
    global.fetch.mockResolvedValue(makeFetchResponse({ contentType: "image/png" }));

    const res = await GET(makeRequest("url=https://cdn.example.com/pic.png"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("max-age=604800");
  });

  it("falls back to extension-guessed mime type for octet-stream responses", async () => {
    global.fetch.mockResolvedValue(
      makeFetchResponse({ contentType: "application/octet-stream" })
    );

    const res = await GET(makeRequest("url=https://cdn.example.com/pic.jpg"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
  });

  it("returns 415 when content-type isn't an image and the extension is unknown", async () => {
    global.fetch.mockResolvedValue(
      makeFetchResponse({ contentType: "text/html" })
    );

    const res = await GET(makeRequest("url=https://cdn.example.com/page"));

    expect(res.status).toBe(415);
  });

  it("propagates the upstream status when the fetch response isn't ok", async () => {
    global.fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 404 }));

    const res = await GET(makeRequest("url=https://cdn.example.com/missing.png"));

    expect(res.status).toBe(404);
  });

  it("returns 504 when the upstream fetch times out", async () => {
    global.fetch.mockImplementation(() => {
      const err = new Error("aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    const res = await GET(makeRequest("url=https://cdn.example.com/slow.png"));

    expect(res.status).toBe(504);
  });

  it("returns 500 on an unexpected fetch error", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    const res = await GET(makeRequest("url=https://cdn.example.com/pic.png"));

    expect(res.status).toBe(500);
  });

  it("rejects a URL string that isn't parseable at all", async () => {
    const res = await GET(makeRequest("url=not%20a%20url%20at%20all"));
    expect(res.status).toBe(400);
  });

  it("forwards the referer query param as the upstream Referer header", async () => {
    global.fetch.mockResolvedValue(makeFetchResponse());

    await GET(makeRequest("url=https://cdn.example.com/pic.png&referer=https://mochareads.com/article/1"));

    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Referer).toBe("https://mochareads.com/article/1");
  });

  it("actually aborts and returns 504 when the real 8-second timeout elapses", async () => {
    vi.useFakeTimers();
    global.fetch.mockImplementation((url, { signal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const promise = GET(makeRequest("url=https://cdn.example.com/slow.png"));
    await vi.advanceTimersByTimeAsync(8000);
    const res = await promise;

    expect(res.status).toBe(504);
    vi.useRealTimers();
  });

  it("pins the fetch to the DNS-validated IP instead of trusting a second, independent lookup", async () => {
    // Guards against DNS-rebinding: fetch() must be told to connect using
    // the exact IP assertSafeUrl already validated, not re-resolve the
    // hostname itself. A dispatcher with a custom `connect.lookup` is how
    // that pin is enforced (see pinnedDispatcher in route.js).
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    global.fetch.mockResolvedValue(makeFetchResponse({ contentType: "image/png" }));

    await GET(makeRequest("url=https://cdn.example.com/pic.png"));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.dispatcher).toBeDefined();

    expect(mockAgent).toHaveBeenCalledTimes(1);
    const agentOptions = mockAgent.mock.calls.at(-1)[0];
    const captured = [];
    agentOptions.connect.lookup("cdn.example.com", { all: true }, (err, addresses) => {
      captured.push(...addresses);
    });
    expect(captured).toEqual([{ address: "93.184.216.34", family: 4 }]);

    const capturedSingle = [];
    agentOptions.connect.lookup("cdn.example.com", { all: false }, (err, address, family) => {
      capturedSingle.push(address, family);
    });
    expect(capturedSingle).toEqual(["93.184.216.34", 4]);
  });

  it("follows a same-host http->https redirect and proxies the final image", async () => {
    // A same-host protocol upgrade (or a CDN handing off to its origin) is
    // routine for article images — refusing to follow it entirely (the
    // previous behavior) meant those images just never loaded.
    global.fetch
      .mockResolvedValueOnce(makeRedirectResponse("https://cdn.example.com/pic.jpg"))
      .mockResolvedValueOnce(makeFetchResponse({ contentType: "image/jpeg" }));

    const res = await GET(makeRequest(`url=${encodeURIComponent("http://cdn.example.com/pic.jpg")}`));

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][0]).toBe("https://cdn.example.com/pic.jpg");
  });

  it("resolves a relative Location header against the redirecting URL", async () => {
    global.fetch
      .mockResolvedValueOnce(makeRedirectResponse("/pic-final.jpg"))
      .mockResolvedValueOnce(makeFetchResponse({ contentType: "image/jpeg" }));

    const res = await GET(makeRequest(`url=${encodeURIComponent("https://cdn.example.com/pic.jpg")}`));

    expect(res.status).toBe(200);
    expect(global.fetch.mock.calls[1][0]).toBe("https://cdn.example.com/pic-final.jpg");
  });

  it("re-validates each redirect hop, rejecting a redirect to a private address (SSRF protection)", async () => {
    global.fetch.mockResolvedValueOnce(makeRedirectResponse("http://169.254.169.254/latest/meta-data"));

    const res = await GET(makeRequest(`url=${encodeURIComponent("https://cdn.example.com/pic.jpg")}`));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid image URL");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("gives up after too many redirect hops instead of looping forever", async () => {
    global.fetch.mockResolvedValue(makeRedirectResponse("https://cdn.example.com/pic.jpg"));

    const res = await GET(makeRequest(`url=${encodeURIComponent("https://cdn.example.com/pic.jpg")}`));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Too many redirects");
  });

  it("does not set a dispatcher when the URL host is already a literal IP", async () => {
    global.fetch.mockResolvedValue(makeFetchResponse({ contentType: "image/png" }));

    await GET(makeRequest(`url=${encodeURIComponent("http://93.184.216.34/pic.png")}`));

    const [, options] = global.fetch.mock.calls[0];
    expect(options.dispatcher).toBeUndefined();
  });
});
