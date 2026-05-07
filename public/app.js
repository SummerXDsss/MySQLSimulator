const sqlEditor = document.querySelector("#sqlEditor");
const lineNumbers = document.querySelector("#lineNumbers");
const highlightCode = document.querySelector("#highlightCode");
const suggestPanel = document.querySelector("#suggestPanel");
const suggestionList = document.querySelector("#suggestionList");
const suggestStatus = document.querySelector("#suggestStatus");
const runBtn = document.querySelector("#runBtn");
const resetBtn = document.querySelector("#resetBtn");
const importSqlmBtn = document.querySelector("#importSqlmBtn");
const exportSqlmBtn = document.querySelector("#exportSqlmBtn");
const sqlmFileInput = document.querySelector("#sqlmFileInput");
const copyBtn = document.querySelector("#copyBtn");
const formatBtn = document.querySelector("#formatBtn");
const loadVisualBtn = document.querySelector("#loadVisualBtn");
const themeToggle = document.querySelector("#themeToggle");
const currentDb = document.querySelector("#currentDb");
const schemaTree = document.querySelector("#schemaTree");
const exampleList = document.querySelector("#exampleList");
const resultTabs = document.querySelector("#resultTabs");
const resultSummary = document.querySelector("#resultSummary");
const resultPanel = document.querySelector("#resultPanel");
const elapsedTime = document.querySelector("#elapsedTime");
const resultState = document.querySelector("#resultState");
const consoleLog = document.querySelector("#consoleLog");
const visualTableSelect = document.querySelector("#visualTableSelect");
const refreshTableBtn = document.querySelector("#refreshTableBtn");
const visualTableMeta = document.querySelector("#visualTableMeta");
const visualTablePanel = document.querySelector("#visualTablePanel");
const builderAction = document.querySelector("#builderAction");
const builderDatabase = document.querySelector("#builderDatabase");
const builderTable = document.querySelector("#builderTable");
const builderColumns = document.querySelector("#builderColumns");
const builderValuesBlock = document.querySelector("#builderValuesBlock");
const builderValues = document.querySelector("#builderValues");
const builderWhereColumn = document.querySelector("#builderWhereColumn");
const builderOperator = document.querySelector("#builderOperator");
const builderWhereValue = document.querySelector("#builderWhereValue");
const builderOrderColumn = document.querySelector("#builderOrderColumn");
const builderOrderDirection = document.querySelector("#builderOrderDirection");
const builderLimit = document.querySelector("#builderLimit");
const generatedSql = document.querySelector("#generatedSql");
const applyGeneratedBtn = document.querySelector("#applyGeneratedBtn");
const runGeneratedBtn = document.querySelector("#runGeneratedBtn");

let results = [];
let activeResultIndex = 0;
let schemaState = null;
let selectedVisualTable = { database: "shop_demo", table: "orders" };
let editorSuggestions = [];
let sidebarSuggestions = [];

const defaultSql = `SELECT VERSION();
SELECT DATABASE();
SHOW TABLES;
SELECT id, customer_id, status, total_amount
FROM orders
WHERE status = 'paid'
ORDER BY id DESC
LIMIT 5;`;

const keywordSuggestions = [
  { label: "SELECT", insert: "SELECT ", detail: "查询数据", type: "关键词" },
  { label: "FROM", insert: "FROM ", detail: "指定表", type: "关键词" },
  { label: "WHERE", insert: "WHERE ", detail: "过滤条件", type: "关键词" },
  { label: "ORDER BY", insert: "ORDER BY ", detail: "排序", type: "关键词" },
  { label: "GROUP BY", insert: "GROUP BY ", detail: "分组", type: "关键词" },
  { label: "LIMIT", insert: "LIMIT ", detail: "限制条数", type: "关键词" },
  { label: "INSERT INTO", insert: "INSERT INTO ", detail: "新增数据", type: "关键词" },
  { label: "UPDATE", insert: "UPDATE ", detail: "更新数据", type: "关键词" },
  { label: "DELETE FROM", insert: "DELETE FROM ", detail: "删除数据", type: "关键词" },
  { label: "CREATE TABLE", insert: "CREATE TABLE ", detail: "创建表", type: "关键词" },
  { label: "ALTER TABLE", insert: "ALTER TABLE ", detail: "修改表结构", type: "关键词" },
  { label: "SHOW TABLES", insert: "SHOW TABLES;", detail: "查看表", type: "指令" },
  { label: "DESC", insert: "DESC ", detail: "查看字段", type: "指令" },
  { label: "EXPLAIN", insert: "EXPLAIN ", detail: "模拟执行计划", type: "指令" },
  { label: "BEGIN", insert: "BEGIN;", detail: "开启事务", type: "事务" },
  { label: "COMMIT", insert: "COMMIT;", detail: "提交事务", type: "事务" },
  { label: "ROLLBACK", insert: "ROLLBACK;", detail: "回滚事务", type: "事务" }
];

