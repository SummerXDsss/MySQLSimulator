const jsEditor = document.querySelector("#jsEditor");
const jsHighlightCode = document.querySelector("#jsHighlightCode");
const jsLineNumbers = document.querySelector("#jsLineNumbers");
const jsSuggestPanel = document.querySelector("#jsSuggestPanel");
const jsSuggestionList = document.querySelector("#jsSuggestionList");
const jsRunBtn = document.querySelector("#jsRunBtn");
const jsClearBtn = document.querySelector("#jsClearBtn");
const jsExampleBtn = document.querySelector("#jsExampleBtn");
const jsFormatBtn = document.querySelector("#jsFormatBtn");
const jsImportBtn = document.querySelector("#jsImportBtn");
const jsExportBtn = document.querySelector("#jsExportBtn");
const jsShareBtn = document.querySelector("#jsShareBtn");
const jsFileInput = document.querySelector("#jsFileInput");
const jsClearOutputBtn = document.querySelector("#jsClearOutputBtn");
const jsOutput = document.querySelector("#jsOutput");
const jsRiskList = document.querySelector("#jsRiskList");
const jsStatus = document.querySelector("#jsStatus");
const jsExtractStatus = document.querySelector("#jsExtractStatus");
const jsInterpreterSelect = document.querySelector("#jsInterpreterSelect");
const jsInterpreterBadge = document.querySelector("#jsInterpreterBadge");
const jsSettingsToggle = document.querySelector("#jsSettingsToggle");
const jsSettingsPanel = document.querySelector("#jsSettingsPanel");
const jsSettingsClose = document.querySelector("#jsSettingsClose");
const jsShareOverlay = document.querySelector("#jsShareOverlay");
const jsShareClose = document.querySelector("#jsShareClose");
const jsShareCancel = document.querySelector("#jsShareCancel");
const jsShareAgree = document.querySelector("#jsShareAgree");
const jsShareRiskList = document.querySelector("#jsShareRiskList");
const jsShareLinkInput = document.querySelector("#jsShareLinkInput");
const jsCopyShareLinkBtn = document.querySelector("#jsCopyShareLinkBtn");
const jsCreateShareLinkBtn = document.querySelector("#jsCreateShareLinkBtn");
const jsShareWatermark = document.querySelector("#jsShareWatermark");
const jsPreviewSection = document.querySelector("#jsPreviewSection");
const jsPreviewFrame = document.querySelector("#jsPreviewFrame");
const jsPreviewWatermark = document.querySelector("#jsPreviewWatermark");
const jsRefreshPreviewBtn = document.querySelector("#jsRefreshPreviewBtn");

const JS_TIMEOUT_MS = 2000;
const JS_MAX_BYTES = 128 * 1024;
const JS_PREFS_KEY = "sqlsimulator-js-preferences-v1";
const JS_HISTORY_LIMIT = 80;

const jsKeywordSet = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default",
  "delete", "do", "else", "export", "extends", "finally", "for", "from", "function", "if",
  "import", "in", "instanceof", "let", "new", "of", "return", "static", "super", "switch",
  "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"
]);

const jsLiteralSet = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);

const jsBuiltinSet = new Set([
  "Array", "Boolean", "Date", "Error", "JSON", "Map", "Math", "Number", "Object", "Promise",
  "RegExp", "Set", "String", "Symbol", "console", "parseFloat", "parseInt"
]);

const jsCompletions = [
  { label: "console.log", insert: "console.log(|);", detail: "输出普通日志", type: "Console" },
  { label: "console.table", insert: "console.table(|);", detail: "表格化输出数组或对象", type: "Console" },
  { label: "JSON.stringify", insert: "JSON.stringify(|, null, 2)", detail: "对象转格式化文本", type: "函数" },
  { label: "Array.map", insert: ".map((item) => {\n  return |;\n})", detail: "映射数组", type: "数组" },
  { label: "Array.filter", insert: ".filter((item) => |)", detail: "过滤数组", type: "数组" },
  { label: "Array.reduce", insert: ".reduce((total, item) => {\n  return total + |;\n}, 0)", detail: "归并数组", type: "数组" },
  { label: "for...of", insert: "for (const item of |) {\n  console.log(item);\n}", detail: "遍历可迭代数据", type: "片段" },
  { label: "if", insert: "if (|) {\n  \n}", detail: "条件判断", type: "片段" },
  { label: "function", insert: "function name(|) {\n  return null;\n}", detail: "函数声明", type: "片段" },
  { label: "async function", insert: "async function name(|) {\n  return null;\n}", detail: "异步函数声明", type: "片段" },
  { label: "try...catch", insert: "try {\n  |\n} catch (error) {\n  console.error(error.message);\n}", detail: "错误处理", type: "片段" },
  { label: "script", insert: "<script>\n  |\n</script>", detail: "HTML 中的 JavaScript 块", type: "HTML" },
  { label: "const", insert: "const | = ;", detail: "常量声明", type: "关键词" },
  { label: "let", insert: "let | = ;", detail: "变量声明", type: "关键词" },
  { label: "return", insert: "return |;", detail: "返回值", type: "关键词" },
  { label: "Math.round", insert: "Math.round(|)", detail: "四舍五入", type: "函数" },
  { label: "Math.max", insert: "Math.max(|)", detail: "最大值", type: "函数" },
  { label: "Number", insert: "Number(|)", detail: "转数字", type: "函数" },
  { label: "String", insert: "String(|)", detail: "转字符串", type: "函数" }
];

let activeSuggestionIndex = 0;
let visibleCompletions = [];
let jsPrefs = loadJsPrefs();
let jsUndoStack = [];
let jsRedoStack = [];
let lastHistoryValue = "";
let applyingHistory = false;

