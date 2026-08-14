import { vi } from "vitest";

// Shared fake shape for a Sequelize Model's static query methods. Every
// route/lib function in this app calls `initializeDbAndModels()` (see
// src/lib/db.js) to get its models rather than importing them directly, so
// the standard pattern for testing anything that touches the DB is:
//
//   import { createDbMock } from "@/test/dbMock";
//   const db = createDbMock();
//   vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));
//   // then per-test: db.User.findByPk.mockResolvedValueOnce({...})
//
// This intentionally does NOT simulate a real query engine (no `where`
// filtering, no real associations) — it stubs the exact calls the code
// under test makes so that code's own logic (auth checks, validation,
// response shaping) is what's actually under test, not Sequelize's SQL
// generation. Real query correctness is Sequelize's contract, not this
// app's; the model files themselves are unit-tested separately via
// `Model.build()` against a disconnected Sequelize instance (see
// modelTestUtils.js) to exercise validators/defaults/setters/hooks logic
// that doesn't require a live connection.
export function createModelMock(overrides = {}) {
  return {
    findOne: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    findByPk: vi.fn().mockResolvedValue(null),
    findAndCountAll: vi.fn().mockResolvedValue({ rows: [], count: 0 }),
    findOrCreate: vi.fn().mockResolvedValue([{}, true]),
    create: vi.fn().mockResolvedValue({}),
    bulkCreate: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue([0]),
    destroy: vi.fn().mockResolvedValue(0),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue([{}, true]),
    ...overrides,
  };
}

// Matches the model set registered in src/lib/db.js's global.db object.
const MODEL_NAMES = [
  "User",
  "Archive",
  "SavedArticle",
  "Article",
  "Feed",
  "ArticleLike",
  "ProcessedStripeEvent",
  "UserInteraction",
  "ReadArticle",
  "MarketQuote",
  "MarketChartCache",
  "PushSubscription",
];

export function createDbMock() {
  const db = {};
  for (const name of MODEL_NAMES) {
    db[name] = createModelMock();
  }
  db.sequelize = {
    transaction: vi.fn(async (fn) => {
      const t = { commit: vi.fn(), rollback: vi.fn(), LOCK: {} };
      return fn ? fn(t) : t;
    }),
    // Real Sequelize wraps a raw SQL fragment in a Literal instance; this
    // stand-in keeps the raw string inspectable so tests can assert on it
    // directly rather than needing to know Sequelize's internal shape.
    literal: vi.fn((sql) => ({ __literal: sql })),
  };
  return db;
}

// A model-instance-shaped stub (the object returned by findOne/findByPk/
// create in real Sequelize, as opposed to the model class's static
// methods above) — has `.update()`/`.destroy()`/`.save()`/`.get()` plus
// whatever plain data fields the test provides.
//
// update()/save()/reload() mutate and return the SAME object identity
// (`instance`), not a fresh copy — matching real Sequelize, where calling
// `.update()` on an instance mutates that instance in place. A route that
// does `const row = await Model.findByPk(id); await row.update({...}); return
// row.someField;` needs `row` itself to reflect the change, not just the
// value `update()` resolved to.
const INSTANCE_METHOD_KEYS = ["update", "save", "destroy", "get", "toJSON", "reload"];

function plainDataOf(instance) {
  const plain = { ...instance };
  for (const key of INSTANCE_METHOD_KEYS) delete plain[key];
  return plain;
}

export function createInstanceMock(data = {}) {
  const instance = {
    ...data,
    update: vi.fn(async (patch) => {
      Object.assign(instance, patch);
      return instance;
    }),
    save: vi.fn(async () => instance),
    destroy: vi.fn(async () => {}),
    get: vi.fn(() => plainDataOf(instance)),
    toJSON: vi.fn(() => plainDataOf(instance)),
    reload: vi.fn(async () => instance),
  };
  return instance;
}