const snippetSuggestions = [
  { label: "SELECT * FROM", insert: "SELECT *\nFROM ", detail: "基础查询片段", type: "片段" },
  { label: "SELECT WHERE LIMIT", insert: "SELECT *\nFROM orders\nWHERE status = 'paid'\nLIMIT 10;", detail: "条件查询片段", type: "片段" },
  { label: "INSERT VALUES", insert: "INSERT INTO customers (name, email, city, vip_level)\nVALUES ('Demo User', 'demo@example.com', 'Shanghai', 'standard');", detail: "新增客户片段", type: "片段" },
  { label: "UPDATE WHERE", insert: "UPDATE orders\nSET status = 'paid'\nWHERE id = 1003;", detail: "条件更新片段", type: "片段" },
  { label: "TRANSACTION", insert: "START TRANSACTION;\nSELECT * FROM orders;\nROLLBACK;", detail: "事务片段", type: "片段" }
];

const sqlKeywordSet = new Set([
  "ADD", "AFTER", "ALGORITHM", "ALL", "ALTER", "ANALYZE", "AND", "AS", "ASC", "AUTO_INCREMENT",
  "BEFORE", "BEGIN", "BETWEEN", "BY", "CASCADE", "CASE", "CHANGE", "CHARACTER", "CHECK", "COLLATE",
  "COLUMN", "COLUMNS", "COMMIT", "CONSTRAINT", "CREATE", "CROSS", "CURRENT_TIMESTAMP", "DATABASE",
  "DATABASES", "DEFAULT", "DELETE", "DESC", "DESCRIBE", "DISTINCT", "DROP", "ELSE", "END", "ENGINE",
  "EXISTS", "EXPLAIN", "FALSE", "FIRST", "FOREIGN", "FROM", "FULL", "GROUP", "HAVING", "HELP",
  "IF", "IGNORE", "IN", "INDEX", "INNER", "INSERT", "INTO", "IS", "JOIN", "KEY", "LEFT", "LIKE",
  "LIMIT", "LOCK", "NOT", "NULL", "ON", "OR", "ORDER", "OUTER", "PRIMARY", "REFERENCES", "RENAME",
  "REPLACE", "RIGHT", "ROLLBACK", "SELECT", "SET", "SHOW", "START", "TABLE", "TABLES", "THEN",
  "TO", "TRANSACTION", "TRUE", "TRUNCATE", "UNION", "UNIQUE", "UNLOCK", "UPDATE", "USE", "USING",
  "VALUES", "VIEW", "WHEN", "WHERE"
]);

const sqlTypeSet = new Set([
  "BIGINT", "BINARY", "BIT", "BLOB", "BOOL", "BOOLEAN", "CHAR", "DATE", "DATETIME", "DECIMAL",
  "DOUBLE", "ENUM", "FLOAT", "INT", "INTEGER", "JSON", "LONGTEXT", "MEDIUMINT", "NUMERIC", "REAL",
  "SMALLINT", "TEXT", "TIME", "TIMESTAMP", "TINYINT", "VARCHAR"
]);

const sqlFunctionSet = new Set([
  "AVG", "COALESCE", "CONCAT", "COUNT", "CURDATE", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_USER",
  "DATABASE", "DATE_FORMAT", "IFNULL", "LOWER", "MAX", "MIN", "NOW", "ROUND", "SUM", "UPPER", "USER",
  "VERSION"
]);

function iconRefresh() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 1.5
      }
    });
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("mysql-simulator-theme", nextTheme);
  themeToggle.innerHTML = nextTheme === "dark"
    ? '<i data-lucide="sun"></i><span>浅色模式</span>'
    : '<i data-lucide="moon"></i><span>深色模式</span>';
  iconRefresh();
}

function initTheme() {
  const activeTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(activeTheme);
}

function setResultState(state, label) {
  resultState.className = `status-badge ${state}`;
  resultState.textContent = label;
}

