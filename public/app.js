const sqlEditor = document.querySelector("#sqlEditor");
const lineNumbers = document.querySelector("#lineNumbers");
const highlightCode = document.querySelector("#highlightCode");
const suggestPanel = document.querySelector("#suggestPanel");
const suggestionList = document.querySelector("#suggestionList");
const suggestStatus = document.querySelector("#suggestStatus");
const runBtn = document.querySelector("#runBtn");
const resetBtn = document.querySelector("#resetBtn");
const importExportToggle = document.querySelector("#importExportToggle");
const importExportMenu = document.querySelector("#importExportMenu");
const importSqlBtn = document.querySelector("#importSqlBtn");
const importSqlmBtn = document.querySelector("#importSqlmBtn");
const exportSqlmBtn = document.querySelector("#exportSqlmBtn");
const exportSqlBtn = document.querySelector("#exportSqlBtn");
const shareSqlBtn = document.querySelector("#shareSqlBtn");
const sqlmFileInput = document.querySelector("#sqlmFileInput");
const sqlFileInput = document.querySelector("#sqlFileInput");
const copyBtn = document.querySelector("#copyBtn");
const formatBtn = document.querySelector("#formatBtn");
const openAiBtn = document.querySelector("#openAiBtn");
const loadVisualBtn = document.querySelector("#loadVisualBtn");
const themeToggle = document.querySelector("#themeToggle");
const navAiBtn = document.querySelector("#navAiBtn");
const settingsToggle = document.querySelector("#settingsToggle");
const settingsPanel = document.querySelector("#settingsPanel");
const settingsClose = document.querySelector("#settingsClose");
const consoleModeSelect = document.querySelector("#consoleModeSelect");
const ideThemeSelect = document.querySelector("#ideThemeSelect");
const databaseAppSelect = document.querySelector("#databaseAppSelect");
const showVisualDataToggle = document.querySelector("#showVisualDataToggle");
const showVisualBuilderToggle = document.querySelector("#showVisualBuilderToggle");
const databaseAppBadge = document.querySelector("#databaseAppBadge");
const modeBadge = document.querySelector("#modeBadge");
const editorModeTitle = document.querySelector("#editorModeTitle");
const editorModeHelp = document.querySelector("#editorModeHelp");
const onboardingOverlay = document.querySelector("#onboardingOverlay");
const onboardingClose = document.querySelector("#onboardingClose");
const onboardingAccept = document.querySelector("#onboardingAccept");
const shareOverlay = document.querySelector("#shareOverlay");
const shareClose = document.querySelector("#shareClose");
const shareCancel = document.querySelector("#shareCancel");
const shareAgree = document.querySelector("#shareAgree");
const shareRiskList = document.querySelector("#shareRiskList");
const shareLinkInput = document.querySelector("#shareLinkInput");
const copyShareLinkBtn = document.querySelector("#copyShareLinkBtn");
const createShareLinkBtn = document.querySelector("#createShareLinkBtn");
const shareWatermark = document.querySelector("#shareWatermark");
const navicatHostLabel = document.querySelector("#navicatHostLabel");
const navicatAppLabel = document.querySelector("#navicatAppLabel");
const navicatDbLabel = document.querySelector("#navicatDbLabel");
const navicatTableLabel = document.querySelector("#navicatTableLabel");
const navicatBuilderBtn = document.querySelector("#navicatBuilderBtn");
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
const CLIENT_STATE_KEY = "mysql-simulator-client-state-v1";
const CONSOLE_PREFS_KEY = "sqlsimulator-console-preferences-v1";
const ONBOARDING_KEY = "sqlsimulator-control-onboarding-seen-v1";
const ONBOARDING_COOKIE = "sqlsimulator_control_onboarding_seen";

const defaultConsolePrefs = {
  databaseApp: "mysql",
  ideTheme: "default",
  mode: "sql",
  showVisualData: true,
  showVisualBuilder: false
};

const databaseAppConfigs = {
  mysql: {
    label: "MySQL",
    dialect: "MySQL 8.x 兼容",
    host: "localhost:3306",
    icon: "database-zap"
  },
  postgresql: {
    label: "PostgreSQL",
    dialect: "PostgreSQL 学习兼容",
    host: "localhost:5432",
    icon: "database"
  },
  sqlite: {
    label: "SQLite",
    dialect: "SQLite 本地文件兼容",
    host: "local:/demo.sqlite",
    icon: "hard-drive"
  },
  mariadb: {
    label: "MariaDB",
    dialect: "MariaDB 兼容",
    host: "localhost:3307",
    icon: "database"
  },
  sqlserver: {
    label: "SQL Server",
    dialect: "T-SQL 学习兼容",
    host: "localhost:1433",
    icon: "server"
  },
  oracle: {
    label: "Oracle",
    dialect: "Oracle SQL 学习兼容",
    host: "localhost:1521/XEPDB1",
    icon: "database"
  }
};

const modeConfigs = {
  sql: {
    label: "普通 SQL 语句模式",
    title: "SQL 编辑器",
    help: "支持多语句执行、事务和表结构模拟",
    icon: "panel-top",
    runLabel: "执行 SQL",
    runHint: "Ctrl Enter"
  },
  navicat: {
    label: "NaviCat UI 模拟模式",
    title: "NaviCat 查询窗口",
    help: "选择库表后运行查询，像数据库管理工具一样查看结果",
    icon: "table-properties",
    runLabel: "运行查询",
    runHint: "Ctrl Enter"
  },
  terminal: {
    label: "Terminal 模式",
    title: "Terminal 命令行",
    help: "输入 SQL、SHOW、USE、HELP 等指令并查看模拟响应",
    icon: "terminal",
    runLabel: "执行命令",
    runHint: "Enter"
  }
};

const ideThemeConfigs = {
  default: "默认亮色",
  midnight: "Midnight 深色",
  solarized: "Solarized 暖色",
  mono: "Mono 灰度"
};

let results = [];
let activeResultIndex = 0;
let schemaState = null;
let selectedVisualTable = { database: "demo", table: "orders" };
let editorSuggestions = [];
let sidebarSuggestions = [];
let consolePrefs = loadConsolePrefs();

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

function formatTimestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function analyzeSqlText(sql, options = {}) {
  const text = String(sql ?? "");
  const maxBytes = options.maxBytes || 128 * 1024;
  const errors = [];
  const warnings = [];
  if (!text.trim()) errors.push("SQL 内容不能为空");
  if (new Blob([text]).size > maxBytes) errors.push(`SQL 文件超过 ${Math.round(maxBytes / 1024)}KB 限制`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) errors.push("检测到非法控制字符");
  if (/[\u202A-\u202E\u2066-\u2069]/.test(text)) warnings.push("检测到 Unicode 方向控制字符");
  if (/[\u200B-\u200F\uFEFF]/.test(text)) warnings.push("检测到零宽字符");
  if (/<\/?(script|iframe|object|embed|link|meta|style)\b/i.test(text) || /javascript\s*:/i.test(text)) {
    warnings.push("检测到疑似脚本或 HTML 注入片段");
  }
  if (/(--|#|\/\*)/.test(text)) warnings.push("检测到 SQL 注释符，请确认没有隐藏语句");
  if (/\b(load_file|into\s+outfile|into\s+dumpfile)\b/i.test(text)) warnings.push("检测到文件读写相关 SQL 语句");
  if (/\b(drop\s+database|drop\s+table|truncate\s+table|grant\s+|revoke\s+|shutdown|kill\s+|lock\s+tables|unlock\s+tables)\b/i.test(text)) {
    warnings.push("检测到高风险 SQL 管理指令");
  }
  return { ok: errors.length === 0, errors, warnings };
}

function renderShareRisks(analysis, serverWarnings = []) {
  const warnings = [...(analysis?.warnings || []), ...serverWarnings];
  const errors = analysis?.errors || [];
  if (!errors.length && !warnings.length) {
    shareRiskList.innerHTML = '<div class="share-risk ok">未检测到非法字符或明显风险字符。</div>';
    return;
  }
  shareRiskList.innerHTML = `
    ${errors.map((item) => `<div class="share-risk error">${escapeHtml(item)}</div>`).join("")}
    ${warnings.map((item) => `<div class="share-risk warning">${escapeHtml(item)}</div>`).join("")}
  `;
}

// ────────────────────────────────────────────────────────────────────────
// SQL Lint engine
// ────────────────────────────────────────────────────────────────────────

const lintBar = document.querySelector("#lintBar");
const lintTooltip = document.querySelector("#lintTooltip");
const lintSummaryEl = document.querySelector("#lintSummary");
const lintErrorCountEl = document.querySelector("#lintErrorCount");
const lintWarningCountEl = document.querySelector("#lintWarningCount");
const lintInfoCountEl = document.querySelector("#lintInfoCount");
const lintIssuePanel = document.querySelector("#lintIssuePanel");
const lintToggleListBtn = document.querySelector("#lintToggleListBtn");

const MYSQL_RESERVED_WORDS = new Set([
  "ACCESSIBLE","ADD","ALL","ALTER","ANALYZE","AND","AS","ASC","ASENSITIVE","BEFORE","BETWEEN","BIGINT","BINARY","BLOB","BOTH","BY",
  "CALL","CASCADE","CASE","CHANGE","CHAR","CHARACTER","CHECK","COLLATE","COLUMN","CONDITION","CONSTRAINT","CONTINUE","CONVERT","CREATE","CROSS","CUBE","CUME_DIST","CURRENT_DATE","CURRENT_TIME","CURRENT_TIMESTAMP","CURRENT_USER","CURSOR",
  "DATABASE","DATABASES","DAY_HOUR","DAY_MICROSECOND","DAY_MINUTE","DAY_SECOND","DEC","DECIMAL","DECLARE","DEFAULT","DELAYED","DELETE","DENSE_RANK","DESC","DESCRIBE","DETERMINISTIC","DISTINCT","DISTINCTROW","DIV","DOUBLE","DROP","DUAL",
  "EACH","ELSE","ELSEIF","EMPTY","ENCLOSED","ESCAPED","EXISTS","EXIT","EXPLAIN","FALSE","FETCH","FIRST_VALUE","FLOAT","FOR","FORCE","FOREIGN","FROM","FULLTEXT","FUNCTION","GENERATED","GET","GRANT","GROUP","GROUPING","GROUPS",
  "HAVING","HIGH_PRIORITY","HOUR_MICROSECOND","HOUR_MINUTE","HOUR_SECOND","IF","IGNORE","IN","INDEX","INFILE","INNER","INOUT","INSENSITIVE","INSERT","INT","INTEGER","INTERVAL","INTO","IO_AFTER_GTIDS","IO_BEFORE_GTIDS","IS","ITERATE","JOIN","JSON_TABLE",
  "KEY","KEYS","KILL","LAG","LAST_VALUE","LATERAL","LEAD","LEADING","LEAVE","LEFT","LIKE","LIMIT","LINEAR","LINES","LOAD","LOCALTIME","LOCALTIMESTAMP","LOCK","LONG","LONGBLOB","LONGTEXT","LOOP","LOW_PRIORITY",
  "MASTER_BIND","MASTER_SSL_VERIFY_SERVER_CERT","MATCH","MAXVALUE","MEDIUMBLOB","MEDIUMINT","MEDIUMTEXT","MIDDLEINT","MINUTE_MICROSECOND","MINUTE_SECOND","MOD","MODIFIES","NATURAL","NOT","NO_WRITE_TO_BINLOG","NTH_VALUE","NTILE","NULL","NUMERIC",
  "OF","ON","OPTIMIZE","OPTIMIZER_COSTS","OPTION","OPTIONALLY","OR","ORDER","OUT","OUTER","OUTFILE","OVER","PARTITION","PERCENT_RANK","PRECISION","PRIMARY","PROCEDURE","PURGE",
  "RANGE","RANK","READ","READS","READ_WRITE","REAL","RECURSIVE","REFERENCES","REGEXP","RELEASE","RENAME","REPEAT","REPLACE","REQUIRE","RESIGNAL","RESTRICT","RETURN","REVOKE","RIGHT","RLIKE","ROW","ROWS","ROW_NUMBER",
  "SCHEMA","SCHEMAS","SECOND_MICROSECOND","SELECT","SENSITIVE","SEPARATOR","SET","SHOW","SIGNAL","SMALLINT","SPATIAL","SPECIFIC","SQL","SQLEXCEPTION","SQLSTATE","SQLWARNING","SQL_BIG_RESULT","SQL_CALC_FOUND_ROWS","SQL_SMALL_RESULT","SSL","STARTING","STORED","STRAIGHT_JOIN","SYSTEM",
  "TABLE","TERMINATED","THEN","TINYBLOB","TINYINT","TINYTEXT","TO","TRAILING","TRIGGER","TRUE","UNDO","UNION","UNIQUE","UNLOCK","UNSIGNED","UPDATE","USAGE","USE","USING","UTC_DATE","UTC_TIME","UTC_TIMESTAMP",
  "VALUES","VARBINARY","VARCHAR","VARCHARACTER","VARYING","VIRTUAL","WHEN","WHERE","WHILE","WINDOW","WITH","WRITE","XOR","YEAR_MONTH","ZEROFILL"
]);

const KNOWN_STATEMENT_HEADS = new Set([
  "SELECT","INSERT","UPDATE","DELETE","CREATE","DROP","ALTER","TRUNCATE","RENAME",
  "USE","SHOW","DESCRIBE","DESC","EXPLAIN","SET","BEGIN","START","COMMIT","ROLLBACK",
  "GRANT","REVOKE","CALL","HELP","ANALYZE","OPTIMIZE","LOCK","UNLOCK","FLUSH","DELIMITER",
  "WITH","DO","HANDLER","KILL","LOAD","SAVEPOINT","RELEASE","REPLACE","SIGNAL","RESIGNAL"
]);

const SQL_LINT_STATE = {
  results: [],
  filter: "all"
};

function offsetToPosition(text, offset) {
  const safe = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < safe; index += 1) {
    if (text.charCodeAt(index) === 10) { line += 1; column = 1; } else { column += 1; }
  }
  return { line, column };
}

function linePartial(text, offset) {
  const start = text.lastIndexOf("\n", offset - 1) + 1;
  const end = text.indexOf("\n", offset);
  return text.slice(start, end === -1 ? text.length : end);
}

function lintSplitStatements(sql) {
  const items = [];
  let buffer = "";
  let start = 0;
  let quote = null;
  let block = false;
  let line = false;
  let delimiter = ";";

  const flush = (end) => {
    if (buffer.trim()) items.push({ start, end, text: buffer });
    buffer = "";
  };

  let index = 0;
  while (index < sql.length) {
    const directive = !quote && !block && !line && /^\s*$/.test(buffer)
      ? sql.slice(index).match(/^[ \t]*delimiter[ \t]+(\S+)[ \t]*\r?\n?/i)
      : null;
    if (directive) {
      delimiter = directive[1];
      index += directive[0].length;
      start = index;
      continue;
    }

    const char = sql[index];
    const next = sql[index + 1];

    if (line) {
      if (char === "\n") line = false;
      buffer += char;
      index += 1;
      continue;
    }
    if (block) {
      if (char === "*" && next === "/") { block = false; buffer += "*/"; index += 2; continue; }
      buffer += char; index += 1; continue;
    }
    if (!quote && char === "-" && next === "-") { line = true; buffer += "--"; index += 2; continue; }
    if (!quote && char === "#") { line = true; buffer += "#"; index += 1; continue; }
    if (!quote && char === "/" && next === "*") { block = true; buffer += "/*"; index += 2; continue; }
    if ((char === "'" || char === '"' || char === "`") && sql[index - 1] !== "\\") {
      if (quote === char) quote = null;
      else if (!quote) quote = char;
    }
    if (!quote && sql.substr(index, delimiter.length) === delimiter) {
      flush(index);
      index += delimiter.length;
      start = index;
      continue;
    }
    buffer += char;
    index += 1;
  }
  if (buffer.trim()) items.push({ start, end: sql.length, text: buffer });
  return items;
}

function lintSql(sql, schema) {
  const text = String(sql ?? "");
  const issues = [];
  const push = (severity, ruleId, message, range) => {
    issues.push({ severity, ruleId, message, ...range });
  };

  if (!text.trim()) {
    SQL_LINT_STATE.results = [];
    return [];
  }

  // — pass 1: lexical balance over the full text —
  let blockDepth = 0;
  let parenDepth = 0;
  let lastBlockOpen = -1;
  let lastParenOpen = -1;
  let inLine = false;
  let inBlock = false;
  let stringQuote = null;
  let stringStart = -1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const nx = text[i + 1];
    if (inLine) { if (ch === "\n") inLine = false; continue; }
    if (inBlock) {
      if (ch === "*" && nx === "/") { inBlock = false; i += 1; }
      continue;
    }
    if (stringQuote) {
      if (ch === "\\") { i += 1; continue; }
      if (ch === stringQuote) stringQuote = null;
      continue;
    }
    if (ch === "-" && nx === "-") { inLine = true; i += 1; continue; }
    if (ch === "#") { inLine = true; continue; }
    if (ch === "/" && nx === "*") { inBlock = true; lastBlockOpen = i; i += 1; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { stringQuote = ch; stringStart = i; continue; }
    if (ch === "(") { parenDepth += 1; lastParenOpen = i; }
    else if (ch === ")") {
      if (parenDepth === 0) push("error", "paren-extra", "多余的 ')'，没有匹配的 '('", { start: i, end: i + 1 });
      else parenDepth -= 1;
    }
  }
  if (parenDepth > 0 && lastParenOpen >= 0) push("error", "paren-unclosed", "未闭合的 '('，缺少匹配的 ')'", { start: lastParenOpen, end: lastParenOpen + 1 });
  if (stringQuote) push("error", "string-unclosed", `未闭合的字符串字面量 ${stringQuote}`, { start: stringStart, end: stringStart + 1 });
  if (inBlock) push("error", "block-comment-unclosed", "未闭合的块注释 /* … */", { start: lastBlockOpen, end: lastBlockOpen + 2 });

  // — pass 2: per-statement rules —
  const statements = lintSplitStatements(text);
  const knownTables = new Set();
  const tableColumns = new Map();
  if (schema && Array.isArray(schema.databases)) {
    schema.databases.forEach((db) => {
      (db.tables || []).forEach((table) => {
        knownTables.add(String(table.name).toLowerCase());
        tableColumns.set(String(table.name).toLowerCase(), new Set((table.columns || []).map((c) => String(c.name).toLowerCase())));
      });
    });
  }

  statements.forEach((statement) => {
    const trimmedRaw = statement.text;
    const trimmed = trimmedRaw.replace(/^\s+/, "");
    const offsetInside = trimmedRaw.length - trimmed.length;
    const stmtStart = statement.start + offsetInside;
    const compact = trimmed.replace(/\s+/g, " ").replace(/^[\s;]+|[\s;]+$/g, "");
    if (!compact) return;

    const headMatch = trimmed.match(/^([A-Za-z_][\w]*)/);
    const head = headMatch ? headMatch[1].toUpperCase() : "";
    if (head && !KNOWN_STATEMENT_HEADS.has(head)) {
      const length = headMatch[1].length;
      push("warning", "unknown-statement", `无法识别的语句开头 '${headMatch[1]}'，请检查关键字拼写`, { start: stmtStart, end: stmtStart + length });
    }

    // missing trailing semicolon
    const rawEnd = statement.end;
    const trailing = text.slice(stmtStart, rawEnd).trimEnd();
    if (trailing && !/;$/.test(trailing) && rawEnd === text.length) {
      const point = stmtStart + trailing.length;
      push("info", "missing-semicolon", "建议在语句末尾加上分号 ;", { start: Math.max(stmtStart, point - 1), end: point });
    }

    // UPDATE / DELETE without WHERE
    if (/^(update|delete\s+from)\b/i.test(compact)) {
      const hasWhere = /\bwhere\b/i.test(compact);
      const verb = compact.toUpperCase().startsWith("UPDATE") ? "UPDATE" : "DELETE";
      if (!hasWhere) {
        const length = verb.length;
        push("error", "no-where", `${verb} 缺少 WHERE 条件——会作用于全表，请确认这是你想要的范围`, { start: stmtStart, end: stmtStart + length });
      }
    }

    // SELECT *
    const selectStarMatch = trimmed.match(/select\s+\*\s+from/i);
    if (selectStarMatch && /^select\b/i.test(compact)) {
      const at = stmtStart + selectStarMatch.index + selectStarMatch[0].toLowerCase().indexOf("*");
      push("info", "select-star", "建议显式列出列名，避免使用 SELECT *（影响可读性与执行性能）", { start: at, end: at + 1 });
    }

    // SELECT without LIMIT (full-table scan hint)
    if (/^select\b/i.test(compact) && !/\blimit\b/i.test(compact) && !/\bcount\s*\(/i.test(compact) && /\bfrom\b/i.test(compact)) {
      const length = "SELECT".length;
      push("info", "select-no-limit", "SELECT 没有 LIMIT，结果集可能很大；建议添加 LIMIT 限制返回行数", { start: stmtStart, end: stmtStart + length });
    }

    // schema-aware: unknown tables
    const fromMatch = trimmed.match(/\bfrom\s+([`"]?)([A-Za-z_][\w$]*)\1/i);
    if (fromMatch && /^(select|update|delete\s+from)\b/i.test(compact) && knownTables.size > 0) {
      const tableName = fromMatch[2];
      if (!knownTables.has(tableName.toLowerCase())) {
        const at = stmtStart + fromMatch.index + fromMatch[0].toLowerCase().lastIndexOf(tableName.toLowerCase());
        push("warning", "unknown-table", `表 '${tableName}' 在当前数据库 schema 中不存在`, { start: at, end: at + tableName.length });
      } else {
        // unknown columns inside SELECT list / WHERE / SET
        const columnSet = tableColumns.get(tableName.toLowerCase());
        const colsInside = compact.match(/\b([A-Za-z_][\w$]*)\b/g) || [];
        const seen = new Set();
        colsInside.forEach((token) => {
          const lower = token.toLowerCase();
          if (seen.has(lower)) return;
          seen.add(lower);
          if (MYSQL_RESERVED_WORDS.has(token.toUpperCase())) return;
          if (KNOWN_STATEMENT_HEADS.has(token.toUpperCase())) return;
          if (knownTables.has(lower)) return;
          if (/^\d/.test(token)) return;
          // Only flag tokens that show up as unquoted column references in WHERE/SET/SELECT projection
          const refRegex = new RegExp(`(?:select\\s+[\\s\\S]*?\\b|where\\s+[\\s\\S]*?\\b|set\\s+[\\s\\S]*?\\b)${token}\\b`, "i");
          if (!refRegex.test(compact)) return;
          if (columnSet && !columnSet.has(lower)) {
            const idx = trimmed.toLowerCase().indexOf(lower);
            if (idx >= 0) {
              push("info", "unknown-column", `字段 '${token}' 不在表 '${tableName}' 中（可能是别名或表达式时可忽略）`, { start: stmtStart + idx, end: stmtStart + idx + token.length });
            }
          }
        });
      }
    }

    // Reserved word used as identifier without backticks
    const reservedRegex = /(create\s+table\s+|create\s+database\s+|alter\s+table\s+|insert\s+into\s+|from\s+|join\s+|update\s+|into\s+)([A-Za-z_][\w$]*)/gi;
    let reservedMatch;
    while ((reservedMatch = reservedRegex.exec(trimmed)) !== null) {
      const ident = reservedMatch[2];
      if (MYSQL_RESERVED_WORDS.has(ident.toUpperCase())) {
        const at = stmtStart + reservedMatch.index + reservedMatch[1].length;
        push("warning", "reserved-word-ident", `'${ident}' 是 MySQL 保留字，作为标识符时建议加反引号 \`${ident}\``, { start: at, end: at + ident.length });
      }
    }

    // Mixing tabs/spaces in same line (style)
    const tabMix = trimmedRaw.match(/^[ ]+\t|^\t+[ ]/m);
    if (tabMix) {
      const at = stmtStart + tabMix.index;
      push("info", "indent-mix", "缩进混用了 Tab 和空格，建议统一使用空格", { start: at, end: at + tabMix[0].length });
    }

    // Double semicolons / weird whitespace before stmt
    if (/;\s*;\s*$/.test(text.slice(0, statement.end))) {
      push("info", "double-semicolon", "出现连续的分号", { start: statement.end - 1, end: statement.end });
    }
  });

  // de-dup overlapping issues with same ruleId+range
  const dedup = new Map();
  for (const issue of issues) {
    const key = `${issue.ruleId}:${issue.start}:${issue.end}`;
    if (!dedup.has(key)) dedup.set(key, issue);
  }
  const finalIssues = Array.from(dedup.values()).sort((a, b) => a.start - b.start);
  finalIssues.forEach((issue) => {
    const pos = offsetToPosition(text, issue.start);
    issue.line = pos.line;
    issue.column = pos.column;
    issue.snippet = linePartial(text, issue.start).trim().slice(0, 120);
  });
  SQL_LINT_STATE.results = finalIssues;
  return finalIssues;
}

function getLintIssueAtOffset(offset) {
  return SQL_LINT_STATE.results.find((issue) => offset >= issue.start && offset <= issue.end) || null;
}

function getLintIssuesByLine(line) {
  return SQL_LINT_STATE.results.filter((issue) => issue.line === line);
}

function refreshLintBar() {
  const issues = SQL_LINT_STATE.results;
  const counts = { error: 0, warning: 0, info: 0 };
  issues.forEach((issue) => { counts[issue.severity] = (counts[issue.severity] || 0) + 1; });
  if (lintErrorCountEl) lintErrorCountEl.textContent = String(counts.error);
  if (lintWarningCountEl) lintWarningCountEl.textContent = String(counts.warning);
  if (lintInfoCountEl) lintInfoCountEl.textContent = String(counts.info);
  if (lintSummaryEl) {
    if (!issues.length) lintSummaryEl.textContent = "无问题";
    else lintSummaryEl.textContent = `${issues.length} 项检查`;
  }
  if (lintBar) {
    lintBar.dataset.severity = counts.error > 0 ? "error" : counts.warning > 0 ? "warning" : counts.info > 0 ? "info" : "ok";
  }
  renderLintIssuePanel();
}

function renderLintIssuePanel() {
  if (!lintIssuePanel) return;
  const issues = SQL_LINT_STATE.results;
  const filter = SQL_LINT_STATE.filter || "all";
  const filtered = filter === "all" ? issues : issues.filter((issue) => issue.severity === filter);
  if (!filtered.length) {
    lintIssuePanel.innerHTML = `<div class="lint-issue-empty">${issues.length ? "当前筛选下没有问题" : "未发现问题，SQL 看起来还行"}</div>`;
    return;
  }
  lintIssuePanel.innerHTML = filtered.map((issue) => `
    <button type="button" class="lint-issue-row ${issue.severity}" data-issue-offset="${issue.start}">
      <span class="lint-issue-severity">${severityLabel(issue.severity)}</span>
      <span class="lint-issue-loc">第 ${issue.line} 行 · 第 ${issue.column} 列</span>
      <span class="lint-issue-msg">
        ${escapeHtml(issue.message)}
        <span class="lint-issue-rule">${escapeHtml(issue.ruleId)}</span>
      </span>
    </button>
  `).join("");
}

function setLintListOpen(open) {
  if (!lintIssuePanel || !lintToggleListBtn) return;
  lintIssuePanel.dataset.open = open ? "true" : "false";
  lintToggleListBtn.setAttribute("aria-pressed", String(open));
  const label = lintToggleListBtn.querySelector("span");
  if (label) label.textContent = open ? "收起问题" : "展开问题";
}

function applyLintHighlightDecorations(html, sql) {
  // Wrap each line in an absolute span so we can underline ranges. Easier: append an overlay div in the editor stack.
  return html;
}

function buildLintOverlay() {
  let overlay = document.querySelector("#lintOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "lintOverlay";
    overlay.className = "lint-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const stack = sqlEditor?.parentElement;
    if (stack) stack.appendChild(overlay);
  }
  return overlay;
}

function updateLintOverlay() {
  const overlay = buildLintOverlay();
  if (!overlay) return;
  const sql = sqlEditor.value;
  if (!SQL_LINT_STATE.results.length) {
    overlay.innerHTML = "";
    return;
  }
  // Mirror the textarea but replace every visible character with a space so the
  // overlay never paints any glyph on top of the highlight layer (avoids ghosting).
  // The underline backgrounds on .lint-mark still render because monospace spaces
  // preserve width and line position.
  const filter = SQL_LINT_STATE.filter || "all";
  const issues = filter === "all"
    ? SQL_LINT_STATE.results
    : SQL_LINT_STATE.results.filter((issue) => issue.severity === filter);
  const replaceWithSpace = (str) => str.replace(/[^\n]/g, " ");
  let cursor = 0;
  let html = "";
  for (const issue of issues) {
    if (issue.start < cursor) continue;
    html += escapeHtml(replaceWithSpace(sql.slice(cursor, issue.start)));
    const span = sql.slice(issue.start, issue.end) || " ";
    html += `<span class="lint-mark lint-${issue.severity}" data-lint-index="${SQL_LINT_STATE.results.indexOf(issue)}">${escapeHtml(replaceWithSpace(span))}</span>`;
    cursor = Math.max(issue.end, issue.start + 1);
  }
  html += escapeHtml(replaceWithSpace(sql.slice(cursor)));
  overlay.innerHTML = `<pre><code>${html}\n</code></pre>`;
  const pre = overlay.querySelector("pre");
  if (pre) {
    pre.style.transform = `translate(${-sqlEditor.scrollLeft}px, ${-sqlEditor.scrollTop}px)`;
  }
}

function syncLintOverlayScroll() {
  const overlay = document.querySelector("#lintOverlay pre");
  if (overlay) overlay.style.transform = `translate(${-sqlEditor.scrollLeft}px, ${-sqlEditor.scrollTop}px)`;
}

function hideLintTooltip() {
  if (!lintTooltip) return;
  lintTooltip.hidden = true;
  lintTooltip.classList.remove("visible");
}

function severityLabel(severity) {
  return ({ error: "错误", warning: "警告", info: "建议" })[severity] || severity;
}

function showLintTooltipForPointer(event) {
  if (!lintTooltip || !sqlEditor) return;
  const rect = sqlEditor.getBoundingClientRect();
  const x = event.clientX - rect.left + sqlEditor.scrollLeft;
  const y = event.clientY - rect.top + sqlEditor.scrollTop;
  const offset = computeOffsetFromPoint(x, y);
  if (offset === -1) { hideLintTooltip(); return; }
  const issue = getLintIssueAtOffset(offset);
  if (!issue) { hideLintTooltip(); return; }
  lintTooltip.innerHTML = `
    <div class="lint-tooltip-head">
      <span class="lint-tooltip-badge ${issue.severity}">${severityLabel(issue.severity)}</span>
      <span class="lint-tooltip-rule">${escapeHtml(issue.ruleId)}</span>
      <span class="lint-tooltip-loc">第 ${issue.line} 行 第 ${issue.column} 列</span>
    </div>
    <div class="lint-tooltip-msg">${escapeHtml(issue.message)}</div>
    ${issue.snippet ? `<pre class="lint-tooltip-snippet">${escapeHtml(issue.snippet)}</pre>` : ""}
  `;
  lintTooltip.hidden = false;
  lintTooltip.classList.add("visible");
  // Position right below the pointer, clamped inside the editor stack.
  const stack = sqlEditor.parentElement;
  const stackRect = stack.getBoundingClientRect();
  const tooltipWidth = lintTooltip.offsetWidth || 320;
  const left = Math.min(Math.max(0, event.clientX - stackRect.left + 12), stackRect.width - tooltipWidth - 6);
  const top = event.clientY - stackRect.top + 18;
  lintTooltip.style.left = `${left}px`;
  lintTooltip.style.top = `${top}px`;
}

function computeOffsetFromPoint(x, y) {
  // Use a hidden mirror to measure character offsets at (x,y). Falls back to selectionStart on caret-position-from-point.
  if (typeof document.caretPositionFromPoint === "function") {
    const rect = sqlEditor.getBoundingClientRect();
    const range = document.caretPositionFromPoint(rect.left + x - sqlEditor.scrollLeft, rect.top + y - sqlEditor.scrollTop);
    if (range && range.offsetNode === sqlEditor) return range.offset;
  }
  if (typeof document.caretRangeFromPoint === "function") {
    const rect = sqlEditor.getBoundingClientRect();
    const range = document.caretRangeFromPoint(rect.left + x - sqlEditor.scrollLeft, rect.top + y - sqlEditor.scrollTop);
    if (range) return range.startOffset;
  }
  return -1;
}

function runLint() {
  lintSql(sqlEditor.value, schemaState);
  refreshLintBar();
  updateLintOverlay();
}

function setLintFilter(filter) {
  SQL_LINT_STATE.filter = filter;
  if (lintBar) {
    lintBar.querySelectorAll("[data-lint-filter]").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.lintFilter === filter));
    });
  }
  updateLintOverlay();
}


