/* ============================================================
 * 融会贯通 · 初中数学方法参数化出题引擎
 * 覆盖：有理数、整式、一元一次方程、不等式、方程组、
 *       线段角、三角形、全等三角形、相似三角形、勾股定理、
 *       四边形、圆、一次函数、反比例函数、二次函数
 * ============================================================ */
(function () {
  const K = { ink: "#334155", sub: "#64748b", line: "#cbd5e1", pri: "#2f6fed", ok: "#16a34a", warn: "#d97706", red: "#dc2626", soft: "#eef3ff", blue: "#2563eb" };
  function S(w, h, inner) { return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // opts(ans, make1, make2, make3) - 由正确答和3个干扰项生成4个互异选项
  // 干扰项不足时：数值答案 ±k 补位；字符串答案把其中第一个数字 ±k（如 "5个"→"6个"）
  function bumpStr(s, k) {
    const m = String(s).match(/-?\d+/);
    if (!m) return null;
    return String(s).replace(m[0], String(parseInt(m[0], 10) + k));
  }
  function opts(ans, make1, make2, make3) {
    const set = new Set([String(ans)]);
    [make1, make2, make3].forEach(mk => {
      if (typeof mk === "function") { const v = String(mk()); if (v !== String(ans) && !set.has(v)) set.add(v); }
    });
    let k = 1;
    while (set.size < 4 && k < 50) {
      const num = Number(ans);
      let v = null;
      if (Number.isFinite(num)) v = String(num + k);
      else { v = (k % 2 ? bumpStr(ans, Math.ceil(k / 2)) : bumpStr(ans, -Math.ceil(k / 2))); }
      if (v != null && !set.has(v)) set.add(v);
      k++;
    }
    const arr = shuffle([...set]);
    return { opts: arr, ans: arr.indexOf(String(ans)) };
  }

  function Q(q, optsObj, level, explain, point, fig) {
    return Object.assign({ q, level: level || "基础", explain, point: point || "" }, optsObj, { fig: fig || null });
  }

  /* ============================================================
   * 1. 有理数与数轴（七年级）
   * ============================================================ */
  function qRational(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 绝对值计算
        const a = rnd(-9, 9);
        const absA = Math.abs(a);
        o = opts(absA, () => -absA, () => rnd(-10, 10), () => 0);
        q = `|${a}| = ？`;
        exp = `绝对值表示数轴上点到原点的距离，|${a}| = ${absA}。`;
      } else if (type === 1) {
        // 相反数
        const a = rnd(-9, 9);
        const opp = -a;
        o = opts(opp, () => a, () => 0, () => rnd(-10, 10));
        q = `${a} 的相反数是？`;
        exp = `相反数只变符号，${a} 的相反数是 ${opp}。`;
      } else {
        // 大小比较
        const a = rnd(-5, -1);
        const b = rnd(1, 5);
        o = opts(b, () => a, () => 0, () => rnd(-6, 6));
        q = `比较 ${a} 与 ${b}，较大的是？`;
        exp = `正数大于负数，${b} > ${a}，较大的是 ${b}。`;
      }
      results.push(Q(q, o, "基础", exp, "有理数基础"));
    }
    return results;
  }

  /* ============================================================
   * 2. 整式加减（七年级）
   * ============================================================ */
  function qIntegral(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 合并同类项
        const a1 = rnd(2, 8), a2 = rnd(2, 8);
        const sum = a1 + a2;
        o = opts(`${sum}x`, () => `${a1 + a2 + 1}x`, () => `${a1}x`, () => `${a2}x`);
        q = `${a1}x + ${a2}x = ？`;
        exp = `同类项合并：系数相加 ${a1} + ${a2} = ${sum}，字母不变，得 ${sum}x。`;
      } else if (type === 1) {
        // 去括号
        const a = rnd(1, 5);
        const b = rnd(1, 9);
        o = opts(`−${a}x + ${b}`, () => `−${a}x − ${b}`, () => `${a}x + ${b}`, () => `${a}x − ${b}`);
        q = `−(${a}x − ${b}) = ？`;
        exp = `括号前是负号，去括号后各项变号：−(${a}x − ${b}) = −${a}x + ${b}。`;
      } else {
        // 系数识别
        const a = rnd(2, 9);
        o = opts(`${-a}`, () => `${a}`, () => `${a + 1}`, () => `1`);
        q = `单项式 −${a}x² 的系数是？`;
        exp = `单项式的系数是数字因数，−${a}x² 的系数是 ${-a}。`;
      }
      results.push(Q(q, o, "基础", exp, "整式加减"));
    }
    return results;
  }

  /* ============================================================
   * 3. 一元一次方程（七年级）
   * ============================================================ */
  function qLinear(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 4;
      let q, ans, o, exp;
      if (type === 0) {
        // 简单方程 ax + b = c
        const x = rnd(1, 10);
        const a = rnd(2, 5);
        const b = rnd(1, 10);
        const c = a * x + b;
        o = opts(x, () => x + 1, () => x - 1, () => rnd(1, 12));
        q = `${a}x + ${b} = ${c}，x = ？`;
        exp = `移项：${a}x = ${c} − ${b} = ${c - b}，x = ${c - b} ÷ ${a} = ${x}。`;
      } else if (type === 1) {
        // 去括号方程
        const x = rnd(1, 8);
        const a = rnd(2, 4);
        const b = rnd(1, 6);
        const c = a * (x + b);
        o = opts(x, () => x + 1, () => x - 1, () => rnd(1, 10));
        q = `${a}(x + ${b}) = ${c}，x = ？`;
        exp = `去括号：x + ${b} = ${c} ÷ ${a} = ${c / a}，x = ${c / a} − ${b} = ${x}。`;
      } else if (type === 2) {
        // 应用题（年龄问题）
        const age = rnd(8, 15);
        const years = rnd(5, 15);
        const fatherAge = 2 * age + years; // 保证 fatherAge > 2*age，x = years 为正解
        o = opts(years, () => years + 2, () => years - 2, () => years + 5);
        q = `儿子 ${age} 岁，父亲 ${fatherAge} 岁，几年后父亲年龄是儿子的 2 倍？`;
        exp = `设 x 年后：${fatherAge} + x = 2(${age} + x)，解得 x = ${years}。`;
      } else {
        // 分式方程
        const x = rnd(2, 8);
        const a = rnd(2, 5);
        const b = a * x;
        o = opts(x, () => x + 1, () => x - 1, () => rnd(1, 10));
        q = `${b} ÷ x = ${a}，x = ？`;
        exp = `x = ${b} ÷ ${a} = ${x}。`;
      }
      results.push(Q(q, o, type < 2 ? "基础" : "进阶", exp, "一元一次方程"));
    }
    return results;
  }

  /* ============================================================
   * 4. 一元一次不等式（七年级）
   * ============================================================ */
  function qInequal(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 2;
      let q, ans, o, exp;
      if (type === 0) {
        // 解不等式（正系数）
        const x = rnd(2, 8);
        const a = rnd(2, 5);
        const b = rnd(1, 10);
        const c = a * x + b;
        o = opts(`x < ${x}`, () => `x > ${x}`, () => `x ≤ ${x}`, () => `x ≥ ${x}`);
        q = `解不等式 ${a}x + ${b} < ${c}，解集是？`;
        exp = `移项：${a}x < ${c} − ${b} = ${c - b}，系数化为 1：x < ${x}，即解集为 x < ${x}。`;
      } else {
        // 负系数不等式（考察不等号变向）
        const x = rnd(2, 8);
        const a = rnd(2, 4);
        const b = rnd(1, 9);
        const c = -a * x + b;
        o = opts(`x > ${x}`, () => `x < ${x}`, () => `x > ${x + 1}`, () => `x < ${x - 1}`);
        q = `解不等式 −${a}x + ${b} < ${c}，解集是？`;
        exp = `移项：−${a}x < ${c} − ${b} = ${c - b}，两边除以 −${a}，不等号改变方向：x > ${x}，即解集为 x > ${x}。`;
      }
      results.push(Q(q, o, "基础", exp, "一元一次不等式"));
    }
    return results;
  }

  /* ============================================================
   * 5. 二元一次方程组（七年级）
   * ============================================================ */
  function qSystem(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 代入法（系数为 1 时省略，保证方程组有唯一解）
        const x = rnd(1, 8);
        const y = rnd(1, 8);
        let a1, b1, a2, b2;
        do {
          a1 = rnd(1, 3); b1 = rnd(1, 3); a2 = rnd(1, 3); b2 = rnd(1, 3);
        } while (a1 * b2 - a2 * b1 === 0);
        const c1 = a1 * x + b1 * y;
        const c2 = a2 * x + b2 * y;
        const cf = (v, s) => v === 1 ? s : `${v}${s}`;
        o = opts(`x=${x}, y=${y}`, () => `x=${y}, y=${x}`, () => `x=${x + 1}, y=${y}`, () => `x=${x}, y=${y + 1}`);
        q = `方程组 ${cf(a1, "x")} + ${cf(b1, "y")} = ${c1} 与 ${cf(a2, "x")} + ${cf(b2, "y")} = ${c2} 的解是？`;
        exp = `代入检验：${a1}×${x} + ${b1}×${y} = ${c1}，${a2}×${x} + ${b2}×${y} = ${c2}，故解为 x=${x}, y=${y}。`;
      } else if (type === 1) {
        // 加减消元
        const x = rnd(1, 6);
        const y = rnd(1, 6);
        const c1 = 2 * x + 3 * y;
        const c2 = 3 * x - 2 * y;
        o = opts(`x=${x}, y=${y}`, () => `x=${y}, y=${x}`, () => `x=${x + 1}, y=${y}`, () => `x=${x}, y=${y + 1}`);
        q = `方程组 2x + 3y = ${c1} 与 3x − 2y = ${c2} 的解是？`;
        exp = `加减消元：第一式 ×2 加第二式 ×3，消去 y 得 13x = ${2 * c1 + 3 * c2}，x = ${x}，代回得 y = ${y}，故解为 x=${x}, y=${y}。`;
      } else {
        // 应用题（保证苹果严格多于梨）
        const a = rnd(3, 6);
        const b = rnd(1, a - 1);
        const total = a + b;
        const diff = a - b;
        o = opts(`${a}个`, () => `${b}个`, () => `${total}个`, () => `${diff}个`);
        q = `买苹果和梨共 ${total} 个，苹果比梨多 ${diff} 个，苹果有几个？`;
        exp = `设苹果 x 个、梨 y 个：x + y = ${total}，x − y = ${diff}，两式相加得 2x = ${total} + ${diff} = ${total + diff}，x = ${a}，即苹果有 ${a}个。`;
      }
      results.push(Q(q, o, type < 2 ? "基础" : "进阶", exp, "二元一次方程组"));
    }
    return results;
  }

  /* ============================================================
   * 6. 线段与角（七年级）
   * ============================================================ */
  function qSegAngle(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 中点计算
        const a = rnd(2, 10) * 2;
        const mid = a / 2;
        o = opts(mid, () => mid + 1, () => mid - 1, () => a);
        q = `线段 AB = ${a}cm，M 是 AB 中点，AM = ？`;
        exp = `中点分线段为两等份，AM = AB ÷ 2 = ${a} ÷ 2 = ${mid}cm。`;
      } else if (type === 1) {
        // 角的度数
        const angle = rnd(30, 150);
        const supplement = 180 - angle;
        o = opts(supplement, () => 180 - supplement, () => 90 - angle, () => angle);
        q = `一个角为 ${angle}°，它的补角是？`;
        exp = `补角 = 180° − ${angle}° = ${supplement}°。`;
      } else {
        // 余角
        const angle = rnd(30, 60);
        const complement = 90 - angle;
        o = opts(complement, () => 90 - complement, () => 180 - angle, () => angle);
        q = `一个角为 ${angle}°，它的余角是？`;
        exp = `余角 = 90° − ${angle}° = ${complement}°。`;
      }
      results.push(Q(q, o, "基础", exp, "线段与角"));
    }
    return results;
  }

  /* ============================================================
   * 7. 三角形性质（七年级）
   * ============================================================ */
  function qTriangle(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 内角和
        const a = rnd(40, 80);
        const b = rnd(40, 80);
        const c = 180 - a - b;
        o = opts(c, () => a + b, () => 180 - a, () => 180 - b);
        q = `三角形两个角分别为 ${a}° 和 ${b}°，第三个角是？`;
        exp = `三角形内角和 = 180°，第三角 = 180° − ${a}° − ${b}° = ${c}°。`;
      } else if (type === 1) {
        // 外角定理
        const a = rnd(40, 70);
        const b = rnd(40, 70);
        const exterior = a + b;
        o = opts(exterior, () => 180 - exterior, () => a - b, () => a + b + 10);
        q = `三角形两个内角为 ${a}° 和 ${b}°，不相邻外角是？`;
        exp = `外角 = 两内角和 = ${a}° + ${b}° = ${exterior}°。`;
      } else {
        // 三边关系
        const a = rnd(3, 8);
        const b = rnd(3, 8);
        const c = rnd(Math.abs(a - b) + 1, a + b - 1);
        o = opts("能构成", () => "不能构成", () => "无法判断", () => "直角三角形");
        q = `三边长 ${a}, ${b}, ${c}，能否构成三角形？`;
        exp = `${a} + ${b} > ${c}，${a} + ${c} > ${b}，${b} + ${c} > ${a}，能构成三角形。`;
      }
      results.push(Q(q, o, "基础", exp, "三角形性质"));
    }
    return results;
  }

  /* ============================================================
   * 8. 全等三角形（八年级）
   * ============================================================ */
  function qCongruent(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 4;
      let q, ans, o, exp;
      if (type === 0) {
        // SAS判定
        o = opts("SAS", () => "ASA", () => "SSS", () => "AAS");
        q = `已知两边及其夹角对应相等，判定三角形全等的依据是？`;
        exp = `两边及其夹角对应相等 → SAS（边角边）全等判定。`;
      } else if (type === 1) {
        // ASA判定
        o = opts("ASA", () => "SAS", () => "SSS", () => "AAS");
        q = `已知两角及其夹边对应相等，判定三角形全等的依据是？`;
        exp = `两角及其夹边对应相等 → ASA（角边角）全等判定。`;
      } else if (type === 2) {
        // SSS判定
        o = opts("SSS", () => "SAS", () => "ASA", () => "AAS");
        q = `已知三边对应相等，判定三角形全等的依据是？`;
        exp = `三边对应相等 → SSS（边边边）全等判定。`;
      } else {
        // HL判定（直角三角形）
        o = opts("HL", () => "SAS", () => "ASA", () => "SSS");
        q = `直角三角形中，已知斜边和一条直角边对应相等，判定依据是？`;
        exp = `直角三角形特有的 HL（斜边、直角边）全等判定。`;
      }
      results.push(Q(q, o, "基础", exp, "全等三角形判定"));
    }
    return results;
  }

  /* ============================================================
   * 9. 相似三角形（八年级）
   * ============================================================ */
  function qSimilar(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 相似比计算（side1 必须是 side2 的 ratio 倍）
        const ratio = rnd(2, 5);
        const side2 = rnd(2, 5);
        const side1 = ratio * side2;
        o = opts(ratio + ":1", () => "1:" + ratio, () => (ratio + 1) + ":1", () => ratio + ":" + (ratio + 1));
        q = `两个相似三角形对应边分别为 ${side1}cm 和 ${side2}cm，相似比是？`;
        exp = `相似比 = ${side1}:${side2} = ${ratio}:1。`;
      } else if (type === 1) {
        // 面积比
        const ratio = rnd(2, 4);
        o = opts((ratio * ratio) + ":1", () => ratio + ":1", () => "1:" + (ratio * ratio), () => "1:1");
        q = `相似比为 ${ratio}:1 的两个三角形，面积比是？`;
        exp = `面积比 = 相似比的平方 = ${ratio}²:1² = ${ratio * ratio}:1。`;
      } else {
        // 相似判定（AA）
        o = opts("两角对应相等（AA）", () => "三边对应相等", () => "两边对应成比例且夹角相等（SAS）", () => "面积相等");
        q = `两个三角形中两对角分别对应相等，判定它们相似的依据是？`;
        exp = `相似判定定理：两角分别对应相等的两个三角形相似，即两角对应相等（AA）。`;
      }
      results.push(Q(q, o, "基础", exp, "相似三角形"));
    }
    return results;
  }

  /* ============================================================
   * 10. 勾股定理（八年级）
   * ============================================================ */
  function qPyth(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 已知两直角边求斜边（勾股数）
        const triples = [[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25]];
        const [a, b, c] = pick(triples);
        o = opts(c, () => a + b, () => Math.abs(a - b), () => a * b);
        q = `直角三角形两直角边为 ${a} 和 ${b}，斜边为？`;
        exp = `由勾股定理：c² = ${a}² + ${b}² = ${a*a} + ${b*b} = ${a*a + b*b}，c = ${c}。`;
      } else if (type === 1) {
        // 已知斜边和一直角边求另一直角边
        const triples = [[3,4,5],[6,8,10],[5,12,13],[8,15,17]];
        const [a, b, c] = pick(triples);
        o = opts(b, () => c - a, () => c + a, () => a * b / c);
        q = `直角三角形斜边 ${c}，一直角边 ${a}，另一直角边为？`;
        exp = `b² = c² − a² = ${c*c} − ${a*a} = ${c*c - a*a}，b = ${b}。`;
      } else {
        // 判断直角三角形
        const triples = [[3,4,5],[6,8,10],[5,12,13]];
        const [a, b, c] = pick(triples);
        o = opts("是直角三角形", () => "不是直角三角形", () => "无法判断", () => "等边三角形");
        q = `三边长为 ${a}, ${b}, ${c}，这个三角形是？`;
        exp = `${a}² + ${b}² = ${a*a} + ${b*b} = ${a*a + b*b} = ${c*c}，满足勾股定理，是直角三角形。`;
      }
      results.push(Q(q, o, "基础", exp, "勾股定理"));
    }
    return results;
  }

  /* ============================================================
   * 11. 四边形与平行四边形（八年级）
   * ============================================================ */
  function qQuad(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 4;
      let q, ans, o, exp;
      if (type === 0) {
        // 平行四边形性质
        o = opts("对边平行且相等", () => "对边不相等", () => "对角不相等", () => "四边相等");
        q = `平行四边形的性质是？`;
        exp = `平行四边形对边平行且相等，对角相等，邻角互补。`;
      } else if (type === 1) {
        // 矩形性质
        o = opts("对角线相等", () => "对角线不相等", () => "四边相等", () => "对角线垂直");
        q = `矩形的特有性质是？`;
        exp = `矩形对角线相等且互相平分，四个角都是直角。`;
      } else if (type === 2) {
        // 菱形性质
        o = opts("对角线互相垂直", () => "对角线相等", () => "四角相等", () => "对边不相等");
        q = `菱形的特有性质是？`;
        exp = `菱形对角线互相垂直且平分每组对角，四边相等。`;
      } else {
        // 正方形性质
        o = opts("对角线相等且垂直", () => "对角线不相等", () => "对角线不垂直", () => "四边不相等");
        q = `正方形的对角线性质是？`;
        exp = `正方形对角线相等、互相垂直且平分，每个对角线平分一组对角。`;
      }
      results.push(Q(q, o, "基础", exp, "四边形性质"));
    }
    return results;
  }

  /* ============================================================
   * 12. 圆的性质（九年级）
   * ============================================================ */
  function qCircle(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 4;
      let q, ans, o, exp;
      if (type === 0) {
        // 圆周角定理（圆心角取偶数，保证圆周角为整数）
        const central = rnd(30, 60) * 2;
        const inscribed = central / 2;
        o = opts(`${inscribed}°`, () => `${central}°`, () => `${90 - inscribed}°`, () => `${180 - central}°`);
        q = `圆心角为 ${central}°，同弧所对的圆周角是？`;
        exp = `圆周角 = 圆心角 ÷ 2 = ${central}° ÷ 2 = ${inscribed}°。`;
      } else if (type === 1) {
        // 圆的周长
        const r = rnd(2, 10);
        o = opts(`${2 * r}π`, () => `${r}π`, () => `${r * r}π`, () => `${2 * r + 2}π`);
        q = `半径为 ${r} 的圆，周长为？`;
        exp = `周长 C = 2πr = 2 × π × ${r} = ${2 * r}π。`;
      } else if (type === 2) {
        // 圆的面积
        const r = rnd(2, 10);
        o = opts(`${r * r}π`, () => `${2 * r}π`, () => `${r}π`, () => `${r * r + 2}π`);
        q = `半径为 ${r} 的圆，面积为？`;
        exp = `面积 S = πr² = π × ${r}² = ${r * r}π。`;
      } else {
        // 弦与直径
        o = opts("直径", () => "弦", () => "切线", () => "弧");
        q = `圆中最长的弦是？`;
        exp = `直径是经过圆心的弦，是圆中最长的弦。`;
      }
      results.push(Q(q, o, "基础", exp, "圆的性质"));
    }
    return results;
  }

  /* ============================================================
   * 13. 一次函数（八年级）
   * ============================================================ */
  function qFunc1(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 4;
      let q, ans, o, exp;
      if (type === 0) {
        // 斜率计算（保证斜率为整数）
        const x1 = rnd(0, 5);
        const y1 = rnd(0, 5);
        const dx = rnd(1, 5);
        const slope = rnd(1, 3);
        const x2 = x1 + dx;
        const y2 = y1 + slope * dx;
        o = opts(slope, () => slope + 1, () => slope - 1, () => -slope);
        q = `点 (${x1},${y1}) 和 (${x2},${y2}) 连线的斜率是？`;
        exp = `斜率 k = (y₂−y₁)/(x₂−x₁) = (${y2}−${y1})/(${x2}−${x1}) = ${slope}。`;
      } else if (type === 1) {
        // 截距
        const k = rnd(1, 3);
        const b = rnd(-5, 5);
        o = opts(b, () => k, () => 0, () => -b);
        q = `一次函数 y = ${k}x${b === 0 ? "" : b > 0 ? " + " + b : " − " + (-b)}，y 轴截距是？`;
        exp = `y 轴截距是 x=0 时的 y 值，即 b = ${b}。`;
      } else if (type === 2) {
        // 函数值
        const k = rnd(1, 3);
        const b = rnd(1, 5);
        const x = rnd(1, 5);
        const y = k * x + b;
        o = opts(y, () => k + b, () => x * b, () => k * b);
        q = `一次函数 y = ${k}x + ${b}，当 x = ${x} 时，y = ？`;
        exp = `y = ${k}×${x} + ${b} = ${y}。`;
      } else {
        // 图像性质
        const k = rnd(1, 3);
        o = opts("上升", () => "下降", () => "水平", () => "垂直");
        q = `一次函数 y = ${k}x + 1，图像从左到右？`;
        exp = `k = ${k} > 0，图像从左向右上升。`;
      }
      results.push(Q(q, o, type < 3 ? "基础" : "进阶", exp, "一次函数"));
    }
    return results;
  }

  /* ============================================================
   * 14. 反比例函数（八年级）
   * ============================================================ */
  function qInverse(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 3;
      let q, ans, o, exp;
      if (type === 0) {
        // 求 k 值（先定点再算 k，保证坐标为整数）
        const x = rnd(1, 5);
        const y = rnd(1, 5);
        const k = x * y;
        o = opts(k, () => k * 2, () => k / 2, () => x + y);
        q = `反比例函数 y = k/x 经过点 (${x},${y})，k 的值为？`;
        exp = `k = x × y = ${x} × ${y} = ${k}。`;
      } else if (type === 1) {
        // 图像位置
        const k = rnd(1, 5);
        o = opts("一、三象限", () => "二、四象限", () => "一、二象限", () => "三、四象限");
        q = `反比例函数 y = ${k}/x，图像在？`;
        exp = `k = ${k} > 0，图像在第一、三象限。`;
      } else {
        // 函数值（k 取 x 的倍数，保证 y 为整数）
        const x = rnd(1, 5);
        const y = rnd(1, 5);
        const k = x * y;
        o = opts(y, () => k + x, () => k - x, () => x + y);
        q = `反比例函数 y = ${k}/x，当 x = ${x} 时，y = ？`;
        exp = `y = ${k} ÷ ${x} = ${y}。`;
      }
      results.push(Q(q, o, "基础", exp, "反比例函数"));
    }
    return results;
  }

  /* ============================================================
   * 15. 二次函数（九年级）
   * ============================================================ */
  function qQuadfunc(n) {
    const results = [];
    for (let i = 0; i < n; i++) {
      const type = i % 5;
      let q, ans, o, exp;
      if (type === 0) {
        // 顶点坐标（规范处理负数符号）
        const h = rnd(-3, 3);
        const k = rnd(-3, 3);
        const xs = h === 0 ? "x" : (h > 0 ? `x − ${h}` : `x + ${-h}`);
        const ks = k === 0 ? "" : (k > 0 ? ` + ${k}` : ` − ${-k}`);
        o = opts(`(${h},${k})`, () => `(${-h},${k})`, () => `(${h},${-k})`, () => `(${-h},${-k})`);
        q = `二次函数 y = (${xs})²${ks} 的顶点坐标是？`;
        exp = `顶点式 y = (x − h)² + k 的顶点为 (h, k)，这里顶点是 (${h},${k})。`;
      } else if (type === 1) {
        // 开口方向
        const a = rnd(1, 5) * (Math.random() < 0.5 ? 1 : -1);
        o = opts(a > 0 ? "开口向上" : "开口向下", () => a > 0 ? "开口向下" : "开口向上", () => "无法判断", () => "开口水平");
        q = `二次函数 y = ${a < 0 ? "−" + (-a) : a}x² + 2x + 1，开口方向？`;
        exp = `a = ${a < 0 ? "−" + (-a) : a} ${a > 0 ? ">" : "<"} 0，开口${a > 0 ? "向上" : "向下"}。`;
      } else if (type === 2) {
        // 对称轴
        const h = rnd(-3, 3);
        const xs = h === 0 ? "x" : (h > 0 ? `x − ${h}` : `x + ${-h}`);
        o = opts(`x = ${h}`, () => `x = ${-h}`, () => `y = ${h}`, () => `y = ${-h}`);
        q = `二次函数 y = (${xs})² 的对称轴是？`;
        exp = `y = (x − h)² 的对称轴为 x = h，这里 h = ${h}，对称轴为 x = ${h}。`;
      } else if (type === 3) {
        // 与 y 轴交点
        const c = rnd(-5, 5);
        const cs = c === 0 ? "" : (c > 0 ? ` + ${c}` : ` − ${-c}`);
        o = opts(`(0,${c})`, () => `(${c},0)`, () => `(0,0)`, () => `(1,${c})`);
        q = `二次函数 y = x² + 2x${cs}，与 y 轴交点是？`;
        exp = `令 x = 0，y = ${c}，交点为 (0,${c})。`;
      } else {
        // 最值（顶点式保证最大值恰为 k）
        const a = -rnd(1, 3);
        const h = rnd(-3, 3);
        const k = rnd(1, 5);
        const xs = h === 0 ? "x" : (h > 0 ? `x − ${h}` : `x + ${-h}`);
        const as = a === -1 ? "−" : "−" + (-a);
        o = opts(`最大值 ${k}`, () => `最小值 ${k}`, () => `最大值 ${-k}`, () => `无最值`);
        q = `二次函数 y = ${as}(${xs})² + ${k} 的最大值是？`;
        exp = `a = ${as} < 0，开口向下，顶点 (${h},${k}) 处取得最大值 ${k}。`;
      }
      results.push(Q(q, o, "基础", exp, "二次函数"));
    }
    return results;
  }

  /* ============================================================
   * 17. 幂的运算与乘法公式（七下/八上）
   * ============================================================ */
  function qPowOps() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // 同底数幂
      const m = rnd(2, 6);
      const sub = Math.random() < 0.5;
      const n = sub ? rnd(1, Math.max(1, m - 1)) : rnd(1, 5);
      const e2 = sub ? m - n : m + n;
      ans = `a^${e2}`;
      o = opts(ans, () => `a^${sub ? m + n : m - n}`, () => `a^${m * n}`, () => `a^${e2 + 1}`);
      q = sub ? `a^${m} ÷ a^${n} = ？` : `a^${m} · a^${n} = ？`;
      exp = sub ? `同底数幂相除底数不变指数相减：${m} − ${n} = ${e2}，即 a^${e2}。` : `同底数幂相乘底数不变指数相加：${m} + ${n} = ${e2}，即 a^${e2}。`;
    } else if (type === 1) {
      // 平方差
      const a = rnd(1, 9), b = rnd(1, 9);
      const v = a * a - b * b;
      ans = v;
      o = opts(v, () => a * a + b * b, () => (a + b) * (a + b), () => a * a - b);
      q = `(${a}+${b})(${a}−${b}) = ？`;
      exp = `平方差公式：(a+b)(a−b)=a²−b²=${a}²−${b}²=${a * a}−${b * b}=${v}。`;
    } else if (type === 2) {
      // 完全平方
      const a = rnd(1, 8), b = rnd(1, 8);
      const plus = Math.random() < 0.5;
      const v = a * a + b * b + (plus ? 2 * a * b : -2 * a * b);
      ans = v;
      o = opts(v, () => a * a + b * b, () => a * a + b * b + (plus ? -2 * a * b : 2 * a * b), () => v + 2);
      q = `(${a}${plus ? "+" : "−"}${b})² = ？`;
      exp = `完全平方公式：(a${plus ? "+" : "−"}b)²=a²${plus ? "+" : "−"}2ab+b²=${a * a}${plus ? "+" : "−"}${2 * a * b}+${b * b}=${v}。`;
    } else {
      // 零指数与负指数
      const base = pick([2, 3, 5, 10]);
      if (Math.random() < 0.5) {
        ans = 1;
        o = opts(1, () => 0, () => base, () => -1);
        q = `(${base === 10 ? "2024" : base})⁰ = ？`;
        exp = `任何非零数的 0 次幂等于 1，即 ${base === 10 ? "2024" : base}⁰ = 1。`;
      } else {
        const k = rnd(1, 3);
        const den = Math.pow(base, k);
        const val = `1/${den}`;
        ans = val;
        o = opts(val, () => `-${val}`, () => String(den), () => `1/${den / base}`);
        q = `${base}^(-${k}) = ？`;
        exp = `负指数化为正指数：${base}^(-${k}) = 1/${base}^${k} = 1/${den}。`;
      }
    }
    return Q(q, o, "基础", exp, "幂的运算与乘法公式", { type, ans: String(ans) });
  }

  /* ============================================================
   * 18. 因式分解（八上）
   * ============================================================ */
  function qFactor() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // 提公因式：ax + ay
      const a = rnd(2, 9), x = rnd(2, 9), y = rnd(2, 9);
      const num = Math.random() < 0.5;
      if (num) {
        ans = `${a}(x+${y})`;
        o = opts(ans, () => `${a}(x+${y + 1})`, () => `${a + 1}(x+${y})`, () => `x(${a}+${y})`);
        q = `${a}x + ${a * y} 分解因式得？`;
        exp = `公因式是 ${a}：${a}x + ${a * y} = ${a}(x + ${y})。`;
      } else {
        ans = `${a}x(x+${y})`;
        o = opts(ans, () => `${a}x(x+${y + 1})`, () => `${a}(x²+${y}x)`, () => `x(${a}x+${a * y})`);
        q = `${a}x² + ${a * y}x 分解因式得？`;
        exp = `公因式是 ${a}x：${a}x² + ${a * y}x = ${a}x(x + ${y})。`;
      }
    } else if (type === 1) {
      // 平方差
      const k = rnd(2, 9);
      const sq = k * k;
      ans = `(x+${k})(x−${k})`;
      o = opts(ans, () => `(x+${k})²`, () => `(x−${k})²`, () => `(x+${sq})(x−${sq})`);
      q = `x² − ${sq} 分解因式得？`;
      exp = `${sq} = ${k}²，用平方差公式：x² − ${k}² = (x+${k})(x−${k})。`;
    } else if (type === 2) {
      // 完全平方
      const k = rnd(2, 7);
      const b = 2 * k;
      ans = `(x+${k})²`;
      o = opts(ans, () => `(x−${k})²`, () => `(x+${k + 1})²`, () => `(x+${k})(x−${k})`);
      q = `x² + ${b}x + ${k * k} 分解因式得？`;
      exp = `首末两项是平方项：x² 与 ${k}²，中间 ${b}=2×${k}，完全平方公式：x² + ${b}x + ${k * k} = (x+${k})²。`;
    } else {
      // 十字相乘：x² + (p+q)x + pq
      const p = rnd(1, 6), q2 = rnd(1, 6);
      const b = p + q2, c = p * q2;
      ans = `(x+${p})(x+${q2})`;
      o = opts(ans, () => `(x+${p + 1})(x+${q2 - 1})`, () => `(x+${p})(x−${q2})`, () => `(x+${b})(x+${c})`);
      q = `x² + ${b}x + ${c} 分解因式得？`;
      exp = `找两个数：积为 ${c}、和为 ${b}，即 ${p} 与 ${q2}，所以 x² + ${b}x + ${c} = (x+${p})(x+${q2})。`;
    }
    return Q(q, o, "基础", exp, "因式分解", { type, ans: String(ans) });
  }

  /* ============================================================
   * 19. 二次根式（八下）
   * ============================================================ */
  function qSqrt3() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // √(a²·b) = a√b，b 无平方因子
      const b = pick([2, 3, 5, 6, 7, 10, 11, 13, 15]);
      const a = rnd(2, 6);
      const inner = a * a * b;
      ans = `${a}√${b}`;
      o = opts(ans, () => `${a * a}√${b}`, () => `${a}√${b * b}`, () => `√${b * a}`);
      q = `化简 √${inner} = ？`;
      exp = `${inner} = ${a * a}×${b}，√${inner} = √${a * a} × √${b} = ${a}√${b}。`;
    } else if (type === 1) {
      // √a × √b
      const a = pick([2, 3, 5, 6, 7]), b = pick([2, 3, 5, 6, 7, 8]);
      const p = a * b;
      // 化简：分离平方因子
      const perf = [4, 9, 16, 25, 36, 49, 64].filter(x => p % x === 0);
      let text;
      if (perf.length) {
        const sq = Math.max(...perf);
        const rest = p / sq;
        text = rest === 1 ? `${Math.sqrt(sq)}` : `${Math.sqrt(sq)}√${rest}`;
      } else text = `√${p}`;
      ans = text;
      o = opts(text, () => `√${a}√${b}`, () => `√${p + 1}`, () => `${a + b}√${p}`);
      q = `√${a} × √${b} = ？`;
      exp = `√a×√b=√(ab)：√${a}×√${b}=√${p}${text !== `√${p}` ? `=${text}` : ""}。`;
    } else if (type === 2) {
      // 有意义的条件
      const k = rnd(1, 9);
      ans = `x ≥ ${k}`;
      o = opts(ans, () => `x > ${k}`, () => `x ≤ ${k}`, () => `x ≥ ${-k}`);
      q = `二次根式 √(x − ${k}) 有意义的条件是？`;
      exp = `被开方数 ≥ 0：x − ${k} ≥ 0，即 x ≥ ${k}。`;
    } else {
      // (√a+√b)(√a−√b) = a − b
      const a = rnd(2, 9), b = rnd(2, 9);
      const v = a - b;
      ans = v;
      o = opts(v, () => a + b, () => `√${a * b}`, () => v - 1);
      q = `(√${a} + √${b})(√${a} − √${b}) = ？`;
      exp = `平方差：(√a)² − (√b)² = ${a} − ${b} = ${v}。`;
    }
    return Q(q, o, "基础", exp, "二次根式", { type, ans: String(ans) });
  }

  /* ============================================================
   * 20. 分式及其运算（八下）
   * ============================================================ */
  function qFrac2() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // 约分：数值型
      const g = rnd(2, 9), p = rnd(2, 9), r = rnd(2, 9);
      const num = g * p, den = g * r;
      // p、r 互质化
      const gcd2 = (x, y) => y ? gcd2(y, x % y) : x;
      const gg = gcd2(p, r);
      const P = p / gg, R = r / gg;
      ans = `${P}/${R}`;
      o = opts(ans, () => `${num}/${den}`, () => `${R}/${P}`, () => `${P + 1}/${R}`);
      q = `约分：${num}/${den} = ？`;
      exp = `分子分母同除以最大公因数 ${g * gg}：${num}÷${g * gg}=${P}，${den}÷${g * gg}=${R}，得 ${P}/${R}。`;
    } else if (type === 1) {
      // 分式有意义
      const k = rnd(1, 9);
      ans = `x ≠ ${k}`;
      o = opts(ans, () => `x ≠ ${-k}`, () => `x ≥ ${k}`, () => `x ≠ 0`);
      q = `分式 5/(x − ${k}) 有意义的条件是？`;
      exp = `分母不为 0：x − ${k} ≠ 0，即 x ≠ ${k}。`;
    } else if (type === 2) {
      // 分式值为 0
      const a = rnd(1, 8);
      let b = rnd(1, 8); while (b === a) b = rnd(1, 8);
      ans = `x = ${a}`;
      o = opts(ans, () => `x = ${b}`, () => `x = 0`, () => `x = ${a} 或 ${b}`);
      q = `分式 (x − ${a})/(x − ${b}) 的值为 0，则 x = ？`;
      exp = `值为 0 需分子为 0 且分母不为 0：x = ${a}（此时分母 ${a}−${b}=${a - b} ≠ 0，成立）。`;
    } else {
      // 同分母加减
      const d = pick([2, 3, 5, 7]);
      const a = rnd(1, 5), b = rnd(1, 5);
      const s = a + b;
      ans = `${s}/${d}`;
      o = opts(ans, () => `${a + b}/${d + d}`, () => `${a * b}/${d}`, () => `${s + 1}/${d}`);
      q = `${a}/${d} + ${b}/${d} = ？`;
      exp = `同分母相加，分母不变分子相加：(${a}+${b})/${d} = ${s}/${d}（若可约分需化为最简）。`;
    }
    return Q(q, o, "基础", exp, "分式运算", { type, ans: String(ans) });
  }

  /* ============================================================
   * 21. 一元二次方程（九上）
   * ============================================================ */
  function qQuadratic() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // 直接开平方 x² = k²
      const k = rnd(2, 9);
      ans = `x = ±${k}`;
      o = opts(ans, () => `x = ${k}`, () => `x = −${k}`, () => `x = ±${k * k}`);
      q = `方程 x² = ${k * k} 的解是？`;
      exp = `直接开平方：x = ±√${k * k} = ±${k}。`;
    } else if (type === 1) {
      // 因式分解法 (x−r1)(x−r2)=0，保证两根不同且常数项非零
      const r1 = -rnd(1, 9);
      const r2 = rnd(1, 9);
      const b = -(r1 + r2), c = r1 * r2;
      const bStr = b === 0 ? "" : b === 1 ? "+ x " : b === -1 ? "− x " : b > 0 ? `+ ${b}x ` : `− ${-b}x `;
      const cStr = c >= 0 ? `+ ${c}` : `− ${-c}`;
      const sorted = [r1, r2].sort((x, y) => x - y);
      ans = `x₁=${sorted[0]}, x₂=${sorted[1]}`;
      o = opts(ans, () => `x₁=${-sorted[0]}, x₂=${-sorted[1]}`, () => `x₁=${sorted[0] + 1}, x₂=${sorted[1]}`, () => `x₁=${b}, x₂=${c}`);
      q = `方程 x² ${bStr}${cStr} = 0 的解是？`;
      const fx = r => r >= 0 ? `(x − ${r})` : `(x + ${-r})`;
      exp = `因式分解：${fx(r1)}${fx(r2)} = 0，两根分别为 ${r1}、${r2}，即 x₁=${sorted[0]}, x₂=${sorted[1]}。`;
    } else if (type === 2) {
      // 判别式
      const b = rnd(1, 6), c = rnd(1, 12);
      const d = b * b - 4 * c;
      const pb = b < 0 ? `(${b})` : `${b}`; // 负数加括号避免 −6² 歧义
      const pc = c < 0 ? `(${c})` : `${c}`;
      let desc, why;
      if (d > 0) { desc = "有两个不相等的实数根"; why = `Δ = ${pb}² − 4×${pc} = ${d} > 0`; }
      else if (d === 0) { desc = "有两个相等的实数根"; why = `Δ = ${pb}² − 4×${pc} = 0`; }
      else { desc = "没有实数根"; why = `Δ = ${pb}² − 4×${pc} = ${d} < 0`; }
      ans = desc;
      o = opts(desc, () => d > 0 ? "有两个相等的实数根" : "有两个不相等的实数根", () => "有一个实数根", () => "根的个数不能确定");
      q = `不解方程，判断方程 x² + ${b}x + ${c} = 0 的根的情况？`;
      exp = `看判别式：${why}，所以${desc}。`;
    } else {
      // 韦达定理（构造保证 Δ>0 且常数项非零）
      const r1 = -rnd(1, 8);
      const r2 = rnd(1, 8);
      const b = -(r1 + r2), c = r1 * r2;
      const bStr = b === 0 ? "" : b === 1 ? "+ x " : b === -1 ? "− x " : b > 0 ? `+ ${b}x ` : `− ${-b}x `;
      const cStr = c >= 0 ? `+ ${c}` : `− ${-c}`;
      const sn = v => v < 0 ? `${-v}` : (v === 0 ? "0" : `−${v}`); // 显示 −v：v<0 时结果为正
      const pb = b < 0 ? `(${b})` : `${b}`, pc = c < 0 ? `(${c})` : `${c}`; // 负数加括号避免 −6² 歧义
      ans = `x₁+x₂=${sn(b)}, x₁x₂=${c}`;
      o = opts(ans, () => `x₁+x₂=${b}, x₁x₂=${c}`, () => `x₁+x₂=${sn(b)}, x₁x₂=${-c}`, () => `x₁+x₂=${c}, x₁x₂=${sn(b)}`);
      q = `方程 x² ${bStr}${cStr} = 0 的两根 x₁, x₂，则 x₁+x₂ 与 x₁x₂ 分别是？`;
      exp = `判别式 Δ = ${pb}² − 4×${pc} = ${b * b - 4 * c} > 0 有两实根；韦达定理：x₁+x₂ = ${sn(b)}，x₁x₂ = ${c}。`;
    }
    return Q(q, o, "进阶", exp, "一元二次方程", { type, ans: String(ans) });
  }

  /* ============================================================
   * 22. 锐角三角函数（九下）
   * ============================================================ */
  function qTrigR() {
    const type = rnd(0, 2);
    let q, ans, o, exp;
    if (type === 0) {
      // 定义：勾股数组直角三角形
      const tri = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29], [9, 40, 41]]);
      const [opp, adj, hyp] = tri;
      const f = pick(["sin", "cos", "tan"]);
      let val;
      if (f === "sin") val = `${opp}/${hyp}`;
      else if (f === "cos") val = `${adj}/${hyp}`;
      else val = `${opp}/${adj}`;
      ans = val;
      o = opts(val, () => f === "sin" ? `${adj}/${hyp}` : `${opp}/${hyp}`, () => `${hyp}/${opp}`, () => `${adj}/${opp}`);
      q = `Rt△ABC 中，∠C=90°，∠A 的对边=${opp}，邻边=${adj}，斜边=${hyp}，则 ${f}A = ？`;
      const def = f === "sin" ? `对边/斜边 = ${opp}/${hyp}` : f === "cos" ? `邻边/斜边 = ${adj}/${hyp}` : `对边/邻边 = ${opp}/${adj}`;
      exp = `${f}A = ${def}。`;
    } else if (type === 1) {
      // 特殊角
      const table = [
        ["sin30°", "1/2"], ["cos60°", "1/2"], ["tan45°", "1"],
        ["sin45°", "√2/2"], ["cos45°", "√2/2"], ["sin60°", "√3/2"], ["cos30°", "√3/2"],
        ["tan30°", "√3/3"], ["tan60°", "√3"]
      ];
      const [ask, val] = pick(table);
      ans = val;
      o = opts(val, () => pick(table.map(x => x[1]).filter(v => v !== val)), () => "2", () => "1/3");
      q = `${ask} = ？`;
      exp = `特殊角三角函数值：${ask} = ${val}。`;
    } else {
      // 解直角三角形：已知两边求第三边
      const tri = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]]);
      const hide = rnd(0, 2);
      const known = tri.filter((_, i) => i !== hide);
      const target = tri[hide];
      ans = target;
      o = opts(target, () => target + 1, () => Math.abs(known[0] - known[1]), () => target + 2);
      const names = ["两直角边", "一直角边和斜边", "一直角边和斜边"];
      q = `Rt△ABC 中 ∠C=90°，已知 ${names[hide]} 分别为 ${known[0]} 和 ${known[1]}，第三边长是？`;
      exp = `勾股定理：a² + b² = c²，设第三边为 x：x² = ${known[0]}² ${hide === 2 ? "−" : "+"} ${known[1]}²，解得 x = ${target}。`;
    }
    return Q(q, o, "进阶", exp, "锐角三角函数", { type, ans: String(ans) });
  }

  /* ============================================================
   * 23. 数据的代表与波动（统计）
   * ============================================================ */
  function qStats2() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // 平均数（偏差成对构造，保证和为 0，均值为整数）
      const n = pick([4, 5]);
      const m = rnd(5, 15);
      const d = rnd(1, 4), e = rnd(1, 4);
      const devs = n === 4 ? [d, -d, e, -e] : [d, -d, e, -e, 0];
      const data = devs.map(x => m + x).sort((a, b) => a - b);
      ans = m;
      o = opts(m, () => m + 1, () => m - 1, () => data[0]);
      q = `数据 ${data.join("、")} 的平均数是？`;
      exp = `总和 = ${data.reduce((s, x) => s + x, 0)}，平均数 = ${data.reduce((s, x) => s + x, 0)} ÷ ${n} = ${m}。`;
    } else if (type === 1) {
      // 中位数（5 个数）
      const m = rnd(4, 20);
      let a = rnd(1, m - 1), b = rnd(1, m - 1);
      let c = m + rnd(1, 9), d = m + rnd(1, 9);
      const data = [a, b, m, c, d].sort((x, y) => x - y);
      ans = m;
      o = opts(m, () => data[2] + 1, () => data[1], () => data[3]);
      q = `数据 ${data.join("、")} 的中位数是？`;
      exp = `从小到大排列后第 3 个（中间）是 ${m}，中位数是 ${m}。`;
    } else if (type === 2) {
      // 众数
      const mode = rnd(2, 9);
      const others = [mode + 1, mode + 2, mode + 3];
      const data = [mode, mode, mode, ...others].sort(() => Math.random() - 0.5).sort((x, y) => x - y);
      ans = mode;
      o = opts(mode, () => mode + 1, () => mode + 2, () => mode * 2);
      q = `数据 ${data.join("、")} 的众数是？`;
      const cnt = data.filter(x => x === mode).length;
      exp = `${mode} 出现了 ${cnt} 次，出现次数最多，众数是 ${mode}。`;
    } else {
      // 方差（对称构造：[m−2d, m−d, m, m+d, m+2d] → 方差 = 2d²）
      const m = rnd(5, 15), d = rnd(1, 4);
      const data = [m - 2 * d, m - d, m, m + d, m + 2 * d];
      const v = 2 * d * d;
      ans = v;
      o = opts(v, () => v + d, () => d * d, () => 0);
      q = `数据 ${data.join("、")} 的方差是？`;
      exp = `平均数 = ${m}；各数偏差平方 = ${(2 * d) ** 2}、${d * d}、0、${d * d}、${(2 * d) ** 2}，方差 = (${(2 * d) ** 2}+${d * d}+0+${d * d}+${(2 * d) ** 2})÷5 = ${4 * d * d + d * d}÷5 = ${v}。`;
    }
    return Q(q, o, "基础", exp, "数据的代表与波动", { type, ans: String(ans) });
  }

  /* ============================================================
   * 24. 图形的平移、旋转与轴对称（七下）
   * ============================================================ */
  function qGTrans2() {
    const type = rnd(0, 3);
    let q, ans, o, exp;
    if (type === 0) {
      // 平移
      const x = rnd(-5, 5), y = rnd(-5, 5);
      const dx = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      const dy = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
      ans = `(${x + dx}, ${y + dy})`;
      o = opts(ans, () => `(${x - dx}, ${y - dy})`, () => `(${x + dx}, ${y})`, () => `(${x}, ${y + dy})`);
      const hMove = dx > 0 ? `向右平移 ${dx} 个单位` : `向左平移 ${-dx} 个单位`;
      const vMove = dy > 0 ? `向上平移 ${dy} 个单位` : `向下平移 ${-dy} 个单位`;
      q = `点 (${x}, ${y}) ${hMove}，再${vMove}后的坐标是？`;
      exp = `左右平移改变横坐标（右加左减），上下平移改变纵坐标（上加下减）：(${x}, ${y}) → (${x + dx}, ${y + dy})。`;
    } else if (type === 1) {
      // 轴对称
      const a = rnd(-6, 6), b = rnd(-6, 6);
      const axis = pick(["x", "y"]);
      ans = axis === "x" ? `(${a}, ${-b})` : `(${-a}, ${b})`;
      o = opts(ans, () => axis === "x" ? `(${-a}, ${b})` : `(${a}, ${-b})`, () => `(${-a}, ${-b})`, () => `(${a}, ${b})`);
      q = `点 (${a}, ${b}) 关于 ${axis === "x" ? "x" : "y"} 轴对称的点的坐标是？`;
      exp = axis === "x" ? `关于 x 轴对称：横坐标不变，纵坐标变相反数 → (${a}, ${-b})。` : `关于 y 轴对称：纵坐标不变，横坐标变相反数 → (${-a}, ${b})。`;
    } else if (type === 2) {
      // 绕原点旋转 180°
      const a = rnd(-6, 6), b = rnd(-6, 6);
      ans = `(${-a}, ${-b})`;
      o = opts(ans, () => `(${a}, ${-b})`, () => `(${-a}, ${b})`, () => `(${a}, ${b})`);
      q = `点 (${a}, ${b}) 绕原点旋转 180° 后的坐标是？`;
      exp = `旋转 180°（中心对称）：横纵坐标都变相反数 → (${-a}, ${-b})。`;
    } else {
      // 概念
      const items = [
        ["平移改变的是图形的？", "位置", ["形状", "大小", "面积"]],
        ["下列图形变换中，不改变图形形状和大小的是？", "平移、旋转和轴对称", ["只有平移", "只有旋转", "只有轴对称"]],
        ["图形绕定点旋转时，旋转的三要素不包括？", "旋转的方向和角度以外的面积变化", ["旋转中心", "旋转方向", "旋转角度"]],
      ];
      const it = pick(items.slice(0, 2));
      ans = it[1];
      o = opts(ans, () => it[2][0], () => it[2][1], () => it[2][2]);
      q = it[0];
      exp = `平移、旋转、轴对称都是全等变换，只改变位置（或方向），不改变形状与大小；本题答案是「${ans}」。`;
    }
    return Q(q, o, "基础", exp, "平移旋转与轴对称", { type, ans: String(ans) });
  }

  /* ============================================================
   * 注册到 window.TECHNIQUES
   * ============================================================ */
  const GEN = {
    rational: qRational,
    integral: qIntegral,
    linear1: qLinear,
    inequal: qInequal,
    system: qSystem,
    segangle: qSegAngle,
    triangle: qTriangle,
    congruent: qCongruent,
    similar: qSimilar,
    pyth: qPyth,
    quad: qQuad,
    circ: qCircle,
    func1: qFunc1,
    inverse: qInverse,
    quadfunc: qQuadfunc,
    powops: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qPowOps()); return out; },
    factor: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qFactor()); return out; },
    sqrt3: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qSqrt3()); return out; },
    frac: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qFrac2()); return out; },
    quadratic: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qQuadratic()); return out; },
    trigr: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qTrigR()); return out; },
    stats2: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qStats2()); return out; },
    gtrans2: (n) => { const out = []; for (let i = 0; i < (n || 6); i++) out.push(qGTrans2()); return out; }
  };

  if (window.TECHNIQUES) {
    window.TECHNIQUES.forEach(t => {
      if (GEN[t.id]) t.qgen = GEN[t.id];
    });
  }
  window.QGEN_JUNIOR_READY = true;
})();