const jsExample = `<main>
  <h1>这里只会执行 script 里的 JavaScript</h1>
  <script>
    const students = ["Nora", "Evan", "Mia"];
    const rows = students.map((name, index) => ({
      id: index + 1,
      name,
      passed: name !== "Evan"
    }));

    console.table(rows);
    console.log("通过人数", rows.filter((row) => row.passed).length);
  </script>
</main>`;

const scriptTypePattern = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const javascriptTypes = new Set([
  "",
  "module",
  "text/javascript",
  "application/javascript",
  "application/ecmascript",
  "text/ecmascript"
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightJavaScript(code) {
  const tokenPattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|=>|===|!==|!=|==|<=|>=|&&|\|\||[{}[\](),.;:*?=<>+\-/%!])/g;
  let html = "";
  let cursor = 0;
  let match;

  while ((match = tokenPattern.exec(code)) !== null) {
    const token = match[0];
    html += escapeHtml(code.slice(cursor, match.index));

    if (token === "!=") {
      html += escapeHtml(token);
    } else if (token.startsWith("//") || token.startsWith("/*")) {
      html += `<span class="js-token-comment">${escapeHtml(token)}</span>`;
    } else if (token.startsWith("'") || token.startsWith('"') || token.startsWith("`")) {
      html += `<span class="js-token-string">${escapeHtml(token)}</span>`;
    } else if (/^\d/.test(token)) {
      html += `<span class="js-token-number">${escapeHtml(token)}</span>`;
    } else if (jsKeywordSet.has(token)) {
      html += `<span class="js-token-keyword">${escapeHtml(token)}</span>`;
    } else if (jsLiteralSet.has(token)) {
      html += `<span class="js-token-literal">${escapeHtml(token)}</span>`;
    } else if (jsBuiltinSet.has(token)) {
      html += `<span class="js-token-builtin">${escapeHtml(token)}</span>`;
    } else if (/^(?:=>|===|!==|==|<=|>=|&&|\|\||[{}[\](),.;:*?=<>+\-/%!])$/.test(token)) {
      html += `<span class="js-token-operator">${escapeHtml(token)}</span>`;
    } else {
      html += escapeHtml(token);
    }

    cursor = match.index + token.length;
  }

  html += escapeHtml(code.slice(cursor));
  return html;
}

function highlightHtmlJavaScript(source) {
  const scriptPattern = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
  let html = "";
  let cursor = 0;
  let match;

  while ((match = scriptPattern.exec(source)) !== null) {
    const block = match[0];
    const openMatch = block.match(/^<script\b[^>]*>/i);
    const closeMatch = block.match(/<\/script>$/i);
    const openTag = openMatch?.[0] || "";
    const closeTag = closeMatch?.[0] || "";
    const code = block.slice(openTag.length, block.length - closeTag.length);

    html += escapeHtml(source.slice(cursor, match.index));
    html += `<span class="js-token-tag">${escapeHtml(openTag)}</span>`;
    html += highlightJavaScript(code);
    html += `<span class="js-token-tag">${escapeHtml(closeTag)}</span>`;
    cursor = match.index + block.length;
  }

  html += escapeHtml(source.slice(cursor));
  return html || "\n";
}

function highlightEditorSource(source) {
  const text = String(source ?? "");
  if (jsPrefs.interpreter === "nodejs") {
    return highlightJavaScript(text);
  }
  if (/<script\b[^>]*>[\s\S]*?<\/script>/i.test(text)) {
    return highlightHtmlJavaScript(text);
  }
  if (!/<\/?[a-z][\s\S]*>/i.test(text)) {
    return highlightJavaScript(text);
  }
  return escapeHtml(text) || "\n";
}

function syncJsHighlightScroll() {
  if (!jsHighlightCode) return;
  if (jsLineNumbers) jsLineNumbers.scrollTop = jsEditor.scrollTop;
  jsHighlightCode.style.transform = `translate(${-jsEditor.scrollLeft}px, ${-jsEditor.scrollTop}px)`;
}

function getCompletionRange() {
  const cursor = jsEditor.selectionStart;
  const before = jsEditor.value.slice(0, cursor);
  const match = before.match(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?$/);
  return {
    start: match ? cursor - match[0].length : cursor,
    end: jsEditor.selectionEnd,
    query: match ? match[0] : ""
  };
}

function loadJsPrefs() {
  try {
    return {
      interpreter: "html-js",
      ...JSON.parse(localStorage.getItem(JS_PREFS_KEY) || "{}")
    };
  } catch {
    return { interpreter: "html-js" };
  }
}

function saveJsPrefs() {
  localStorage.setItem(JS_PREFS_KEY, JSON.stringify(jsPrefs));
}

function setJsSettingsOpen(open) {
  if (!jsSettingsPanel || !jsSettingsToggle) return;
  jsSettingsPanel.hidden = !open;
  jsSettingsToggle.setAttribute("aria-expanded", String(open));
}

function applyInterpreterMode() {
  const interpreter = ["nodejs", "html-preview"].includes(jsPrefs.interpreter) ? jsPrefs.interpreter : "html-js";
  if (jsInterpreterSelect) jsInterpreterSelect.value = interpreter;
  if (jsInterpreterBadge) {
    const labelMap = {
      "nodejs": "NodeJS 解释器",
      "html-preview": "网页预览模式",
      "html-js": "HTML JS 解释器"
    };
    jsInterpreterBadge.innerHTML = `<i data-lucide="cpu"></i> ${labelMap[interpreter]}`;
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });
  }
  // 预览面板：网页预览模式总是显示；HTML JS 解释器在检测到 HTML 标签时也显示。
  if (jsPreviewSection) {
    const editorValue = jsEditor?.value || "";
    const editorHasDom = /<\s*(button|input|form|div|section|main|header|footer|nav|aside|article|h[1-6]|p|span|ul|ol|li|table|tr|td|th|img|video|audio|canvas|svg|select|textarea|label|a|b|i|em|strong)\b/i.test(editorValue);
    const showPreview = interpreter === "html-preview" || (interpreter === "html-js" && editorHasDom);
    jsPreviewSection.hidden = !showPreview;
    if (!showPreview && jsPreviewFrame) {
      jsPreviewFrame.srcdoc = "";
    }
  }
  updateJsHighlight();
  refreshRiskState({ showSuggestions: false });
}

