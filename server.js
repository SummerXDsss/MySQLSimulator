const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const { exec } = require("child_process");
const { performance } = require("perf_hooks");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");
const SQLM_MAGIC = "MYSQL_SIMULATOR_SQLM";
const SQLM_VERSION = 1;
const SQLM_ALGORITHM = "aes-256-gcm";
const SQLM_KEY = crypto
  .createHash("sha256")
  .update(process.env.SQLM_SECRET || "mysql-simulator-local-sqlm-key-v1")
  .digest();
const SESSION_STATE_VERSION = 1;
const APP_REPO = process.env.APP_REPO || "SummerXDsss/MySQLSimulator";
const APP_UPDATE_BRANCH = process.env.APP_UPDATE_BRANCH || "main";
const APP_DIR = __dirname;
const WEB_UPDATE_ENABLED = process.env.WEB_UPDATE_ENABLED !== "false";
const WEB_UPDATE_RESTART = process.env.WEB_UPDATE_RESTART === "true";
const WEB_UPDATE_PUBLIC = process.env.WEB_UPDATE_PUBLIC === "true";
const WEB_UPDATE_TOKEN = process.env.WEB_UPDATE_TOKEN || process.env.UPDATE_TOKEN || "";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";
const PUBLIC_BASE_URL = normalizeBaseUrl(process.env.PUBLIC_BASE_URL || "");
const VERSION_CACHE_MS = 60 * 1000;
const HISTORY_CACHE_MS = 5 * 60 * 1000;
const SHARE_TTL_MS = 60 * 60 * 1000;
const SHARE_SQL_MAX_BYTES = 128 * 1024;
const SHARE_JS_MAX_BYTES = 128 * 1024;
const SHARE_AUDIT_LOG = path.join(APP_DIR, "share-audit.log");

const sharedSqlStore = new Map();
const sharedJsStore = new Map();

const SHARE_DISCLAIMER = "分享链接仅保存 SQL 文本，不保存模拟数据库状态；链接有效期 60 分钟，请勿分享真实密码、密钥、生产数据或个人敏感信息。";
const SHARE_TERMS = "用户确认其有权分享该 SQL 文本，并自行承担由链接传播、内容合规和敏感信息泄露造成的风险。SQLSimulator 仅提供短效文本传递和模拟执行能力，不对 SQL 内容的真实性、安全性或执行后果负责。";
const JS_SHARE_DISCLAIMER = "分享链接仅保存 JavaScript 学习代码文本；链接有效期 60 分钟，请勿分享真实密钥、生产数据、个人敏感信息或可造成风险的代码片段。";
const JS_SHARE_TERMS = "用户确认其有权分享该代码，并自行承担由链接传播、内容合规和敏感信息泄露造成的风险。SQLSimulator 仅提供短效文本传递和学习模拟能力。";

function compareVersions(left, right) {
  const cleanLeft = String(left || "0.0.0").replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const cleanRight = String(right || "0.0.0").replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(cleanLeft.length, cleanRight.length, 3);
  for (let index = 0; index < length; index += 1) {
    const a = cleanLeft[index] || 0;
    const b = cleanRight[index] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".hsml": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sqlm": "application/octet-stream",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self' https://unpkg.com 'unsafe-inline'",
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'"
  ].join("; ")
};

const helpRows = [
  ["DDL", "CREATE DATABASE, DROP DATABASE, CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE TABLE, RENAME TABLE, CREATE INDEX, DROP INDEX"],
  ["DML", "INSERT, SELECT, UPDATE, DELETE"],
  ["元信息", "SHOW DATABASES, SHOW TABLES, SHOW COLUMNS, SHOW CREATE TABLE, SHOW VARIABLES, SHOW STATUS, DESCRIBE, EXPLAIN"],
  ["会话", "USE, SELECT DATABASE(), SELECT VERSION(), SELECT NOW(), SELECT USER(), SET"],
  ["事务", "BEGIN, START TRANSACTION, COMMIT, ROLLBACK"]
];

const examples = [
  {
    name: "快速查询",
    description: "查看当前库、表和订单数据",
    sql: "SELECT DATABASE();\nSHOW TABLES;\nSELECT id, customer_id, status, total_amount FROM orders ORDER BY id DESC LIMIT 5;"
  },
  {
    name: "新增数据",
    description: "插入客户并查询结果",
    sql: "INSERT INTO customers (name, email, city, vip_level) VALUES ('Luna Chen', 'luna@example.com', 'Shanghai', 'gold');\nSELECT id, name, email, city, vip_level FROM customers ORDER BY id DESC LIMIT 5;"
  },
  {
    name: "建库建表",
    description: "创建数据库和任务表",
    sql: "CREATE DATABASE analytics_lab;\nUSE analytics_lab;\nCREATE TABLE tasks (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  title VARCHAR(120) NOT NULL,\n  status VARCHAR(20) DEFAULT 'open',\n  created_at DATETIME DEFAULT NOW()\n);\nINSERT INTO tasks (title, status) VALUES ('Build dashboard', 'open'), ('Check slow queries', 'done');\nSELECT * FROM tasks;"
  },
  {
    name: "条件更新",
    description: "更新订单状态并统计影响",
    sql: "UPDATE orders SET status = 'paid' WHERE id = 1003;\nSELECT id, status, total_amount FROM orders WHERE id = 1003;"
  },
  {
    name: "事务回滚",
    description: "模拟事务修改和回滚",
    sql: "START TRANSACTION;\nDELETE FROM products WHERE stock < 10;\nSELECT id, name, stock FROM products ORDER BY stock ASC;\nROLLBACK;\nSELECT id, name, stock FROM products ORDER BY stock ASC;"
  },
  {
    name: "表结构调整",
    description: "添加列、描述结构、删除列",
    sql: "ALTER TABLE customers ADD COLUMN source VARCHAR(40) DEFAULT 'website';\nDESC customers;\nALTER TABLE customers DROP COLUMN source;\nDESC customers;"
  }
];

function createColumn(name, type, options = {}) {
  return {
    name,
    type,
    nullable: options.nullable ?? true,
    key: options.key || "",
    default: options.default ?? null,
    extra: options.extra || ""
  };
}

function createInitialState() {
  return {
    currentDatabase: "demo",
    transactionSnapshot: null,
    variables: {
      autocommit: "ON",
      sql_mode: "STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION",
      time_zone: "+08:00",
      character_set_client: "utf8mb4",
      max_connections: "151"
    },
    databases: {
      demo: {
        name: "demo",
        tables: {
          customers: {
            name: "customers",
            autoIncrement: 5,
            indexes: [{ name: "PRIMARY", columns: ["id"], unique: true }],
            columns: [
              createColumn("id", "INT", { nullable: false, key: "PRI", extra: "auto_increment" }),
              createColumn("name", "VARCHAR(80)", { nullable: false }),
              createColumn("email", "VARCHAR(120)", { nullable: false }),
              createColumn("city", "VARCHAR(60)"),
              createColumn("vip_level", "VARCHAR(20)", { default: "standard" }),
              createColumn("created_at", "DATETIME", { default: "CURRENT_TIMESTAMP" })
            ],
            rows: [
              { id: 1, name: "Nora Li", email: "nora@example.com", city: "Beijing", vip_level: "gold", created_at: "2026-01-12 09:30:00" },
              { id: 2, name: "Evan Zhang", email: "evan@example.com", city: "Shanghai", vip_level: "standard", created_at: "2026-01-18 14:22:10" },
              { id: 3, name: "Mia Wang", email: "mia@example.com", city: "Shenzhen", vip_level: "silver", created_at: "2026-02-02 11:05:45" },
              { id: 4, name: "Leo Xu", email: "leo@example.com", city: "Hangzhou", vip_level: "standard", created_at: "2026-02-19 16:40:15" }
            ]
          },
          products: {
            name: "products",
            autoIncrement: 6,
            indexes: [{ name: "PRIMARY", columns: ["id"], unique: true }],
            columns: [
              createColumn("id", "INT", { nullable: false, key: "PRI", extra: "auto_increment" }),
              createColumn("name", "VARCHAR(100)", { nullable: false }),
              createColumn("category", "VARCHAR(60)"),
              createColumn("price", "DECIMAL(10,2)", { nullable: false, default: 0 }),
              createColumn("stock", "INT", { default: 0 })
            ],
            rows: [
              { id: 1, name: "Mechanical Keyboard", category: "Accessories", price: 89.9, stock: 42 },
              { id: 2, name: "USB-C Dock", category: "Accessories", price: 129, stock: 18 },
              { id: 3, name: "27-inch Monitor", category: "Display", price: 299, stock: 11 },
              { id: 4, name: "Noise Cancelling Headset", category: "Audio", price: 159, stock: 7 },
              { id: 5, name: "Developer Notebook", category: "Stationery", price: 12.5, stock: 120 }
            ]
          },
          orders: {
            name: "orders",
            autoIncrement: 1005,
            indexes: [
              { name: "PRIMARY", columns: ["id"], unique: true },
              { name: "idx_orders_customer", columns: ["customer_id"], unique: false }
            ],
            columns: [
              createColumn("id", "INT", { nullable: false, key: "PRI", extra: "auto_increment" }),
              createColumn("customer_id", "INT", { nullable: false, key: "MUL" }),
              createColumn("status", "VARCHAR(20)", { default: "pending" }),
              createColumn("total_amount", "DECIMAL(10,2)", { default: 0 }),
              createColumn("created_at", "DATETIME", { default: "CURRENT_TIMESTAMP" })
            ],
            rows: [
              { id: 1001, customer_id: 1, status: "paid", total_amount: 231.4, created_at: "2026-03-01 10:15:00" },
              { id: 1002, customer_id: 2, status: "shipped", total_amount: 299, created_at: "2026-03-03 13:25:00" },
              { id: 1003, customer_id: 1, status: "pending", total_amount: 89.9, created_at: "2026-03-04 17:42:00" },
              { id: 1004, customer_id: 3, status: "paid", total_amount: 171.5, created_at: "2026-03-05 09:08:00" }
            ]
          }
        }
      },
      education: {
        name: "education",
        tables: {
          students: {
            name: "students",
            autoIncrement: 4,
            indexes: [{ name: "PRIMARY", columns: ["id"], unique: true }],
            columns: [
              createColumn("id", "INT", { nullable: false, key: "PRI", extra: "auto_increment" }),
              createColumn("name", "VARCHAR(80)", { nullable: false }),
              createColumn("grade", "INT"),
              createColumn("major", "VARCHAR(80)")
            ],
            rows: [
              { id: 1, name: "Ava", grade: 2024, major: "Computer Science" },
              { id: 2, name: "Ben", grade: 2025, major: "Data Science" },
              { id: 3, name: "Chloe", grade: 2024, major: "Information Systems" }
            ]
          },
          courses: {
            name: "courses",
            autoIncrement: 4,
            indexes: [{ name: "PRIMARY", columns: ["id"], unique: true }],
            columns: [
              createColumn("id", "INT", { nullable: false, key: "PRI", extra: "auto_increment" }),
              createColumn("title", "VARCHAR(100)", { nullable: false }),
              createColumn("credits", "INT", { default: 3 })
            ],
            rows: [
              { id: 1, title: "SQL Basics", credits: 3 },
              { id: 2, title: "Database Design", credits: 4 },
              { id: 3, title: "Query Optimization", credits: 3 }
            ]
          }
        }
      }
    }
  };
}

