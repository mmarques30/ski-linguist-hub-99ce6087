import { describe, expect, it } from "vitest";
import {
  compareByLastName,
  formatNameLastFirst,
  sortByLastName,
} from "./person-name";

describe("person-name", () => {
  it("trie par nom puis prénom (FR, accents)", () => {
    const sorted = sortByLastName([
      { first_name: "Michèle", last_name: "Looten" },
      { first_name: "Anna", last_name: "Tessier" },
      { first_name: "Élodie", last_name: "Bernard" },
      { first_name: "Zoe", last_name: "Brier" },
      { first_name: "Claire", last_name: "bernard" },
    ]);
    expect(sorted.map(formatNameLastFirst)).toEqual([
      "bernard Claire",
      "Bernard Élodie",
      "Brier Zoe",
      "Looten Michèle",
      "Tessier Anna",
    ]);
  });

  it("formatNameLastFirst", () => {
    expect(formatNameLastFirst({ first_name: "Anna", last_name: "Tessier" })).toBe(
      "Tessier Anna"
    );
  });

  it("compareByLastName égalité", () => {
    expect(
      compareByLastName(
        { first_name: "A", last_name: "Dupont" },
        { first_name: "A", last_name: "Dupont" }
      )
    ).toBe(0);
  });
});
