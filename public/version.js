const versionWidgets = document.querySelectorAll("[data-version-widget]");
const UPDATE_TOKEN_KEY = "sqlsimulator-update-token-v1";
const HISTORY_PAGE_SIZE = 8;
let historyPage = 1;
let historyOverlay = null;
let historyList = null;
let historyMeta = null;
let historyPrev = null;
let historyNext = null;
let repoMetaElements = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value) {
  if (!value) return "未知时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ensureHistoryButton(widget) {
  if (widget.querySelector("[data-history-button]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.historyButton = "";
  button.textContent = "更新历史";
  widget.appendChild(button);
}

function ensureRepoMeta() {
  document.querySelectorAll(".nav-tools").forEach((tools) => {
    if (tools.querySelector("[data-repo-meta]")) return;
    const link = document.createElement("a");
    link.className = "nav-repo-meta";
    link.dataset.repoMeta = "";
    link.href = "https://github.com/SummerXDsss/MySQLSimulator";
    link.target = "_blank";
    link.rel = "noreferrer";
    link.hidden = true;
    link.innerHTML = `
      <svg class="github-mini-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      <span data-repo-branch>main</span>
      <strong data-repo-version>v0.0.0</strong>
    `;
    tools.insertBefore(link, tools.firstElementChild);
  });
  repoMetaElements = Array.from(document.querySelectorAll("[data-repo-meta]"));
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });
}

function renderRepoMeta(version) {
  if (!repoMetaElements.length || !version) return;
  const repo = version.repo || "SummerXDsss/MySQLSimulator";
  const branch = version.branch || "main";
  const currentVersion = version.currentVersion || "0.0.0";
  repoMetaElements.forEach((meta) => {
    meta.href = `https://github.com/${repo}/tree/${encodeURIComponent(branch)}`;
    meta.hidden = false;
    meta.title = `${repo} · ${branch} · v${currentVersion}`;
    meta.querySelector("[data-repo-branch]").textContent = branch;
    meta.querySelector("[data-repo-version]").textContent = `v${currentVersion}`;
  });
}

function ensureHistoryOverlay() {
  if (historyOverlay) return;
  const wrapper = document.createElement("div");
  wrapper.id = "updateHistoryOverlay";
  wrapper.className = "onboarding-overlay";
  wrapper.hidden = true;
  wrapper.innerHTML = `
    <section class="onboarding-card update-history-card" role="dialog" aria-modal="true" aria-labelledby="updateHistoryTitle">
      <button class="icon-button onboarding-close" type="button" data-history-close aria-label="关闭更新历史">
        <i data-lucide="x"></i>
      </button>
      <p class="eyebrow">CHANGELOG</p>
      <h2 id="updateHistoryTitle">更新历史</h2>
      <div class="history-meta" data-history-meta>正在加载...</div>
      <div class="history-list" data-history-list></div>
      <div class="history-pagination">
        <button class="tool-button" type="button" data-history-prev>
          <i data-lucide="chevron-left"></i>
          上一页
        </button>
        <button class="tool-button" type="button" data-history-next>
          下一页
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
    </section>
  `;
  document.body.appendChild(wrapper);
  historyOverlay = wrapper;
  historyList = wrapper.querySelector("[data-history-list]");
  historyMeta = wrapper.querySelector("[data-history-meta]");
  historyPrev = wrapper.querySelector("[data-history-prev]");
  historyNext = wrapper.querySelector("[data-history-next]");
  wrapper.querySelector("[data-history-close]").addEventListener("click", closeHistoryOverlay);
  wrapper.addEventListener("click", (event) => {
    if (event.target === wrapper) closeHistoryOverlay();
  });
  historyPrev.addEventListener("click", () => loadUpdateHistory(historyPage - 1));
  historyNext.addEventListener("click", () => loadUpdateHistory(historyPage + 1));
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });
}

function openHistoryOverlay() {
  ensureHistoryOverlay();
  historyOverlay.hidden = false;
  loadUpdateHistory(1);
}

function closeHistoryOverlay() {
  if (historyOverlay) historyOverlay.hidden = true;
}

async function requestUpdateHistory(page) {
  const response = await fetch(`/api/update-history?page=${encodeURIComponent(page)}&pageSize=${HISTORY_PAGE_SIZE}`, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "更新历史加载失败");
  return payload;
}

