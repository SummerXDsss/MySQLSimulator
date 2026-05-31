(function () {
  const AI_PREFS_KEY = "sqlsimulator-ai-preferences-v1";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizePrefs(prefs = {}) {
    return {
      baseUrl: String(prefs.baseUrl || ""),
      requestPath: String(prefs.requestPath || "/v1/chat/completions"),
      model: String(prefs.model || ""),
      apiKey: String(prefs.apiKey || "")
    };
  }

  function loadPrefs() {
    try {
      return normalizePrefs(JSON.parse(localStorage.getItem(AI_PREFS_KEY) || "{}"));
    } catch {
      return normalizePrefs();
    }
  }

  function savePrefs(prefs) {
    localStorage.setItem(AI_PREFS_KEY, JSON.stringify(normalizePrefs(prefs)));
  }

  function buildUrl(prefs) {
    const requestPath = String(prefs.requestPath || "").trim();
    if (/^https?:\/\//i.test(requestPath)) return requestPath;
    const baseUrl = String(prefs.baseUrl || "").trim();
    if (!baseUrl) throw new Error("请先配置 AI 接口地址");
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return new URL(requestPath.replace(/^\/+/, ""), normalizedBase).toString();
  }

  function parseAiResponse(payload) {
    return payload?.choices?.[0]?.message?.content
      || payload?.choices?.[0]?.text
      || payload?.answer
      || payload?.data?.answer
      || payload?.data?.content
      || payload?.message?.content
      || payload?.message
      || payload?.text
      || JSON.stringify(payload, null, 2);
  }

  function extractFirstCodeBlock(text) {
    const match = String(text || "").match(/```(?:[a-z0-9_-]+)?\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : String(text || "").trim();
  }

  function renderAnswer(container, text) {
    if (!container) return;
    if (!text) {
      container.innerHTML = '<div class="ai-empty">暂无回复</div>';
      return;
    }
    container.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
  }

  function create(options) {
    const elements = options.elements;
    const getContext = options.getContext;
    const insertText = options.insertText;
    const setStatus = options.setStatus || (() => {});
    const language = options.language || "text";
    const kind = options.kind || "代码";
    let lastAnswer = "";

    function readPrefsFromInputs() {
      return normalizePrefs({
        baseUrl: elements.baseUrl?.value,
        requestPath: elements.requestPath?.value,
        model: elements.model?.value,
        apiKey: elements.apiKey?.value
      });
    }

    function writePrefsToInputs(prefs) {
      if (elements.baseUrl) elements.baseUrl.value = prefs.baseUrl;
      if (elements.requestPath) elements.requestPath.value = prefs.requestPath;
      if (elements.model) elements.model.value = prefs.model;
      if (elements.apiKey) elements.apiKey.value = prefs.apiKey;
      if (elements.configState) {
        elements.configState.textContent = prefs.baseUrl ? "已配置" : "未配置";
      }
    }

    function saveFromInputs() {
      const current = readPrefsFromInputs();
      savePrefs(current);
      if (elements.configState) {
        elements.configState.textContent = current.baseUrl ? "已配置" : "未配置";
      }
      return current;
    }

    async function ask() {
      const prefs = saveFromInputs();
      const question = String(elements.prompt?.value || "").trim() || `请检查并改进当前${kind}`;
      if (elements.askButton) elements.askButton.disabled = true;
      setStatus("AI 思考中");
      renderAnswer(elements.response, "请求中...");

      try {
        const url = buildUrl(prefs);
        const headers = { "content-type": "application/json" };
        if (prefs.apiKey) headers.authorization = `Bearer ${prefs.apiKey}`;
        const body = {
          model: prefs.model || undefined,
          messages: [
            {
              role: "system",
              content: `你是前后端全栈开发模拟器里的 AI 助手。请用中文回答，优先给可直接运行的 ${kind} 建议。`
            },
            {
              role: "user",
              content: `${getContext()}\n\n用户问题：${question}`
            }
          ],
          stream: false
        };
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || payload.error?.message || `AI 请求失败：${response.status}`);
        lastAnswer = parseAiResponse(payload);
        renderAnswer(elements.response, lastAnswer);
        if (elements.insertButton) elements.insertButton.hidden = false;
        setStatus("AI 已回复");
      } catch (error) {
        lastAnswer = "";
        renderAnswer(elements.response, error.message || "AI 请求失败");
        if (elements.insertButton) elements.insertButton.hidden = true;
        setStatus("AI 请求失败");
      } finally {
        if (elements.askButton) elements.askButton.disabled = false;
      }
    }

    writePrefsToInputs(loadPrefs());
    [elements.baseUrl, elements.requestPath, elements.model, elements.apiKey].forEach((input) => {
      input?.addEventListener("change", saveFromInputs);
      input?.addEventListener("blur", saveFromInputs);
    });
    elements.askButton?.addEventListener("click", ask);
    elements.prompt?.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        ask();
      }
    });
    elements.insertButton?.addEventListener("click", () => {
      if (!lastAnswer) return;
      insertText(extractFirstCodeBlock(lastAnswer));
      setStatus("AI 回复已插入");
    });

    return { ask, saveFromInputs };
  }

  window.SqlSimAiAssistant = {
    create,
    loadPrefs,
    savePrefs,
    extractFirstCodeBlock
  };
})();