function highlightSql(sql) {
  const tokenPattern = /(--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|''|[^'])*'|"(?:\\.|[^"])*"|`[^`]*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w$]*\b|<>|!=|<=|>=|:=|[(),.;=*<>+-])/g;
  let html = "";
  let cursor = 0;
  let match;

  while ((match = tokenPattern.exec(sql)) !== null) {
    const token = match[0];
    html += escapeHtml(sql.slice(cursor, match.index));
    const upperToken = token.toUpperCase();
    const rest = sql.slice(match.index + token.length);
    const isFunctionCall = sqlFunctionSet.has(upperToken) && /^\s*\(/.test(rest);

    if (token.startsWith("--") || token.startsWith("#") || token.startsWith("/*")) {
      html += `<span class="sql-comment">${escapeHtml(token)}</span>`;
    } else if (token.startsWith("'") || token.startsWith('"') || token.startsWith("`")) {
      html += `<span class="sql-string">${escapeHtml(token)}</span>`;
    } else if (/^\d/.test(token)) {
      html += `<span class="sql-number">${escapeHtml(token)}</span>`;
    } else if (isFunctionCall) {
      html += `<span class="sql-function">${escapeHtml(token)}</span>`;
    } else if (sqlKeywordSet.has(upperToken)) {
      html += `<span class="sql-keyword">${escapeHtml(token)}</span>`;
    } else if (sqlTypeSet.has(upperToken)) {
      html += `<span class="sql-type">${escapeHtml(token)}</span>`;
    } else if (/^(?:[(),.;=*<>+-]|<>|!=|<=|>=|:=)$/.test(token)) {
      html += `<span class="sql-operator">${escapeHtml(token)}</span>`;
    } else {
      html += escapeHtml(token);
    }

    cursor = match.index + token.length;
  }

  html += escapeHtml(sql.slice(cursor));
  return html || "\n";
}

function syncEditorScroll() {
  lineNumbers.scrollTop = sqlEditor.scrollTop;
  highlightCode.style.transform = `translate(${-sqlEditor.scrollLeft}px, ${-sqlEditor.scrollTop}px)`;
}

function updateHighlight() {
  highlightCode.innerHTML = `${highlightSql(sqlEditor.value)}\n`;
  syncEditorScroll();
}

function updateEditorVisuals() {
  updateLineNumbers();
  updateHighlight();
}

function quoteSqlValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "''";
  if (/^null$/i.test(raw)) return "NULL";
  if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
  if (/^now\(\)$/i.test(raw)) return "NOW()";
  return `'${raw.replace(/'/g, "\\'")}'`;
}

function getDatabases() {
  return schemaState?.databases || [];
}

function getTables(databaseName) {
  return getDatabases().find((database) => database.name === databaseName)?.tables || [];
}

function getSelectedTable() {
  return getTables(selectedVisualTable.database).find((table) => table.name === selectedVisualTable.table) || null;
}

function getCurrentWord() {
  const cursor = sqlEditor.selectionStart || 0;
  const prefix = sqlEditor.value.slice(0, cursor);
  const match = prefix.match(/[A-Za-z_][\w.]*$/);
  const word = match?.[0] || "";
  return {
    word,
    start: cursor - word.length,
    end: cursor
  };
}

function uniqueSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.label}:${item.insert}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSchemaSuggestionItems() {
  if (!schemaState) return [];
  const items = [];
  getDatabases().forEach((database) => {
    items.push({ label: database.name, insert: database.name, detail: "数据库", type: "库" });
    database.tables.forEach((table) => {
      items.push({ label: table.name, insert: table.name, detail: `${database.name} · 表`, type: "表" });
      table.columns.forEach((column) => {
        items.push({
          label: column.name,
          insert: column.name,
          detail: `${table.name} · ${column.type}`,
          type: "字段"
        });
        items.push({
          label: `${table.name}.${column.name}`,
          insert: `${table.name}.${column.name}`,
          detail: column.type,
          type: "字段"
        });
      });
    });
  });
  return items;
}

function buildSuggestions(query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  const items = uniqueSuggestions([
    ...keywordSuggestions,
    ...snippetSuggestions,
    ...getSchemaSuggestionItems()
  ]);

  if (!normalizedQuery) return items;

  return items
    .filter((item) => `${item.label} ${item.insert} ${item.detail}`.toLowerCase().includes(normalizedQuery))
    .sort((first, second) => {
      const firstStarts = first.label.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      const secondStarts = second.label.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      return firstStarts - secondStarts || first.label.localeCompare(second.label);
    });
}

