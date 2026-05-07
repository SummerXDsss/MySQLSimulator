const versionWidgets = document.querySelectorAll("[data-version-widget]");
const UPDATE_TOKEN_KEY = "sqlsimulator-update-token-v1";

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
  if (!button) return;
  button.addEventListener("click", async () => {
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

checkVersion();