function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function loadConsolePrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSOLE_PREFS_KEY) || "{}");
    const mode = modeConfigs[stored.mode] ? stored.mode : defaultConsolePrefs.mode;
    const databaseApp = databaseAppConfigs[stored.databaseApp] ? stored.databaseApp : defaultConsolePrefs.databaseApp;
    const ideTheme = ideThemeConfigs[stored.ideTheme] ? stored.ideTheme : defaultConsolePrefs.ideTheme;
    return {
      ...defaultConsolePrefs,
      ...stored,
      databaseApp,
      ideTheme,
      mode,
      showVisualData: typeof stored.showVisualData === "boolean" ? stored.showVisualData : defaultConsolePrefs.showVisualData,
      showVisualBuilder: typeof stored.showVisualBuilder === "boolean" ? stored.showVisualBuilder : defaultConsolePrefs.showVisualBuilder
    };
  } catch {
    return { ...defaultConsolePrefs };
  }
}

function saveConsolePrefs() {
  try {
    localStorage.setItem(CONSOLE_PREFS_KEY, JSON.stringify(consolePrefs));
  } catch {
    // 设置保存失败不影响模拟器运行。
  }
}

function getModeConfig() {
  return modeConfigs[consolePrefs.mode] || modeConfigs.sql;
}