function renderSidebarSuggestions() {
  const table = getSelectedTable();
  const selectedColumns = table?.columns?.slice(0, 8).map((column) => ({
    label: column.name,
    insert: column.name,
    detail: `${table.name} · ${column.type}`,
    type: "字段"
  })) || [];
  sidebarSuggestions = uniqueSuggestions([
    ...keywordSuggestions.slice(0, 8),
    ...selectedColumns,
    ...snippetSuggestions.slice(0, 3)
  ]).slice(0, 18);

  suggestionList.innerHTML = sidebarSuggestions.map((item, index) => `
    <button class="suggestion-chip" type="button" data-sidebar-suggestion="${index}" title="${escapeHtml(item.detail)}">
      ${escapeHtml(item.label)}
    </button>
  `).join("");

  suggestionList.querySelectorAll("[data-sidebar-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      insertSuggestion(sidebarSuggestions[Number(button.dataset.sidebarSuggestion)]);
    });
  });
}

function renderSuggestPanel(force = false) {
  const current = getCurrentWord();
  const shouldShow = force || current.word.length > 0;
  editorSuggestions = buildSuggestions(current.word).slice(0, 9);

  if (!shouldShow || !editorSuggestions.length) {
    suggestPanel.hidden = true;
    suggestStatus.textContent = current.word ? "无匹配提示" : "输入 SQL 获取提示";
    return;
  }

  suggestStatus.textContent = `${editorSuggestions.length} 个提示`;
  suggestPanel.hidden = false;
  suggestPanel.innerHTML = editorSuggestions.map((item, index) => `
    <button class="suggest-option" type="button" data-editor-suggestion="${index}">
      <span>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.detail)}</small>
      </span>
      <em>${escapeHtml(item.type)}</em>
    </button>
  `).join("");

  suggestPanel.querySelectorAll("[data-editor-suggestion]").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      insertSuggestion(editorSuggestions[Number(button.dataset.editorSuggestion)]);
    });
  });
}

function insertSuggestion(item) {
  if (!item) return;
  const current = getCurrentWord();
  const before = sqlEditor.value.slice(0, current.start);
  const after = sqlEditor.value.slice(current.end);
  sqlEditor.value = `${before}${item.insert}${after}`;
  const cursor = before.length + item.insert.length;
  sqlEditor.setSelectionRange(cursor, cursor);
  updateEditorVisuals();
  renderSuggestPanel(false);
  sqlEditor.focus();
}

function getFirstTable(schema) {
  const database = schema?.databases?.[0];
  const table = database?.tables?.[0];
  if (!database || !table) return null;
  return { database: database.name, table: table.name };
}

function sampleValueForColumn(column) {
  if (/int|decimal|float|double/i.test(column.type)) return column.extra === "auto_increment" ? "" : "1";
  if (/date|time/i.test(column.type)) return "NOW()";
  if (/status/i.test(column.name)) return "paid";
  if (/email/i.test(column.name)) return "demo@example.com";
  if (/name|title/i.test(column.name)) return "Demo";
  return "value";
}

function updateLineNumbers() {
  const count = sqlEditor.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
}

function formatSql() {
  const keywords = [
    "SELECT", "FROM", "WHERE", "ORDER BY", "GROUP BY", "LIMIT", "INSERT INTO", "VALUES",
    "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "CREATE DATABASE", "ALTER TABLE",
    "DROP TABLE", "SHOW TABLES", "SHOW DATABASES", "DESC", "EXPLAIN", "BEGIN", "COMMIT", "ROLLBACK"
  ];
  let value = sqlEditor.value.replace(/\s+/g, " ").trim();
  keywords.forEach((keyword) => {
    const pattern = new RegExp(`\\b${keyword.replace(" ", "\\s+")}\\b`, "gi");
    value = value.replace(pattern, keyword);
  });
  value = value
    .replace(/\s*;\s*/g, ";\n")
    .replace(/\s+(FROM|WHERE|ORDER BY|GROUP BY|LIMIT|VALUES|SET)\s+/g, "\n$1 ")
    .trim();
  sqlEditor.value = value.endsWith(";") ? value : `${value};`;
  updateEditorVisuals();
  renderSuggestPanel(false);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "请求失败");
  }
  return payload;
}

