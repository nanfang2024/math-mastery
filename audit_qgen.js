/* 数学严谨性审计：加载全部 qgen 引擎，逐技巧生成大量题目做
 * 1) 结构校验（选项数/答案下标/选项去重/无 undefined/NaN）
 * 2) 小学 10 法独立数学复算（不信任原代码，用 fig 参数重推答案）
 * 3) 初中/高中：通用检查 + 「答案是否出现在解析中」启发式复核
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {
  console,
  Math,
  Date,
  Set,
  Map,
  Array,
  Object,
  JSON,
  String,
  Number,
  RegExp,
  parseInt,
  parseFloat,
  isNaN,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { hash: "" },
  document: undefined,
};
sandbox.Fig = {};
sandbox.QGENFig = {};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

for (const f of ["data.js", "qgen.js", "qgen_junior.js", "qgen_high.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "js", f), "utf8"), ctx, { filename: f });
}

const TECH = sandbox.window.TECHNIQUES;
console.log("技巧总数:", TECH.length, "| 带参数化生成器:", TECH.filter(t => typeof t.qgen === "function").length);

let totalQ = 0, totalBad = 0, totalWarn = 0;
const badReport = [];

/* ---------- 独立数学复算（不信任原代码，从题面重新推导答案） ---------- */
function parseC(s) { // 解析 "5 + 4i" / "5 − i" / "5 − 2i" / "5"
  s = String(s).trim();
  const m = s.match(/^(-?\d+)(?:\s*([+−-])\s*(\d*)i)?$/);
  if (!m) return null;
  const re = parseInt(m[1], 10);
  if (!m[2]) return [re, 0];
  const im = (m[3] === "" ? 1 : parseInt(m[3], 10)) * (m[2] === "+" ? 1 : -1);
  return [re, im];
}
function parseVX(s) { // 解析 "x − 3" / "x + 3" / "x" → h（顶点横坐标）
  if (s === "x") return 0;
  const m = s.match(/^x ([−+]) (\d+)$/);
  if (!m) return null;
  return m[1] === "−" ? parseInt(m[2], 10) : -parseInt(m[2], 10);
}
function recheck(id, q) {
  // 返回 true=复算一致 / false=复算不一致 / null=无法复算
  const f = q.fig || {};
  const correct = q.opts[q.ans];
  switch (id) {
    case "chicken": { // H 头 F 脚 → 兔=(F-2H)/2
      if (!f.H || !f.F) return null;
      const R = (f.F - 2 * f.H) / 2, C = f.H - R;
      const askRabbit = /问兔/.test(q.q);
      return askRabbit ? String(R) === correct : String(C) === correct;
    }
    case "plant": { // fig: seg, mode
      if (f.seg == null) return null;
      const t = f.mode === "both" ? f.seg + 1 : f.mode === "none" ? f.seg - 1 : f.seg;
      return String(t) === correct;
    }
    case "sumdiff": { // fig: big, small
      if (f.big == null) return null;
      const askBig = /问(较大|大数)/.test(q.q);
      return askBig ? String(f.big) === correct : String(f.small) === correct;
    }
    case "profitloss": { // fig: a,c,b,d,N —— 两种分法糖果总数必须一致
      if (f.N == null) return null;
      const total1 = f.a * f.N + f.b;             // 每人 a 颗，多 b
      const total2 = (f.d != null) ? f.c * f.N - f.d : null; // 每人 c 颗，少 d
      const total3 = (f.e != null) ? f.c * f.N + f.e : null; // 双盈：每人 c 颗，多 e
      const consistent = total2 != null ? total1 === total2 : (total3 != null ? total1 === total3 : true);
      return consistent && String(f.N) === correct;
    }
    case "inequal": { // 解不等式 ±ax + b < c（题面重推）
      const m = q.q.match(/解不等式 ([−-]?)(\d*)x \+ (\d+) < (-?\d+)/);
      if (!m) return null;
      const a = (m[1] ? -1 : 1) * (m[2] === "" ? 1 : parseInt(m[2], 10));
      const b = parseInt(m[3], 10), c = parseInt(m[4], 10);
      if (a === 0 || (c - b) % a !== 0) return false; // 解必须为整数
      const v = (c - b) / a;
      return correct === (a > 0 ? `x < ${v}` : `x > ${v}`);
    }
    case "system": { // 方程组解复算 + 唯一解校验
      const m = q.q.match(/方程组 (\d*)x ([+−]) (\d*)y = (-?\d+) 与 (\d*)x ([+−]) (\d*)y = (-?\d+)/);
      if (!m) return null;
      const c0 = s => s === "" ? 1 : parseInt(s, 10);
      const a1 = c0(m[1]), b1 = c0(m[3]) * (m[2] === "+" ? 1 : -1), c1 = parseInt(m[4], 10);
      const a2 = c0(m[5]), b2 = c0(m[7]) * (m[6] === "+" ? 1 : -1), c2 = parseInt(m[8], 10);
      if (a1 * b2 - a2 * b1 === 0) return false; // 必须有唯一解
      const am = correct.match(/^x=(-?\d+), y=(-?\d+)$/);
      if (!am) return false;
      const x = parseInt(am[1], 10), y = parseInt(am[2], 10);
      return a1 * x + b1 * y === c1 && a2 * x + b2 * y === c2;
    }
    case "similar": { // 相似比 = 长边:短边
      const m = q.q.match(/对应边分别为 (\d+)cm 和 (\d+)cm/);
      if (!m) return null;
      const s1 = parseInt(m[1], 10), s2 = parseInt(m[2], 10);
      if (s1 % s2 !== 0) return false;
      return correct === (s1 / s2) + ":1";
    }
    case "pyth": {
      let m = q.q.match(/两直角边为 (\d+) 和 (\d+)/);
      if (m) {
        const a = +m[1], b = +m[2], c2 = a * a + b * b, c = Math.sqrt(c2);
        return Number.isInteger(c) && correct === String(c);
      }
      m = q.q.match(/斜边 (\d+)，一直角边 (\d+)/);
      if (m) {
        const c = +m[1], a = +m[2], b2 = c * c - a * a, b = Math.sqrt(b2);
        return b2 > 0 && Number.isInteger(b) && correct === String(b);
      }
      return null;
    }
    case "circ": {
      let m = q.q.match(/圆心角为 (\d+)°/);
      if (m) { const cc = +m[1]; return cc % 2 === 0 && correct === (cc / 2) + "°"; }
      m = q.q.match(/半径为 (\d+) 的圆，周长/);
      if (m) return correct === (2 * +m[1]) + "π";
      m = q.q.match(/半径为 (\d+) 的圆，面积/);
      if (m) return correct === (+m[1] * +m[1]) + "π";
      return null;
    }
    case "func1": {
      const m = q.q.match(/点 \((\d+),(\d+)\) 和 \((\d+),(\d+)\) 连线的斜率/);
      if (!m) return null;
      const x1 = +m[1], y1 = +m[2], x2 = +m[3], y2 = +m[4];
      if (x2 === x1) return false;
      const k = (y2 - y1) / (x2 - x1);
      return Number.isInteger(k) && correct === String(k);
    }
    case "inverse": {
      let m = q.q.match(/经过点 \((\d+),(\d+)\)，k 的值/);
      if (m) return correct === String(+m[1] * +m[2]);
      m = q.q.match(/y = (\d+)\/x，当 x = (\d+)/);
      if (m) { const k = +m[1], x = +m[2]; return k % x === 0 && correct === String(k / x); }
      return null;
    }
    case "quadfunc": {
      let m = q.q.match(/y = \((x(?: [−+] \d+)?)\)²(?: ([−+]) (\d+))? 的顶点坐标/);
      if (m) {
        const h = parseVX(m[1]);
        const k = m[2] ? (m[2] === "+" ? 1 : -1) * +m[3] : 0;
        return h !== null && correct === `(${h},${k})`;
      }
      m = q.q.match(/y = \((x(?: [−+] \d+)?)\)² 的对称轴/);
      if (m) { const h = parseVX(m[1]); return h !== null && correct === `x = ${h}`; }
      m = q.q.match(/y = −\d*\((x(?: [−+] \d+)?)\)² \+ (\d+) 的最大值/);
      if (m) { const k = +m[2]; return correct === `最大值 ${k}`; }
      return null;
    }
    case "conic_link": { // 韦达定理：两根必须为实根（Δ>0）
      const m = q.q.match(/方程 x² \+ (\d+)x \+ (\d+) = 0 的两根/);
      if (!m) return null;
      const s = +m[1], p = +m[2];
      if (s * s - 4 * p <= 0) return false; // 无两不等实根，题目不严谨
      return correct === `x₁+x₂=−${s}, x₁x₂=${p}`;
    }
    case "deriv_ineq": {
      const m = q.q.match(/x² − (\d+) 的最小值/);
      if (!m) return null;
      return correct === `−${m[1]}`;
    }
    case "complex": {
      let m = q.q.match(/\(([^)]+)\) ([+·]) \(([^)]+)\) = /);
      if (m) {
        const A = parseC(m[1]), B = parseC(m[3]);
        if (!A || !B) return null;
        const R = m[2] === "+" ? [A[0] + B[0], A[1] + B[1]] : [A[0] * B[0] - A[1] * B[1], A[0] * B[1] + A[1] * B[0]];
        const C = parseC(correct);
        return C !== null && C[0] === R[0] && C[1] === R[1];
      }
      m = q.q.match(/复数 z = ([^ ]+(?: [−+] \d*i)?) 的共轭复数/);
      if (m) {
        const Z = parseC(m[1]);
        if (!Z) return null;
        const C = parseC(correct);
        return C !== null && C[0] === Z[0] && C[1] === -Z[1];
      }
      m = q.q.match(/复数 z = (.+) 的模/);
      if (m) {
        const Z = parseC(m[1]);
        if (!Z) return null;
        return correct === Math.sqrt(Z[0] * Z[0] + Z[1] * Z[1]).toFixed(1);
      }
      return null;
    }
    case "solid_axis": { // 向量减法 a−b
      const m = q.q.match(/a=\((-?\d+),(-?\d+),(-?\d+)\), b=\((-?\d+),(-?\d+),(-?\d+)\)，a−b/);
      if (!m) return null;
      const d = [ +m[1] - +m[4], +m[2] - +m[5], +m[3] - +m[6] ];
      return correct === `(${d[0]},${d[1]},${d[2]})`;
    }
    default: return null;
  }
}