function getDatabaseAppConfig() {
  return databaseAppConfigs[consolePrefs.databaseApp] || databaseAppConfigs.mysql;
}

function renderRunButton(isRunning = false) {
  if (isRunning) {
    runBtn.innerHTML = '<i data-lucide="loader-circle"></i><span>执行中</span><small>请稍候</small>';
    iconRefresh();
    return;
  }
  const config = getModeConfig();
  runBtn.innerHTML = `<i data-lucide="play"></i><span>${escapeHtml(config.runLabel)}</span><small>${escapeHtml(config.runHint)}</small>`;
  iconRefresh();
}

function applyConsolePrefs({ persist = false } = {}) {
  const config = getModeConfig();
  const databaseApp = getDatabaseAppConfig();
  document.body.dataset.consoleMode = consolePrefs.mode;
  document.body.dataset.databaseApp = consolePrefs.databaseApp;
  document.body.dataset.ideTheme = consolePrefs.ideTheme;
  document.body.classList.toggle("hide-inspector", !consolePrefs.showVisualBuilder);
  document.body.classList.toggle("hide-visual-data", !consolePrefs.showVisualData);

  ideThemeSelect.value = consolePrefs.ideTheme;
  databaseAppSelect.value = consolePrefs.databaseApp;
  consoleModeSelect.value = consolePrefs.mode;
  showVisualDataToggle.checked = consolePrefs.showVisualData;
  showVisualBuilderToggle.checked = consolePrefs.showVisualBuilder;
  databaseAppBadge.innerHTML = `<i data-lucide="${databaseApp.icon}"></i> ${escapeHtml(databaseApp.label)}`;
  modeBadge.innerHTML = `<i data-lucide="${config.icon}"></i> ${escapeHtml(config.label)}`;
  editorModeTitle.textContent = config.title;
  editorModeHelp.textContent = `${config.help} · ${databaseApp.dialect}`;
  updateNavicatLabels();

  if (!runBtn.disabled) {
    renderRunButton(false);
  }
  if (persist) {
    saveConsolePrefs();
  }
  iconRefresh();
}