function renderSchema(schema) {
  schemaState = schema;
  if (!getSelectedTable()) {
    selectedVisualTable = getFirstTable(schema) || selectedVisualTable;
  }
  currentDb.textContent = `${schema.currentDatabase || "未选择数据库"}${schema.transactionActive ? " · transaction" : ""}`;
  schemaTree.innerHTML = schema.databases.map((database) => `
    <div class="schema-db">
      <div class="schema-db-name">
        <span>${escapeHtml(database.name)}</span>
        <span class="schema-pill">${database.tables.length} tables</span>
      </div>
      <div class="table-group">
        ${database.tables.map((table) => `
          <div class="table-node">
            <button class="table-name ${selectedVisualTable.database === database.name && selectedVisualTable.table === table.name ? "active" : ""}" type="button" data-database="${escapeHtml(database.name)}" data-table="${escapeHtml(table.name)}">
              ${escapeHtml(table.name)} · ${table.rowCount}
            </button>
            ${table.columns.slice(0, 5).map((column) => `
              <div class="column-row">${escapeHtml(column.name)} <span>${escapeHtml(column.type)}</span></div>
            `).join("")}
          </div>
        `).join("") || '<div class="column-row">空数据库</div>'}
      </div>
    </div>
  `).join("");
  schemaTree.querySelectorAll("[data-database][data-table]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedVisualTable = {
        database: button.dataset.database,
        table: button.dataset.table
      };
      renderSchema(schemaState);
      syncBuilderFromSelection();
      loadVisualTable();
    });
  });
  renderVisualTableOptions();
  renderBuilderControls();
  renderSidebarSuggestions();
}

function renderExamples(examples) {
  exampleList.innerHTML = examples.map((example, index) => `
    <button class="example-button" type="button" data-example="${index}">
      <strong>${escapeHtml(example.name)}</strong>
      <span>${escapeHtml(example.description)}</span>
    </button>
  `).join("");
  exampleList.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => {
      const example = examples[Number(button.dataset.example)];
      sqlEditor.value = example.sql;
      updateEditorVisuals();
      sqlEditor.focus();
    });
  });
}

function renderVisualTableOptions() {
  const options = getDatabases().flatMap((database) => database.tables.map((table) => ({
    value: `${database.name}.${table.name}`,
    label: `${database.name}.${table.name}`
  })));

  visualTableSelect.innerHTML = options.map((option) => `
    <option value="${escapeHtml(option.value)}" ${option.value === `${selectedVisualTable.database}.${selectedVisualTable.table}` ? "selected" : ""}>
      ${escapeHtml(option.label)}
    </option>
  `).join("");
}

function syncBuilderFromSelection() {
  builderDatabase.value = selectedVisualTable.database;
  renderBuilderTableOptions();
  builderTable.value = selectedVisualTable.table;
  renderBuilderFields();
  updateGeneratedSql();
}

function renderBuilderControls() {
  const databases = getDatabases();
  builderDatabase.innerHTML = databases.map((database) => `
    <option value="${escapeHtml(database.name)}" ${database.name === selectedVisualTable.database ? "selected" : ""}>
      ${escapeHtml(database.name)}
    </option>
  `).join("");
  renderBuilderTableOptions();
  renderBuilderFields();
  updateGeneratedSql();
}

function renderBuilderTableOptions() {
  const tables = getTables(builderDatabase.value || selectedVisualTable.database);
  if (!tables.some((table) => table.name === selectedVisualTable.table)) {
    selectedVisualTable.table = tables[0]?.name || "";
  }
  builderTable.innerHTML = tables.map((table) => `
    <option value="${escapeHtml(table.name)}" ${table.name === selectedVisualTable.table ? "selected" : ""}>
      ${escapeHtml(table.name)}
    </option>
  `).join("");
}

function renderBuilderFields() {
  const table = getSelectedTable();
  const columns = table?.columns || [];
  const writableColumns = columns.filter((column) => column.extra !== "auto_increment");
  const selectedColumnNames = columns.slice(0, 4).map((column) => column.name);
  const valueColumns = writableColumns.slice(0, 4);

  builderColumns.innerHTML = columns.map((column) => `
    <label class="builder-column">
      <input type="checkbox" value="${escapeHtml(column.name)}" ${selectedColumnNames.includes(column.name) ? "checked" : ""} />
      <span>${escapeHtml(column.name)} <small>${escapeHtml(column.type)}</small></span>
    </label>
  `).join("");

  builderValues.innerHTML = valueColumns.map((column) => `
    <label class="builder-value-row">
      <span>${escapeHtml(column.name)}</span>
      <input class="builder-value" data-column="${escapeHtml(column.name)}" type="text" value="${escapeHtml(sampleValueForColumn(column))}" />
    </label>
  `).join("");

  const noneOption = '<option value="">无</option>';
  const columnOptions = columns.map((column) => `<option value="${escapeHtml(column.name)}">${escapeHtml(column.name)}</option>`).join("");
  builderWhereColumn.innerHTML = `${noneOption}${columnOptions}`;
  builderOrderColumn.innerHTML = `${noneOption}${columnOptions}`;

  const idColumn = columns.find((column) => column.key === "PRI") || columns[0];
  if (idColumn) builderWhereColumn.value = idColumn.name;
  if (columns[0]) builderOrderColumn.value = columns[0].name;

  builderValuesBlock.style.display = ["insert", "update"].includes(builderAction.value) ? "block" : "none";
  document.querySelectorAll(".select-options").forEach((element) => {
    element.style.display = builderAction.value === "select" ? "grid" : "none";
  });

  builderColumns.querySelectorAll("input").forEach((input) => input.addEventListener("change", updateGeneratedSql));
  builderValues.querySelectorAll("input").forEach((input) => input.addEventListener("input", updateGeneratedSql));
}

