/* 导出每个生成器的样题，供人工复核数学正确性 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {
  console, Math, Date, Set, Map, Array, Object, JSON, String, Number, RegExp,
  parseInt, parseFloat, isNaN,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { hash: "" },
  document: undefined,
};
sandbox.Fig = {};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
for (const f of ["data.js", "qgen.js", "qgen_junior.js", "qgen_high.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "js", f), "utf8"), ctx, { filename: f });
}

const lines = [];
for (const t of sandbox.window.TECHNIQUES) {
  if (typeof t.qgen !== "function") continue;
  const qs = t.qgen(4);
  lines.push(`\n### [${t.id}] ${t.name} (${t.stage || t.grade || ""})`);
  for (const q of qs) {
    lines.push(`Q: ${q.q}`);
    lines.push(`   选项: ${q.opts.join(" | ")}   【标答: ${q.opts[q.ans]}】`);
    lines.push(`   解析: ${q.explain}`);
  }
}
fs.writeFileSync(path.join(__dirname, "sample_dump.txt"), lines.join("\n"), "utf8");
console.log("已导出", sandbox.window.TECHNIQUES.filter(t => typeof t.qgen === "function").length, "个生成器的样题 → sample_dump.txt");