function updateNavicatLabels() {
  const table = getSelectedTable();
  const databaseApp = getDatabaseAppConfig();
  navicatHostLabel.textContent = databaseApp.host;
  navicatAppLabel.textContent = databaseApp.label;
  navicatDbLabel.textContent = selectedVisualTable.database || schemaState?.currentDatabase || "demo";
  navicatTableLabel.textContent = table ? `${table.name} · ${table.rowCount} rows` : selectedVisualTable.table || "未选择表";
}

function setConsolePref(key, value) {
  consolePrefs = {
    ...consolePrefs,
    [key]: value
  };
  applyConsolePrefs({ persist: true });
  if (key === "showVisualData" && value) {
    loadVisualTable().catch((error) => addSystemLog("可视化表刷新失败", error.message, false));
  }
}

function setSettingsOpen(open) {
  settingsPanel.hidden = !open;
  settingsToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    setImportExportMenuOpen(false);
    consoleModeSelect.focus();
  }
}

function setImportExportMenuOpen(open) {
  importExportMenu.hidden = !open;
  importExportToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    settingsPanel.hidden = true;
    settingsToggle.setAttribute("aria-expanded", "false");
  }
}

function hasSeenOnboarding() {
  const cookieSeen = document.cookie
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === `${ONBOARDING_COOKIE}=1`);
  let localSeen = false;
  try {
    localSeen = localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    localSeen = false;
  }
  return localSeen || cookieSeen;
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // cookie 会作为兜底标记。
  }
  document.cookie = `${ONBOARDING_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax`;
}