let state = createInitialState();
let versionCache = null;
let updateTagCache = null;
const updateHistoryCache = new Map();

function getStateSnapshot() {
  return clone({
    currentDatabase: state.currentDatabase,
    transactionSnapshot: state.transactionSnapshot,
    variables: state.variables,
    databases: state.databases
  });
}

function createClientStatePayload() {
  return {
    version: SESSION_STATE_VERSION,
    savedAt: new Date().toISOString(),
    state: getStateSnapshot()
  };
}

function unwrapClientState(payload) {
  const clientState = payload?.clientState || payload?.browserState || payload?.sessionState || null;
  if (!clientState) return null;
  return clientState.state || clientState;
}

function normalizeRuntimeState(runtimeState) {
  if (!runtimeState) return createInitialState();
  const normalized = validateImportedState(runtimeState);
  if (!normalized.databases.demo) {
    const demoSource = normalized.databases.shop_demo || createInitialState().databases.demo;
    normalized.databases.demo = clone(demoSource);
    normalized.databases.demo.name = "demo";
  }
  if (!normalized.currentDatabase || normalized.currentDatabase === "shop_demo") {
    normalized.currentDatabase = "demo";
  }
  if (runtimeState.transactionSnapshot && typeof runtimeState.transactionSnapshot === "object") {
    try {
      normalized.transactionSnapshot = validateImportedState(runtimeState.transactionSnapshot);
    } catch {
      normalized.transactionSnapshot = null;
    }
  }
  return normalized;
}

function loadRequestState(payload) {
  state = normalizeRuntimeState(unwrapClientState(payload));
}

function stateResponse(data = {}) {
  return {
    ...data,
    schema: getSchemaSummary(),
    clientState: createClientStatePayload()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBaseUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function normalizeIpCandidate(value) {
  const first = String(value || "").split(",")[0].trim().replace(/^::ffff:/, "");
  const bracketless = first.startsWith("[") && first.includes("]")
    ? first.slice(1, first.indexOf("]"))
    : first;
  const withoutIpv4Port = /^\d{1,3}(?:\.\d{1,3}){3}:\d{1,5}$/.test(bracketless)
    ? bracketless.replace(/:\d{1,5}$/, "")
    : bracketless;
  return net.isIP(withoutIpv4Port) ? withoutIpv4Port : "";
}

function getClientIp(request) {
  if (TRUST_PROXY) {
    const forwarded = normalizeIpCandidate(request.headers["x-forwarded-for"]);
    const realIp = normalizeIpCandidate(request.headers["x-real-ip"]);
    if (forwarded) return forwarded;
    if (realIp) return realIp;
  }
  return normalizeIpCandidate(request.socket.remoteAddress) || request.socket.remoteAddress || "unknown";
}

function maskIpAddress(ip) {
  const cleanIp = String(ip || "unknown").replace(/^::ffff:/, "");
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(cleanIp)) {
    const parts = cleanIp.split(".");
    return `${parts[0]}.${parts[1]}.***.${parts[3]}`;
  }
  if (cleanIp.includes(":")) {
    const parts = cleanIp.split(":").filter(Boolean);
    if (parts.length <= 2) return `${parts[0] || "ip"}:***`;
    return `${parts[0]}:${parts[1]}:***:${parts[parts.length - 1]}`;
  }
  if (cleanIp.length <= 6) return `${cleanIp.slice(0, 1)}***`;
  return `${cleanIp.slice(0, 3)}***${cleanIp.slice(-2)}`;
}

function writeShareAudit(event, request, data = {}) {
  const entry = {
    at: new Date().toISOString(),
    event,
    ip: getClientIp(request),
    userAgent: request.headers["user-agent"] || "",
    ...data
  };
  const line = JSON.stringify(entry);
  console.log(`[share-audit] ${line}`);
  fs.appendFile(SHARE_AUDIT_LOG, `${line}\n`, () => {});
}

function analyzeSharedSql(sql) {
  const text = String(sql ?? "");
  const byteLength = Buffer.byteLength(text, "utf8");
  const errors = [];
  const warnings = [];

  if (!text.trim()) {
    errors.push("SQL 内容不能为空");
  }
  if (byteLength > SHARE_SQL_MAX_BYTES) {
    errors.push(`SQL 文件超过 ${Math.round(SHARE_SQL_MAX_BYTES / 1024)}KB 限制`);
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    errors.push("检测到非法控制字符，请删除后再分享");
  }
  if (/[\u202A-\u202E\u2066-\u2069]/.test(text)) {
    warnings.push("检测到 Unicode 方向控制字符，可能造成代码显示混淆");
  }
  if (/[\u200B-\u200F\uFEFF]/.test(text)) {
    warnings.push("检测到零宽字符，可能影响 SQL 审阅");
  }
  if (/<\/?(script|iframe|object|embed|link|meta|style)\b/i.test(text) || /javascript\s*:/i.test(text)) {
    warnings.push("检测到疑似脚本或 HTML 注入片段");
  }
  if (/(--|#|\/\*)/.test(text)) {
    warnings.push("检测到 SQL 注释符，请确认没有隐藏语句");
  }
  if (/\b(load_file|into\s+outfile|into\s+dumpfile)\b/i.test(text)) {
    warnings.push("检测到文件读写相关 SQL 语句");
  }
  if (/\b(drop\s+database|drop\s+table|truncate\s+table|grant\s+|revoke\s+|shutdown|kill\s+|lock\s+tables|unlock\s+tables)\b/i.test(text)) {
    warnings.push("检测到高风险 SQL 管理指令，请确认分享对象可信");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    byteLength
  };
}

function extractSharedJavaScript(source, interpreter = "html-js") {
  const text = String(source ?? "");
  const warnings = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  let match;

  if (interpreter === "nodejs" && /<\/?[a-z][\s\S]*>/i.test(text)) {
    return {
      code: "",
      warnings,
      errors: ["NodeJS 解释器只接受 JavaScript 代码内容"]
    };
  }

  while ((match = scriptPattern.exec(text)) !== null) {
    const attrs = match[1] || "";
    const typeMatch = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const scriptType = String(typeMatch?.[1] || typeMatch?.[2] || typeMatch?.[3] || "").trim().toLowerCase();
    const javascriptTypes = new Set(["", "module", "text/javascript", "application/javascript", "application/ecmascript", "text/ecmascript"]);
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

  if (scripts.length) {
    warnings.push("已忽略 HTML/CSS，只执行 script 中的 JavaScript");
    return { code: scripts.join("\n\n"), warnings, errors: [] };
  }

  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return {
      code: "",
      warnings,
      errors: ["未识别到可执行的 JavaScript，请把代码放到 <script> 中"]
    };
  }

  return { code: text.trim(), warnings, errors: [] };
}

function analyzeSharedJs(code, interpreter = "html-js") {
  const text = String(code ?? "");
  const extracted = extractSharedJavaScript(text, interpreter);
  const js = extracted.code;
  const byteLength = Buffer.byteLength(text, "utf8");
  const errors = [...(extracted.errors || [])];
  const warnings = [...(extracted.warnings || [])];

  if (!text.trim()) errors.push("JavaScript 内容不能为空");
  if (byteLength > SHARE_JS_MAX_BYTES) {
    errors.push(`JavaScript 文件超过 ${Math.round(SHARE_JS_MAX_BYTES / 1024)}KB 限制`);
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    errors.push("检测到非法控制字符，请删除后再分享");
  }
  if (/[\u202A-\u202E\u2066-\u2069]/.test(text)) {
    warnings.push("检测到 Unicode 方向控制字符，可能造成代码显示混淆");
  }
  if (/[\u200B-\u200F\uFEFF]/.test(text)) {
    warnings.push("检测到零宽字符，可能影响代码审阅");
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

  blockedRules.forEach(([pattern, message]) => {
    if (pattern.test(js)) errors.push(message);
  });

  if (/\bwhile\s*\(\s*true\s*\)|\bfor\s*\(\s*;\s*;\s*\)/i.test(js)) {
    warnings.push("检测到可能的无限循环，运行会在 2 秒后强制终止");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    byteLength
  };
}

function cleanupExpiredShares() {
  const now = Date.now();
  for (const [token, item] of sharedSqlStore.entries()) {
    if (item.expiresAt <= now) {
      sharedSqlStore.delete(token);
    }
  }
  for (const [token, item] of sharedJsStore.entries()) {
    if (item.expiresAt <= now) {
      sharedJsStore.delete(token);
    }
  }
}

function getRequestOrigin(request) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
  const forwardedProto = TRUST_PROXY
    ? String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase()
    : "";
  const proto = ["http", "https"].includes(forwardedProto) ? forwardedProto : "http";
  const forwardedHost = TRUST_PROXY ? request.headers["x-forwarded-host"] : "";
  const host = sanitizeHost(forwardedHost || request.headers.host) || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function sanitizeHost(value) {
  const host = String(value || "").split(",")[0].trim();
  if (/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host)) return host;
  if (/^\[[0-9a-f:.]+\](?::\d{1,5})?$/i.test(host)) return host;
  return "";
}

function encryptSqlm(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(SQLM_ALGORITHM, SQLM_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  return JSON.stringify({
    magic: SQLM_MAGIC,
    version: SQLM_VERSION,
    algorithm: SQLM_ALGORITHM,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64")
  }, null, 2);
}

function decryptSqlm(content) {
  let envelope;
  try {
    envelope = JSON.parse(String(content || ""));
  } catch {
    throw new SqlError("Invalid .sqlm file: cannot parse encrypted envelope");
  }

  if (envelope.magic !== SQLM_MAGIC || envelope.version !== SQLM_VERSION || envelope.algorithm !== SQLM_ALGORITHM) {
    throw new SqlError("Invalid .sqlm file: unsupported format");
  }

  try {
    const decipher = crypto.createDecipheriv(SQLM_ALGORITHM, SQLM_KEY, Buffer.from(envelope.iv, "base64"));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(envelope.data, "base64")),
      decipher.final()
    ]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    throw new SqlError("Invalid .sqlm file: decrypt failed");
  }
}

function createSqlmPayload() {
  return {
    app: "SQL Database Simulator",
    format: SQLM_MAGIC,
    version: SQLM_VERSION,
    exportedAt: new Date().toISOString(),
    state: clone({
      currentDatabase: state.currentDatabase,
      variables: state.variables,
      databases: state.databases
    })
  };
}

function validateImportedState(importedState) {
  if (!importedState || typeof importedState !== "object") throw new SqlError("Invalid .sqlm file: missing state");
  if (!importedState.databases || typeof importedState.databases !== "object") throw new SqlError("Invalid .sqlm file: missing databases");
  const databaseNames = Object.keys(importedState.databases);
  if (databaseNames.length === 0) throw new SqlError("Invalid .sqlm file: no database found");

  databaseNames.forEach((databaseName) => {
    const database = importedState.databases[databaseName];
    if (!database || typeof database !== "object" || !database.tables || typeof database.tables !== "object") {
      throw new SqlError(`Invalid .sqlm file: database '${databaseName}' is broken`);
    }
    Object.entries(database.tables).forEach(([tableName, table]) => {
      if (!Array.isArray(table.columns) || !Array.isArray(table.rows) || !Array.isArray(table.indexes)) {
        throw new SqlError(`Invalid .sqlm file: table '${tableName}' is broken`);
      }
    });
  });

  return {
    currentDatabase: importedState.currentDatabase && importedState.databases[importedState.currentDatabase]
      ? importedState.currentDatabase
      : databaseNames[0],
    transactionSnapshot: null,
    variables: importedState.variables && typeof importedState.variables === "object" ? importedState.variables : {},
    databases: importedState.databases
  };
}

function downloadResponse(response, filename, content) {
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    "content-type": "application/octet-stream",
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": "no-store"
  });
  response.end(content);
}

