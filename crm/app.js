(() => {
  const CFG = window.CRM_CONFIG;
  const $ = (id) => document.getElementById(id);
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---- state ----------------------------------------------------------------
  const state = {
    vertical: CFG.verticals[LS.get("crm.vertical")] ? LS.get("crm.vertical") : CFG.defaultVertical,
    key: LS.get("crm.key") || "",
  };

  // ---- screen-pop parameters --------------------------------------------------
  // ?q=<id|mobile|email>  or  ?customer=<id>  ?mobile=<no>  ?email=<addr>   &vertical=telecom   #key=crm_...
  function readLink() {
    const p = new URLSearchParams(location.search);
    const h = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (h.get("key")) { state.key = h.get("key"); LS.set("crm.key", state.key); }
    const v = p.get("vertical");
    if (v && CFG.verticals[v]) { state.vertical = v; LS.set("crm.vertical", v); }
    const q = p.get("q") || p.get("customer") || p.get("customer_id") || p.get("mobile") || p.get("email") || "";
    // keep the key out of the address bar and history
    if (h.get("key")) history.replaceState(null, "", location.pathname + location.search);
    return q.trim();
  }

  // ---- branding / vertical -----------------------------------------------------
  function applyVertical() {
    const v = CFG.verticals[state.vertical];
    $("logo").src = v.logo; $("logo").alt = v.label;
    document.title = v.label + " CRM";
    const vh = $("verticalHint"); if (vh) vh.textContent = "Vertical: " + v.label + (state.key ? "" : " · no CRM key set, open Settings (gear) to add one");
  }

  // ---- settings dialog ---------------------------------------------------------
  const dlg = $("settings");
  $("gear").onclick = () => {
    $("verticalSel").innerHTML = Object.entries(CFG.verticals).map(([k, v]) => `<option value="${esc(k)}"${k === state.vertical ? " selected" : ""}>${esc(v.label)}</option>`).join("");
    $("keyInput").value = state.key; $("settingsMsg").textContent = "";
    dlg.showModal();
  };
  $("closeSettings").onclick = () => dlg.close();
  $("clearKey").onclick = () => { state.key = ""; LS.del("crm.key"); $("keyInput").value = ""; $("settingsMsg").textContent = "Key removed from this browser."; applyVertical(); };
  $("settingsForm").addEventListener("submit", async () => {
    state.vertical = $("verticalSel").value; LS.set("crm.vertical", state.vertical);
    state.key = $("keyInput").value.trim();
    state.key ? LS.set("crm.key", state.key) : LS.del("crm.key");
    applyVertical();
  });

  // ---- API ----------------------------------------------------------------------
  async function api(body) {
    const res = await fetch(CFG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + state.key },
      body: JSON.stringify({ vertical: state.vertical, ...body }),
    });
    let j = {}; try { j = await res.json(); } catch {}
    return { status: res.status, body: j };
  }

  // ---- formatting ----------------------------------------------------------------
  const money = (n, cur) => n == null ? "–" : (cur === "SGD" || !cur ? "S$" : cur + " ") + Number(n).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (d) => d ? new Date(d.length <= 10 ? d + "T00:00:00" : d).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" }) : "–";
  const when = (d) => d ? new Date(d).toLocaleString("en-SG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "–";
  const gb = (mb) => mb == null ? "–" : (mb / 1024).toFixed(1) + " GB";
  const label = (s) => esc(String(s ?? "").replace(/_/g, " "));
  const pct = (u, a) => (a ? Math.min(100, Math.round((u / a) * 100)) : 0);
  const cls = (p) => (p >= 90 ? "bad" : p >= 75 ? "warn" : "");

  const bar = (name, used, total, fmt) => {
    if (total == null) return `<div class="bl"><span>${esc(name)}</span><span>${fmt(used)} used · Unlimited</span></div><div class="bar"></div>`;
    const p = pct(used, total);
    return `<div class="bl"><span>${esc(name)}</span><span>${fmt(used)} / ${fmt(total)} (${p}%)</span></div><div class="bar"><i class="${cls(p)}" style="width:${p}%"></i></div>`;
  };

  // ---- render ----------------------------------------------------------------------
  function show(html) { $("main").innerHTML = html; }

  function render(r) {
    const c = r.customer, v = r.view || {}, d = v.data || {}, s = v.summary || {}, cur = CFG.verticals[state.vertical].currency;
    const sub = (d.subscriptions || [])[0], bill = d.latest_bill, ini = ((c.first_name || "?")[0] + (c.last_name || "")[0]).toUpperCase();
    const vip = v.customer && v.customer.vip;
    const cards = (s.cards || []).map((k) => `<div class="kpi ${esc(k.status || "")}"><div class="l">${esc(k.label)}</div><div class="v">${esc(k.value)}</div></div>`).join("");

    const plan = sub ? `<dl>
        <dt>Plan</dt><dd>${esc(sub.plan_name)} · ${money(sub.plan_price, cur)}/mo</dd>
        <dt>Number</dt><dd>${esc(sub.msisdn)}</dd>
        <dt>Network</dt><dd>${esc(sub.network)} · ${label(sub.billing_type)}</dd>
        <dt>Device</dt><dd>${esc(sub.device_model || "–")}</dd>
        <dt>Contract ends</dt><dd>${date(sub.contract_end)}</dd>
        <dt>Early termination fee</dt><dd>${money(sub.early_termination_fee, cur)}</dd>
        <dt>Roaming</dt><dd>${sub.roaming_enabled ? "On" : "Off"}</dd>
        <dt>Add-ons</dt><dd>${(sub.addons || []).length ? (sub.addons || []).map((a) => esc(a.name || a.item_code || a)).join(", ") : "None"}</dd>
      </dl>` : `<p class="muted">No active subscription.</p>`;

    const u = sub && sub.usage_current, al = sub && sub.allowance;
    const usage = u && al ? `${bar("Data", u.data_mb, al.data_mb, gb)}${bar("Voice", u.voice_min, al.voice_min, (x) => x + " min")}${bar("SMS", u.sms, al.sms, (x) => x)}
        <p class="hint">Period from ${date(u.period)}${u.roaming_charges ? " · roaming charges " + money(u.roaming_charges, cur) : ""}</p>` : `<p class="muted">No usage data.</p>`;

    const billHtml = bill ? `<dl>
        <dt>Period</dt><dd>${date(bill.period_start)} – ${date(bill.period_end)}</dd>
        <dt>Total</dt><dd>${money(bill.total, cur)} <span class="muted">(${bill.change_pct > 0 ? "+" : ""}${bill.change_pct ?? 0}% vs previous)</span></dd>
        <dt>Status</dt><dd><span class="st ${esc(bill.status)}">${label(bill.status)}</span></dd>
        <dt>Outstanding</dt><dd>${money(bill.outstanding, cur)}</dd>
        <dt>Due</dt><dd>${date(bill.due_date)}</dd></dl>
      <table style="margin-top:10px"><tbody>${(bill.lines || []).map((l) => `<tr><td>${esc(l.description)}</td><td class="n">${money(l.amount, cur)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No bills.</p>`;

    const cases = (r.cases || []).length ? `<table><thead><tr><th>Case</th><th>Type</th><th>Status</th><th>Raised</th></tr></thead><tbody>${r.cases.map((x) =>
      `<tr><td><b>${esc(x.case_reference)}</b><br><span class="muted">${esc(x.description || "")}</span></td><td>${label(x.request_type)}</td><td><span class="st ${esc(x.status)}">${label(x.status)}</span></td><td>${when(x.raised_at)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No cases.</p>`;

    const offers = (d.offers || []).length ? d.offers.map((o) => `<div class="offer"><b>${esc(o.headline)}</b>${esc(o.description || "")}<br><span class="muted">${o.price != null ? money(o.price, cur) + " · " : ""}valid until ${date(o.valid_until)}</span></div>`).join("") : `<p class="muted">No offers.</p>`;

    const out = (d.outages || []).length ? `<div class="panel"><h3>Network outage in area</h3>${d.outages.map((o) => `<p><b>${esc(o.area || "Outage")}</b> <span class="st open">${label(o.status)}</span><br>${esc(o.description || "")}<br><span class="muted">Since ${when(o.started_at)}${o.eta ? " · ETA " + when(o.eta) : ""}</span></p>`).join("")}</div>` : "";

    const tl = (r.interactions || []).length ? `<ul class="tl">${r.interactions.map((i) =>
      `<li><div class="t">${when(i.started_at)}<br><span class="by">${label(i.handled_by)}</span></div><div><b>${label(i.intent)}</b> · ${label(i.channel)} · ${label(i.outcome)}<br>${esc(i.summary || "")}</div></li>`).join("")}</ul>` : `<p class="muted">No interactions yet.</p>`;

    show(`
      <section class="who"><div class="avatar">${esc(ini)}</div>
        <div><h2>${esc(c.name)} ${vip ? '<span class="tag vip">VIP</span>' : ""}</h2>
          <div class="meta"><span>ID ${esc(c.customer_id)}</span><span>${esc(c.mobile_no ? "+" + String(c.mobile_no).replace(/^\+/, "") : "")}</span><span>${esc(c.email)}</span><span>${esc((v.customer && v.customer.service_area) || c.city || "")}</span>${v.customer && v.customer.tenure_months != null ? `<span>${esc(v.customer.tenure_months)} months with us</span>` : ""}</div></div>
      </section>
      ${s.headline ? `<div class="headline">${esc(s.headline)}</div>` : ""}
      <div class="cards">${cards}</div>
      <div class="grid">
        <div class="panel"><h3>Plan & line</h3>${plan}</div>
        <div class="panel"><h3>Usage this month</h3>${usage}</div>
        <div class="panel"><h3>Latest bill</h3>${billHtml}</div>
        <div class="panel"><h3>Offers</h3>${offers}</div>
        ${out}
        <div class="panel wide"><h3>Cases</h3>${cases}</div>
        <div class="panel wide"><h3>Interaction timeline</h3>${tl}</div>
      </div>`);
  }

  // ---- search ------------------------------------------------------------------------
  let seq = 0;
  async function search(q) {
    q = (q || "").trim(); if (!q) return;
    $("q").value = q;
    if (!state.key) {
      show(`<div class="msg"><h3>CRM key needed</h3>Open Settings (gear icon) and paste the CRM key, or open a screen-pop link that carries it.</div>`);
      return;
    }
    const my = ++seq;
    show(`<div class="loading">Searching…</div>`);
    let r;
    try { r = await api({ q }); } catch { if (my === seq) show(`<div class="msg err"><h3>Can't reach the CRM service</h3>Check your connection and try again.</div>`); return; }
    if (my !== seq) return;
    if (r.status === 401 || r.status === 403) {
      show(`<div class="msg err"><h3>${r.status === 401 ? "CRM key not accepted" : "Key not allowed for this vertical"}</h3>Open Settings (gear icon) and check the key and vertical.</div>`); return;
    }
    if (!r.body.ok) { show(`<div class="msg err"><h3>Search failed</h3>${esc(r.body.error && r.body.error.message || "Please try again.")}</div>`); return; }
    if (!r.body.found) { show(`<div class="msg"><h3>No customer found</h3>Nothing matches “${esc(q)}” in ${esc(CFG.verticals[state.vertical].label)}. Try the customer id, the full mobile number (with country code) or the email.</div>`); return; }
    render(r.body);
    try { history.replaceState(null, "", location.pathname + "?q=" + encodeURIComponent(q)); } catch {}
  }

  $("searchForm").addEventListener("submit", (e) => { e.preventDefault(); search($("q").value); });

  // ---- start ------------------------------------------------------------------------------
  const first = readLink();
  applyVertical();
  if (first) search(first);
})();
