/* ============================================================
 * 融会贯通 · 核心逻辑
 * 学习路径 + 学习页 + 练习 + 薄弱点复习 + 通关门禁 + 进度持久化
 * ============================================================ */
(function () {
  const KEY = "mathMastery.v2";   // v2: 新增 starred/dailyLog/stats/freeMode
  const APP_VERSION = "1.1.0";
  const APP_EDITION = "砚墨";
  const APP_BUILD = "2026-09-02";
  const $ = sel => document.querySelector(sel);
  const view = () => document.getElementById("view");

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY)) || {};
      raw.starred = raw.starred || [];
      raw.dailyLog = raw.dailyLog || [];
      raw.stats = raw.stats || { answered: 0, correct: 0, timeSec: 0 };
      raw.freeMode = !!raw.freeMode;
      // 从 v1 迁移旧数据
      const oldKey = "mathMastery.v1";
      if (!raw._migrated && localStorage.getItem(oldKey)) {
        const old = JSON.parse(localStorage.getItem(oldKey)) || {};
        Object.keys(old).forEach(id => { if (!raw[id]) raw[id] = old[id]; });
        raw._migrated = true;
      }
      return raw;
    } catch (e) { return { starred: [], dailyLog: [], stats: { answered: 0, correct: 0, timeSec: 0 }, freeMode: false }; }
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  let state = load();
  let pendingScrollTech = null;

  /* ---- 学习打卡与统计 ---- */
  function todayStr() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function logDaily() { const t = todayStr(); if (!state.dailyLog.includes(t)) { state.dailyLog.push(t); state.dailyLog.sort(); save(state); } }
  function streakDays() {
    if (!state.dailyLog.length) return 0;
    const days = state.dailyLog.slice().sort();
    let streak = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const d1 = new Date(days[i]), d2 = new Date(days[i - 1]);
      const diff = Math.round((d1 - d2) / 86400000);
      if (diff === 1) streak++; else break;
    }
    if (!state.dailyLog.includes(todayStr()) && days.length) {
      const last = new Date(days[days.length - 1]);
      const diff = Math.round((new Date() - last) / 86400000);
      return diff === 1 ? streak : 0;
    }
    return state.dailyLog.includes(todayStr()) ? streak : 0;
  }
  function addStat(isCorrect, timeSec) {
    if (!state.stats) state.stats = { answered: 0, correct: 0, timeSec: 0 };
    state.stats.answered++;
    if (isCorrect) state.stats.correct++;
    state.stats.timeSec += timeSec || 0;
    save(state);
  }

  /* ---- 收藏夹 ---- */
  function starKey(techId, qidx) { return techId + "::" + qidx; }
  function toggleStar(techId, qidx) {
    const k = starKey(techId, qidx);
    const i = state.starred.indexOf(k);
    if (i >= 0) state.starred.splice(i, 1); else state.starred.push(k);
    save(state);
    return i < 0;
  }
  function isStarred(techId, qidx) { return state.starred.indexOf(starKey(techId, qidx)) >= 0; }
  function starredCount() { return state.starred.length; }

  /* ---- 进度导出/导入 ---- */
  function exportProgress() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "方寸数学-学习进度-" + todayStr() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast("进度已导出，可发送给家长或老师查看");
  }
  function importProgress(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported || typeof imported !== "object") throw new Error("格式不对");
        if (confirm("导入将覆盖当前进度，确定继续？")) {
          state = imported;
          state.starred = state.starred || [];
          state.dailyLog = state.dailyLog || [];
          state.stats = state.stats || { answered: 0, correct: 0, timeSec: 0 };
          state.freeMode = !!state.freeMode;
          save(state); toast("进度已导入"); route();
        }
      } catch (e) { toast("文件格式不对，请选择导出的 JSON 文件"); }
    };
    reader.readAsText(file);
  }

  /* ---- 解锁模式切换 ---- */
  function setFreeMode(on) {
    state.freeMode = on; save(state);
    toast(on ? "已切换为自由探索模式" : "已切换为顺序解锁模式");
  }

  /* ---- 解锁规则（按年级动态计算，单一事实来源）----
   * 小学 1–6 年级、初中初一/初二（7、8 年级）：
   *   年级内顺序解锁——第一个技巧为入口，掌握后才会解锁本年级下一个。
   * 初三（9 年级）起：所有技巧均可单独进入（无前置依赖）。
   */
  const ORDER = {}; TECHNIQUES.forEach((t, i) => ORDER[t.id] = i);
  function effPrereq(t) {
    const g = gradeNum(t.grade);
    if (g >= 9) return null;                          // 初三及高中：全部独立入口
    const same = TECHNIQUES.filter(x => x.grade === t.grade)
      .sort((a, b) => ORDER[a.id] - ORDER[b.id]);     // 年级内按编写顺序
    const i = same.findIndex(x => x.id === t.id);
    return i > 0 ? same[i - 1].id : null;             // 首技巧为入口，其余依赖上一技巧
  }
  // 用新规则重写每项 prereq，后续 unlocked / 下一技巧 / 排序 直接复用
  TECHNIQUES.forEach(t => { t.prereq = effPrereq(t); });

  function tech(id) { return TECHNIQUES.find(t => t.id === id); }
  function tstate(id) { if (!state[id]) state[id] = { mastered: false, weak: {} }; return state[id]; }
  function unlocked(id) {
    if (state.freeMode) return true;               // 自由探索：全部开放
    const t = tech(id); return !t.prereq || !!(state[t.prereq] && state[t.prereq].mastered);
  }
  function weakCount() { let n = 0; for (const id in state) for (const k in state[id].weak) if (!state[id].weak[k].cleared) n++; return n; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function gradeNum(g) { const m = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "十一": 11, "十二": 12 }; const x = /([一二三四五六七八九十]+)年级/.exec(g || ""); return x ? (m[x[1]] || 99) : 99; }
  function sortGroup(arr) {
    return arr.slice().sort((a, b) => ORDER[a.id] - ORDER[b.id]);
  }

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function updateBadge() {
    const b = $("#weakBadge"); const n = weakCount();
    if (n > 0) { b.textContent = n; b.classList.add("show"); } else b.classList.remove("show");
  }
  function esc(s) { return (s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

  /* ---------------- 题目配图 ---------------- */
  function qfigSpec(t, qidx) {
    const q = t.questions[qidx];
    if (q && q.fig) return q.fig;                       // 题目自带
    const k = t.id + "::" + qidx;
    return (window.QFIG_MAP && window.QFIG_MAP[k]) || null; // 逐题注册表
  }
  function qfigSVG(t, qidx) {
    const spec = qfigSpec(t, qidx);
    if (!spec || !window.Fig) return "";
    let name, params = {};
    if (typeof spec === "string") name = spec;
    else { name = spec.name; params = spec; }
    if (!window.Fig[name]) return "";
    try { return `<div class="qfig">${window.Fig[name](params)}</div>`; }
    catch (e) { return ""; }
  }
  // 渲染单题自带配图（生成题也可用 q.fig 指定图元名或 {name,参数}）
  function renderFigOf(q) {
    if (!q || !q.fig || !window.Fig) return "";
    let name, params = {};
    if (typeof q.fig === "string") name = q.fig;
    else { name = q.fig.name; params = q.fig; }
    if (!window.Fig[name]) return "";
    try { return `<div class="qfig">${window.Fig[name](params)}</div>`; }
    catch (e) { return ""; }
  }

  /* ---------------- 路由 ---------------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/");
    const cur = parts[0] || "path";
    document.querySelectorAll(".nav-link").forEach(a => a.classList.toggle("active", a.dataset.route === cur));
    const ba = $("#backArr"); if (ba) ba.classList.toggle("show", cur !== "path");
    const vc = $("#verChip"); if (vc && vc.dataset.v !== APP_VERSION) { vc.textContent = "V " + APP_VERSION; vc.dataset.v = APP_VERSION; }
    updateBadge();
    window.scrollTo(0, 0);
    if (cur === "path") return renderPath();
    if (cur === "learn") return renderLearn(parts[1]);
    if (cur === "practice") return renderQuiz(parts[1], "practice");
    if (cur === "gate") return renderQuiz(parts[1], "gate");
    if (cur === "review") return renderReview();
    if (cur === "favorites") return renderFavorites();
    if (cur === "progress") return renderProgress();
    if (cur === "resources") return renderResources();
    if (cur === "about") return renderAbout();
    renderPath();
  }
  window.addEventListener("hashchange", route);

  // 顶栏返回箭头：从学习/练习页返回路径并定位到该技巧节点
  $("#backArr").addEventListener("click", () => {
    const p = location.hash.replace(/^#\/?/, "").split("/");
    if ((p[0] === "learn" || p[0] === "practice" || p[0] === "gate") && p[1]) return goPath(p[1]);
    location.hash = "#/path";
  });

  // 返回学习路径，并定位/高亮到指定技巧节点（避免回到页面最顶部）
  function goPath(techId) {
    pendingScrollTech = techId || null;
    if (location.hash.replace(/^#\/?/, "") === "path") renderPath();
    else location.hash = "#/path";
  }

  /* ---------------- 学习路径 ---------------- */
  function renderPath() {
    const v = view(); v.innerHTML = "";
    const h = document.createElement("h2"); h.className = "section"; h.textContent = "学习路径"; v.appendChild(h);
    const hint = document.createElement("div"); hint.className = "hint";
    hint.textContent = "按 小学 → 中学 → 高中 排列，细分到年级。小学各年级、初一·初二年级：年级内顺序解锁——第一个技巧是入口，掌握后才会解锁本年级下一个。初三及高中：所有技巧均可直接进入。练习做错的题进入「薄弱点」，复习通关才算掌握。";
    v.appendChild(hint);

    const STAGES = ["小学", "中学", "高中"];
    const STAGE_DESC = {
      "小学": "1–6 年级 · 数与代数、图形、奥数启蒙",
      "中学": "7–9 年级 · 初中代数、几何、函数",
      "高中": "10–12 年级 · 高中数学核心与专题"
    };
    const STAGE_GLYPH = { "小学": "＋", "中学": "√", "高中": "∫" };
    const groups = {};
    TECHNIQUES.forEach(t => { const k = t.stage + "|" + t.grade; (groups[k] = groups[k] || []).push(t); });

    let stepNo = 0;
    STAGES.forEach(stage => {
      const grades = [...new Set(TECHNIQUES.filter(t => t.stage === stage).map(t => t.grade))]
        .sort((a, b) => gradeNum(a) - gradeNum(b));
      if (!grades.length) return;
      const sb = document.createElement("div"); sb.className = "stage-banner"; sb.dataset.stage = stage;
      sb.innerHTML = `<span class="stage-name">${stage}</span><span class="stage-desc">${STAGE_DESC[stage]}</span><span class="stage-glyph">${STAGE_GLYPH[stage]}</span>`;
      v.appendChild(sb);
      grades.forEach(g => {
        const sub = document.createElement("div"); sub.className = "grade-sep"; sub.dataset.stage = stage;
        sub.innerHTML = `<span class="grade-tag">${g}</span><span class="grade-count">${groups[stage + "|" + g].length} 个技巧</span>`;
        v.appendChild(sub);
        sortGroup(groups[stage + "|" + g]).forEach(t => {
          stepNo++;
          const st = tstate(t.id);
          const open = unlocked(t.id);
          const status = !open ? "lock" : (st.mastered ? "done" : "learn");
          const node = document.createElement("div");
          node.className = "node " + (status === "done" ? "mastered" : status === "lock" ? "locked" : "");
          const weakN = Object.keys(st.weak).filter(k => !st.weak[k].cleared).length;
          node.innerHTML = `
            <div class="step">${status === "done" ? "✓" : stepNo}</div>
            <div class="body">
              <div class="title">${esc(t.name)}
                ${status === "lock" ? '<span class="lock-ico">🔒</span>' : ""}
                <span class="status-pill ${status === "lock" ? "lock" : status === "done" ? "done" : "learn"}">${status === "lock" ? "未解锁" : status === "done" ? "已掌握" : "学习中"}</span>
                ${weakN ? `<span class="tag w">薄弱点 ${weakN}</span>` : ""}
              </div>
              <div class="meta">${esc(t.summary)}</div>
              <div class="acts">
                ${open ? `<a class="btn sm" href="#/learn/${t.id}">去学习</a>` : ""}
                ${open ? `<a class="btn sm ghost" href="#/practice/${t.id}">练习</a>` : ""}
                ${open && !st.mastered ? `<a class="btn sm soft" href="#/gate/${t.id}">通关测试</a>` : ""}
              </div>
              ${status === "lock" ? `<div class="meta" style="color:var(--lock)">需先掌握：${esc(tech(t.prereq).name)}</div>` : ""}
            </div>`;
          node.id = "node-" + t.id;
          v.appendChild(node);
        });
      });
    });
    // 若从某技巧返回路径，自动定位并高亮该节点
    if (pendingScrollTech) {
      const el = document.getElementById("node-" + pendingScrollTech);
      if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800); }
      pendingScrollTech = null;
    }
  }

  /* ---------------- 学习页 ---------------- */
  function renderLearn(id) {
    const v = view(); v.innerHTML = "";
    const t = tech(id); if (!t) return renderPath();
    if (!unlocked(id)) { toast("先融会贯通上一技巧才能解锁"); location.hash = "#/path"; return; }
    const st = tstate(id);

    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `
      <div class="tech-head"><h2 class="section" style="margin:0">${esc(t.name)}</h2><span class="tag">${esc(t.grade)}</span></div>
      <div class="muted">${esc(t.summary)}</div>
      <div class="kou"><b>名师口诀：</b>${esc(t.kou)}</div>
      <h3>解题步骤</h3>
      <ol class="steps">${t.steps.map(s => `<li>${s}</li>`).join("")}</ol>`;
    v.appendChild(card);

    if (t.anim && window.Anim && window.Anim[t.anim]) {
      const aw = document.createElement("div"); aw.className = "card";
      aw.innerHTML = `<h3>动图演示</h3><div class="anim-wrap" id="animBox"></div>`;
      v.appendChild(aw);
      window.Anim[t.anim](aw.querySelector("#animBox"));
    }

    const acts = document.createElement("div"); acts.className = "row";
    acts.style.margin = "4px 0 18px";
    acts.innerHTML = `
      <a class="btn" href="#/practice/${t.id}">开始练习（${typeof t.qgen === "function" ? "每轮 8 题·随机" : t.questions.length + " 题"}）</a>
      ${!st.mastered ? `<a class="btn soft" href="#/gate/${t.id}">通关测试</a>` : `<span class="status-pill done">已掌握</span>`}
      <a class="btn ghost" id="backBtnL" href="#/path">返回路径</a>`;
    v.appendChild(acts);
    acts.querySelector("#backBtnL").addEventListener("click", (e) => { e.preventDefault(); goPath(t.id); });
  }

  /* ---------------- 练习 / 通关 ---------------- */
  function shuffleOptions(q) {
    const idx = q.opts.map((_, i) => i);
    const sh = shuffle(idx);
    return { opts: sh.map(i => q.opts[i]), ans: sh.indexOf(q.ans) };
  }

  // 判断题识别：仅 2 个选项且语义为「对/错」
  function isJudge(q) {
    if (!q.opts || q.opts.length !== 2) return false;
    const s = q.opts.map(x => String(x).trim());
    const yes = s.some(x => x === "对" || x === "正确");
    const no = s.some(x => x === "错" || x === "错误");
    return yes && no;
  }
  // 判断题标记：对 / 错
  function judgeMark(text) {
    const t = String(text).trim();
    return (t === "对" || t === "正确") ? "对" : "错";
  }

  function renderQuiz(id, mode) {
    const v = view(); v.innerHTML = "";
    const t = tech(id); if (!t) return renderPath();
    if (!unlocked(id)) { toast("先融会贯通上一技巧才能解锁"); location.hash = "#/path"; return; }
    const st = tstate(id);

    const genMode = typeof t.qgen === "function";
    let items; // {q, qidx, gen}
    if (genMode) {
      // 参数化出题：每次生成全新随机题，真正不重样（第一遍/第二遍/第三遍都不同）
      items = t.qgen(8).map((q, idx) => ({ q, qidx: idx, gen: true }));
    } else {
      let pool;
      if (mode === "gate") {
        const weakIdx = Object.keys(st.weak).filter(k => !st.weak[k].cleared).map(Number);
        const rest = shuffle(t.questions.map((_, i) => i)).filter(i => !weakIdx.includes(i));
        pool = weakIdx.concat(rest).slice(0, Math.max(5, weakIdx.length));
      } else {
        // 自由练习：每次随机抽题（随机子集 + 随机顺序），避免每次都是同一批固定题
        // 题少（≤6 道）时全部出示；题多时抽约 70%，且至少出 5 道，保证「每轮不少于 5 题」
        const n = t.questions.length;
        const k = n <= 6 ? n : Math.max(5, Math.ceil(n * 0.7));
        pool = shuffle(t.questions.map((_, i) => i)).slice(0, k);
      }
      items = pool.map(i => ({ q: t.questions[i], qidx: i, gen: false }));
    }
    const total = items.length;
    let answered = 0, correct = 0;

    const head = document.createElement("div"); head.className = "card";
    head.innerHTML = `<div class="tech-head"><h2 class="section" style="margin:0">${esc(t.name)} · ${mode === "gate" ? "通关测试" : "自由练习"}</h2>
      <span class="tag">${mode === "gate" ? "需 ≥80% 且薄弱点清零" : "不限量"}</span></div>
      <div class="muted">${mode === "gate" ? "通关测试会优先把你之前的薄弱点放进题里；全部答对并清零薄弱点，才算融会贯通、解锁下一技巧。" : "随手练，做错自动记入薄弱点，可去「薄弱点复习」集中攻克。"}</div>`;
    v.appendChild(head);

    const list = document.createElement("div"); v.appendChild(list);

    function finish() {
      const weakRemain = Object.keys(st.weak).filter(k => !st.weak[k].cleared).length;
      const banner = document.createElement("div"); banner.className = "card center";
      if (mode === "gate") {
        const pass = correct >= Math.ceil(total * 0.8) && weakRemain === 0;
        if (pass) {
          st.mastered = true; save(state);
          const nxt = TECHNIQUES.find(x => x.prereq === t.id);
          const freeToEnter = gradeNum(t.grade) >= 9;
          banner.innerHTML = `<div class="qres" style="color:var(--ok)">融会贯通！${esc(t.name)} 已掌握</div>
            ${nxt ? `<div class="muted">下一技巧已解锁：<b>${esc(nxt.name)}</b></div>
              <a class="btn" href="#/learn/${nxt.id}" style="margin-top:10px">去学习 ${esc(nxt.name)}</a>`
              : (freeToEnter ? `<div class="muted">本年级所有技巧均可直接进入，按需挑选下一个继续吧。</div>`
                : `<div class="muted">已是本年级最后一道技巧，全部通关！</div>`)}`;
        } else {
          banner.innerHTML = `<div class="qres" style="color:var(--warn)">还差一点：本次正确 ${correct}/${total}${weakRemain ? `，还有 ${weakRemain} 个薄弱点没清零` : ""}</div>
            <div class="muted">去「薄弱点复习」或再练几组，清零后才能通关。</div>
            <a class="btn soft" href="#/review" style="margin-top:8px">去复习薄弱点</a>`;
        }
      } else {
        banner.innerHTML = `<div class="qres">本轮完成 ${total} 题，正确 ${correct} 题。</div>
          <a class="btn ghost" id="backBtn2" href="#/path">返回路径</a>`;
        banner.querySelector("#backBtn2").addEventListener("click", (e) => { e.preventDefault(); goPath(t.id); });
      }
      list.appendChild(banner);
      updateBadge();
    }

    items.forEach((it, qi) => {
      const q = it.q;
      const judge = isJudge(q);
      const disp = judge ? { opts: q.opts, ans: q.ans } : shuffleOptions(q);
      const card = document.createElement("div"); card.className = "q"; card.dataset.done = "0";
      const tag = q.level === "易错" ? '<span class="tag w">易错</span>' : (q.level === "进阶" ? '<span class="tag g">进阶</span>' : '<span class="tag">基础</span>');
      const fig = renderFigOf(q);
      card.innerHTML = `<div class="qtext">${qi + 1}. ${esc(q.q)} ${tag}</div>
        ${fig}
        <div class="opts${judge ? " judge" : ""}">${disp.opts.map((o, i) => `<div class="opt${judge ? " judge" : ""}" data-i="${i}"><span class="mark${judge ? " judge" : ""}">${judge ? judgeMark(o) : String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></div>`).join("")}</div>`;
      list.appendChild(card);

      const opts = card.querySelectorAll(".opt");
      opts.forEach(op => op.addEventListener("click", () => {
        if (card.dataset.done === "1") return;
        card.dataset.done = "1";
        const chosen = +op.dataset.i;
        const ans = disp.ans;
        opts.forEach((o, i) => { o.style.pointerEvents = "none"; if (i === ans) o.classList.add("correct"); });
        if (chosen === ans) op.classList.add("correct"); else op.classList.add("wrong");
        const ex = document.createElement("div"); ex.className = "explain"; ex.innerHTML = "解析：" + esc(q.explain); card.appendChild(ex);

        if (chosen === ans) {
          correct++;
          if (it.gen) { st.weak[t.id] = { fails: 0, cleared: true }; }
          else if (st.weak["" + it.qidx]) st.weak["" + it.qidx].cleared = true;
        } else {
          if (it.gen) { st.weak[t.id] = st.weak[t.id] || { fails: 0, cleared: false }; st.weak[t.id].fails++; st.weak[t.id].cleared = false; }
          else { if (!st.weak["" + it.qidx]) st.weak["" + it.qidx] = { fails: 0, cleared: false }; st.weak["" + it.qidx].fails++; st.weak["" + it.qidx].cleared = false; }
        }
        save(state); updateBadge();
        answered++;
        if (answered === total) finish();
      }));
    });

    if (mode === "practice") {
      const again = document.createElement("div"); again.className = "row"; again.style.margin = "6px 0 16px";
      again.innerHTML = `<a class="btn ghost" id="againBtn" href="#/practice/${t.id}">再练一组</a><a class="btn soft" id="backBtn" href="#/path">返回路径</a>`;
      v.appendChild(again);
      // 关键修复：当前页 hash 与按钮 href 相同，hashchange 不会触发，需手动强制重渲染
      again.querySelector("#againBtn").addEventListener("click", (e) => {
        e.preventDefault();
        renderQuiz(t.id, "practice"); // 重新进入会重新随机抽题 / 重新生成，做到「再练一组」立即出新题
      });
      // 返回路径时，定位到当前练习的技巧节点，而不是回到页面顶部
      again.querySelector("#backBtn").addEventListener("click", (e) => {
        e.preventDefault();
        goPath(t.id);
      });
    }
  }

  /* ---------------- 薄弱点复习 ---------------- */
  function renderReview() {
    const v = view(); v.innerHTML = "";
    const h = document.createElement("h2"); h.className = "section"; h.textContent = "薄弱点复习"; v.appendChild(h);
    const items = [];
    TECHNIQUES.forEach(t => {
      const st = tstate(t.id);
      const gen = typeof t.qgen === "function";
      Object.keys(st.weak).forEach(k => {
        if (st.weak[k].cleared) return;
        if (gen) {
          // 参数化方法：薄弱点指向“整个方法”，复习时重新生成一道随机题来攻克
          items.push({ t, q: t.qgen(1)[0], gen: true, key: t.id });
        } else {
          items.push({ t, q: t.questions[+k], gen: false, key: "" + k });
        }
      });
    });
    if (!items.length) {
      v.innerHTML += `<div class="empty">暂时没有薄弱点，继续保持！</div>`;
      return;
    }
    const tip = document.createElement("div"); tip.className = "hint";
    tip.textContent = `共 ${items.length} 个薄弱点。在这里把它们做对，就能从「薄弱点」中清除；相关技巧的通关测试也会优先考这些。`;
    v.appendChild(tip);

    let done = 0, ok = 0;
    const list = document.createElement("div"); v.appendChild(list);
    items.forEach((it, i) => {
      const q = it.q;
      const judge = isJudge(q);
      const disp = judge ? { opts: q.opts, ans: q.ans } : shuffleOptions(q);
      const card = document.createElement("div"); card.className = "q"; card.dataset.done = "0";
      const fig = renderFigOf(q);
      card.innerHTML = `<div class="qtext">${esc(it.t.name)} ｜ ${i + 1}. ${esc(q.q)}</div>
        ${fig}
        <div class="opts${judge ? " judge" : ""}">${disp.opts.map((o, j) => `<div class="opt${judge ? " judge" : ""}" data-i="${j}"><span class="mark${judge ? " judge" : ""}">${judge ? judgeMark(o) : String.fromCharCode(65 + j)}</span><span>${esc(o)}</span></div>`).join("")}</div>`;
      list.appendChild(card);
      const opts = card.querySelectorAll(".opt");
      opts.forEach(op => op.addEventListener("click", () => {
        if (card.dataset.done === "1") return; card.dataset.done = "1";
        const chosen = +op.dataset.i;
        const ans = disp.ans;
        opts.forEach((o, j) => { o.style.pointerEvents = "none"; if (j === ans) o.classList.add("correct"); });
        if (chosen === ans) op.classList.add("correct"); else op.classList.add("wrong");
        const ex = document.createElement("div"); ex.className = "explain"; ex.innerHTML = "解析：" + esc(q.explain); card.appendChild(ex);
        const st = tstate(it.t.id);
        if (chosen === ans) { st.weak[it.key].cleared = true; ok++; }
        else { st.weak[it.key].cleared = false; }
        save(state); updateBadge(); done++;
        if (done === items.length) {
          const b = document.createElement("div"); b.className = "card center";
          b.innerHTML = `<div class="qres" style="color:var(--ok)">本轮复习 ${items.length} 题，清空 ${ok} 个薄弱点。</div>
            <a class="btn ghost" href="#/review">刷新</a>`;
          list.appendChild(b);
        }
      }));
    });
  }

  /* ---------------- 进度 ---------------- */
  function renderProgress() {
    const v = view(); v.innerHTML = "";
    const total = TECHNIQUES.length;
    const mastered = TECHNIQUES.filter(t => state[t.id] && state[t.id].mastered).length;
    const learning = TECHNIQUES.filter(t => unlocked(t.id) && !(state[t.id] && state[t.id].mastered)).length;
    const locked = total - mastered - learning;
    const wn = weakCount();

    const grid = document.createElement("div"); grid.className = "stat-grid";
    grid.innerHTML = `
      <div class="stat"><div class="n">${mastered}</div><div class="l">已掌握</div></div>
      <div class="stat"><div class="n">${learning}</div><div class="l">学习中</div></div>
      <div class="stat"><div class="n">${locked}</div><div class="l">未解锁</div></div>
      <div class="stat"><div class="n">${wn}</div><div class="l">薄弱点</div></div>`;
    v.appendChild(grid);

    const pct = Math.round(mastered / total * 100);
    const bar = document.createElement("div"); bar.className = "card";
    bar.innerHTML = `<div class="muted">总通关进度 ${pct}%</div><div class="bar"><i style="width:${pct}%"></i></div>`;
    v.appendChild(bar);

    const reset = document.createElement("div"); reset.className = "row"; reset.style.marginTop = "8px";
    reset.innerHTML = `<button class="btn ghost sm" id="resetBtn">重置全部进度</button>`;
    v.appendChild(reset);
    $("#resetBtn").addEventListener("click", () => {
      if (confirm("确定清空所有学习进度与薄弱点记录？")) { state = {}; save(state); toast("已重置"); route(); }
    });

    const h = document.createElement("h3"); h.textContent = "各技巧状态"; v.appendChild(h);
    const tree = document.createElement("div"); tree.className = "tree";
    const STAGES = ["小学", "中学", "高中"];
    const groups = {};
    TECHNIQUES.forEach(t => { const k = t.stage + "|" + t.grade; (groups[k] = groups[k] || []).push(t); });
    STAGES.forEach(stage => {
      const grades = [...new Set(TECHNIQUES.filter(t => t.stage === stage).map(t => t.grade))]
        .sort((a, b) => gradeNum(a) - gradeNum(b));
      if (!grades.length) return;
      const sb = document.createElement("div"); sb.className = "stage-banner sm"; sb.dataset.stage = stage;
      sb.innerHTML = `<span class="stage-name">${stage}</span>`;
      tree.appendChild(sb);
      grades.forEach(g => {
        const sub = document.createElement("div"); sub.className = "grade-sep"; sub.dataset.stage = stage;
        sub.innerHTML = `<span class="grade-tag">${g}</span><span class="grade-count">${groups[stage + "|" + g].length} 个技巧</span>`;
        tree.appendChild(sub);
        sortGroup(groups[stage + "|" + g]).forEach(t => {
          const st = tstate(t.id);
          const open = unlocked(t.id);
          const status = !open ? "lock" : (st.mastered ? "done" : "learn");
          const weakN = Object.keys(st.weak).filter(k => !st.weak[k].cleared).length;
          const node = document.createElement("div");
          node.className = "node " + (status === "done" ? "mastered" : status === "lock" ? "locked" : "");
          node.innerHTML = `<div class="step">${status === "done" ? "通" : (open ? "●" : "锁")}</div>
            <div class="body"><div class="title">${esc(t.name)}
              <span class="status-pill ${status === "lock" ? "lock" : status === "done" ? "done" : "learn"}">${status === "lock" ? "未解锁" : status === "done" ? "已掌握" : "学习中"}</span>
              ${weakN ? `<span class="tag w">薄弱点 ${weakN}</span>` : ""}</div>
            ${open ? `<div class="acts"><a class="btn sm" href="#/practice/${t.id}">练习</a>${!st.mastered ? `<a class="btn sm soft" href="#/gate/${t.id}">通关</a>` : ""}</div>` : ""}</div>`;
          tree.appendChild(node);
        });
      });
    });
    v.appendChild(tree);
  }

  /* ---------------- 相关项目推荐 ---------------- */
  function renderResources() {
    const v = view(); v.innerHTML = "";
    const h = document.createElement("h2"); h.className = "section"; h.textContent = "相关项目与资源"; v.appendChild(h);
    const hint = document.createElement("div"); hint.className = "hint";
    hint.textContent = "这里汇集了和「融会贯通」定位相近的可视化数学学习项目：动画引擎、开源练习平台、商业参考课程、资源清单。点击卡片可访问官网或仓库。";
    v.appendChild(hint);

    const cats = window.RELATED_PROJECTS || [];
    cats.forEach(cat => {
      const wrap = document.createElement("div"); wrap.className = "card";
      wrap.innerHTML = `<h3 class="res-cat">${esc(cat.category)}</h3>
        <div class="res-desc">${esc(cat.desc)}</div>`;
      const grid = document.createElement("div"); grid.className = "res-grid";
      (cat.items || []).forEach(it => {
        const link = it.cnUrl || it.url;
        const card = document.createElement("a");
        card.className = "res-item";
        card.href = link;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        const tags = (it.tags || []).map(tg => `<span class="res-tag">${esc(tg)}</span>`).join("");
        card.innerHTML = `
          <div class="res-head">
            <span class="res-name">${esc(it.name)}</span>
            <span class="res-tags">${tags}</span>
          </div>
          <div class="res-summary">${esc(it.summary)}</div>
          <div class="res-why"><b>为什么收录：</b>${esc(it.why)}</div>
          <div class="res-url">${esc(link)}</div>`;
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      v.appendChild(wrap);
    });

    if (!cats.length) {
      v.innerHTML += `<div class="empty">暂无推荐资源</div>`;
    }
  }

  /* ---------------- 关于 ---------------- */
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise((res) => {
      const ta = document.createElement("textarea");
      ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove(); res();
    });
  }
  function renderAbout() {
    const v = view();
    const total = TECHNIQUES.length;
    const gens = TECHNIQUES.filter(t => typeof t.qgen === "function").length;
    const grades = new Set(TECHNIQUES.map(t => t.grade)).size;
    v.innerHTML = `
      <div class="about-hero">
        <span class="glyph g1">π</span><span class="glyph g2">∑</span><span class="glyph g3">√</span><span class="glyph g4">∫</span>
        <div class="seal">∑</div>
        <div class="ah-name">融会贯通</div>
        <div class="ah-sub">中小学数学技巧教练</div>
        <div class="ah-chips">
          <span class="ah-chip">V ${APP_VERSION} · ${APP_EDITION}版</span>
          <span class="ah-chip alt">构建日期 ${APP_BUILD}</span>
        </div>
      </div>

      <div class="card">
        <h3 class="about-h">关于本软件</h3>
        <p class="about-p">「融会贯通」是一款覆盖小学、初中、高中三个学段的数学技巧学习工具。它把每个考点提炼为「名师口诀、解题步骤、动图演示、随机练习」四步闭环，配合通关测试与薄弱点复习，帮助学生真正吃透每一个方法，而不是刷完就忘。</p>
        <div class="feat-grid">
          <div class="feat"><div class="feat-t">学习路径</div><div class="feat-d">${total} 个技巧按学段与年级递进排列，循序渐进解锁</div></div>
          <div class="feat"><div class="feat-t">随机出题</div><div class="feat-d">${gens} 个参数化引擎，每轮题目即时生成、不重样</div></div>
          <div class="feat"><div class="feat-t">薄弱点复习</div><div class="feat-d">做错自动收录为薄弱点，攻克清零才能通关</div></div>
          <div class="feat"><div class="feat-t">通关测试</div><div class="feat-d">正确率不低于 80% 且薄弱点清零，方为融会贯通</div></div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat"><div class="n">${total}</div><div class="l">学习技巧</div></div>
        <div class="stat"><div class="n">${gens}</div><div class="l">随机引擎</div></div>
        <div class="stat"><div class="n">${grades}</div><div class="l">覆盖年级</div></div>
        <div class="stat"><div class="n">3</div><div class="l">学习学段</div></div>
      </div>

      <div class="wechat-card">
        <div class="wc-ico">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path fill="#07c160" d="M11.7 6C7.4 6 3.9 8.9 3.9 12.5c0 2 1.1 3.8 2.8 5l-.7 2.3 2.6-1.3c.9.3 1.9.4 2.8.4h.5c-.2-.6-.3-1.2-.3-1.9 0-3.4 3.3-6.1 7.3-6.1h.4C18.3 8.2 15.3 6 11.7 6z"/>
            <circle cx="8.8" cy="10.4" r=".9" fill="#fff"/><circle cx="14.2" cy="10.4" r=".9" fill="#fff"/>
            <path fill="#07c160" d="M28.1 16.9c0-3-2.9-5.4-6.5-5.4s-6.5 2.4-6.5 5.4 2.9 5.4 6.5 5.4c.8 0 1.5-.1 2.2-.4l2.3 1.2-.6-2c1.6-.9 2.6-2.4 2.6-4.2z"/>
            <circle cx="19.4" cy="15.6" r=".8" fill="#fff"/><circle cx="24" cy="15.6" r=".8" fill="#fff"/>
          </svg>
        </div>
        <div class="wc-body">
          <div class="wc-t">微信公众号</div>
          <div class="wc-name">NGZ南歌</div>
          <div class="wc-d">关注微信公众号：NGZ南歌，获取版本动态与学习资料</div>
        </div>
        <button class="btn sm" id="copyWx">复制 ID</button>
      </div>

      <div class="about-foot">学而时习之，不亦说乎<br><span>融会贯通 V ${APP_VERSION} · ${APP_EDITION}版</span></div>`;
    $("#copyWx").addEventListener("click", async () => {
      try { await copyText("NGZ南歌"); toast("已复制公众号：NGZ南歌"); }
      catch (e) { toast("复制失败，请手动关注：NGZ南歌"); }
    });
  }

  route();
})();