function closeOnboarding() {
  onboardingOverlay.hidden = true;
  markOnboardingSeen();
}

function initOnboarding() {
  if (hasSeenOnboarding()) return;
  window.setTimeout(() => {
    onboardingOverlay.hidden = false;
    onboardingAccept.focus();
    iconRefresh();
  }, 320);
}

function setShareDialogOpen(open) {
  shareOverlay.hidden = !open;
  if (open) {
    shareAgree.checked = false;
    shareLinkInput.value = "";
    renderShareRisks(analyzeSqlText(sqlEditor.value));
    shareAgree.focus();
    iconRefresh();
  }
}

function getShareTokenFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("share");
  if (queryToken) return queryToken;
  const pathMatch = window.location.pathname.match(/^\/share\/([A-Za-z0-9_-]{16,})$/);
  return pathMatch?.[1] || "";
}

async function loadSharedSqlFromToken() {
  const token = getShareTokenFromLocation();
  if (!token) return;
  try {
    const payload = await fetchJson(`/api/share/sql/${encodeURIComponent(token)}`);
    sqlEditor.value = payload.sql || "";
    updateEditorVisuals();
    renderSuggestPanel(false);
    shareWatermark.textContent = `由用户 IP 地址 ${payload.sharedByMaskedIp || "***"} 分享 · 60 分钟短效链接`;
    shareWatermark.hidden = false;
    addSystemLog("已载入分享 SQL", `来源 IP：${payload.sharedByMaskedIp || "***"}，有效期至 ${new Date(payload.expiresAt).toLocaleString()}`);
    if (payload.warnings?.length) {
      addSystemLog("分享内容风险提示", payload.warnings.join("；"), false);
    }
  } catch (error) {
    addSystemLog("分享链接不可用", error.message, false);
  }
}

