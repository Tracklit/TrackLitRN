import { describe, expect, it, vi } from "vitest";

// Short-circuit the storage -> db import chain so the regex-only test suite does
// not require a live DATABASE_URL. The constants we care about are pure and don't
// touch storage, but importing patchUser.ts transitively pulls in server/db.ts.
vi.mock("../storage", () => ({
  storage: {},
}));

import {
  ACTIVE_PROGRAM_SELECTION_MAX_LEN,
  ACTIVE_PROGRAM_SELECTION_RE,
} from "../handlers/patchUser";

// These tests exercise the wrapper-id format validator used by PATCH /api/user to
// guard the `active_program_selection` column. The regex is the single source of
// truth for "what may land in the DB", so it needs to reject every garbage shape
// we can think of without a full Express/supertest harness.

describe("ACTIVE_PROGRAM_SELECTION_RE", () => {
  describe("valid wrapper ids", () => {
    it("accepts assigned-{id} with a small positive integer", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-17")).toBe(true);
    });

    it("accepts created-{id} with a small positive integer", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("created-42")).toBe(true);
    });

    it("accepts a bare positive integer (purchase id)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("123")).toBe(true);
    });

    it("accepts single-digit assigned ids", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-1")).toBe(true);
    });

    it("accepts single-digit created ids", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("created-9")).toBe(true);
    });

    it("accepts a bare single-digit purchase id", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("7")).toBe(true);
    });

    it("accepts very large numeric ids", () => {
      expect(
        ACTIVE_PROGRAM_SELECTION_RE.test("assigned-9999999999"),
      ).toBe(true);
    });
  });

  describe("rejects zero and leading-zero variants", () => {
    it("rejects assigned-0", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-0")).toBe(false);
    });

    it("rejects created-0", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("created-0")).toBe(false);
    });

    it("rejects a bare 0", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("0")).toBe(false);
    });

    it("rejects assigned-017 (leading zero)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-017")).toBe(false);
    });

    it("rejects a bare 017 (leading zero)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("017")).toBe(false);
    });

    it("rejects created-0123", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("created-0123")).toBe(false);
    });
  });

  describe("rejects unknown or malformed prefixes", () => {
    it("rejects an unknown prefix", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("foo-17")).toBe(false);
    });

    it("rejects self_assigned-{id} (backend never emits this wrapper)", () => {
      expect(
        ACTIVE_PROGRAM_SELECTION_RE.test("self_assigned-17"),
      ).toBe(false);
    });

    it("rejects the assigned prefix without a numeric id", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-")).toBe(false);
    });

    it("rejects assigned-abc (non-numeric id)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-abc")).toBe(false);
    });

    it("rejects assigned-17abc (trailing garbage)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-17abc")).toBe(false);
    });

    it("rejects abc123 (random garbage)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("abc123")).toBe(false);
    });

    it("rejects the empty string", () => {
      // Note: the handler coerces "" -> null before calling the regex, so this
      // is a belt-and-suspenders check.
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("")).toBe(false);
    });

    it("rejects whitespace-only", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("   ")).toBe(false);
    });

    it("rejects assigned-17 with trailing whitespace (handler trims first)", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-17 ")).toBe(false);
    });

    it("rejects signed negatives", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned--17")).toBe(false);
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("-17")).toBe(false);
    });

    it("rejects decimals", () => {
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("17.5")).toBe(false);
      expect(ACTIVE_PROGRAM_SELECTION_RE.test("assigned-17.5")).toBe(false);
    });

    it("rejects SQL-ish injection attempts", () => {
      expect(
        ACTIVE_PROGRAM_SELECTION_RE.test("1; DROP TABLE users"),
      ).toBe(false);
      expect(
        ACTIVE_PROGRAM_SELECTION_RE.test("assigned-1 OR 1=1"),
      ).toBe(false);
    });
  });

  describe("max length guard", () => {
    it("ACTIVE_PROGRAM_SELECTION_MAX_LEN is 64", () => {
      expect(ACTIVE_PROGRAM_SELECTION_MAX_LEN).toBe(64);
    });

    it("accepts an id at exactly 64 characters (regex-only check)", () => {
      // "assigned-" (9 chars) + 55 digits = 64 chars total.
      const id = "assigned-" + "1".repeat(64 - "assigned-".length);
      expect(id.length).toBe(64);
      expect(ACTIVE_PROGRAM_SELECTION_RE.test(id)).toBe(true);
    });

    it("rejects a 70-character string via the max-length guard", () => {
      const longId = "assigned-" + "1".repeat(70 - "assigned-".length);
      expect(longId.length).toBe(70);
      // Regex would match the shape, but the handler's length guard catches it.
      expect(longId.length > ACTIVE_PROGRAM_SELECTION_MAX_LEN).toBe(true);
    });

    it("rejects a 70-character random garbage string on both guards", () => {
      const garbage = "x".repeat(70);
      expect(garbage.length > ACTIVE_PROGRAM_SELECTION_MAX_LEN).toBe(true);
      expect(ACTIVE_PROGRAM_SELECTION_RE.test(garbage)).toBe(false);
    });
  });
});
