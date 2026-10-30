import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(fs.readFileSync(new URL("../components/WritingActions.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function renderActions(props) {
  const events = [];
  let blob;
  let timer;
  const anchor = { href: "", download: "", click() { events.push("click"); }, remove() { events.push("remove"); } };
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module, exports: module.exports, Blob,
    require(name) {
      if (name === "react") return { useState: value => [value, () => {}] };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "lucide-react") return { Check: "check", Copy: "copy", Download: "download" };
      throw new Error(`Unexpected module ${name}`);
    },
    URL: { createObjectURL(value) { blob = value; return "blob:test-worksheet"; }, revokeObjectURL(url) { events.push(`revoke:${url}`); } },
    document: { createElement(tag) { assert.equal(tag, "a"); return anchor; }, body: { appendChild(value) { assert.equal(value, anchor); events.push("append"); } } },
    window: { setTimeout(callback) { timer = callback; } },
  });
  const tree = module.exports.WritingActions(props);
  const buttons = tree.props.children.filter(child => child?.type === "button");
  return { buttons, anchor, events, blob: () => blob, cleanup: () => timer() };
}

test("worksheet download preserves exact UTF-8 text and the chosen filename", async () => {
  const text = "Character / setting: Nell\nWhat they want: An apprenticeship\n场景：渡轮出发前";
  const result = renderActions({ text, filename: "nell-oc-worksheet.txt", download: true });
  result.buttons.find(button => button.props["aria-label"] === "Download text").props.onClick();
  assert.equal(result.anchor.download, "nell-oc-worksheet.txt");
  assert.equal(result.anchor.href, "blob:test-worksheet");
  assert.equal(await result.blob().text(), text);
  assert.equal(result.blob().type, "text/plain;charset=utf-8");
  assert.deepEqual(result.events, ["append", "click", "remove"]);
  result.cleanup();
  assert.equal(result.events.at(-1), "revoke:blob:test-worksheet");
});

test("empty exports are disabled and copy-only recipes have no download control", () => {
  const empty = renderActions({ text: "  ", download: true });
  assert.ok(empty.buttons.every(button => button.props.disabled));
  const recipe = renderActions({ text: "Scene: a late ferry" });
  assert.equal(recipe.buttons.length, 1);
  assert.equal(recipe.buttons[0].props["aria-label"], "Copy text");
});