function exportCurrentSql() {
  const analysis = analyzeSqlText(sqlEditor.value);
  if (!analysis.ok) {
    addSystemLog("导出失败", analysis.errors.join("；"), false);
    return;
  }
  downloadTextFile(`sqlsimulator-query-${formatTimestampForFile()}.sql`, sqlEditor.value, "application/sql;charset=utf-8");
  addSystemLog("已导出 SQL", "当前编辑器内容已保存为 .sql 文件");
  if (analysis.warnings.length) {
    addSystemLog("导出风险提示", analysis.warnings.join("；"), false);
  }
}

async function importSqlFile(file) {
  if (!file) return;
  const content = await file.text();
  const analysis = analyzeSqlText(content, { maxBytes: 512 * 1024 });
  if (!analysis.ok) {
    throw new Error(analysis.errors.join("；"));
  }
  sqlEditor.value = content;
  updateEditorVisuals();
  renderSuggestPanel(false);
  addSystemLog("已导入 SQL", `${file.name || "query.sql"} 已载入编辑器`);
  if (analysis.warnings.length) {
    addSystemLog("导入风险提示", analysis.warnings.join("；"), false);
  }
}

async function createShareLink() {
  const analysis = analyzeSqlText(sqlEditor.value);
  renderShareRisks(analysis);
  if (!analysis.ok) {
    addSystemLog("分享失败", analysis.errors.join("；"), false);
    return;
  }
  if (!shareAgree.checked) {
    addSystemLog("分享未创建", "请先确认免责声明和用户协议", false);
    return;
  }

  createShareLinkBtn.disabled = true;
  createShareLinkBtn.innerHTML = '<i data-lucide="loader-circle"></i> 创建中';
  iconRefresh();
  try {
    const payload = await fetchJson("/api/share/sql", {
      method: "POST",
      body: JSON.stringify({
        sql: sqlEditor.value,
        acceptedTerms: true
      })
    });
    shareLinkInput.value = payload.url;
    renderShareRisks(payload.analysis);
    await navigator.clipboard.writeText(payload.url).catch(() => {});
    addSystemLog("已创建分享链接", `链接 60 分钟内有效，来源 IP 将以 ${payload.sharedByMaskedIp} 显示`);
  } catch (error) {
    addSystemLog("分享失败", error.message, false);
  } finally {
    createShareLinkBtn.disabled = false;
    createShareLinkBtn.innerHTML = '<i data-lucide="link"></i> 创建 60 分钟链接';
    iconRefresh();
  }
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
  if (typeof runLint === "function") runLint();
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

function insertSqlAtSelection(text) {
  const value = String(text || "");
  const start = sqlEditor.selectionStart || 0;
  const end = sqlEditor.selectionEnd || start;
  sqlEditor.value = `${sqlEditor.value.slice(0, start)}${value}${sqlEditor.value.slice(end)}`;
  const cursor = start + value.length;
  sqlEditor.setSelectionRange(cursor, cursor);
  updateEditorVisuals();
  runLint();
  sqlEditor.focus();
}

function buildSqlAiContext() {
  const databaseApp = getDatabaseAppConfig();
  const schemaSummary = schemaState?.databases?.map((database) => {
    const tables = database.tables.map((table) => {
      const columns = table.columns.map((column) => `${column.name} ${column.type}`).join(", ");
      return `- ${table.name}(${columns})`;
    }).join("\n");
    return `数据库 ${database.name}:\n${tables || "- 空"}`;
  }).join("\n\n") || "暂无结构信息";
  const latestResult = results[activeResultIndex];
  return [
    `场景：SQLSimulator ${databaseApp.label} 学习环境`,
    `方言：${databaseApp.dialect}`,
    `当前模式：${modeConfigs[consolePrefs.mode]?.label || consolePrefs.mode}`,
    `当前 SQL:\n${sqlEditor.value}`,
    `结构信息:\n${schemaSummary}`,
    latestResult ? `当前结果/错误：${latestResult.message || latestResult.kind}` : "当前结果：未执行"
  ].join("\n\n");
}

function setupSqlAiAssistant() {
  if (!window.SqlSimAiAssistant) return;
  window.SqlSimAiAssistant.create({
    kind: "SQL",
    language: "sql",
    getContext: buildSqlAiContext,
    insertText: insertSqlAtSelection,
    setStatus: (message) => addSystemLog("问 AI", message, !/失败/.test(message)),
    elements: {
      baseUrl: document.querySelector("#aiBaseUrlInput"),
      requestPath: document.querySelector("#aiRequestPathInput"),
      model: document.querySelector("#aiModelInput"),
      apiKey: document.querySelector("#aiApiKeyInput"),
      prompt: document.querySelector("#aiPromptInput"),
      askButton: document.querySelector("#askAiBtn"),
      insertButton: document.querySelector("#insertAiAnswerBtn"),
      response: document.querySelector("#aiResponse"),
      configState: document.querySelector("#aiConfigState")
    }
  });
}

function focusSqlAiPanel() {
  const panel = document.querySelector(".ai-assistant-card");
  const prompt = document.querySelector("#aiPromptInput");
  panel?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => prompt?.focus(), 220);
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

function loadClientState() {
  try {
    const stored = localStorage.getItem(CLIENT_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveClientState(payload) {
  if (!payload?.clientState) return;
  try {
    localStorage.setItem(CLIENT_STATE_KEY, JSON.stringify(payload.clientState));
  } catch {
    addSystemLog("本地保存失败", "浏览器空间不足，模拟数据可能不会保留", false);
  }
}

async function fetchSimulatorJson(url, data = {}) {
  const payload = await fetchJson(url, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      dialect: data.dialect || consolePrefs.databaseApp,
      clientState: loadClientState()
    })
  });
  saveClientState(payload);
  return payload;
}

async function fetchInitialState() {
  try {
    const payload = await fetchSimulatorJson("/api/state");
    return payload.schema || payload;
  } catch (error) {
    localStorage.removeItem(CLIENT_STATE_KEY);
    const payload = await fetchSimulatorJson("/api/state");
    return payload.schema || payload;
  }
}

function renderSchema(schema) {
  schemaState = schema;
  if (!getSelectedTable()) {
    selectedVisualTable = getFirstTable(schema) || selectedVisualTable;
  }
  const databaseApp = getDatabaseAppConfig();
  currentDb.textContent = `${databaseApp.label} · ${schema.currentDatabase || "未选择数据库"}${schema.transactionActive ? " · transaction" : ""}`;
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
  updateNavicatLabels();
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
  if (!consolePrefs.showVisualData) return;
  if (!selectedVisualTable.database || !selectedVisualTable.table) return;
  const tableData = await fetchSimulatorJson("/api/table", {
    database: selectedVisualTable.database,
    table: selectedVisualTable.table
  });
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
  renderRunButton(true);
  try {
    const payload = await fetchSimulatorJson("/api/query", {
      sql: sqlEditor.value
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
    renderRunButton(false);
  }
}

async function resetState() {
  const payload = await fetchSimulatorJson("/api/reset");
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
  const response = await fetch("/api/sqlm/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clientState: loadClientState() })
  });
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
  const payload = await fetchSimulatorJson("/api/sqlm/import", { content });
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
  setupSqlAiAssistant();
  applyConsolePrefs();
  initOnboarding();
  sqlEditor.value = defaultSql;
  updateEditorVisuals();
  setResultState("idle", "等待执行");
  renderResults();

  const [state, examplePayload] = await Promise.all([
    fetchInitialState(),
    fetchJson("/api/examples")
  ]);
  renderSchema(state);
  renderExamples(examplePayload.examples);
  if (consolePrefs.showVisualData) {
    await loadVisualTable();
  }
  await loadSharedSqlFromToken();
  renderSuggestPanel(false);
  iconRefresh();
}

sqlEditor.addEventListener("input", () => {
  updateEditorVisuals();
  renderSuggestPanel(false);
  runLint();
});
sqlEditor.addEventListener("scroll", () => {
  syncEditorScroll();
  syncLintOverlayScroll();
  hideLintTooltip();
});

sqlEditor.addEventListener("mousemove", showLintTooltipForPointer);
sqlEditor.addEventListener("mouseleave", hideLintTooltip);
sqlEditor.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideLintTooltip();
}, true);

