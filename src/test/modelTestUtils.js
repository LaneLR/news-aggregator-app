import { Sequelize } from "sequelize";

// A Sequelize instance that never connects to anything — `new Sequelize()`
// itself doesn't open a connection, only methods that actually need one
// (`.authenticate()`, `.sync()`, `.query()`) do. That's enough for
// `Model.init()` (schema/validator/hook registration, called by each
// src/lib/models/define*.js function) and `Model.build()` (in-memory
// instance construction with defaults/setters applied) to work for real,
// which covers everything about a model file that doesn't require an
// actual query: default values, custom setters/getters, built-in
// validators via `.validate()`, and plain instance methods.
//
// What this can't exercise: anything that issues a real query — `.save()`/
// `.create()` persisting a row, hooks that query other tables (e.g.
// User's afterCreate creating a default Archive), associations resolving
// related rows. Those are covered where they're actually invoked, one
// layer up, via the mocked model in dbMock.js.
export function createDisconnectedSequelize() {
  return new Sequelize("postgres://test:test@localhost:5432/test", {
    dialect: "postgres",
    logging: false,
    // Off by default in Sequelize (perf/back-compat) — without it,
    // `.validate()` doesn't actually check ENUM membership, so an
    // out-of-range value like tier: "Enterprise" would silently pass.
    typeValidation: true,
  });
}