function getCheckedBuilderColumns() {
  return Array.from(builderColumns.querySelectorAll("input:checked")).map((input) => input.value);
}

function getBuilderValueMap() {
  return Object.fromEntries(Array.from(builderValues.querySelectorAll("input")).map((input) => [input.dataset.column, input.value]));
}

function buildWhereClause() {
  const column = builderWhereColumn.value;
  const value = builderWhereValue.value.trim();
  if (!column || !value) return "";
  const operator = builderOperator.value.toUpperCase();
  return ` WHERE ${column} ${operator} ${quoteSqlValue(value)}`;
}

function updateGeneratedSql() {
  const table = getSelectedTable();
  if (!table) {
    generatedSql.value = "";
    return;
  }

  const action = builderAction.value;
  const checked = getCheckedBuilderColumns();
  const values = getBuilderValueMap();
  const tableName = table.name;
  const whereClause = buildWhereClause();
  const selectedColumns = checked.length ? checked : table.columns.map((column) => column.name);

  if (action === "select") {
    const order = builderOrderColumn.value ? `\nORDER BY ${builderOrderColumn.value} ${builderOrderDirection.value}` : "";
    const limit = builderLimit.value ? `\nLIMIT ${builderLimit.value}` : "";
    generatedSql.value = `SELECT ${selectedColumns.join(", ")}\nFROM ${tableName}${whereClause}${order}${limit};`;
    return;
  }

  if (action === "insert") {
    const insertColumns = selectedColumns.filter((columnName) => table.columns.find((column) => column.name === columnName)?.extra !== "auto_increment");
    const valueList = insertColumns.map((columnName) => quoteSqlValue(values[columnName] || sampleValueForColumn(table.columns.find((column) => column.name === columnName))));
    generatedSql.value = `INSERT INTO ${tableName} (${insertColumns.join(", ")})\nVALUES (${valueList.join(", ")});`;
    return;
  }

  if (action === "update") {
    const updateColumns = selectedColumns.filter((columnName) => table.columns.find((column) => column.name === columnName)?.extra !== "auto_increment");
    const assignments = updateColumns.map((columnName) => `${columnName} = ${quoteSqlValue(values[columnName] || sampleValueForColumn(table.columns.find((column) => column.name === columnName)))}`);
    generatedSql.value = `UPDATE ${tableName}\nSET ${assignments.join(", ")}${whereClause};`;
    return;
  }

  generatedSql.value = `DELETE FROM ${tableName}${whereClause};`;
}

async function loadVisualTable() {
  if (!selectedVisualTable.database || !selectedVisualTable.table) return;
  const tableData = await fetchJson(`/api/table?database=${encodeURIComponent(selectedVisualTable.database)}&table=${encodeURIComponent(selectedVisualTable.table)}`);
  visualTableMeta.innerHTML = `
    <span class="summary-pill"><strong>${escapeHtml(tableData.database)}.${escapeHtml(tableData.table)}</strong></span>
    <span class="summary-pill"><strong>${tableData.rowCount}</strong> 行</span>
    <span class="summary-pill"><strong>${tableData.columns.length}</strong> 字段</span>
  `;
  renderTableInto(visualTablePanel, tableData.columns.map((column) => column.name), tableData.rows, "这个表目前没有数据。");
}

function renderResultTabs() {
  if (!results.length) {
    resultTabs.innerHTML = "";
    return;
  }
  resultTabs.innerHTML = results.map((result, index) => `
    <button class="result-tab ${index === activeResultIndex ? "active" : ""}" type="button" data-result="${index}">
      #${index + 1} ${result.kind === "error" ? "错误" : result.kind === "table" ? "表格" : "消息"}
    </button>
  `).join("");
  resultTabs.querySelectorAll("[data-result]").forEach((button) => {
    button.addEventListener("click", () => {
      activeResultIndex = Number(button.dataset.result);
      renderResults();
    });
  });
}