for (const t of TECH) {
  if (typeof t.qgen !== "function") continue;
  const N = 100;      // 100 轮 × 每轮 4 题（覆盖 i%4 的全部题型）
  let bad = [], warn = [];
  for (let i = 0; i < N; i++) {
    const qs = t.qgen(4);
    for (const q of qs) {
      totalQ++;
      // 结构校验
      if (!q || typeof q !== "object") { bad.push("非对象"); continue; }
      if (!Array.isArray(q.opts) || (q.opts.length !== 4 && q.opts.length !== 2)) { bad.push("选项数异常:" + JSON.stringify(q.opts)); continue; }
      if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans >= q.opts.length) { bad.push("答案下标异常"); continue; }
      if (new Set(q.opts).size !== q.opts.length) bad.push("选项重复:" + q.opts.join("|"));
      if (/undefined|NaN|null/.test(q.q || "")) bad.push("题干含undefined/NaN: " + (q.q || "").slice(0, 50));
      if ((q.opts || []).some(o => /undefined|NaN/.test(String(o)))) bad.push("选项含undefined/NaN");
      if (!(q.explain || "").trim()) bad.push("无解析");
      // 小学复算
      const rc = recheck(t.id, q);
      if (rc === false) bad.push("复算不一致: " + (q.q || "").slice(0, 60) + " 标答=" + q.opts[q.ans]);
      // 启发式：解析中应出现答案值（多数解析以答案收尾）
      const correct = String(q.opts[q.ans]);
      if (!(q.explain || "").includes(correct)) warn.push("答案未见于解析: " + (q.q || "").slice(0, 40) + " → " + correct);
    }
  }
  if (bad.length || warn.length) {
    totalBad += bad.length; totalWarn += warn.length;
    badReport.push({ id: t.id, name: t.name, bad: bad.slice(0, 5), warnCount: warn.length, warnSample: warn.slice(0, 2) });
  }
}

console.log("\n===== 审计结果 =====");
console.log("总生成题数:", totalQ);
console.log("硬错误(结构/复算):", totalBad, "| 软警告(答案未见于解析):", totalWarn);
for (const r of badReport) {
  console.log(`\n[${r.id} ${r.name}]`);
  r.bad.forEach(b => console.log("  ✗ " + b));
  if (r.warnCount) { console.log(`  ⚠ 解析未含答案值 ×${r.warnCount}`); r.warnSample.forEach(w => console.log("    " + w)); }
}
