import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const loadDependency = createRequire(import.meta.url);

const source = fs.readFileSync(
  new URL("../components/Analytics.tsx", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;

function mount(saved = null, pathname = "/", storageBlocked = false) {
  let state = null;
  let effect;
  const storage = new Map(saved === null ? [] : [["headcanon-analytics-consent", saved]]);
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: testModule,
    exports: testModule.exports,
    require(name) {
      if (name === "react") {
        return {
          useState: () => [state, (value) => { state = value; }],
          useEffect: (callback) => { effect = callback; },
        };
      }
      if (name === "next/navigation") return { usePathname: () => pathname };
      if (name === "next/script") return { __esModule: true, default: "analytics-script" };
      if (name === "next/link") return { __esModule: true, default: "a" };
      return loadDependency(name);
    },
    window: {
      localStorage: {
        getItem(key) {
          if (storageBlocked) throw new Error("Storage unavailable");
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          if (storageBlocked) throw new Error("Storage unavailable");
          storage.set(key, value);
        },
      },
      setTimeout(callback) { callback(); return 1; },
      clearTimeout() {},
    },
  });
  const render = () => testModule.exports.Analytics();
  render();
  effect();
  return { render, storage };
}

function elements(tree, predicate) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => elements(child, predicate));
  return [
    ...(predicate(tree) ? [tree] : []),
    ...elements(tree.props?.children, predicate),
  ];
}

const dialogs = (tree) => elements(tree, (node) => node.props?.role === "dialog");
const scripts = (tree) => elements(tree, (node) => node.type === "analytics-script");

test("new or invalid consent keeps the choice visible without loading analytics", () => {
  for (const saved of [null, "", "invalid"]) {
    const app = mount(saved);
    assert.equal(dialogs(app.render()).length, 1);
    assert.equal(scripts(app.render()).length, 0);
  }
});

test("allowing analytics saves consent and renders one loader and one initializer", () => {
  const app = mount();
  elements(app.render(), (node) => node.type === "button" && node.props.children === "Allow analytics")[0].props.onClick();
  assert.equal(app.storage.get("headcanon-analytics-consent"), "accepted");
  assert.equal(dialogs(app.render()).length, 0);
  const tags = scripts(app.render());
  assert.equal(tags.length, 2);
  assert.equal(tags.filter((tag) => tag.props.src?.includes("G-L1SQ5EQQ4Q")).length, 1);
  assert.equal(tags.filter((tag) => tag.props.id === "gtag-init").length, 1);
});

test("declining analytics saves the choice and keeps scripts disabled", () => {
  const app = mount();
  elements(app.render(), (node) => node.type === "button" && node.props.children === "Decline")[0].props.onClick();
  assert.equal(app.storage.get("headcanon-analytics-consent"), "declined");
  assert.equal(dialogs(app.render()).length, 0);
  assert.equal(scripts(app.render()).length, 0);
});

test("returning visitors retain their accepted or declined choice", () => {
  for (const saved of ["accepted", "declined"]) {
    const app = mount(saved);
    assert.equal(dialogs(app.render()).length, 0);
    assert.equal(scripts(app.render()).length, saved === "accepted" ? 2 : 0);
  }
});

test("blocked storage leaves a usable prompt and allows a page-local choice", () => {
  const app = mount(null, "/", true);
  assert.equal(dialogs(app.render()).length, 1);
  elements(app.render(), (node) => node.type === "button" && node.props.children === "Allow analytics")[0].props.onClick();
  assert.equal(dialogs(app.render()).length, 0);
  assert.equal(scripts(app.render()).length, 2);
});

test("share pages do not show a prompt or load analytics", () => {
  for (const saved of [null, "accepted", "declined"]) {
    assert.equal(mount(saved, "/share/example").render(), null);
  }
});
