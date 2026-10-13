import { describe, expect, it } from "vitest";
import {
  defaultEndPackCcForInscription,
  formatEndPackCcAddress,
  parseEndPackCcInput,
} from "./end-pack-email-cc";

describe("end-pack-email-cc", () => {
  it("préremplit Anne Boniface pour Tom", () => {
    expect(
      defaultEndPackCcForInscription(
        "5f3452cf-de23-4a3c-a1b7-62b5c6b6198a"
      )
    ).toEqual(["Anne Boniface <ab732@icloud.com>"]);
  });

  it("formate et parse les adresses CC", () => {
    expect(
      formatEndPackCcAddress({
        name: "Anne Boniface",
        email: "ab732@icloud.com",
      })
    ).toBe("Anne Boniface <ab732@icloud.com>");
    expect(
      parseEndPackCcInput(
        "Anne Boniface <ab732@icloud.com>, autre@exemple.fr"
      )
    ).toEqual([
      "Anne Boniface <ab732@icloud.com>",
      "autre@exemple.fr",
    ]);
  });
});
