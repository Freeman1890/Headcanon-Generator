import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(import.meta.url);
let account;
let requests = [];
const context = () => ({ account, refresh: async () => account, openLogin() {}, buy() {} });
function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      if (name === "react") return { ...React, useContext: context, useState: (value) => [value, () => {}], useEffect() {}, useCallback: (value) => value, useRef: (value) => ({ current: value }) };
      if (name === "@/components/AccountProvider") return { useAccount: context };
      if (name === "@/components/ui/button") return { Button: ({ children, variant, size, ...props }) => React.createElement("button", props, children) };
      if (name === "@/components/ui/input") return { Input: (props) => React.createElement("input", props) };
      if (name === "@/components/WritingActions") return { WritingActions: () => null };
      if (name === "next/link") return { __esModule: true, default: "a" };
      if (name === "@/lib/commerce") return { commerceRequest: async (url) => { requests.push(url); return account; } };
      return dependency(name);
    },
  });
  return module.exports;
}
const { AccountMenu, AccountProvider } = load("components/AccountProvider.tsx");
const { HeroSection } = load("components/HeroSection.tsx");
const { PaidWritingTool } = load("components/PaidWritingTool.tsx");
const state = (payments, balance = 0) => ({ user: { id: "test", email: "test@site.test" }, balance, capabilities: { email: true, generation: true, payments } });
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));
const hero = (paymentsEnabled) => render(HeroSection, {
  characterName: "Mira", workName: "", mode: "character", secondCharacter: "", needsCredits: true,
  options: { relationshipKind: "any", tone: "any", scenario: "" }, paymentsEnabled,
});

test("production pauses purchases without disabling authentication or generation", () => {
  const config = ts.parseConfigFileTextToJson("wrangler.jsonc", fs.readFileSync(path.join(root, "commerce/wrangler.jsonc"), "utf8")).config;
  assert.equal(config.vars.PAYMENTS_ENABLED, "false");
  assert.equal(config.vars.AUTH_ENABLED, "true");
  assert.equal(config.vars.GENERATION_ENABLED, "true");
});

test("account menu hides buying while retaining balance and sign-out", () => {
  account = state(false, 19);
  const html = render(AccountMenu);
  assert.ok(!html.includes("$9.90 / 100"));
  assert.ok(html.includes("19 credits available"));
  assert.ok(html.includes("Sign out"));
  account = state(true);
  assert.ok(render(AccountMenu).includes("$9.90 / 100"));
});

test("home and writing tools hide purchase controls when closed or not yet loaded", () => {
  for (const enabled of [false, undefined]) assert.ok(!hero(enabled).includes("Buy 100 credits"));
  assert.ok(hero(false).includes("Credit purchases are temporarily paused"));
  assert.ok(hero(true).includes("Buy 100 credits"));
  for (const kind of ["scenario", "dialogue", "plot"]) {
    account = state(false);
    const html = render(PaidWritingTool, { kind });
    assert.ok(!html.includes("Buy 100 credits"));
    assert.ok(html.includes("Existing credits can still be used."));
    assert.ok(html.includes("Generate 5"));
    account = state(true);
    assert.ok(render(PaidWritingTool, { kind }).includes("Buy 100 credits"));
    account = null;
    assert.ok(!render(PaidWritingTool, { kind }).includes("Buy 100 credits"));
  }
});

test("buy rechecks current availability and never creates checkout while paused", async () => {
  for (const user of [null, state(false).user]) {
    account = { ...state(false), user };
    requests = [];
    const provider = AccountProvider({ children: null });
    await assert.rejects(provider.props.value.buy(), /Purchases are temporarily unavailable/);
    assert.deepEqual(requests, ["/api/state"]);
  }
});