function renderUpdateHistory(payload) {
  historyPage = payload.page || 1;
  const totalPages = Math.max(historyPage, payload.totalPages || historyPage);
  historyMeta.textContent = `${payload.repo || "仓库"} · ${payload.branch || "main"} · 第 ${historyPage} / ${totalPages} 页`;
  historyPrev.disabled = !payload.hasPrev;
  historyNext.disabled = !payload.hasNext;

  if (!payload.items?.length) {
    historyList.innerHTML = '<div class="history-empty">暂无更多更新记录</div>';
    return;
  }

  historyList.innerHTML = payload.items.map((item) => `
    <article class="history-item">
      <div class="history-row">
        <span>更新时间</span>
        <strong>${escapeHtml(formatDateTime(item.updatedAt))}</strong>
      </div>
      <div class="history-row">
        <span>版本号</span>
        <strong>${escapeHtml(item.version || "未标记")}</strong>
      </div>
      <div class="history-row">
        <span>短 Hash</span>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.shortHash || "")}</a>
      </div>
      <div class="history-commit">
        <span>更新 Commit 内容</span>
        <p>${escapeHtml(item.title || item.message || "")}</p>
      </div>
    </article>
  `).join("");
}

async function loadUpdateHistory(page) {
  ensureHistoryOverlay();
  historyPage = Math.max(1, page);
  historyMeta.textContent = "正在加载...";
  historyList.innerHTML = '<div class="history-empty">正在获取 GitHub 更新记录...</div>';
  historyPrev.disabled = true;
  historyNext.disabled = true;
  try {
    renderUpdateHistory(await requestUpdateHistory(historyPage));
  } catch (error) {
    historyMeta.textContent = "加载失败";
    historyList.innerHTML = `<div class="history-empty">${escapeHtml(error.message || "更新历史加载失败")}</div>`;
  }
}

versionWidgets.forEach(ensureHistoryButton);
ensureRepoMeta();

function renderVersionState(message, options = {}) {
  versionWidgets.forEach((widget) => {
    const status = widget.querySelector("[data-version-status]");
    const button = widget.querySelector("[data-update-button]");
    if (!status || !button) return;
    status.textContent = message;
    widget.dataset.state = options.state || "idle";
    button.hidden = !options.showUpdate;
    button.disabled = Boolean(options.disabled);
  });
}

async function requestVersion() {
  const response = await fetch("/api/version", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "版本检测失败");
  return payload;
}

function getUpdateToken(version) {
  if (!version?.updateAuthRequired) return "";
  const storedToken = sessionStorage.getItem(UPDATE_TOKEN_KEY) || "";
  const token = window.prompt("请输入服务器更新令牌", storedToken);
  if (token === null) throw new Error("已取消更新");
  sessionStorage.setItem(UPDATE_TOKEN_KEY, token);
  return token;
}

async function requestUpdate(version) {
  const updateToken = getUpdateToken(version);
  const response = await fetch("/api/update", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(updateToken ? { "x-update-token": updateToken } : {})
    },
    body: JSON.stringify({ updateToken })
  });
  const payload = await response.json();
  if (response.status === 401) {
    sessionStorage.removeItem(UPDATE_TOKEN_KEY);
  }
  if (!response.ok) throw new Error(payload.message || "更新失败");
  return payload;
}

function formatRevision(revision) {
  if (!revision || revision === "local") return "local";
  return revision.slice(0, 7);
}

function formatVersionLabel(version) {
  if (!version?.latestVersion || !version?.currentVersion || version.latestVersion === version.currentVersion) {
    return `当前 ${formatRevision(version.currentRevision)}，最新 ${formatRevision(version.latestRevision)}`;
  }
  return `当前 ${version.currentVersion}，最新 ${version.latestVersion}`;
}

async function checkVersion() {
  if (!versionWidgets.length) return;
  try {
    const version = await requestVersion();
    renderRepoMeta(version);
    if (!version.ok) {
      renderVersionState(version.message || "暂时无法检测版本", { state: "warning" });
      return;
    }
    if (version.updateAvailable) {
      renderVersionState(
        version.updateEnabled ? formatVersionLabel(version) : `${formatVersionLabel(version)}，服务器未开启网页更新`,
        {
          state: "update",
          showUpdate: true,
          disabled: !version.updateEnabled
        }
      );
      return;
    }
    renderVersionState(`已是最新版本 ${version.currentVersion}`, { state: "ok" });
  } catch (error) {
    renderVersionState(error.message || "暂时无法检测版本", { state: "warning" });
  }
}

versionWidgets.forEach((widget) => {
  const button = widget.querySelector("[data-update-button]");
  const historyButton = widget.querySelector("[data-history-button]");
  historyButton?.addEventListener("click", openHistoryOverlay);
  button?.addEventListener("click", async () => {
    let version;
    try {
      version = await requestVersion();
    } catch (error) {
      renderVersionState(error.message || "版本检测失败", { state: "warning" });
      return;
    }
    renderVersionState("正在更新，请稍候...", {
      state: "update",
      showUpdate: true,
      disabled: true
    });
    try {
      const payload = await requestUpdate(version);
      renderVersionState(payload.message || "更新完成", { state: "ok" });
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error) {
      renderVersionState(error.message || "更新失败", { state: "warning" });
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && historyOverlay && !historyOverlay.hidden) {
    closeHistoryOverlay();
  }
});

checkVersion();