function renderTableInto(container, columns, rows, emptyText) {
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((row) => `
          <tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>
        `).join("") : `<tr><td colspan="${Math.max(columns.length, 1)}">${escapeHtml(emptyText)}</td></tr>`}
      </tbody>
    </table>
  `;
}

function renderResultSummary() {
  if (!results.length) {
    resultSummary.innerHTML = "";
    return;
  }
  const tableCount = results.filter((result) => result.kind === "table").length;
  const errorCount = results.filter((result) => result.kind === "error").length;
  const affectedRows = results.reduce((total, result) => total + Number(result.affectedRows || 0), 0);
  resultSummary.innerHTML = `
    <span class="summary-pill"><strong>${results.length}</strong> 语句</span>
    <span class="summary-pill"><strong>${tableCount}</strong> 表格结果</span>
    <span class="summary-pill"><strong>${affectedRows}</strong> 影响/返回行</span>
    ${errorCount ? `<span class="summary-pill"><strong>${errorCount}</strong> 错误</span>` : ""}
  `;
}

function renderResults() {
  renderResultTabs();
  renderResultSummary();

  if (!results.length) {
    resultPanel.innerHTML = '<div class="empty-result">运行 SQL 后，这里会显示表格、消息或错误。</div>';
    return;
  }

  const result = results[activeResultIndex] || results[0];
  if (result.kind === "error") {
    resultPanel.innerHTML = `
      <div class="result-message result-error">
        <strong>${escapeHtml(result.message)}</strong>
        ${result.detail ? `<p>${escapeHtml(result.detail)}</p>` : ""}
      </div>
    `;
    return;
  }

  if (result.kind === "message") {
    resultPanel.innerHTML = `
      <div class="result-message">
        <strong>${escapeHtml(result.message)}</strong>
        <p>影响行数：${Number(result.affectedRows || 0)}</p>
      </div>
    `;
    return;
  }

  const rows = result.rows || [];
  const columns = result.columns || [];
  renderTableInto(resultPanel, columns, rows, "Empty set");
  resultPanel.insertAdjacentHTML("beforeend", `<div class="result-message">${escapeHtml(result.message)}</div>`);
}

function addLog(resultSet) {
  const items = resultSet.results || [];
  const entry = document.createElement("div");
  entry.className = `log-item ${resultSet.ok ? "" : "error"}`;
  entry.innerHTML = `
    <strong>${resultSet.ok ? "执行完成" : "执行出现错误"}</strong>
    <span>${items.length} 条语句 · ${resultSet.elapsedMs} ms</span>
  `;
  consoleLog.prepend(entry);
  while (consoleLog.children.length > 8) {
    consoleLog.removeChild(consoleLog.lastChild);
  }
}

function addSystemLog(title, detail, ok = true) {
  const entry = document.createElement("div");
  entry.className = `log-item ${ok ? "" : "error"}`;
  entry.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(detail)}</span>
  `;
  consoleLog.prepend(entry);
  while (consoleLog.children.length > 8) {
    consoleLog.removeChild(consoleLog.lastChild);
  }
}

async function runSql() {
  runBtn.disabled = true;
  setResultState("running", "执行中");
  elapsedTime.textContent = "运行中";
  runBtn.innerHTML = '<i data-lucide="loader-circle"></i><span>执行中</span><small>请稍候</small>';
  iconRefresh();
  try {
    const payload = await fetchJson("/api/query", {
      method: "POST",
      body: JSON.stringify({ sql: sqlEditor.value })
    });
    results = payload.results || [];
    activeResultIndex = 0;
    elapsedTime.textContent = `${payload.elapsedMs} ms`;
    setResultState(payload.ok ? "success" : "error", payload.ok ? "执行成功" : "执行失败");
    renderSchema(payload.schema);
    renderResults();
    addLog(payload);
    await loadVisualTable();
  } catch (error) {
    results = [{ kind: "error", message: error.message, columns: [], rows: [] }];
    activeResultIndex = 0;
    elapsedTime.textContent = "失败";
    setResultState("error", "执行失败");
    renderResults();
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<i data-lucide="play"></i><span>执行 SQL</span><small>Ctrl Enter</small>';
    iconRefresh();
  }
}

async function resetState() {
  const payload = await fetchJson("/api/reset", { method: "POST", body: "{}" });
  renderSchema(payload.schema);
  results = [];
  activeResultIndex = 0;
  elapsedTime.textContent = "已重置";
  setResultState("idle", "已重置");
  renderResults();
  addSystemLog("已重置", "模拟数据库恢复到初始状态");
  await loadVisualTable();
}

