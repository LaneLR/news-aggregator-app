import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuthenticate = vi.fn().mockResolvedValue();
const SequelizeMock = vi.fn().mockImplementation(function (databaseUrl, options) {
  this.databaseUrl = databaseUrl;
  this.options = options;
  this.authenticate = mockAuthenticate;
});

vi.mock("sequelize", () => ({ Sequelize: SequelizeMock }));
vi.mock("pg", () => ({ default: {} }));
vi.mock("pg-hstore", () => ({ default: {} }));

describe("getSequelizeInstance", () => {
  beforeEach(() => {
    vi.resetModules();
    SequelizeMock.mockClear();
    mockAuthenticate.mockClear();
    mockAuthenticate.mockResolvedValue();
  });

  it("throws when DATABASE_URL is not set", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const getSequelizeInstance = (await import("./sequelize.js")).default;

    await expect(getSequelizeInstance()).rejects.toThrow("Database URL is missing.");
    expect(SequelizeMock).not.toHaveBeenCalled();
  });

  it("constructs a postgres-dialect Sequelize instance from DATABASE_URL and authenticates", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host:5432/db");
    const getSequelizeInstance = (await import("./sequelize.js")).default;

    const instance = await getSequelizeInstance();
    expect(SequelizeMock).toHaveBeenCalledWith(
      "postgresql://user:pass@host:5432/db",
      expect.objectContaining({ dialect: "postgres" })
    );
    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    expect(instance).toBeInstanceOf(SequelizeMock);
  });

  it("only constructs the instance once across repeated calls (singleton)", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host:5432/db");
    const getSequelizeInstance = (await import("./sequelize.js")).default;

    const first = await getSequelizeInstance();
    const second = await getSequelizeInstance();
    expect(SequelizeMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("rejects when authenticate() fails", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host:5432/db");
    mockAuthenticate.mockRejectedValueOnce(new Error("auth failed"));
    const getSequelizeInstance = (await import("./sequelize.js")).default;

    await expect(getSequelizeInstance()).rejects.toThrow("auth failed");
  });
});