function jsonResponse(response, status, data) {
  const body = JSON.stringify(data, null, 2);
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("请求体过大"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendText(response, status, message) {
  response.writeHead(status, { ...SECURITY_HEADERS, "content-type": "text/plain; charset=utf-8" });
  response.end(message);
}

function serveStatic(request, response) {
  let requestedPath;
  try {
    requestedPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    sendText(response, 400, "Bad request");
    return;
  }
  const safePath = requestedPath === "/"
    ? "/index.html"
    : ["/control", "/control.html"].includes(requestedPath)
      ? "/console.html"
      : /^\/share\/[A-Za-z0-9_-]{16,}$/.test(requestedPath)
        ? "/console.html"
      : /^\/js-share\/[A-Za-z0-9_-]{16,}$/.test(requestedPath)
        ? "/js.hsml"
      : requestedPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath.replace(/^\/+/, "")));
  const relativePath = path.relative(PUBLIC_DIR, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath);
    response.writeHead(200, {
      ...SECURITY_HEADERS,
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(content);
  });
}

function readPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(APP_DIR, "package.json"), "utf8"));
    return pkg.version || "0.0.0";
  } catch {
    return process.env.APP_VERSION || "0.0.0";
  }
}

function readCurrentRevision() {
  const revisionFile = path.join(APP_DIR, ".current-revision");
  try {
    const revision = fs.readFileSync(revisionFile, "utf8").trim();
    if (revision) return revision;
  } catch {
    // ignore missing revision file
  }
  if (process.env.APP_REVISION) return process.env.APP_REVISION;
  return "local";
}

function requestJsonWithMeta(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        "accept": "application/vnd.github+json",
        "user-agent": "mysql-simulator-version-check"
      }
    }, (incoming) => {
      let body = "";
      incoming.on("data", (chunk) => {
        body += chunk;
      });
      incoming.on("end", () => {
        if (incoming.statusCode < 200 || incoming.statusCode >= 300) {
          reject(new Error(`Version request failed: ${incoming.statusCode}`));
          return;
        }
        try {
          resolve({
            data: JSON.parse(body),
            headers: incoming.headers
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.setTimeout(8000, () => {
      request.destroy(new Error("Version request timeout"));
    });
    request.on("error", reject);
  });
}

async function requestJson(url) {
  const response = await requestJsonWithMeta(url);
  return response.data;
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        "user-agent": "mysql-simulator-version-check"
      }
    }, (incoming) => {
      let body = "";
      incoming.on("data", (chunk) => {
        body += chunk;
      });
      incoming.on("end", () => {
        if (incoming.statusCode < 200 || incoming.statusCode >= 300) {
          reject(new Error(`Version request failed: ${incoming.statusCode}`));
          return;
        }
        resolve(body);
      });
    });
    request.setTimeout(8000, () => {
      request.destroy(new Error("Version request timeout"));
    });
    request.on("error", reject);
  });
}

async function getLatestVersionInfo(force = false) {
  const now = Date.now();
  if (!force && versionCache && now - versionCache.checkedAt < VERSION_CACHE_MS) {
    return versionCache.payload;
  }

  const currentVersion = readPackageVersion();
  const currentRevision = readCurrentRevision();
  const payload = {
    ok: true,
    repo: APP_REPO,
    branch: APP_UPDATE_BRANCH,
    currentVersion,
    currentRevision,
    latestVersion: null,
    latestRevision: null,
    checkedAt: new Date().toISOString(),
    updateAvailable: false,
    updateEnabled: WEB_UPDATE_ENABLED,
    updateAuthRequired: Boolean(WEB_UPDATE_TOKEN),
    message: "已是最新版本"
  };

  try {
    const [commit, packageText] = await Promise.all([
      requestJson(`https://api.github.com/repos/${APP_REPO}/commits/${APP_UPDATE_BRANCH}`),
      requestText(`https://raw.githubusercontent.com/${APP_REPO}/${APP_UPDATE_BRANCH}/package.json`)
    ]);
    const latestPackage = JSON.parse(packageText);
    payload.latestRevision = commit.sha || null;
    payload.latestVersion = latestPackage.version || null;
    const versionBehind = compareVersions(payload.latestVersion, currentVersion) > 0;
    const revisionBehind = Boolean(
      payload.latestRevision
      && currentRevision !== "local"
      && !payload.latestRevision.startsWith(currentRevision)
    );
    payload.updateAvailable = Boolean(versionBehind || revisionBehind);
    payload.message = payload.updateAvailable ? "发现新版本" : "已是最新版本";
  } catch (error) {
    payload.ok = false;
    payload.message = "暂时无法检查最新版本";
    payload.detail = error.message;
  }

  versionCache = { checkedAt: now, payload };
  return payload;
}