async function exportSqlm() {
  const response = await fetch("/api/sqlm/export");
  if (!response.ok) throw new Error("下载 sqlm 失败");
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "mysql-simulator.sqlm";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  addSystemLog("已下载 sqlm", `${filename} 已加密导出`);
}

async function importSqlm(file) {
  if (!file) return;
  const content = await file.text();
  const payload = await fetchJson("/api/sqlm/import", {
    method: "POST",
    body: JSON.stringify({ content })
  });
  renderSchema(payload.schema);
  results = [];
  activeResultIndex = 0;
  elapsedTime.textContent = "已导入";
  setResultState("success", "导入成功");
  renderResults();
  addSystemLog("已导入 sqlm", payload.message || "文件已解密并恢复");
  await loadVisualTable();
}

async function bootstrap() {
  initTheme();
  sqlEditor.value = defaultSql;
  updateEditorVisuals();
  setResultState("idle", "等待执行");
  renderResults();

  const [state, examplePayload] = await Promise.all([
    fetchJson("/api/state"),
    fetchJson("/api/examples")
  ]);
  renderSchema(state);
  renderExamples(examplePayload.examples);
  await loadVisualTable();
  renderSuggestPanel(false);
  iconRefresh();
}

sqlEditor.addEventListener("input", () => {
  updateEditorVisuals();
  renderSuggestPanel(false);
});
sqlEditor.addEventListener("scroll", () => {
  syncEditorScroll();
});

sqlEditor.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    runSql();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.code === "Space") {
    event.preventDefault();
    renderSuggestPanel(true);
    return;
  }
  if (event.key === "Escape") {
    suggestPanel.hidden = true;
  }
});

sqlEditor.addEventListener("click", () => renderSuggestPanel(false));
sqlEditor.addEventListener("blur", () => {
  setTimeout(() => {
    suggestPanel.hidden = true;
  }, 120);
});

themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

runBtn.addEventListener("click", runSql);
resetBtn.addEventListener("click", resetState);
exportSqlmBtn.addEventListener("click", () => {
  exportSqlm().catch((error) => addSystemLog("下载失败", error.message, false));
});
importSqlmBtn.addEventListener("click", () => {
  sqlmFileInput.click();
});
sqlmFileInput.addEventListener("change", () => {
  importSqlm(sqlmFileInput.files?.[0])
    .catch((error) => addSystemLog("导入失败", error.message, false))
    .finally(() => {
      sqlmFileInput.value = "";
    });
});
formatBtn.addEventListener("click", formatSql);
loadVisualBtn.addEventListener("click", loadVisualTable);
refreshTableBtn.addEventListener("click", loadVisualTable);
visualTableSelect.addEventListener("change", () => {
  const [database, table] = visualTableSelect.value.split(".");
  selectedVisualTable = { database, table };
  renderSchema(schemaState);
  syncBuilderFromSelection();
  loadVisualTable();
});
builderAction.addEventListener("change", () => {
  renderBuilderFields();
  updateGeneratedSql();
});
builderDatabase.addEventListener("change", () => {
  selectedVisualTable.database = builderDatabase.value;
  selectedVisualTable.table = getTables(builderDatabase.value)[0]?.name || "";
  renderSchema(schemaState);
  syncBuilderFromSelection();
  loadVisualTable();
});
builderTable.addEventListener("change", () => {
  selectedVisualTable.table = builderTable.value;
  renderSchema(schemaState);
  syncBuilderFromSelection();
  loadVisualTable();
});
[builderWhereColumn, builderOperator, builderWhereValue, builderOrderColumn, builderOrderDirection, builderLimit].forEach((element) => {
  element.addEventListener("input", updateGeneratedSql);
  element.addEventListener("change", updateGeneratedSql);
});
applyGeneratedBtn.addEventListener("click", () => {
  sqlEditor.value = generatedSql.value;
  updateEditorVisuals();
  sqlEditor.focus();
});
runGeneratedBtn.addEventListener("click", async () => {
  sqlEditor.value = generatedSql.value;
  updateEditorVisuals();
  await runSql();
});
copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(sqlEditor.value);
  const label = copyBtn.querySelector("span");
  if (label) label.textContent = "已复制";
  copyBtn.title = "已复制";
  setTimeout(() => {
    copyBtn.title = "复制 SQL";
    if (label) label.textContent = "复制";
  }, 1200);
});

bootstrap().catch((error) => {
  results = [{ kind: "error", message: error.message, columns: [], rows: [] }];
  renderResults();
});