function hideJsSuggestions() {
  visibleCompletions = [];
  if (jsSuggestPanel) jsSuggestPanel.hidden = true;
}

function renderJsSuggestions() {
  if (!jsSuggestPanel || !jsSuggestionList) return;
  const { query } = getCompletionRange();
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.length < 2) {
    hideJsSuggestions();
    return;
  }

  visibleCompletions = jsCompletions
    .filter((item) => {
      if (!normalizedQuery) return item.type === "片段" || item.type === "Console";
      return item.label.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 9);

  if (!visibleCompletions.length) {
    hideJsSuggestions();
    return;
  }

  activeSuggestionIndex = Math.min(activeSuggestionIndex, visibleCompletions.length - 1);
  positionSuggestPanel();
  jsSuggestionList.innerHTML = visibleCompletions.map((item, index) => `
    <button class="suggest-option ${index === activeSuggestionIndex ? "active" : ""}" type="button" data-index="${index}">
      <span>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.detail)}</small>
      </span>
      <em>${escapeHtml(item.type)}</em>
    </button>
  `).join("");
  jsSuggestPanel.hidden = false;
}

function positionSuggestPanel() {
  if (!jsSuggestPanel) return;
  const cursor = jsEditor.selectionStart;
  const before = jsEditor.value.slice(0, cursor);
  const lines = before.split("\n");
  const lineIndex = lines.length - 1;
  const column = lines[lineIndex].length;
  const lineHeight = Number.parseFloat(getComputedStyle(jsEditor).lineHeight) || 23;
  const charWidth = 8.4;
  const left = Math.max(8, 20 + column * charWidth - jsEditor.scrollLeft);
  const top = Math.max(8, 20 + (lineIndex + 1) * lineHeight - jsEditor.scrollTop);
  const maxLeft = Math.max(8, jsEditor.clientWidth - 380);
  const maxTop = Math.max(8, jsEditor.clientHeight - 300);
  jsSuggestPanel.style.left = `${Math.min(left, maxLeft)}px`;
  jsSuggestPanel.style.top = `${Math.min(top, maxTop)}px`;
}

function insertCompletion(completion) {
  pushEditorHistory(true);
  const { start, end } = getCompletionRange();
  const before = jsEditor.value.slice(0, start);
  const after = jsEditor.value.slice(end);
  const markerIndex = completion.insert.indexOf("|");
  const insertText = completion.insert.replace("|", "");
  const cursor = before.length + (markerIndex >= 0 ? markerIndex : insertText.length);
  jsEditor.value = before + insertText + after;
  jsEditor.focus();
  jsEditor.setSelectionRange(cursor, cursor);
  updateJsHighlight();
  refreshRiskState();
  hideJsSuggestions();
}

function insertAtSelection(text, cursorOffset = text.length, options = {}) {
  if (!options.skipHistory) pushEditorHistory(true);
  const start = jsEditor.selectionStart;
  const end = jsEditor.selectionEnd;
  jsEditor.value = jsEditor.value.slice(0, start) + text + jsEditor.value.slice(end);
  const cursor = start + cursorOffset;
  jsEditor.setSelectionRange(cursor, cursor);
  updateJsHighlight();
  refreshRiskState();
}

function refreshRiskState(options = {}) {
  const extraction = extractJavaScript(jsEditor.value, jsPrefs.interpreter);
  const analysis = extraction.errors?.length
    ? { ok: false, errors: extraction.errors, warnings: [] }
    : analyzeJavaScript(extraction.code, jsPrefs.interpreter);
  jsExtractStatus.textContent = jsPrefs.interpreter === "nodejs"
    ? "NodeJS JavaScript"
    : jsPrefs.interpreter === "html-preview"
      ? "HTML 预览（含 CSS/JS）"
      : extraction.mode === "html-script" ? "已提取 script" : "JavaScript only";
  renderRisks(analysis, extraction);
  if (options.showSuggestions === false) {
    hideJsSuggestions();
  } else {
    renderJsSuggestions();
  }
}

function updateJsHighlight() {
  if (!jsHighlightCode) return;
  jsHighlightCode.innerHTML = `${highlightEditorSource(jsEditor.value)}\n`;
  updateJsLineNumbers();
  syncJsHighlightScroll();
}

function updateJsLineNumbers() {
  if (!jsLineNumbers) return;
  const count = Math.max(1, jsEditor.value.split("\n").length);
  jsLineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
}

function setEditorValue(value, options = {}) {
  if (!options.skipHistory) pushEditorHistory(true);
  jsEditor.value = value;
  updateJsHighlight();
  refreshRiskState({ showSuggestions: false });
  if (!options.keepOutput) renderOutput([]);
  lastHistoryValue = jsEditor.value;
}

function pushEditorHistory(force = false) {
  if (applyingHistory) return;
  const value = jsEditor.value;
  if (!force && value === lastHistoryValue) return;
  jsUndoStack.push(value);
  if (jsUndoStack.length > JS_HISTORY_LIMIT) jsUndoStack.shift();
  jsRedoStack = [];
  lastHistoryValue = value;
}

function undoEditor() {
  if (!jsUndoStack.length) return;
  applyingHistory = true;
  jsRedoStack.push(jsEditor.value);
  jsEditor.value = jsUndoStack.pop();
  lastHistoryValue = jsEditor.value;
  updateJsHighlight();
  refreshRiskState({ showSuggestions: false });
  applyingHistory = false;
}

function redoEditor() {
  if (!jsRedoStack.length) return;
  applyingHistory = true;
  jsUndoStack.push(jsEditor.value);
  jsEditor.value = jsRedoStack.pop();
  lastHistoryValue = jsEditor.value;
  updateJsHighlight();
  refreshRiskState({ showSuggestions: false });
  applyingHistory = false;
}

function formatTimestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatJsLikeCode(value) {
  const text = String(value ?? "").replace(/\r\n?/g, "\n");
  let output = "";
  let indent = 0;
  let inString = "";
  let inLineComment = false;
  let inBlockComment = false;

  const appendIndent = () => {
    output += "  ".repeat(Math.max(0, indent));
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] || "";

    if (inLineComment) {
      output += char;
      if (char === "\n") {
        inLineComment = false;
        appendIndent();
      }
      continue;
    }
    if (inBlockComment) {
      output += char;
      if (char === "*" && next === "/") {
        output += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }
    if (inString) {
      output += char;
      if (char === "\\" && next) {
        output += next;
        index += 1;
      } else if (char === inString) {
        inString = "";
      }
      continue;
    }

    if ((char === "/" && next === "/") || (char === "/" && next === "*")) {
      inLineComment = next === "/";
      inBlockComment = next === "*";
      output += char + next;
      index += 1;
      continue;
    }
    if (char === "'" || char === "\"" || char === "`") {
      inString = char;
      output += char;
      continue;
    }
    if (char === "{" || char === "[" || char === "(") {
      output = output.replace(/[ \t]+$/g, "");
      output += `${char}\n`;
      indent += 1;
      appendIndent();
      continue;
    }
    if (char === "}" || char === "]" || char === ")") {
      output = output.replace(/[ \t]+$/g, "").replace(/\n\s*$/g, "\n");
      indent -= 1;
      appendIndent();
      output += char;
      continue;
    }
    if (char === ";") {
      output += ";\n";
      appendIndent();
      continue;
    }
    if (char === "\n") {
      output = output.replace(/[ \t]+$/g, "");
      output += "\n";
      appendIndent();
      continue;
    }
    output += char;
  }

  return output
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function analyzeShareableJs() {
  const extraction = extractJavaScript(jsEditor.value, jsPrefs.interpreter);
  const analysis = extraction.errors?.length
    ? { ok: false, errors: extraction.errors, warnings: [] }
    : analyzeJavaScript(extraction.code);
  return {
    ...analysis,
    warnings: [...(extraction.warnings || []), ...(analysis.warnings || [])],
    byteLength: byteLength(jsEditor.value)
  };
}

function renderShareRisks(analysis) {
  if (!jsShareRiskList) return;
  const errors = analysis.errors || [];
  const warnings = analysis.warnings || [];
  if (!errors.length && !warnings.length) {
    jsShareRiskList.innerHTML = '<div class="share-risk ok">未检测到明显风险。</div>';
    return;
  }
  jsShareRiskList.innerHTML = [
    ...errors.map((item) => `<div class="share-risk error">${escapeHtml(item)}</div>`),
    ...warnings.map((item) => `<div class="share-risk warning">${escapeHtml(item)}</div>`)
  ].join("");
}

function setShareDialogOpen(open) {
  if (!jsShareOverlay) return;
  jsShareOverlay.hidden = !open;
  if (open) {
    jsShareAgree.checked = false;
    jsShareLinkInput.value = "";
    renderShareRisks(analyzeShareableJs());
  }
}

function byteLength(value) {
  return new Blob([String(value ?? "")]).size;
}

function extractJavaScript(input, interpreter = jsPrefs.interpreter) {
  const source = String(input ?? "");
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  const warnings = [];
  let match;

  if (interpreter === "html-preview") {
    return { code: source, warnings, mode: "html-preview" };
  }

  if (interpreter === "nodejs" && /<\/?[a-z][\s\S]*>/i.test(source)) {
    return {
      code: "",
      warnings,
      mode: "nodejs-html-blocked",
      errors: ["NodeJS 解释器只接受 JavaScript 代码内容"]
    };
  }

  while ((match = scriptPattern.exec(source)) !== null) {
    const attrs = match[1] || "";
    const typeMatch = attrs.match(scriptTypePattern);
    const scriptType = String(typeMatch?.[1] || typeMatch?.[2] || typeMatch?.[3] || "").trim().toLowerCase();
    if (!javascriptTypes.has(scriptType)) {
      warnings.push(`已忽略非 JavaScript 类型 script：${scriptType}`);
      continue;
    }
    if (/\bsrc\s*=/i.test(attrs)) {
      warnings.push("已忽略外部 script src，工具不会加载远程脚本");
      continue;
    }
    scripts.push(match[2].trim());
  }

  // 检测是否有可见 DOM 元素（button / div / input / form 等）。仅 <script> 不算。
  const stripped = source.replace(scriptPattern, "");
  const hasVisibleDom = /<\s*[a-z][\w-]*(\s|>|\/)/i.test(stripped);

  if (hasVisibleDom) {
    // HTML JS 模式下检测到可见 DOM——切到 iframe 沙箱以便看到 button、input、div 等效果。
    if (scripts.length) {
      warnings.push("检测到 HTML 标签，已在 iframe 沙箱中渲染网页效果，script 也会在沙箱内执行");
    } else {
      warnings.push("检测到 HTML 标签，已在 iframe 沙箱中渲染（纯展示，无 script）");
    }
    return { code: source, warnings, mode: "html-render" };
  }

  if (scripts.length) {
    return { code: scripts.join("\n\n"), warnings, mode: "html-script" };
  }

  if (/<\/?[a-z][\s\S]*>/i.test(source)) {
    return {
      code: "",
      warnings,
      mode: "html-no-script",
      errors: ["未识别到可执行的 JavaScript，请把代码放到 <script> 中"]
    };
  }

  return { code: source.trim(), warnings, mode: "javascript" };
}

function analyzeJavaScript(code, interpreter = jsPrefs.interpreter) {
  const text = String(code ?? "");
  const errors = [];
  const warnings = [];

  if (!text.trim()) errors.push("JavaScript 内容不能为空");
  if (byteLength(text) > JS_MAX_BYTES) errors.push("JavaScript 内容超过 128KB 限制");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) errors.push("检测到非法控制字符");
  if (/[\u202A-\u202E\u2066-\u2069\u200B-\u200F\uFEFF]/.test(text)) warnings.push("检测到方向控制或零宽字符，可能影响审阅");

  let scanText = text;
  if (interpreter === "html-preview") {
    const previewScripts = [];
    const scriptScan = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptScan.exec(text)) !== null) {
      if (/\bsrc\s*=/i.test(scriptMatch[1] || "")) {
        warnings.push("已忽略外部 script src，预览不会加载远程脚本");
        continue;
      }
      previewScripts.push(scriptMatch[2]);
    }
    if (/<iframe\b|<frame\b|<object\b|<embed\b|<applet\b|<meta[^>]*http-equiv/i.test(text)) {
      errors.push("禁止嵌入 iframe / object / 跳转 meta，请在预览中只使用普通 HTML/CSS");
    }
    if (/<form\b[^>]*action\s*=/i.test(text)) {
      warnings.push("表单 action 在预览沙箱内不会发送请求");
    }
    if (/\bon[a-z]+\s*=\s*["'][^"']*\b(eval|Function|fetch|XMLHttpRequest)\b/i.test(text)) {
      errors.push("内联事件处理器中禁止动态执行或网络请求");
    }
    scanText = previewScripts.join("\n");
  }

  const blockedRules = [
    [/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|Request|Response|Headers|navigator)\b/i, "禁止网络请求相关 API"],
    [/\b(showOpenFilePicker|showSaveFilePicker|showDirectoryPicker|FileReader|FileList|FileSystem|FileSystemHandle|FileSystemFileHandle|FileSystemDirectoryHandle|FileSystemWritableFileStream|createWritable|getFile|removeEntry|Blob|FormData|createObjectURL|revokeObjectURL|download|clipboard|ClipboardItem|WritableStream)\b/i, "禁止文件读取、文件修改、下载或剪贴板相关 API"],
    [/\b(localStorage|sessionStorage|indexedDB|cookie|caches|CacheStorage)\b/i, "禁止读取或写入浏览器本地存储"],
    [/\beval\s*\(|\bnew\s+Function\b|\bFunction\s*\(|\bAsyncFunction\b|\bGeneratorFunction\b|\bimportScripts\b|\bimport\s*(?:\(|[\w{*])|\bexport\s+(?:default|const|let|var|function|class|\{)/, "禁止动态执行、导入或导出外部代码"],
    [/\b(Worker|SharedWorker|ServiceWorker|BroadcastChannel|MessageChannel)\b/i, "禁止创建后台线程、消息通道或广播通道"],
    [/\b(top|parent|opener|frames|location|history)\b/i, "禁止访问窗口跳转或父级上下文"],
    [/\bdocument\s*\.\s*(write|createElement|body|head|cookie)\b/i, "禁止操作页面 DOM 或写入 document"],
    [/\bset(?:Timeout|Interval)\s*\(\s*['"`]/i, "禁止字符串形式的定时执行"],
    [/\.\s*constructor\b|\[\s*["']constructor["']\s*\]|\bconstructor\s*\.\s*constructor\b/i, "禁止构造器逃逸写法"],
    [/\b(__sqlsimPost__|__sqlsimBlocked__|__sqlsimSend__|__sqlsimFormat__|__sqlsimMaxOutput__)\b/i, "禁止访问沙箱内部变量"],
    [/\b(?:globalThis|self)\s*\.\s*(postMessage|close|dispatchEvent|addEventListener|removeEventListener)\b|\b(postMessage|close|dispatchEvent|addEventListener|removeEventListener)\s*\(/i, "禁止直接操作 Worker 全局通信能力"]
  ];

  const target = interpreter === "html-preview" ? scanText : text;
  blockedRules.forEach(([pattern, message]) => {
    if (pattern.test(target)) errors.push(message);
  });

  if (/\bwhile\s*\(\s*true\s*\)|\bfor\s*\(\s*;\s*;\s*\)/i.test(text)) {
    warnings.push("检测到可能的无限循环，运行会在 2 秒后强制终止");
  }

  return { ok: errors.length === 0, errors, warnings };
}

function renderRisks(analysis, extraction) {
  const items = [
    ...(extraction?.warnings || []).map((message) => ({ type: "warning", message })),
    ...(analysis?.warnings || []).map((message) => ({ type: "warning", message })),
    ...(analysis?.errors || []).map((message) => ({ type: "error", message }))
  ];

  if (!items.length) {
    const okMessage = jsPrefs.interpreter === "html-preview"
      ? "未检测到明显风险，HTML 将在受限 iframe(allow-scripts) 中预览。"
      : "未检测到明显风险，代码将在 Worker 沙箱中执行。";
    jsRiskList.innerHTML = `<div class="share-risk ok">${escapeHtml(okMessage)}</div>`;
    return;
  }

  jsRiskList.innerHTML = items
    .map((item) => `<div class="share-risk ${item.type}">${escapeHtml(item.message)}</div>`)
    .join("");
}

function renderOutput(lines) {
  if (!lines.length) {
    jsOutput.innerHTML = '<div class="js-output-empty">暂无输出</div>';
    return;
  }
  jsOutput.innerHTML = lines.map((line) => `
    <div class="js-output-line ${line.type === "error" ? "error" : ""}">
      <span>${escapeHtml(line.type)}</span>
      <code>${escapeHtml(line.message)}</code>
    </div>
  `).join("");
}

function formatConsoleValue(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function createWorkerSource(code) {
  return `
const __sqlsimMaxOutput__ = 8000;
const __sqlsimPost__ = self.postMessage.bind(self);
const __sqlsimBlocked__ = () => { throw new Error("风险控制：该 API 已被禁用"); };
self.eval = __sqlsimBlocked__;
self.Function = undefined;
self.fetch = __sqlsimBlocked__;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.Worker = undefined;
self.SharedWorker = undefined;
self.MessageChannel = undefined;
self.MessagePort = undefined;
self.importScripts = __sqlsimBlocked__;
self.localStorage = undefined;
self.sessionStorage = undefined;
self.indexedDB = undefined;
self.File = undefined;
self.FileReader = undefined;
self.FileList = undefined;
self.Blob = undefined;
self.FormData = undefined;
self.URL = undefined;
self.navigator = Object.freeze({ userAgent: "JavaScriptSandbox" });
const __sqlsimSend__ = (type, message) => __sqlsimPost__({ type, message });
self.postMessage = __sqlsimBlocked__;
self.close = __sqlsimBlocked__;
self.dispatchEvent = __sqlsimBlocked__;
self.addEventListener = __sqlsimBlocked__;
self.removeEventListener = __sqlsimBlocked__;
const __sqlsimFormat__ = (value) => {
  const text = typeof value === "string" ? value : (() => {
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  })();
  return text.length > __sqlsimMaxOutput__ ? text.slice(0, __sqlsimMaxOutput__) + "\\n...输出已截断" : text;
};
self.console = {
  log: (...args) => __sqlsimSend__("log", args.map(__sqlsimFormat__).join(" ")),
  info: (...args) => __sqlsimSend__("info", args.map(__sqlsimFormat__).join(" ")),
  warn: (...args) => __sqlsimSend__("warn", args.map(__sqlsimFormat__).join(" ")),
  error: (...args) => __sqlsimSend__("error", args.map(__sqlsimFormat__).join(" ")),
  table: (value) => __sqlsimSend__("table", __sqlsimFormat__(value))
};
Promise.resolve()
  .then(async () => {
    "use strict";
${code}
  })
  .then((value) => {
    if (value !== undefined) __sqlsimSend__("result", __sqlsimFormat__(value));
    __sqlsimPost__({ type: "done", message: "执行完成" });
  })
  .catch((error) => __sqlsimPost__({ type: "error", message: error && error.message ? error.message : String(error) }));
`;
}

function runJavaScript(code) {
  return new Promise((resolve) => {
    const lines = [];
    const blob = new Blob([createWorkerSource(code)], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    let finished = false;
    const finish = (line) => {
      if (finished) return;
      finished = true;
      if (line) lines.push(line);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(lines);
    };

    const timer = window.setTimeout(() => {
      finish({ type: "error", message: `执行超时，已在 ${JS_TIMEOUT_MS}ms 后终止` });
    }, JS_TIMEOUT_MS);

    worker.onmessage = (event) => {
      const message = event.data || {};
      if (message.type === "done") {
        window.clearTimeout(timer);
        finish({ type: "done", message: message.message || "执行完成" });
        return;
      }
      lines.push({
        type: message.type || "log",
        message: formatConsoleValue(message.message)
      });
    };

    worker.onerror = (event) => {
      window.clearTimeout(timer);
      finish({ type: "error", message: event.message || "执行失败" });
    };
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "请求失败");
  return payload;
}

async function loadSharedJsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("shareToken");
  const pathMatch = window.location.pathname.match(/^\/js-share\/([A-Za-z0-9_-]{16,})$/);
  const token = pathMatch?.[1] || queryToken;
  if (!token) return;
  try {
    const payload = await requestJson(`/api/share/js/${encodeURIComponent(token)}`);
    jsPrefs.interpreter = ["nodejs", "html-preview"].includes(payload.interpreter) ? payload.interpreter : "html-js";
    saveJsPrefs();
    setEditorValue(payload.code, { skipHistory: true });
    applyInterpreterMode();
    if (jsShareWatermark) {
      jsShareWatermark.textContent = `由用户 IP 地址 ${payload.sharedByMaskedIp || "***"} 分享 · 60 分钟短效链接`;
      jsShareWatermark.hidden = false;
    }
    jsStatus.textContent = "已载入分享代码";
  } catch (error) {
    renderOutput([{ type: "error", message: error.message || "分享链接解析失败" }]);
  }
}

let cachedViewerIp = null;

async function getViewerIp() {
  if (cachedViewerIp) return cachedViewerIp;
  try {
    const data = await requestJson("/api/whoami");
    cachedViewerIp = data.ip || data.maskedIp || "unknown";
    return cachedViewerIp;
  } catch {
    cachedViewerIp = "unknown";
    return cachedViewerIp;
  }
}

function renderPreviewWatermark(ip) {
  if (!jsPreviewWatermark) return;
  const tile = `<span>IP ${escapeHtml(String(ip))} · 预览仅本机可见</span>`;
  jsPreviewWatermark.innerHTML = Array.from({ length: 30 }, () => tile).join("");
}

function buildPreviewSrcdoc(html, ip) {
  const safeIp = String(ip || "unknown").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&#39;" }[c]));
  const guard = `\n<script>(() => {\n  const block = (name) => () => { throw new Error("受限沙箱：" + name + " 已被禁用"); };\n  try { window.fetch = block("fetch"); } catch {}\n  try { window.XMLHttpRequest = function(){ throw new Error("受限沙箱：XMLHttpRequest 已被禁用"); }; } catch {}\n  try { window.WebSocket = function(){ throw new Error("受限沙箱：WebSocket 已被禁用"); }; } catch {}\n  try { window.EventSource = function(){ throw new Error("受限沙箱：EventSource 已被禁用"); }; } catch {}\n  try { Object.defineProperty(window, "localStorage", { get: block("localStorage") }); } catch {}\n  try { Object.defineProperty(window, "sessionStorage", { get: block("sessionStorage") }); } catch {}\n  try { Object.defineProperty(window, "indexedDB", { get: block("indexedDB") }); } catch {}\n  try { Object.defineProperty(document, "cookie", { get: () => "", set: block("document.cookie") }); } catch {}\n  try { window.eval = block("eval"); } catch {}\n  try { window.Function = function(){ throw new Error("受限沙箱：Function 构造器已被禁用"); }; } catch {}\n})();</script>\n`;
  // 水印：放进 iframe 内部，平铺并轻微旋转；颜色加深以确保可见。
  const watermarkStyle = `\n<style>\n#__sqlsim_watermark__ {\n  position: fixed; inset: 0; pointer-events: none; z-index: 2147483646;\n  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n  grid-auto-rows: 90px; align-items: center; justify-items: center;\n  color: rgba(15, 23, 42, 0.28); font-family: monospace;\n  font-size: 13px; font-weight: 700; letter-spacing: 0.04em; user-select: none;\n  text-shadow: 0 0 1px rgba(255,255,255,0.8);\n}\n#__sqlsim_watermark__ span { transform: rotate(-22deg); white-space: nowrap; }\n@media (prefers-color-scheme: dark) {\n  #__sqlsim_watermark__ { color: rgba(255, 255, 255, 0.32); text-shadow: 0 0 1px rgba(0,0,0,0.6); }\n}\n</style>\n`;
  const watermark = `${watermarkStyle}<div id="__sqlsim_watermark__" aria-hidden="true">${Array.from({ length: 30 }).map(() => `<span>IP ${safeIp} · 预览仅本机可见</span>`).join("")}</div>\n`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${watermark}${guard}</body>`);
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, `${watermark}${guard}</html>`);
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}\n${watermark}${guard}</body></html>`;
}

async function runHtmlPreview(html) {
  if (jsPreviewSection) jsPreviewSection.hidden = false;
  if (!jsPreviewFrame) {
    return [{ type: "error", message: "未找到预览容器" }];
  }
  const ip = await getViewerIp();
  renderPreviewWatermark(ip);
  jsPreviewFrame.srcdoc = buildPreviewSrcdoc(html, ip);
  return [
    { type: "info", message: `已渲染网页预览 · 访问 IP ${ip}` },
    { type: "done", message: "预览完成（高危 API 已被沙箱拦截）" }
  ];
}

async function runCurrentJavaScript() {
  const extraction = extractJavaScript(jsEditor.value, jsPrefs.interpreter);
  const extractionErrors = extraction.errors || [];
  const analysis = extractionErrors.length
    ? { ok: false, errors: extractionErrors, warnings: [] }
    : analyzeJavaScript(extraction.code, jsPrefs.interpreter === "html-js" && extraction.mode === "html-render" ? "html-preview" : jsPrefs.interpreter);

  renderRisks(analysis, extraction);
  jsExtractStatus.textContent = jsPrefs.interpreter === "nodejs"
    ? "NodeJS JavaScript"
    : jsPrefs.interpreter === "html-preview"
      ? "HTML 预览（含 CSS/JS）"
      : extraction.mode === "html-render" ? "HTML + script 渲染"
      : extraction.mode === "html-script" ? "已提取 script"
      : "JavaScript only";

  if (!analysis.ok) {
    jsStatus.textContent = "已拦截";
    renderOutput(analysis.errors.map((message) => ({ type: "error", message })));
    return;
  }

  jsRunBtn.disabled = true;
  const usePreview = jsPrefs.interpreter === "html-preview" || extraction.mode === "html-render";
  jsStatus.textContent = usePreview ? "渲染预览中" : "执行中";
  renderOutput([{ type: "info", message: usePreview ? "受限沙箱渲染中..." : "Worker 沙箱执行中..." }]);
  const lines = usePreview
    ? await runHtmlPreview(extraction.code)
    : await runJavaScript(extraction.code);
  renderOutput(lines);
  jsStatus.textContent = lines.some((line) => line.type === "error") ? "执行失败" : "执行完成";
  jsRunBtn.disabled = false;
}

jsEditor.value = jsExample;
updateJsHighlight();
refreshRiskState({ showSuggestions: false });
renderOutput([]);
lastHistoryValue = jsEditor.value;
applyInterpreterMode();
loadSharedJsFromUrl();
window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });

jsRunBtn.addEventListener("click", runCurrentJavaScript);
jsRefreshPreviewBtn?.addEventListener("click", () => {
  if (jsPrefs.interpreter === "html-preview") runCurrentJavaScript();
});
jsExampleBtn.addEventListener("click", () => {
  setEditorValue(jsExample);
  jsStatus.textContent = "已载入示例";
});
jsClearBtn.addEventListener("click", () => {
  setEditorValue("");
  jsStatus.textContent = "已清空";
  jsExtractStatus.textContent = "JavaScript only";
  renderRisks({ ok: false, errors: ["JavaScript 内容不能为空"], warnings: [] }, { warnings: [] });
  renderOutput([]);
});
jsFormatBtn?.addEventListener("click", () => {
  setEditorValue(formatJsLikeCode(jsEditor.value), { keepOutput: true });
  jsStatus.textContent = "已格式化";
});
jsImportBtn?.addEventListener("click", () => jsFileInput?.click());
jsFileInput?.addEventListener("change", async () => {
  const file = jsFileInput.files?.[0];
  if (!file) return;
  const content = await file.text();
  setEditorValue(content);
  jsStatus.textContent = `已导入 ${file.name || "文件"}`;
  jsFileInput.value = "";
});
jsExportBtn?.addEventListener("click", () => {
  const ext = /<\/?[a-z][\s\S]*>/i.test(jsEditor.value) ? "html" : "js";
  downloadTextFile(`javascript-lab-${formatTimestampForFile()}.${ext}`, jsEditor.value, ext === "html" ? "text/html;charset=utf-8" : "text/javascript;charset=utf-8");
  jsStatus.textContent = "已导出";
});
jsShareBtn?.addEventListener("click", () => setShareDialogOpen(true));
jsShareClose?.addEventListener("click", () => setShareDialogOpen(false));
jsShareCancel?.addEventListener("click", () => setShareDialogOpen(false));
jsShareAgree?.addEventListener("change", () => renderShareRisks(analyzeShareableJs()));
jsCreateShareLinkBtn?.addEventListener("click", async () => {
  const analysis = analyzeShareableJs();
  renderShareRisks(analysis);
  if (!analysis.ok) {
    jsStatus.textContent = "分享已拦截";
    return;
  }
  if (!jsShareAgree.checked) {
    jsStatus.textContent = "请先同意分享协议";
    return;
  }
  jsCreateShareLinkBtn.disabled = true;
  jsCreateShareLinkBtn.innerHTML = '<i data-lucide="loader-circle"></i> 创建中';
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });
  try {
    const payload = await requestJson("/api/share/js", {
      method: "POST",
      body: JSON.stringify({
        code: jsEditor.value,
        interpreter: jsPrefs.interpreter,
        acceptedTerms: true
      })
    });
    jsShareLinkInput.value = payload.url;
    renderShareRisks(payload.analysis);
    await navigator.clipboard?.writeText(payload.url).catch(() => {});
    jsStatus.textContent = "已创建 60 分钟分享链接";
  } catch (error) {
    jsStatus.textContent = "分享失败";
    renderOutput([{ type: "error", message: error.message || "分享失败" }]);
  } finally {
    jsCreateShareLinkBtn.disabled = false;
    jsCreateShareLinkBtn.innerHTML = '<i data-lucide="link"></i> 创建 60 分钟链接';
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });
  }
});
jsCopyShareLinkBtn?.addEventListener("click", async () => {
  if (!jsShareLinkInput.value) return;
  await navigator.clipboard?.writeText(jsShareLinkInput.value).catch(() => {
    jsShareLinkInput.select();
  });
});
jsClearOutputBtn?.addEventListener("click", () => {
  renderOutput([]);
  jsStatus.textContent = "已清除结果";
});
jsSettingsToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  setJsSettingsOpen(jsSettingsPanel.hidden);
});
jsSettingsClose?.addEventListener("click", () => setJsSettingsOpen(false));
jsSettingsPanel?.addEventListener("click", (event) => event.stopPropagation());
jsInterpreterSelect?.addEventListener("change", () => {
  jsPrefs.interpreter = jsInterpreterSelect.value;
  saveJsPrefs();
  applyInterpreterMode();
});
jsEditor.addEventListener("beforeinput", () => {
  pushEditorHistory(true);
});
jsEditor.addEventListener("input", () => {
  if (!applyingHistory) {
    jsRedoStack = [];
  }
  lastHistoryValue = jsEditor.value;
  updateJsHighlight();
  refreshRiskState();
  applyInterpreterMode();
});
jsEditor.addEventListener("scroll", syncJsHighlightScroll);
jsEditor.addEventListener("click", () => {
  hideJsSuggestions();
});
jsEditor.addEventListener("keydown", (event) => {
  const pairs = {
    "(": ")",
    "[": "]",
    "{": "}",
    "\"": "\"",
    "'": "'",
    "`": "`"
  };

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      redoEditor();
    } else {
      undoEditor();
    }
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    redoEditor();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redoEditor();
    return;
  }

  if (jsSuggestPanel && !jsSuggestPanel.hidden) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % visibleCompletions.length;
      renderJsSuggestions();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + visibleCompletions.length) % visibleCompletions.length;
      renderJsSuggestions();
      return;
    }
    if ((event.key === "Enter") && visibleCompletions[activeSuggestionIndex]) {
      event.preventDefault();
      insertCompletion(visibleCompletions[activeSuggestionIndex]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      hideJsSuggestions();
      return;
    }
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runCurrentJavaScript();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    if (jsEditor.selectionStart !== jsEditor.selectionEnd) {
      pushEditorHistory(true);
      const start = jsEditor.selectionStart;
      const end = jsEditor.selectionEnd;
      const before = jsEditor.value.slice(0, start);
      const selected = jsEditor.value.slice(start, end);
      const after = jsEditor.value.slice(end);
      const replacement = selected.split("\n").map((line) => `\t${line}`).join("\n");
      jsEditor.value = before + replacement + after;
      jsEditor.setSelectionRange(start, start + replacement.length);
    } else {
      insertAtSelection("\t");
    }
    updateJsHighlight();
    refreshRiskState({ showSuggestions: false });
    return;
  }

  if (event.key === ">" && jsEditor.selectionStart === jsEditor.selectionEnd) {
    const before = jsEditor.value.slice(0, jsEditor.selectionStart);
    if (/<script\b[^>]*$/i.test(before)) {
      event.preventDefault();
      insertAtSelection(">\n  \n</script>", 5);
      return;
    }
  }

  if (pairs[event.key] && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    pushEditorHistory(true);
    const start = jsEditor.selectionStart;
    const end = jsEditor.selectionEnd;
    const selected = jsEditor.value.slice(start, end);
    const text = event.key + selected + pairs[event.key];
    jsEditor.value = jsEditor.value.slice(0, start) + text + jsEditor.value.slice(end);
    const cursor = selected ? start + text.length : start + 1;
    jsEditor.setSelectionRange(cursor, cursor);
    updateJsHighlight();
    refreshRiskState();
    return;
  }

  const closingPairs = new Set([")", "]", "}", "\"", "'", "`"]);
  if (closingPairs.has(event.key) && jsEditor.value[jsEditor.selectionStart] === event.key) {
    event.preventDefault();
    const cursor = jsEditor.selectionStart + 1;
    jsEditor.setSelectionRange(cursor, cursor);
  }
});
jsSuggestionList?.addEventListener("mousedown", (event) => {
  const option = event.target.closest(".suggest-option");
  if (!option) return;
  event.preventDefault();
  const completion = visibleCompletions[Number(option.dataset.index)];
  if (completion) insertCompletion(completion);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".js-editor-stack")) hideJsSuggestions();
  if (!event.target.closest(".settings-wrap")) setJsSettingsOpen(false);
});
