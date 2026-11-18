/* WhatAi — docs router on clean paths (/docs, /docs/<page>). */
(function () {
  const { Chain, esc } = window.WA;
  const pages = [...document.querySelectorAll("[data-page]")].map((a) => a.dataset.page);

  function slug() {
    const s = location.pathname.replace(/^\/docs\/?/, "").replace(/\/+$/, "").replace(/\.html$/, "");
    return pages.includes(s) ? s : "introduction";
  }

  function show() {
    const s = slug();
    document.querySelectorAll("[data-page]").forEach((a) => (a.hidden = a.dataset.page !== s));
    document.querySelectorAll("[data-doc]").forEach((a) => a.classList.toggle("on", a.dataset.doc === s));
    const h = document.querySelector(`[data-page="${s}"] h1`);
    document.title = (s === "introduction" ? "Docs" : h ? h.textContent : "Docs") + " — WhatAi";
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='/docs']");
    if (!a || e.metaKey || e.ctrlKey || a.target) return;
    e.preventDefault();
    if (a.getAttribute("href") !== location.pathname) history.pushState(null, "", a.getAttribute("href"));
    show();
  });
  window.addEventListener("popstate", show);

  document.getElementById("netCards").innerHTML = Chain.list().map((n) => {
    const ca = Chain.ca(n.id), ex = Chain.explorer(n.id);
    return `<div class="card net-card" style="--net:${esc(n.color)}">
      <img src="${esc(n.icon)}" width="36" height="36" alt="">
      <div><b>${esc(n.name)}</b><span>${n.type === "solana" ? "Solana" : "EVM · Chain ID " + esc(n.chainId)}</span>
      ${ex ? `<a href="${esc(ex)}" target="_blank" rel="noopener">View token on explorer</a>` : `<em>${ca ? "" : "CA coming soon"}</em>`}</div>
    </div>`;
  }).join("");

  window.WA.renderShared();
  show();
})();