function clampNumber(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function firstCommitLine(message) {
  return String(message || "").split("\n").find((line) => line.trim())?.trim() || "No commit message";
}

function parseGitHubLinkHeader(linkHeader) {
  const links = {};
  String(linkHeader || "").split(",").forEach((part) => {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (!match) return;
    links[match[2]] = match[1];
  });
  return links;
}

function getPageFromUrl(value) {
  try {
    return Number.parseInt(new URL(value).searchParams.get("page"), 10);
  } catch {
    return 0;
  }
}

async function getUpdateTagMap(force = false) {
  const now = Date.now();
  if (!force && updateTagCache && now - updateTagCache.checkedAt < HISTORY_CACHE_MS) {
    return updateTagCache.map;
  }

  const refs = await requestJson(`https://api.github.com/repos/${APP_REPO}/git/matching-refs/tags/v`);
  const tagMap = new Map();
  await Promise.all((Array.isArray(refs) ? refs : []).map(async (ref) => {
    const tagName = String(ref.ref || "").replace(/^refs\/tags\//, "");
    if (!tagName) return;
    let commitSha = ref.object?.sha || "";
    if (ref.object?.type === "tag" && ref.object?.url) {
      try {
        const tagObject = await requestJson(ref.object.url);
        commitSha = tagObject.object?.sha || commitSha;
      } catch {
        // Keep the tag object SHA as a fallback.
      }
    }
    if (!commitSha) return;
    const versions = tagMap.get(commitSha) || [];
    versions.push(tagName);
    tagMap.set(commitSha, versions);
  }));

  updateTagCache = { checkedAt: now, map: tagMap };
  return tagMap;
}

async function getUpdateHistory(page, pageSize, force = false) {
  const currentPage = clampNumber(page, 1, 999, 1);
  const currentPageSize = clampNumber(pageSize, 5, 30, 8);
  const cacheKey = `${currentPage}:${currentPageSize}`;
  const now = Date.now();
  const cached = updateHistoryCache.get(cacheKey);
  if (!force && cached && now - cached.checkedAt < HISTORY_CACHE_MS) {
    return cached.payload;
  }

  const [commitsResponse, tagMap] = await Promise.all([
    requestJsonWithMeta(`https://api.github.com/repos/${APP_REPO}/commits?sha=${encodeURIComponent(APP_UPDATE_BRANCH)}&per_page=${currentPageSize}&page=${currentPage}`),
    getUpdateTagMap(force)
  ]);

  const commits = commitsResponse.data;
  const list = Array.isArray(commits) ? commits : [];
  const links = parseGitHubLinkHeader(commitsResponse.headers?.link);
  const lastPage = Math.max(currentPage, getPageFromUrl(links.last) || currentPage);
  const hasNext = Boolean(links.next) || currentPage < lastPage;
  const items = list.map((commit) => {
    const sha = commit.sha || "";
    const tags = tagMap.get(sha) || [];
    return {
      updatedAt: commit.commit?.committer?.date || commit.commit?.author?.date || "",
      version: tags.length ? tags.join(", ") : "未标记",
      shortHash: sha.slice(0, 7),
      hash: sha,
      title: firstCommitLine(commit.commit?.message),
      message: String(commit.commit?.message || "").trim(),
      author: commit.commit?.author?.name || commit.author?.login || "unknown",
      url: commit.html_url || `https://github.com/${APP_REPO}/commit/${sha}`
    };
  });

  const payload = {
    ok: true,
    repo: APP_REPO,
    branch: APP_UPDATE_BRANCH,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages: lastPage,
    hasPrev: currentPage > 1,
    hasNext,
    checkedAt: new Date().toISOString(),
    items
  };
  updateHistoryCache.set(cacheKey, { checkedAt: now, payload });
  return payload;
}

function decorateVersionForRequest(version) {
  const payload = {
    ...version,
    updateAuthRequired: Boolean(WEB_UPDATE_TOKEN),
    updateEnabled: Boolean(WEB_UPDATE_ENABLED && (WEB_UPDATE_PUBLIC || WEB_UPDATE_TOKEN))
  };
  if (WEB_UPDATE_ENABLED && !payload.updateEnabled) {
    payload.message = payload.updateAvailable
      ? "发现新版本，但服务器未配置更新权限"
      : payload.message;
  }
  return payload;
}

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function authorizeWebUpdate(request, payload = {}) {
  if (!WEB_UPDATE_ENABLED) {
    return { ok: false, status: 400, message: "服务器未开启网页更新" };
  }
  if (WEB_UPDATE_PUBLIC) {
    return { ok: true };
  }
  if (!WEB_UPDATE_TOKEN) {
    return { ok: false, status: 403, message: "服务器未配置更新令牌" };
  }
  const providedToken = request.headers["x-update-token"] || payload.updateToken || "";
  if (!timingSafeEqualText(providedToken, WEB_UPDATE_TOKEN)) {
    return { ok: false, status: 401, message: "更新令牌不正确" };
  }
  return { ok: true };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function runWebUpdate(latestRevision) {
  const archiveUrl = `https://github.com/${APP_REPO}/archive/${latestRevision}.tar.gz`;
  const quotedAppDir = shellQuote(APP_DIR);
  const quotedArchiveUrl = shellQuote(archiveUrl);
  const quotedRevision = shellQuote(latestRevision);
  const command = [
    "set -e",
    "tmp=$(mktemp -d)",
    `wget -qO \"$tmp/source.tar.gz\" ${quotedArchiveUrl}`,
    "tar -xzf \"$tmp/source.tar.gz\" -C \"$tmp\"",
    "src=$(find \"$tmp\" -mindepth 1 -maxdepth 1 -type d | head -n 1)",
    `cp \"$src/package.json\" \"$src/server.js\" ${quotedAppDir}/`,
    `rm -rf ${quotedAppDir}/public`,
    `cp -R \"$src/public\" ${quotedAppDir}/public`,
    `printf %s ${quotedRevision} > ${quotedAppDir}/.current-revision`,
    "rm -rf \"$tmp\""
  ].join(" && ");

  return new Promise((resolve, reject) => {
    exec(command, { cwd: APP_DIR, timeout: 120000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

function getCurrentDatabase() {
  const db = state.databases[state.currentDatabase];
  if (!db) {
    throw new SqlError(`Unknown database '${state.currentDatabase}'`);
  }
  return db;
}

function getDatabase(databaseName) {
  const cleanName = normalizeIdentifier(databaseName || state.currentDatabase);
  const db = state.databases[cleanName];
  if (!db) {
    throw new SqlError(`Unknown database '${cleanName}'`);
  }
  return db;
}

function getTable(tableName) {
  const db = getCurrentDatabase();
  const cleanName = normalizeIdentifier(tableName);
  const table = db.tables[cleanName];
  if (!table) {
    throw new SqlError(`Table '${state.currentDatabase}.${cleanName}' doesn't exist`);
  }
  return table;
}

function getTableFromDatabase(databaseName, tableName) {
  const db = getDatabase(databaseName);
  const cleanName = normalizeIdentifier(tableName);
  const table = db.tables[cleanName];
  if (!table) {
    throw new SqlError(`Table '${db.name}.${cleanName}' doesn't exist`);
  }
  return { database: db, table };
}

function normalizeIdentifier(identifier) {
  return stripTicks(String(identifier || "").trim()).replace(/;$/, "");
}

function stripTicks(value) {
  const text = String(value || "").trim();
  if ((text.startsWith("`") && text.endsWith("`")) || (text.startsWith('"') && text.endsWith('"'))) {
    return text.slice(1, -1);
  }
  return text;
}

class SqlError extends Error {
  constructor(message) {
    super(message);
    this.name = "SqlError";
  }
}

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let quote = null;
  let blockComment = false;
  let lineComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
        current += char;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (!quote && char === "-" && next === "-") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (!quote && char === "#") {
      lineComment = true;
      continue;
    }

    if (!quote && char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if ((char === "'" || char === '"' || char === "`") && sql[index - 1] !== "\\") {
      if (quote === char) {
        quote = null;
      } else if (!quote) {
        quote = char;
      }
    }

    if (char === ";" && !quote) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
}

function splitTopLevel(input, delimiter = ",") {
  const parts = [];
  let current = "";
  let depth = 0;
  let quote = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if ((char === "'" || char === '"' || char === "`") && input[index - 1] !== "\\") {
      if (quote === char) quote = null;
      else if (!quote) quote = char;
    }

    if (!quote) {
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      if (char === delimiter && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseLiteral(value) {
  const raw = String(value || "").trim();
  if (/^null$/i.test(raw)) return null;
  if (/^true$/i.test(raw)) return true;
  if (/^false$/i.test(raw)) return false;
  if (/^now\(\)$/i.test(raw) || /^current_timestamp$/i.test(raw)) return formatDateTime(new Date());
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    return raw.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return stripTicks(raw);
}

function formatDateTime(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function makeMessage(statement, message, extras = {}) {
  return {
    statement,
    kind: "message",
    message,
    columns: [],
    rows: [],
    affectedRows: extras.affectedRows ?? 0,
    warning: extras.warning || ""
  };
}

function makeTable(statement, columns, rows, extras = {}) {
  return {
    statement,
    kind: "table",
    message: extras.message || `${rows.length} row${rows.length === 1 ? "" : "s"} in set`,
    columns,
    rows,
    affectedRows: extras.affectedRows ?? rows.length,
    warning: extras.warning || ""
  };
}

function executeSql(sql) {
  const start = performance.now();
  const statements = splitStatements(sql);

  if (statements.length === 0) {
    return {
      ok: true,
      elapsedMs: 0,
      results: [makeMessage("", "请输入 SQL 指令")]
    };
  }

  const results = statements.map((statement) => {
    try {
      return executeStatement(statement);
    } catch (error) {
      return {
        statement,
        kind: "error",
        message: error instanceof SqlError ? error.message : "模拟器执行失败",
        detail: error instanceof SqlError ? "" : error.message,
        columns: [],
        rows: [],
        affectedRows: 0
      };
    }
  });

  return {
    ok: !results.some((result) => result.kind === "error"),
    elapsedMs: Number((performance.now() - start).toFixed(2)),
    results
  };
}

function executeStatement(statement) {
  const sql = statement.trim().replace(/;$/, "");
  const compact = sql.replace(/\s+/g, " ");

  if (/^help$/i.test(compact)) return makeTable(statement, ["category", "commands"], helpRows.map(([category, commands]) => ({ category, commands })));
  if (/^use\s+/i.test(compact)) return executeUse(statement, compact);
  if (/^show\s+/i.test(compact)) return executeShow(statement, compact);
  if (/^(describe|desc)\s+/i.test(compact)) return executeDescribe(statement, compact);
  if (/^explain\s+/i.test(compact)) return executeExplain(statement, compact);
  if (/^create\s+database\s+/i.test(compact)) return executeCreateDatabase(statement, compact);
  if (/^drop\s+database\s+/i.test(compact)) return executeDropDatabase(statement, compact);
  if (/^create\s+table\s+/i.test(compact)) return executeCreateTable(statement, sql);
  if (/^drop\s+table\s+/i.test(compact)) return executeDropTable(statement, compact);
  if (/^truncate\s+table\s+/i.test(compact)) return executeTruncateTable(statement, compact);
  if (/^rename\s+table\s+/i.test(compact)) return executeRenameTable(statement, compact);
  if (/^alter\s+table\s+/i.test(compact)) return executeAlterTable(statement, compact);
  if (/^create\s+(unique\s+)?index\s+/i.test(compact)) return executeCreateIndex(statement, compact);
  if (/^drop\s+index\s+/i.test(compact)) return executeDropIndex(statement, compact);
  if (/^insert\s+into\s+/i.test(compact)) return executeInsert(statement, sql);
  if (/^select\s+/i.test(compact)) return executeSelect(statement, sql);
  if (/^update\s+/i.test(compact)) return executeUpdate(statement, sql);
  if (/^delete\s+from\s+/i.test(compact)) return executeDelete(statement, sql);
  if (/^(begin|start\s+transaction)$/i.test(compact)) return executeBegin(statement);
  if (/^commit$/i.test(compact)) return executeCommit(statement);
  if (/^rollback$/i.test(compact)) return executeRollback(statement);
  if (/^set\s+/i.test(compact)) return executeSet(statement, compact);
  if (/^(grant|revoke|lock\s+tables|unlock\s+tables|analyze\s+table|optimize\s+table)\b/i.test(compact)) {
    return makeMessage(statement, "语法已识别：此类管理指令在模拟器中返回成功，不改变真实权限或存储状态");
  }

  throw new SqlError(`Unsupported SQL statement: ${compact}`);
}

function executeUse(statement, compact) {
  const match = compact.match(/^use\s+(.+)$/i);
  const dbName = normalizeIdentifier(match?.[1]);
  if (!dbName || !state.databases[dbName]) throw new SqlError(`Unknown database '${dbName}'`);
  state.currentDatabase = dbName;
  return makeMessage(statement, `Database changed to '${dbName}'`);
}

function executeShow(statement, compact) {
  if (/^show\s+databases$/i.test(compact)) {
    const rows = Object.keys(state.databases).map((database) => ({ Database: database }));
    return makeTable(statement, ["Database"], rows);
  }

  if (/^show\s+tables$/i.test(compact)) {
    const db = getCurrentDatabase();
    const column = `Tables_in_${db.name}`;
    const rows = Object.keys(db.tables).map((table) => ({ [column]: table }));
    return makeTable(statement, [column], rows);
  }

  const columnsMatch = compact.match(/^show\s+(columns|fields)\s+from\s+(.+)$/i);
  if (columnsMatch) return executeDescribe(statement, `DESC ${columnsMatch[2]}`);

  const createMatch = compact.match(/^show\s+create\s+table\s+(.+)$/i);
  if (createMatch) {
    const table = getTable(createMatch[1]);
    return makeTable(statement, ["Table", "Create Table"], [{ Table: table.name, "Create Table": createTableSql(table) }]);
  }

  const indexMatch = compact.match(/^show\s+(index|indexes|keys)\s+from\s+(.+)$/i);
  if (indexMatch) {
    const table = getTable(indexMatch[2]);
    const rows = table.indexes.flatMap((index) => index.columns.map((column, seq) => ({
      Table: table.name,
      Non_unique: index.unique ? 0 : 1,
      Key_name: index.name,
      Seq_in_index: seq + 1,
      Column_name: column
    })));
    return makeTable(statement, ["Table", "Non_unique", "Key_name", "Seq_in_index", "Column_name"], rows);
  }

  const variablesMatch = compact.match(/^show\s+variables(?:\s+like\s+(.+))?$/i);
  if (variablesMatch) {
    const like = variablesMatch[1] ? String(parseLiteral(variablesMatch[1])).replace(/%/g, ".*") : null;
    const regex = like ? new RegExp(`^${like}$`, "i") : null;
    const rows = Object.entries(state.variables)
      .filter(([name]) => !regex || regex.test(name))
      .map(([Variable_name, Value]) => ({ Variable_name, Value }));
    return makeTable(statement, ["Variable_name", "Value"], rows);
  }

  if (/^show\s+status$/i.test(compact)) {
    const tableCount = Object.values(state.databases).reduce((total, db) => total + Object.keys(db.tables).length, 0);
    const rows = [
      { Variable_name: "Simulator_uptime", Value: "local-session" },
      { Variable_name: "Databases", Value: Object.keys(state.databases).length },
      { Variable_name: "Tables", Value: tableCount },
      { Variable_name: "Transaction_active", Value: state.transactionSnapshot ? "ON" : "OFF" }
    ];
    return makeTable(statement, ["Variable_name", "Value"], rows);
  }

  throw new SqlError(`Unsupported SHOW command: ${compact}`);
}

function executeDescribe(statement, compact) {
  const match = compact.match(/^(describe|desc)\s+(.+)$/i);
  const table = getTable(match?.[2]);
  const rows = table.columns.map((column) => ({
    Field: column.name,
    Type: column.type,
    Null: column.nullable ? "YES" : "NO",
    Key: column.key,
    Default: column.default,
    Extra: column.extra
  }));
  return makeTable(statement, ["Field", "Type", "Null", "Key", "Default", "Extra"], rows);
}

function executeExplain(statement, compact) {
  const match = compact.match(/^explain\s+(.+)$/i);
  const selectSql = match?.[1] || "";
  const fromMatch = selectSql.match(/\bfrom\s+([`"\w]+)/i);
  const tableName = fromMatch ? normalizeIdentifier(fromMatch[1]) : "derived";
  const table = fromMatch ? getTable(tableName) : null;
  const hasWhere = /\bwhere\b/i.test(selectSql);
  const rows = [{
    id: 1,
    select_type: "SIMPLE",
    table: tableName,
    type: hasWhere ? "ref" : "ALL",
    possible_keys: table?.indexes.map((index) => index.name).join(",") || null,
    key: hasWhere ? table?.indexes[0]?.name || null : null,
    rows: table ? table.rows.length : 1,
    Extra: hasWhere ? "Using where" : ""
  }];
  return makeTable(statement, ["id", "select_type", "table", "type", "possible_keys", "key", "rows", "Extra"], rows);
}

function executeCreateDatabase(statement, compact) {
  const match = compact.match(/^create\s+database(?:\s+if\s+not\s+exists)?\s+(.+)$/i);
  const dbName = normalizeIdentifier(match?.[1]);
  if (!dbName) throw new SqlError("Database name is required");
  const ifNotExists = /^create\s+database\s+if\s+not\s+exists/i.test(compact);
  if (state.databases[dbName]) {
    if (ifNotExists) return makeMessage(statement, `Database '${dbName}' already exists`, { warning: "1 warning" });
    throw new SqlError(`Can't create database '${dbName}'; database exists`);
  }
  state.databases[dbName] = { name: dbName, tables: {} };
  return makeMessage(statement, `Query OK, 1 database created`);
}

function executeDropDatabase(statement, compact) {
  const match = compact.match(/^drop\s+database(?:\s+if\s+exists)?\s+(.+)$/i);
  const dbName = normalizeIdentifier(match?.[1]);
  const ifExists = /^drop\s+database\s+if\s+exists/i.test(compact);
  if (!state.databases[dbName]) {
    if (ifExists) return makeMessage(statement, `Database '${dbName}' does not exist`, { warning: "1 warning" });
    throw new SqlError(`Can't drop database '${dbName}'; database doesn't exist`);
  }
  delete state.databases[dbName];
  if (state.currentDatabase === dbName) {
    state.currentDatabase = Object.keys(state.databases)[0] || "";
  }
  return makeMessage(statement, "Query OK, 1 database dropped");
}

function executeCreateTable(statement, sql) {
  const match = sql.match(/^create\s+table(?:\s+if\s+not\s+exists)?\s+([`"\w]+)\s*\(([\s\S]+)\)$/i);
  if (!match) throw new SqlError("CREATE TABLE syntax error");
  const tableName = normalizeIdentifier(match[1]);
  const ifNotExists = /^create\s+table\s+if\s+not\s+exists/i.test(sql);
  const db = getCurrentDatabase();
  if (db.tables[tableName]) {
    if (ifNotExists) return makeMessage(statement, `Table '${tableName}' already exists`, { warning: "1 warning" });
    throw new SqlError(`Table '${tableName}' already exists`);
  }

  const table = {
    name: tableName,
    autoIncrement: 1,
    indexes: [],
    columns: [],
    rows: []
  };
  const definitions = splitTopLevel(match[2]);

  definitions.forEach((definition) => {
    if (/^primary\s+key/i.test(definition)) {
      const keyMatch = definition.match(/\(([^)]+)\)/);
      const columns = keyMatch ? splitTopLevel(keyMatch[1]).map(normalizeIdentifier) : [];
      table.indexes.push({ name: "PRIMARY", columns, unique: true });
      columns.forEach((columnName) => {
        const column = table.columns.find((item) => item.name === columnName);
        if (column) column.key = "PRI";
      });
      return;
    }

    if (/^(foreign|unique|key|index|constraint)\b/i.test(definition)) return;

    const column = parseColumnDefinition(definition);
    table.columns.push(column);
    if (column.key === "PRI") {
      table.indexes.push({ name: "PRIMARY", columns: [column.name], unique: true });
    }
  });

  if (table.columns.length === 0) throw new SqlError("A table must contain at least one column");
  db.tables[tableName] = table;
  return makeMessage(statement, "Query OK, 0 rows affected");
}

function parseColumnDefinition(definition) {
  const tokens = definition.trim().split(/\s+/);
  const name = normalizeIdentifier(tokens.shift());
  if (!name) throw new SqlError("Column name is required");

  const upperTokens = tokens.map((token) => token.toUpperCase());
  let typeEnd = tokens.length;
  const constraintWords = ["PRIMARY", "NOT", "NULL", "DEFAULT", "AUTO_INCREMENT", "UNIQUE", "KEY", "COMMENT"];
  for (let index = 0; index < upperTokens.length; index += 1) {
    if (constraintWords.includes(upperTokens[index])) {
      typeEnd = index;
      break;
    }
  }

  const type = tokens.slice(0, typeEnd).join(" ") || "VARCHAR(255)";
  const rest = tokens.slice(typeEnd).join(" ");
  const primary = /\bprimary\s+key\b/i.test(rest);
  const notNull = /\bnot\s+null\b/i.test(rest);
  const autoIncrement = /\bauto_increment\b/i.test(rest);
  const defaultMatch = rest.match(/\bdefault\s+(.+?)(?=\s+(primary|not|null|auto_increment|unique|key|comment)\b|$)/i);

  return createColumn(name, type.toUpperCase(), {
    nullable: !notNull && !primary,
    key: primary ? "PRI" : "",
    default: defaultMatch ? parseLiteral(defaultMatch[1]) : null,
    extra: autoIncrement ? "auto_increment" : ""
  });
}

function executeDropTable(statement, compact) {
  const match = compact.match(/^drop\s+table(?:\s+if\s+exists)?\s+(.+)$/i);
  const tableNames = splitTopLevel(match?.[1] || "").map(normalizeIdentifier);
  const db = getCurrentDatabase();
  const ifExists = /^drop\s+table\s+if\s+exists/i.test(compact);
  let dropped = 0;

  tableNames.forEach((tableName) => {
    if (!db.tables[tableName]) {
      if (!ifExists) throw new SqlError(`Unknown table '${tableName}'`);
      return;
    }
    delete db.tables[tableName];
    dropped += 1;
  });

  return makeMessage(statement, `Query OK, ${dropped} table${dropped === 1 ? "" : "s"} dropped`);
}

function executeTruncateTable(statement, compact) {
  const match = compact.match(/^truncate\s+table\s+(.+)$/i);
  const table = getTable(match?.[1]);
  table.rows = [];
  table.autoIncrement = 1;
  return makeMessage(statement, "Query OK, table truncated");
}

function executeRenameTable(statement, compact) {
  const match = compact.match(/^rename\s+table\s+([`"\w]+)\s+to\s+([`"\w]+)$/i);
  if (!match) throw new SqlError("RENAME TABLE syntax error");
  const db = getCurrentDatabase();
  const oldName = normalizeIdentifier(match[1]);
  const newName = normalizeIdentifier(match[2]);
  if (!db.tables[oldName]) throw new SqlError(`Unknown table '${oldName}'`);
  if (db.tables[newName]) throw new SqlError(`Table '${newName}' already exists`);
  db.tables[newName] = db.tables[oldName];
  db.tables[newName].name = newName;
  delete db.tables[oldName];
  return makeMessage(statement, "Query OK, table renamed");
}

function executeAlterTable(statement, compact) {
  const match = compact.match(/^alter\s+table\s+([`"\w]+)\s+(.+)$/i);
  if (!match) throw new SqlError("ALTER TABLE syntax error");
  const table = getTable(match[1]);
  const action = match[2].trim();

  const addMatch = action.match(/^add\s+(?:column\s+)?(.+)$/i);
  if (addMatch) {
    const column = parseColumnDefinition(addMatch[1]);
    if (table.columns.some((item) => item.name === column.name)) throw new SqlError(`Duplicate column name '${column.name}'`);
    table.columns.push(column);
    table.rows.forEach((row) => {
      row[column.name] = materializeDefault(column);
    });
    return makeMessage(statement, "Query OK, column added");
  }

  const dropMatch = action.match(/^drop\s+(?:column\s+)?([`"\w]+)$/i);
  if (dropMatch) {
    const columnName = normalizeIdentifier(dropMatch[1]);
    if (!table.columns.some((column) => column.name === columnName)) throw new SqlError(`Unknown column '${columnName}'`);
    table.columns = table.columns.filter((column) => column.name !== columnName);
    table.indexes.forEach((index) => {
      index.columns = index.columns.filter((column) => column !== columnName);
    });
    table.rows.forEach((row) => {
      delete row[columnName];
    });
    return makeMessage(statement, "Query OK, column dropped");
  }

  const renameMatch = action.match(/^rename\s+column\s+([`"\w]+)\s+to\s+([`"\w]+)$/i);
  if (renameMatch) {
    const oldName = normalizeIdentifier(renameMatch[1]);
    const newName = normalizeIdentifier(renameMatch[2]);
    const column = table.columns.find((item) => item.name === oldName);
    if (!column) throw new SqlError(`Unknown column '${oldName}'`);
    column.name = newName;
    table.rows.forEach((row) => {
      row[newName] = row[oldName];
      delete row[oldName];
    });
    table.indexes.forEach((index) => {
      index.columns = index.columns.map((columnName) => columnName === oldName ? newName : columnName);
    });
    return makeMessage(statement, "Query OK, column renamed");
  }

  const modifyMatch = action.match(/^modify\s+(?:column\s+)?(.+)$/i);
  if (modifyMatch) {
    const column = parseColumnDefinition(modifyMatch[1]);
    const index = table.columns.findIndex((item) => item.name === column.name);
    if (index === -1) throw new SqlError(`Unknown column '${column.name}'`);
    table.columns[index] = { ...table.columns[index], ...column };
    return makeMessage(statement, "Query OK, column modified");
  }

  throw new SqlError(`Unsupported ALTER TABLE action: ${action}`);
}

function executeCreateIndex(statement, compact) {
  const match = compact.match(/^create\s+(unique\s+)?index\s+([`"\w]+)\s+on\s+([`"\w]+)\s*\(([^)]+)\)$/i);
  if (!match) throw new SqlError("CREATE INDEX syntax error");
  const table = getTable(match[3]);
  const indexName = normalizeIdentifier(match[2]);
  if (table.indexes.some((index) => index.name === indexName)) throw new SqlError(`Duplicate key name '${indexName}'`);
  const columns = splitTopLevel(match[4]).map(normalizeIdentifier);
  table.indexes.push({ name: indexName, columns, unique: Boolean(match[1]) });
  columns.forEach((columnName) => {
    const column = table.columns.find((item) => item.name === columnName);
    if (column && column.key !== "PRI") column.key = "MUL";
  });
  return makeMessage(statement, "Query OK, index created");
}

function executeDropIndex(statement, compact) {
  const match = compact.match(/^drop\s+index\s+([`"\w]+)\s+on\s+([`"\w]+)$/i);
  if (!match) throw new SqlError("DROP INDEX syntax error");
  const table = getTable(match[2]);
  const indexName = normalizeIdentifier(match[1]);
  const before = table.indexes.length;
  table.indexes = table.indexes.filter((index) => index.name !== indexName);
  if (table.indexes.length === before) throw new SqlError(`Can't DROP '${indexName}'; check that column/key exists`);
  return makeMessage(statement, "Query OK, index dropped");
}

function executeInsert(statement, sql) {
  const match = sql.match(/^insert\s+into\s+([`"\w]+)(?:\s*\(([^)]+)\))?\s+values\s*(.+)$/i);
  if (!match) throw new SqlError("INSERT syntax error");
  const table = getTable(match[1]);
  const columns = match[2] ? splitTopLevel(match[2]).map(normalizeIdentifier) : table.columns.map((column) => column.name);
  const valueGroups = parseValueGroups(match[3]);

  valueGroups.forEach((group) => {
    if (group.length !== columns.length) throw new SqlError("Column count doesn't match value count");
    const row = {};
    table.columns.forEach((column) => {
      row[column.name] = column.extra === "auto_increment" ? table.autoIncrement++ : materializeDefault(column);
    });
    columns.forEach((columnName, index) => {
      if (!table.columns.some((column) => column.name === columnName)) throw new SqlError(`Unknown column '${columnName}'`);
      row[columnName] = parseLiteral(group[index]);
    });
    validateRow(table, row);
    table.rows.push(row);
  });

  return makeMessage(statement, `Query OK, ${valueGroups.length} row${valueGroups.length === 1 ? "" : "s"} affected`, { affectedRows: valueGroups.length });
}

function parseValueGroups(valuesText) {
  const groups = [];
  let input = valuesText.trim();
  while (input) {
    if (!input.startsWith("(")) throw new SqlError("VALUES list syntax error");
    let depth = 0;
    let quote = null;
    let end = -1;
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if ((char === "'" || char === '"' || char === "`") && input[index - 1] !== "\\") {
        if (quote === char) quote = null;
        else if (!quote) quote = char;
      }
      if (!quote) {
        if (char === "(") depth += 1;
        if (char === ")") depth -= 1;
        if (depth === 0) {
          end = index;
          break;
        }
      }
    }
    if (end === -1) throw new SqlError("Unclosed VALUES group");
    groups.push(splitTopLevel(input.slice(1, end)));
    input = input.slice(end + 1).trim();
    if (input.startsWith(",")) input = input.slice(1).trim();
    else if (input) throw new SqlError("VALUES list syntax error");
  }
  return groups;
}

function materializeDefault(column) {
  if (column.default === "CURRENT_TIMESTAMP") return formatDateTime(new Date());
  return column.default;
}

function validateRow(table, row) {
  table.columns.forEach((column) => {
    if (!column.nullable && (row[column.name] === null || row[column.name] === undefined)) {
      throw new SqlError(`Column '${column.name}' cannot be null`);
    }
  });
}

function executeSelect(statement, sql) {
  const scalarResult = executeScalarSelect(statement, sql);
  if (scalarResult) return scalarResult;

  const match = sql.match(/^select\s+([\s\S]+?)\s+from\s+([`"\w]+)(?:\s+where\s+([\s\S]+?))?(?:\s+order\s+by\s+([`"\w]+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i);
  if (!match) throw new SqlError("SELECT syntax error. The simulator supports SELECT columns FROM table [WHERE ...] [ORDER BY col] [LIMIT n]");

  const selected = match[1].trim();
  const table = getTable(match[2]);
  const where = match[3]?.trim();
  const orderBy = match[4] ? normalizeIdentifier(match[4]) : null;
  const orderDirection = (match[5] || "asc").toLowerCase();
  const limit = match[6] ? Number(match[6]) : null;
  let rows = table.rows.filter((row) => matchesWhere(row, where));

  if (orderBy) {
    rows = rows.slice().sort((a, b) => compareValues(a[orderBy], b[orderBy]) * (orderDirection === "desc" ? -1 : 1));
  }

  if (limit !== null) rows = rows.slice(0, limit);

  if (/^count\s*\(\s*\*\s*\)$/i.test(selected)) {
    return makeTable(statement, ["count(*)"], [{ "count(*)": rows.length }]);
  }

  let columns;
  if (selected === "*") {
    columns = table.columns.map((column) => column.name);
  } else {
    columns = splitTopLevel(selected).map((item) => {
      const asMatch = item.match(/^([`"\w]+)(?:\s+as\s+[`"]?([\w]+)[`"]?)?$/i);
      if (!asMatch) throw new SqlError(`Unsupported SELECT expression '${item}'`);
      const source = normalizeIdentifier(asMatch[1]);
      if (!table.columns.some((column) => column.name === source)) throw new SqlError(`Unknown column '${source}'`);
      return { source, alias: asMatch[2] || source };
    });
  }

  const resultRows = columns.map ? rows.map((row) => {
    if (typeof columns[0] === "string") {
      return Object.fromEntries(columns.map((column) => [column, row[column]]));
    }
    return Object.fromEntries(columns.map((column) => [column.alias, row[column.source]]));
  }) : [];
  const resultColumns = typeof columns[0] === "string" ? columns : columns.map((column) => column.alias);
  return makeTable(statement, resultColumns, resultRows);
}

function executeScalarSelect(statement, sql) {
  const compact = sql.replace(/\s+/g, " ").trim();
  const functions = [
    {
      regex: /^select\s+version\(\)$/i,
      columns: ["VERSION()"],
      row: { "VERSION()": "8.0.36-simulator" }
    },
    {
      regex: /^select\s+database\(\)$/i,
      columns: ["DATABASE()"],
      row: { "DATABASE()": state.currentDatabase || null }
    },
    {
      regex: /^select\s+now\(\)$/i,
      columns: ["NOW()"],
      row: { "NOW()": formatDateTime(new Date()) }
    },
    {
      regex: /^select\s+user\(\)$/i,
      columns: ["USER()"],
      row: { "USER()": "simulator@localhost" }
    }
  ];
  const found = functions.find((item) => item.regex.test(compact));
  if (found) return makeTable(statement, found.columns, [found.row]);

  const literalMatch = compact.match(/^select\s+(.+)$/i);
  if (!/\sfrom\s/i.test(compact) && literalMatch) {
    const expressions = splitTopLevel(literalMatch[1]);
    const row = {};
    const columns = [];
    expressions.forEach((expression, index) => {
      const aliasMatch = expression.match(/^(.+?)\s+as\s+[`"]?([\w]+)[`"]?$/i);
      const valueText = aliasMatch ? aliasMatch[1] : expression;
      const column = aliasMatch ? aliasMatch[2] : `expr_${index + 1}`;
      row[column] = parseLiteral(valueText);
      columns.push(column);
    });
    return makeTable(statement, columns, [row]);
  }

  return null;
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return a > b ? 1 : -1;
}

function matchesWhere(row, where) {
  if (!where) return true;
  const clauses = where.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
  return clauses.every((clause) => evaluateClause(row, clause));
}

function evaluateClause(row, clause) {
  const isNullMatch = clause.match(/^([`"\w]+)\s+is\s+(not\s+)?null$/i);
  if (isNullMatch) {
    const value = row[normalizeIdentifier(isNullMatch[1])];
    return isNullMatch[2] ? value !== null && value !== undefined : value === null || value === undefined;
  }

  const inMatch = clause.match(/^([`"\w]+)\s+in\s*\((.+)\)$/i);
  if (inMatch) {
    const value = row[normalizeIdentifier(inMatch[1])];
    const values = splitTopLevel(inMatch[2]).map(parseLiteral);
    return values.includes(value);
  }

  const likeMatch = clause.match(/^([`"\w]+)\s+like\s+(.+)$/i);
  if (likeMatch) {
    const value = String(row[normalizeIdentifier(likeMatch[1])] ?? "");
    const pattern = String(parseLiteral(likeMatch[2])).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
    return new RegExp(`^${pattern}$`, "i").test(value);
  }

  const match = clause.match(/^([`"\w]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/i);
  if (!match) throw new SqlError(`Unsupported WHERE clause '${clause}'`);
  const left = row[normalizeIdentifier(match[1])];
  const operator = match[2];
  const right = parseLiteral(match[3]);

  switch (operator) {
    case "=":
      return left === right;
    case "!=":
    case "<>":
      return left !== right;
    case ">":
      return left > right;
    case "<":
      return left < right;
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    default:
      return false;
  }
}

function executeUpdate(statement, sql) {
  const match = sql.match(/^update\s+([`"\w]+)\s+set\s+([\s\S]+?)(?:\s+where\s+([\s\S]+))?$/i);
  if (!match) throw new SqlError("UPDATE syntax error");
  const table = getTable(match[1]);
  const assignments = splitTopLevel(match[2]).map((part) => {
    const item = part.match(/^([`"\w]+)\s*=\s*(.+)$/);
    if (!item) throw new SqlError(`Invalid assignment '${part}'`);
    const column = normalizeIdentifier(item[1]);
    if (!table.columns.some((definition) => definition.name === column)) throw new SqlError(`Unknown column '${column}'`);
    return { column, value: parseLiteral(item[2]) };
  });

  let affected = 0;
  table.rows.forEach((row) => {
    if (!matchesWhere(row, match[3])) return;
    assignments.forEach(({ column, value }) => {
      row[column] = value;
    });
    validateRow(table, row);
    affected += 1;
  });

  return makeMessage(statement, `Query OK, ${affected} row${affected === 1 ? "" : "s"} affected`, { affectedRows: affected });
}

function executeDelete(statement, sql) {
  const match = sql.match(/^delete\s+from\s+([`"\w]+)(?:\s+where\s+([\s\S]+))?$/i);
  if (!match) throw new SqlError("DELETE syntax error");
  const table = getTable(match[1]);
  const before = table.rows.length;
  table.rows = table.rows.filter((row) => !matchesWhere(row, match[2]));
  const affected = before - table.rows.length;
  return makeMessage(statement, `Query OK, ${affected} row${affected === 1 ? "" : "s"} affected`, { affectedRows: affected });
}

function executeBegin(statement) {
  if (state.transactionSnapshot) throw new SqlError("Transaction already active");
  state.transactionSnapshot = clone({
    currentDatabase: state.currentDatabase,
    databases: state.databases,
    variables: state.variables
  });
  return makeMessage(statement, "Query OK, transaction started");
}

function executeCommit(statement) {
  if (!state.transactionSnapshot) return makeMessage(statement, "Query OK, no active transaction");
  state.transactionSnapshot = null;
  return makeMessage(statement, "Query OK, transaction committed");
}

function executeRollback(statement) {
  if (!state.transactionSnapshot) return makeMessage(statement, "Query OK, no active transaction");
  state.currentDatabase = state.transactionSnapshot.currentDatabase;
  state.databases = state.transactionSnapshot.databases;
  state.variables = state.transactionSnapshot.variables;
  state.transactionSnapshot = null;
  return makeMessage(statement, "Query OK, transaction rolled back");
}

function executeSet(statement, compact) {
  const match = compact.match(/^set\s+@?([A-Za-z_][\w]*)\s*=\s*(.+)$/i);
  if (!match) throw new SqlError("SET syntax error");
  const name = match[1];
  state.variables[name] = String(parseLiteral(match[2]));
  return makeMessage(statement, "Query OK, variable changed");
}

function createTableSql(table) {
  const columnLines = table.columns.map((column) => {
    const nullable = column.nullable ? "" : " NOT NULL";
    const defaultValue = column.default === null || column.default === undefined
      ? ""
      : ` DEFAULT ${typeof column.default === "number" ? column.default : `'${column.default}'`}`;
    const extra = column.extra ? ` ${column.extra.toUpperCase()}` : "";
    const primary = column.key === "PRI" && !table.indexes.some((index) => index.name === "PRIMARY" && index.columns.length > 1) ? " PRIMARY KEY" : "";
    return `  \`${column.name}\` ${column.type}${nullable}${defaultValue}${extra}${primary}`;
  });
  const primary = table.indexes.find((index) => index.name === "PRIMARY" && index.columns.length > 1);
  if (primary) columnLines.push(`  PRIMARY KEY (${primary.columns.map((column) => `\`${column}\``).join(", ")})`);
  return `CREATE TABLE \`${table.name}\` (\n${columnLines.join(",\n")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
}

function getSchemaSummary() {
  return {
    currentDatabase: state.currentDatabase,
    transactionActive: Boolean(state.transactionSnapshot),
    databases: Object.values(state.databases).map((database) => ({
      name: database.name,
      tables: Object.values(database.tables).map((table) => ({
        name: table.name,
        rowCount: table.rows.length,
        columns: table.columns,
        indexes: table.indexes
      }))
    }))
  };
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/version") {
    jsonResponse(response, 200, decorateVersionForRequest(await getLatestVersionInfo()));
    return;
  }

  if (request.method === "GET" && pathname === "/api/update-history") {
    try {
      const params = new URL(request.url, `http://${request.headers.host}`).searchParams;
      jsonResponse(response, 200, await getUpdateHistory(params.get("page"), params.get("pageSize")));
    } catch (error) {
      jsonResponse(response, 502, {
        ok: false,
        message: "暂时无法获取更新历史",
        detail: error.message
      });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/update") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      const auth = authorizeWebUpdate(request, payload);
      if (!auth.ok) {
        jsonResponse(response, auth.status, {
          ok: false,
          message: auth.message
        });
        return;
      }
      const version = await getLatestVersionInfo(true);
      if (!version.updateAvailable || !version.latestRevision) {
        jsonResponse(response, 200, {
          ok: true,
          message: version.message || "已是最新版本",
          version
        });
        return;
      }
      await runWebUpdate(version.latestRevision);
      versionCache = null;
      jsonResponse(response, 200, {
        ok: true,
        message: WEB_UPDATE_RESTART ? "更新完成，服务正在重启" : "更新完成，刷新页面后生效",
        version: decorateVersionForRequest(await getLatestVersionInfo(true))
      });
      if (WEB_UPDATE_RESTART) {
        setTimeout(() => process.exit(0), 500);
      }
    } catch (error) {
      jsonResponse(response, 500, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/api/state") {
    state = createInitialState();
    jsonResponse(response, 200, stateResponse());
    return;
  }

  if (request.method === "POST" && pathname === "/api/state") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      loadRequestState(payload);
      jsonResponse(response, 200, stateResponse());
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/api/table") {
    try {
      state = createInitialState();
      const url = new URL(request.url, `http://${request.headers.host}`);
      const databaseName = url.searchParams.get("database") || state.currentDatabase;
      const tableName = url.searchParams.get("table");
      if (!tableName) throw new SqlError("Table name is required");
      const { database, table } = getTableFromDatabase(databaseName, tableName);
      jsonResponse(response, 200, {
        database: database.name,
        table: table.name,
        columns: clone(table.columns),
        rows: clone(table.rows),
        rowCount: table.rows.length
      });
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/table") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      loadRequestState(payload);
      const databaseName = payload.database || state.currentDatabase;
      const tableName = payload.table;
      if (!tableName) throw new SqlError("Table name is required");
      const { database, table } = getTableFromDatabase(databaseName, tableName);
      jsonResponse(response, 200, {
        database: database.name,
        table: table.name,
        columns: clone(table.columns),
        rows: clone(table.rows),
        rowCount: table.rows.length,
        clientState: createClientStatePayload()
      });
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/api/examples") {
    jsonResponse(response, 200, { examples });
    return;
  }

  if (request.method === "POST" && pathname === "/api/share/sql") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      if (!payload.acceptedTerms) {
        jsonResponse(response, 400, {
          ok: false,
          message: "请先确认免责声明和用户协议"
        });
        return;
      }
      const sql = String(payload.sql || "");
      const analysis = analyzeSharedSql(sql);
      if (!analysis.ok) {
        writeShareAudit("share.reject", request, {
          reason: analysis.errors.join("; "),
          byteLength: analysis.byteLength
        });
        jsonResponse(response, 400, {
          ok: false,
          message: "SQL 内容未通过安全检查",
          analysis,
          disclaimer: SHARE_DISCLAIMER,
          terms: SHARE_TERMS
        });
        return;
      }

      cleanupExpiredShares();
      const token = crypto.randomBytes(24).toString("base64url");
      const now = Date.now();
      const ip = getClientIp(request);
      const item = {
        token,
        sql,
        createdAt: now,
        expiresAt: now + SHARE_TTL_MS,
        creatorIp: ip,
        creatorMaskedIp: maskIpAddress(ip),
        warnings: analysis.warnings
      };
      sharedSqlStore.set(token, item);
      writeShareAudit("share.create", request, {
        token,
        maskedIp: item.creatorMaskedIp,
        byteLength: analysis.byteLength,
        expiresAt: new Date(item.expiresAt).toISOString(),
        warnings: analysis.warnings
      });
      jsonResponse(response, 200, {
        ok: true,
        token,
        url: `${getRequestOrigin(request)}/share/${token}`,
        expiresAt: new Date(item.expiresAt).toISOString(),
        ttlSeconds: Math.floor(SHARE_TTL_MS / 1000),
        sharedByMaskedIp: item.creatorMaskedIp,
        analysis,
        disclaimer: SHARE_DISCLAIMER,
        terms: SHARE_TERMS
      });
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  const shareMatch = pathname.match(/^\/api\/share\/sql\/([A-Za-z0-9_-]{16,})$/);
  if (request.method === "GET" && shareMatch) {
    cleanupExpiredShares();
    const token = shareMatch[1];
    const item = sharedSqlStore.get(token);
    if (!item) {
      writeShareAudit("share.miss", request, { token });
      jsonResponse(response, 404, {
        ok: false,
        message: "分享链接不存在或已过期"
      });
      return;
    }
    writeShareAudit("share.open", request, {
      token,
      creatorIp: item.creatorIp,
      creatorMaskedIp: item.creatorMaskedIp
    });
    jsonResponse(response, 200, {
      ok: true,
      token,
      sql: item.sql,
      createdAt: new Date(item.createdAt).toISOString(),
      expiresAt: new Date(item.expiresAt).toISOString(),
      sharedByMaskedIp: item.creatorMaskedIp,
      warnings: item.warnings,
      disclaimer: SHARE_DISCLAIMER,
      terms: SHARE_TERMS
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/share/js") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      if (!payload.acceptedTerms) {
        jsonResponse(response, 400, {
          ok: false,
          message: "请先确认免责声明和用户协议"
        });
        return;
      }

      const code = String(payload.code || "");
      const interpreter = payload.interpreter === "nodejs" ? "nodejs" : "html-js";
      const analysis = analyzeSharedJs(code, interpreter);
      if (!analysis.ok) {
        writeShareAudit("share-js.reject", request, {
          reason: analysis.errors.join("; "),
          byteLength: analysis.byteLength
        });
        jsonResponse(response, 400, {
          ok: false,
          message: "JavaScript 内容未通过安全检查",
          analysis,
          disclaimer: JS_SHARE_DISCLAIMER,
          terms: JS_SHARE_TERMS
        });
        return;
      }

      cleanupExpiredShares();
      const token = crypto.randomBytes(24).toString("base64url");
      const now = Date.now();
      const ip = getClientIp(request);
      const item = {
        token,
        code,
        interpreter,
        createdAt: now,
        expiresAt: now + SHARE_TTL_MS,
        creatorIp: ip,
        creatorMaskedIp: maskIpAddress(ip),
        warnings: analysis.warnings
      };
      sharedJsStore.set(token, item);
      writeShareAudit("share-js.create", request, {
        token,
        maskedIp: item.creatorMaskedIp,
        byteLength: analysis.byteLength,
        expiresAt: new Date(item.expiresAt).toISOString(),
        warnings: analysis.warnings
      });
      jsonResponse(response, 200, {
        ok: true,
        token,
        url: `${getRequestOrigin(request)}/js-share/${token}`,
        expiresAt: new Date(item.expiresAt).toISOString(),
        ttlSeconds: Math.floor(SHARE_TTL_MS / 1000),
        sharedByMaskedIp: item.creatorMaskedIp,
        analysis,
        disclaimer: JS_SHARE_DISCLAIMER,
        terms: JS_SHARE_TERMS
      });
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  const jsShareMatch = pathname.match(/^\/api\/share\/js\/([A-Za-z0-9_-]{16,})$/);
  if (request.method === "GET" && jsShareMatch) {
    cleanupExpiredShares();
    const token = jsShareMatch[1];
    const item = sharedJsStore.get(token);
    if (!item) {
      writeShareAudit("share-js.miss", request, { token });
      jsonResponse(response, 404, {
        ok: false,
        message: "分享链接不存在或已过期"
      });
      return;
    }
    writeShareAudit("share-js.open", request, {
      token,
      creatorIp: item.creatorIp,
      creatorMaskedIp: item.creatorMaskedIp
    });
    jsonResponse(response, 200, {
      ok: true,
      token,
      code: item.code,
      interpreter: item.interpreter,
      createdAt: new Date(item.createdAt).toISOString(),
      expiresAt: new Date(item.expiresAt).toISOString(),
      sharedByMaskedIp: item.creatorMaskedIp,
      warnings: item.warnings,
      disclaimer: JS_SHARE_DISCLAIMER,
      terms: JS_SHARE_TERMS
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/sqlm/export") {
    state = createInitialState();
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
    downloadResponse(response, `mysql-simulator-${stamp}.sqlm`, encryptSqlm(createSqlmPayload()));
    return;
  }

  if (request.method === "POST" && pathname === "/api/sqlm/export") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      loadRequestState(payload);
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
      downloadResponse(response, `mysql-simulator-${stamp}.sqlm`, encryptSqlm(createSqlmPayload()));
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/sqlm/import") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      const decrypted = decryptSqlm(payload.content);
      state = validateImportedState(decrypted.state);
      jsonResponse(response, 200, stateResponse({
        ok: true,
        message: ".sqlm 文件已解密并导入",
        exportedAt: decrypted.exportedAt || null
      }));
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/sqlm/decrypt") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      const decrypted = decryptSqlm(payload.content);
      const importedState = validateImportedState(decrypted.state);
      jsonResponse(response, 200, {
        ok: true,
        exportedAt: decrypted.exportedAt || null,
        schema: {
          currentDatabase: importedState.currentDatabase,
          databases: Object.values(importedState.databases).map((database) => ({
            name: database.name,
            tableCount: Object.keys(database.tables || {}).length
          }))
        }
      });
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/query") {
    try {
      const payload = JSON.parse(await readBody(request) || "{}");
      loadRequestState(payload);
      const result = executeSql(String(payload.sql || ""));
      jsonResponse(response, 200, stateResponse(result));
    } catch (error) {
      jsonResponse(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/reset") {
    state = createInitialState();
    jsonResponse(response, 200, stateResponse({ ok: true }));
    return;
  }

  jsonResponse(response, 404, { ok: false, message: "API not found" });
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const { pathname } = new URL(request.url, `http://${request.headers.host}`);
      if (pathname.startsWith("/api/")) {
        await handleApi(request, response, pathname);
        return;
      }
      serveStatic(request, response);
    } catch (error) {
      if (!response.headersSent) {
        jsonResponse(response, 500, { ok: false, message: "服务器内部错误" });
      }
    }
  });
}

function listen(port) {
  const appServer = createServer();

  appServer.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      appServer.close(() => listen(port + 1));
      return;
    }
    throw error;
  });

  appServer.listen(port, HOST, () => {
    console.log(`SQL Database Simulator running at http://${HOST}:${port}`);
  });
}

listen(PORT);
