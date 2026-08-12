import { describe, expect, it } from "vitest";
import { assertProviderAllowed } from "./provider-guard";
import { EngineConfigError } from "./errors";

describe("assertProviderAllowed (BK-002 / REL-001)", () => {
  it("mock dilarang di production", () => {
    expect(() => assertProviderAllowed("mock", "production")).toThrow(EngineConfigError);
  });

  it("provider kosong juga dilarang di production", () => {
    expect(() => assertProviderAllowed(undefined, "production")).toThrow(EngineConfigError);
  });

  it("cloudbeds diizinkan di production", () => {
    expect(() => assertProviderAllowed("cloudbeds", "production")).not.toThrow();
  });

  it("mock diizinkan di dev/test", () => {
    expect(() => assertProviderAllowed("mock", "development")).not.toThrow();
    expect(() => assertProviderAllowed("mock", "test")).not.toThrow();
  });
});