if (lintBar) {
  lintBar.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-lint-filter]");
    if (chip) {
      setLintFilter(chip.dataset.lintFilter);
      // Open the issue list automatically when filtering by severity.
      if (chip.dataset.lintFilter !== "all" && SQL_LINT_STATE.results.length) setLintListOpen(true);
      return;
    }
    if (event.target.closest("#lintToggleListBtn")) {
      const next = lintIssuePanel?.dataset.open !== "true";
      setLintListOpen(next);
    }
  });
}

if (lintIssuePanel) {
  lintIssuePanel.addEventListener("click", (event) => {
    const row = event.target.closest("[data-issue-offset]");
    if (!row) return;
    const offset = Number(row.dataset.issueOffset);
    if (Number.isNaN(offset)) return;
    sqlEditor.focus();
    sqlEditor.setSelectionRange(offset, offset);
    syncEditorScroll();
  });
}

sqlEditor.addEventListener("keydown", (event) => {
  if (consolePrefs.mode === "terminal" && event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    runSql();
    return;
  }
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
navAiBtn?.addEventListener("click", focusSqlAiPanel);

settingsToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  setSettingsOpen(settingsPanel.hidden);
});
settingsPanel.addEventListener("click", (event) => {
  event.stopPropagation();
});
settingsClose.addEventListener("click", () => setSettingsOpen(false));
importExportToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  setImportExportMenuOpen(importExportMenu.hidden);
});
importExportMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});
consoleModeSelect.addEventListener("change", () => setConsolePref("mode", consoleModeSelect.value));
ideThemeSelect.addEventListener("change", () => setConsolePref("ideTheme", ideThemeSelect.value));
databaseAppSelect.addEventListener("change", () => {
  setConsolePref("databaseApp", databaseAppSelect.value);
  const databaseApp = getDatabaseAppConfig();
  if (schemaState) {
    currentDb.textContent = `${databaseApp.label} · ${schemaState.currentDatabase || "未选择数据库"}${schemaState.transactionActive ? " · transaction" : ""}`;
  }
  addSystemLog("已切换数据库应用", `${databaseApp.label} · ${databaseApp.dialect}`);
});
showVisualDataToggle.addEventListener("change", () => setConsolePref("showVisualData", showVisualDataToggle.checked));
showVisualBuilderToggle.addEventListener("change", () => setConsolePref("showVisualBuilder", showVisualBuilderToggle.checked));
navicatBuilderBtn.addEventListener("click", () => {
  setConsolePref("mode", "navicat");
  setConsolePref("showVisualBuilder", true);
});
document.addEventListener("click", () => {
  if (!settingsPanel.hidden) {
    setSettingsOpen(false);
  }
  if (!importExportMenu.hidden) {
    setImportExportMenuOpen(false);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!settingsPanel.hidden) {
      setSettingsOpen(false);
    }
    if (!onboardingOverlay.hidden) {
      closeOnboarding();
    }
    if (!shareOverlay.hidden) {
      setShareDialogOpen(false);
    }
    if (!importExportMenu.hidden) {
      setImportExportMenuOpen(false);
    }
  }
});
onboardingClose.addEventListener("click", closeOnboarding);
onboardingAccept.addEventListener("click", closeOnboarding);
shareClose.addEventListener("click", () => setShareDialogOpen(false));
shareCancel.addEventListener("click", () => setShareDialogOpen(false));
shareSqlBtn.addEventListener("click", () => {
  setImportExportMenuOpen(false);
  setShareDialogOpen(true);
});
exportSqlBtn.addEventListener("click", () => {
  setImportExportMenuOpen(false);
  exportCurrentSql();
});
shareAgree.addEventListener("change", () => renderShareRisks(analyzeSqlText(sqlEditor.value)));
createShareLinkBtn.addEventListener("click", createShareLink);
copyShareLinkBtn.addEventListener("click", async () => {
  if (!shareLinkInput.value) {
    addSystemLog("没有可复制的链接", "请先创建分享链接", false);
    return;
  }
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    addSystemLog("已复制分享链接", "链接将在创建后 60 分钟失效");
  } catch {
    shareLinkInput.select();
    addSystemLog("复制受限", "浏览器限制了自动复制，已选中链接，可手动复制", false);
  }
});

runBtn.addEventListener("click", runSql);
resetBtn.addEventListener("click", resetState);
exportSqlmBtn.addEventListener("click", () => {
  setImportExportMenuOpen(false);
  exportSqlm().catch((error) => addSystemLog("下载失败", error.message, false));
});
importSqlBtn.addEventListener("click", () => {
  setImportExportMenuOpen(false);
  sqlFileInput.click();
});
importSqlmBtn.addEventListener("click", () => {
  setImportExportMenuOpen(false);
  sqlmFileInput.click();
});
sqlFileInput.addEventListener("change", () => {
  importSqlFile(sqlFileInput.files?.[0])
    .catch((error) => addSystemLog("导入 SQL 失败", error.message, false))
    .finally(() => {
      sqlFileInput.value = "";
    });
});
sqlmFileInput.addEventListener("change", () => {
  importSqlm(sqlmFileInput.files?.[0])
    .catch((error) => addSystemLog("导入失败", error.message, false))
    .finally(() => {
      sqlmFileInput.value = "";
    });
});
formatBtn.addEventListener("click", formatSql);
openAiBtn?.addEventListener("click", focusSqlAiPanel);
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
