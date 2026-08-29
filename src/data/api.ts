/* ============================================================
   Atlas API — data model, seed, RBAC & mesin simulasi request
   ============================================================ */

export type Method = "GET" | "POST" | "PATCH" | "DELETE";
export type Role = "public" | "staff" | "manager" | "admin";

export interface RoleToken {
  id: string;
  label: string;
  name: string;
  role: Role;
  email: string;
  scope: string[];
  jwt: string;
  hue: string;
}

export interface EndpointDef {
  id: string;
  method: Method;
  path: string;
  group: string;
  summary: string;
  auth: boolean;
  permission: string | null;
  hasParam?: boolean;
  paramDefault?: string;
  bodyTemplate?: string;
}

export interface TraceStep {
  layer: "gateway" | "middleware" | "controller" | "service" | "repository";
  label: string;
  ms: number;
  ok: boolean;
}

export interface SimResult {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: Record<string, unknown> | null;
  trace: TraceStep[];
  latency: number;
  bytes: number;
}

/* ---------------- Token / identitas ---------------- */

export const TOKENS: RoleToken[] = [
  {
    id: "public",
    label: "Public",
    name: "Anonim",
    role: "public",
    email: "—",
    scope: [],
    jwt: "",
    hue: "var(--color-faint)",
  },
  {
    id: "staff",
    label: "Staff",
    name: "Rizky Pratama",
    role: "staff",
    email: "staff@atlas.dev",
    scope: ["orders:read", "orders:create", "products:read"],
    jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDMiLCJyb2xlIjoic3RhZmYifQ.kQ7vR2xP9dLm",
    hue: "var(--color-info)",
  },
  {
    id: "manager",
    label: "Manager",
    name: "Dewi Lestari",
    role: "manager",
    email: "manager@atlas.dev",
    scope: ["orders:read", "orders:create", "orders:update-status", "reports:read"],
    jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDIiLCJyb2xlIjoibWFuYWdlciJ9.Zt41WxN6bHca",
    hue: "var(--color-warn)",
  },
  {
    id: "admin",
    label: "Admin",
    name: "Andi Nugroho",
    role: "admin",
    email: "admin@atlas.dev",
    scope: ["*"],
    jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDEiLCJyb2xlIjoiYWRtaW4ifQ.Mp88Dqe3YsVw",
    hue: "var(--color-bad)",
  },
];

export const ACCOUNTS: Record<string, { password: string; token: RoleToken }> = {
  "staff@atlas.dev": { password: "staff123", token: TOKENS[1] },
  "manager@atlas.dev": { password: "manager123", token: TOKENS[2] },
  "admin@atlas.dev": { password: "admin123", token: TOKENS[3] },
};

/* ---------------- Seed database (in-memory) ---------------- */

export interface SeedOrder {
  id: string;
  customerId: string;
  customer: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  items: { sku: string; name: string; qty: number; price: number }[];
  total: number;
  createdAt: string;
}

export const ORDERS: SeedOrder[] = [
  {
    id: "ord_1042",
    customerId: "cus_01",
    customer: "PT Sinar Jaya Abadi",
    status: "pending",
    items: [
      { sku: "KEY-MX87", name: "Mechanical Keyboard MX87", qty: 4, price: 850_000 },
      { sku: "MON-27Q", name: 'Monitor 27" 2K IPS', qty: 2, price: 2_350_000 },
    ],
    total: 8_100_000,
    createdAt: "2026-02-10T09:14:00Z",
  },
  {
    id: "ord_1043",
    customerId: "cus_02",
    customer: "CV Berkah Mandiri",
    status: "confirmed",
    items: [{ sku: "LAP-T14", name: "Laptop ThinkPad T14", qty: 3, price: 18_500_000 }],
    total: 55_500_000,
    createdAt: "2026-02-11T13:41:00Z",
  },
  {
    id: "ord_1044",
    customerId: "cus_03",
    customer: "Toko Komputer 88",
    status: "shipped",
    items: [{ sku: "SSD-1TB", name: "SSD NVMe 1TB", qty: 12, price: 1_150_000 }],
    total: 13_800_000,
    createdAt: "2026-02-12T08:02:00Z",
  },
  {
    id: "ord_1045",
    customerId: "cus_01",
    customer: "PT Sinar Jaya Abadi",
    status: "delivered",
    items: [{ sku: "MOU-ERG", name: "Mouse Ergonomis Vertikal", qty: 10, price: 420_000 }],
    total: 4_200_000,
    createdAt: "2026-02-05T10:22:00Z",
  },
  {
    id: "ord_1046",
    customerId: "cus_04",
    customer: "Yayasan Cendekia",
    status: "pending",
    items: [{ sku: "PRJ-4K", name: "Proyektor 4K HDR", qty: 1, price: 9_750_000 }],
    total: 9_750_000,
    createdAt: "2026-02-13T15:30:00Z",
  },
  {
    id: "ord_1047",
    customerId: "cus_02",
    customer: "CV Berkah Mandiri",
    status: "cancelled",
    items: [{ sku: "WEB-4K", name: "Webcam 4K Autofocus", qty: 6, price: 980_000 }],
    total: 5_880_000,
    createdAt: "2026-02-03T11:08:00Z",
  },
];

export const USERS = [
  { id: "usr_01", name: "Andi Nugroho", email: "admin@atlas.dev", role: "admin", active: true },
  { id: "usr_02", name: "Dewi Lestari", email: "manager@atlas.dev", role: "manager", active: true },
  { id: "usr_03", name: "Rizky Pratama", email: "staff@atlas.dev", role: "staff", active: true },
  { id: "usr_04", name: "Sari Wulandari", email: "sari@atlas.dev", role: "staff", active: false },
];

export const CUSTOMERS = [
  { id: "cus_01", name: "PT Sinar Jaya Abadi" },
  { id: "cus_02", name: "CV Berkah Mandiri" },
  { id: "cus_03", name: "Toko Komputer 88" },
  { id: "cus_04", name: "Yayasan Cendekia" },
];

export const PRODUCTS = [
  { id: "prd_01", sku: "KEY-MX87", name: "Mechanical Keyboard MX87", price: 850_000, stock: 143 },
  { id: "prd_02", sku: "MON-27Q", name: 'Monitor 27" 2K IPS', price: 2_350_000, stock: 58 },
  { id: "prd_03", sku: "SSD-1TB", name: "SSD NVMe 1TB", price: 1_150_000, stock: 312 },
  { id: "prd_04", sku: "LAP-T14", name: "Laptop ThinkPad T14", price: 18_500_000, stock: 21 },
];

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/* ---------------- Definisi endpoint ---------------- */

export const ENDPOINTS: EndpointDef[] = [
  {
    id: "login",
    method: "POST",
    path: "/api/v1/auth/login",
    group: "Auth",
    summary: "Tukar kredensial dengan access token JWT",
    auth: false,
    permission: null,
    bodyTemplate: `{
  "email": "manager@atlas.dev",
  "password": "manager123"
}`,
  },
  {
    id: "me",
    method: "GET",
    path: "/api/v1/auth/me",
    group: "Auth",
    summary: "Profil user dari token yang aktif",
    auth: true,
    permission: null,
  },
  {
    id: "list-orders",
    method: "GET",
    path: "/api/v1/orders",
    group: "Orders",
    summary: "Daftar pesanan (paginasi, include items)",
    auth: true,
    permission: "orders:read",
  },
  {
    id: "get-order",
    method: "GET",
    path: "/api/v1/orders/:id",
    group: "Orders",
    summary: "Detail satu pesanan beserta line items",
    auth: true,
    permission: "orders:read",
    hasParam: true,
    paramDefault: "ord_1042",
  },
  {
    id: "create-order",
    method: "POST",
    path: "/api/v1/orders",
    group: "Orders",
    summary: "Buat pesanan — divalidasi Zod di controller",
    auth: true,
    permission: "orders:create",
    bodyTemplate: `{
  "customerId": "cus_01",
  "items": [
    { "sku": "KEY-MX87", "qty": 2 },
    { "sku": "SSD-1TB", "qty": 1 }
  ]
}`,
  },
  {
    id: "update-status",
    method: "PATCH",
    path: "/api/v1/orders/:id/status",
    group: "Orders",
    summary: "Transisi status pesanan (state machine)",
    auth: true,
    permission: "orders:update-status",
    hasParam: true,
    paramDefault: "ord_1042",
    bodyTemplate: `{
  "status": "confirmed"
}`,
  },
  {
    id: "list-users",
    method: "GET",
    path: "/api/v1/users",
    group: "Users",
    summary: "Daftar user — hanya admin",
    auth: true,
    permission: "users:manage",
  },
  {
    id: "delete-user",
    method: "DELETE",
    path: "/api/v1/users/:id",
    group: "Users",
    summary: "Hapus user (soft delete) — hanya admin",
    auth: true,
    permission: "users:manage",
    hasParam: true,
    paramDefault: "usr_04",
  },
  {
    id: "revenue",
    method: "GET",
    path: "/api/v1/reports/revenue",
    group: "Reports",
    summary: "Agregasi pendapatan — manager & admin",
    auth: true,
    permission: "reports:read",
  },
  {
    id: "products",
    method: "GET",
    path: "/api/v1/products",
    group: "Catalog",
    summary: "Katalog produk — publik, tanpa token",
    auth: false,
    permission: null,
  },
];

/* ---------------- Util ---------------- */

const rid = () =>
  "req_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

const now = () => new Date().toISOString();

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function errorBody(code: string, message: string, details?: unknown) {
  const body: Record<string, unknown> = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      requestId: rid(),
      timestamp: now(),
    },
  };
  return body;
}

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

/* ---------------- Mesin simulasi ---------------- */

export function simulate(
  token: RoleToken,
  def: EndpointDef,
  param: string,
  bodyText: string
): SimResult {
  const trace: TraceStep[] = [];
  const step = (layer: TraceStep["layer"], label: string, ok = true): TraceStep => {
    const s = { layer, label, ok, ms: layer === "repository" ? rand(6, 18) : rand(1, 5) };
    trace.push(s);
    return s;
  };

  const finish = (
    status: number,
    body: Record<string, unknown> | null,
    extraHeaders: [string, string][] = []
  ): SimResult => {
    const latency = trace.reduce((a, s) => a + s.ms, 0) + rand(4, 11);
    const json = body ? JSON.stringify(body, null, 2) : "";
    const headers: [string, string][] = [
      ["content-type", body ? "application/json; charset=utf-8" : ""],
      ["x-request-id", rid()],
      ["x-ratelimit-limit", "100"],
      ["x-ratelimit-remaining", String(rand(61, 97))],
      ["x-response-time", `${latency}ms`],
      ...extraHeaders,
    ].filter(([, v]) => v !== "") as [string, string][];
    return { status, statusText: STATUS_TEXT[status], headers, body, trace, latency, bytes: json.length };
  };

  const fail = (
    status: number,
    code: string,
    message: string,
    failedLayer: TraceStep["layer"],
    failedLabel: string,
    details?: unknown,
    extraHeaders: [string, string][] = []
  ): SimResult => {
    trace.push({ layer: failedLayer, label: failedLabel, ok: false, ms: rand(1, 4) });
    return finish(status, errorBody(code, message, details), extraHeaders);
  };

  /* — 1. Gateway: rate limit — */
  step("gateway", "Edge gateway · cek rate limit (redis: 100 req/menit)");

  /* — 2. Middleware: auth & RBAC — */
  if (def.auth) {
    if (token.role === "public") {
      return fail(
        401,
        "TOKEN_MISSING",
        "Header Authorization tidak ditemukan. Sertakan 'Bearer <access_token>'.",
        "middleware",
        "auth.middleware · verifikasi JWT — header Authorization kosong",
        undefined,
        [["www-authenticate", "Bearer realm=atlas-api"]]
      );
    }
    step("middleware", `auth.middleware · JWT diverifikasi → sub=${token.jwt.slice(-28)}… role=${token.role}`);
    if (def.permission) {
      const allowed = token.scope.includes("*") || token.scope.includes(def.permission);
      if (!allowed) {
        return fail(
          403,
          "FORBIDDEN",
          `Role '${token.role}' tidak memiliki permission '${def.permission}'.`,
          "middleware",
          `rbac.guard · butuh '${def.permission}' — token hanya punya [${token.scope.join(", ")}]`,
          { requiredPermission: def.permission, currentRole: token.role }
        );
      }
      step("middleware", `rbac.guard · permission '${def.permission}' ✓ dimiliki role ${token.role}`);
    }
  }

  /* — 3. Controller: parse & validasi — */
  let parsed: Record<string, unknown> | null = null;
  if (def.bodyTemplate !== undefined) {
    try {
      parsed = JSON.parse(bodyText || "{}");
    } catch {
      return fail(
        400,
        "MALFORMED_JSON",
        "Body bukan JSON yang valid — parser gagal di karakter tak terduga.",
        "controller",
        "orders.controller · JSON.parse gagal sebelum validasi"
      );
    }
    step("controller", "controller · body diterima, melanjutkan ke validasi schema Zod");
  } else {
    step("controller", `controller · route ${def.method} ${def.path} cocok, parse params`);
  }

  /* — 4. Service + Repository: logika per endpoint — */
  switch (def.id) {
    case "login": {
      const email = String(parsed?.email ?? "");
      const password = String(parsed?.password ?? "");
      const details: { field: string; message: string }[] = [];
      if (!email) details.push({ field: "email", message: "email wajib diisi" });
      if (!password) details.push({ field: "password", message: "password wajib diisi" });
      if (details.length)
        return fail(422, "VALIDATION_ERROR", "Payload gagal validasi schema LoginRequest.", "controller", "zod · LoginRequestSchema.safeParse → 2 issue", details);
      const acc = ACCOUNTS[email];
      step("service", "auth.service · hash bcrypt.compare() terhadap passwordHash", true);
      if (!acc || acc.password !== password) {
        return fail(
          401,
          "INVALID_CREDENTIALS",
          "Email atau password salah.",
          "repository",
          "userRepository.findByEmail() · user tidak ditemukan / hash tidak cocok"
        );
      }
      step("repository", "prisma.user.findUnique({ where: { email } })");
      return finish(200, {
        success: true,
        data: {
          accessToken: acc.token.jwt,
          tokenType: "Bearer",
          expiresIn: 3600,
          user: { id: acc.token.jwt.includes("MDMi") ? "usr_03" : acc.token === TOKENS[3] ? "usr_01" : "usr_02", name: acc.token.name, email: acc.token.email, role: acc.token.role },
        },
      });
    }

    case "me": {
      step("service", "auth.service · ambil profil + permission dari claim & DB");
      step("repository", "prisma.user.findUnique({ include: { role: { include: { permissions: true } } } })");
      const u = USERS.find((x) => x.email === token.email) ?? USERS[0];
      return finish(200, {
        success: true,
        data: { id: u.id, name: u.name, email: u.email, role: u.role, permissions: token.scope, active: u.active },
      });
    }

    case "list-orders": {
      step("service", "orders.service · susun filter + pagination (page=1, limit=20)");
      step("repository", "prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } })");
      return finish(200, {
        success: true,
        meta: { page: 1, limit: 20, total: ORDERS.length },
        data: ORDERS.map(({ items, ...o }) => ({ ...o, itemCount: items.length, total: rupiah(o.total) })),
      });
    }

    case "get-order": {
      if (!param.trim())
        return fail(404, "ROUTE_NOT_FOUND", `Route '${def.method} /api/v1/orders/' tidak terdaftar.`, "controller", "express router · tidak ada route yang cocok");
      step("service", "orders.service · ambil detail + hitung ulang subtotal items");
      step("repository", `prisma.order.findUnique({ where: { id: '${param.trim()}' }, include: { items: true } })`);
      const o = ORDERS.find((x) => x.id === param.trim());
      if (!o)
        return fail(
          404,
          "ORDER_NOT_FOUND",
          `Pesanan '${param.trim()}' tidak ditemukan.`,
          "repository",
          `prisma.order.findUnique → null untuk id '${param.trim()}'`
        );
      return finish(200, { success: true, data: { ...o, total: rupiah(o.total) } });
    }

    case "create-order": {
      const details: { field: string; message: string }[] = [];
      const customerId = String(parsed?.customerId ?? "");
      const items = Array.isArray(parsed?.items) ? (parsed!.items as { sku?: string; qty?: number }[]) : null;
      if (!customerId) details.push({ field: "customerId", message: "customerId wajib diisi" });
      else if (!CUSTOMERS.some((c) => c.id === customerId))
        details.push({ field: "customerId", message: `customer '${customerId}' tidak ada di database` });
      if (!items) details.push({ field: "items", message: "items wajib berupa array" });
      else if (items.length === 0) details.push({ field: "items", message: "minimal 1 item" });
      else
        items.forEach((it, i) => {
          if (!it.sku || !PRODUCTS.some((p) => p.sku === it.sku))
            details.push({ field: `items.${i}.sku`, message: `SKU '${it.sku ?? ""}' tidak dikenal` });
          if (!it.qty || it.qty < 1)
            details.push({ field: `items.${i}.qty`, message: "qty harus integer ≥ 1" });
        });
      if (details.length)
        return fail(422, "VALIDATION_ERROR", "Payload gagal validasi schema CreateOrderRequest.", "controller", `zod · CreateOrderSchema.safeParse → ${details.length} issue`, details);
      const total = items!.reduce(
        (a, it) => a + (PRODUCTS.find((p) => p.sku === it.sku)?.price ?? 0) * (it.qty ?? 0),
        0
      );
      step("service", `orders.service · validasi bisnis: customer aktif, SKU valid, total=${rupiah(total)}`);
      step("repository", "prisma.$transaction([ order.create, item.createMany, product.decrementStock ])");
      return finish(
        201,
        {
          success: true,
          data: {
            id: "ord_1048",
            customerId,
            customer: CUSTOMERS.find((c) => c.id === customerId)?.name,
            status: "pending",
            items: items!.map((it) => ({ sku: it.sku, qty: it.qty, name: PRODUCTS.find((p) => p.sku === it.sku)?.name })),
            total: rupiah(total),
            createdAt: now(),
          },
        },
        [["location", "/api/v1/orders/ord_1048"]]
      );
    }

    case "update-status": {
      const status = String(parsed?.status ?? "");
      const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      if (!allowed.includes(status))
        return fail(422, "VALIDATION_ERROR", "Payload gagal validasi schema UpdateStatusRequest.", "controller", "zod · status bukan bagian dari enum OrderStatus", [
          { field: "status", message: `harus salah satu dari: ${allowed.join(", ")}` },
        ]);
      step("service", "orders.service · cek state machine transisi status");
      step("repository", `prisma.order.findUnique({ where: { id: '${param.trim()}' } })`);
      const o = ORDERS.find((x) => x.id === param.trim());
      if (!o)
        return fail(404, "ORDER_NOT_FOUND", `Pesanan '${param.trim()}' tidak ditemukan.`, "repository", `prisma.order.findUnique → null untuk id '${param.trim()}'`);
      if (!TRANSITIONS[o.status].includes(status))
        return fail(
          409,
          "STATE_CONFLICT",
          `Transisi '${o.status}' → '${status}' tidak diizinkan oleh state machine.`,
          "service",
          `orderStateMachine.assertTransition('${o.status}', '${status}') → menolak`,
          { currentStatus: o.status, requested: status, allowedNext: TRANSITIONS[o.status] }
        );
      return finish(200, {
        success: true,
        data: { ...o, status, total: rupiah(o.total), updatedAt: now() },
      });
    }

    case "list-users": {
      step("service", "users.service · strip kolom sensitif (passwordHash, refreshHash)");
      step("repository", "prisma.user.findMany({ select: { passwordHash: false } })");
      return finish(200, { success: true, meta: { total: USERS.length }, data: USERS });
    }

    case "delete-user": {
      step("service", "users.service · cek aturan: tidak boleh hapus diri sendiri");
      step("repository", `prisma.user.findUnique({ where: { id: '${param.trim()}' } })`);
      const u = USERS.find((x) => x.id === param.trim());
      if (!u)
        return fail(404, "USER_NOT_FOUND", `User '${param.trim()}' tidak ditemukan.`, "repository", `prisma.user.findUnique → null untuk id '${param.trim()}'`);
      if (u.id === "usr_01")
        return fail(409, "STATE_CONFLICT", "User tidak dapat menghapus akunnya sendiri.", "service", "users.service · target === req.user.id → menolak", {
          reason: "SELF_DELETE_FORBIDDEN",
        });
      step("repository", "prisma.user.update({ data: { deletedAt: new Date() } }) · soft delete");
      return finish(204, null);
    }

    case "revenue": {
      step("service", "reports.service · agregasi per status + average order value");
      step("repository", "prisma.order.groupBy({ by: ['status'], _sum: { total: true } })");
      const gross = ORDERS.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.total, 0);
      return finish(200, {
        success: true,
        data: {
          period: "2026-02",
          grossRevenue: rupiah(gross),
          orderCount: ORDERS.length,
          averageOrderValue: rupiah(Math.round(gross / 5)),
          byStatus: { pending: 2, confirmed: 1, shipped: 1, delivered: 1, cancelled: 1 },
        },
      });
    }

    case "products": {
      step("service", "products.service · cache hit (redis, TTL 60s) — tanpa hit DB");
      return finish(200, {
        success: true,
        meta: { total: PRODUCTS.length, cache: "HIT" },
        data: PRODUCTS.map((p) => ({ ...p, price: rupiah(p.price) })),
      });
    }
  }

  return finish(500, errorBody("INTERNAL_ERROR", "Terjadi kesalahan tak terduga di server."));
}

/* ---------------- Katalog error ---------------- */

export interface ErrorInfo {
  status: number;
  code: string;
  message: string;
  trigger: string;
  layer: string;
  sample: Record<string, unknown>;
}

const errSample = (code: string, message: string, details?: unknown) => ({
  success: false,
  error: {
    code,
    message,
    ...(details ? { details } : {}),
    requestId: "req_7d2f91ae",
    timestamp: "2026-02-14T08:12:44.190Z",
  },
});

export const ERROR_CATALOG: ErrorInfo[] = [
  {
    status: 400,
    code: "MALFORMED_JSON",
    message: "Body bukan JSON yang valid.",
    trigger: "Client mengirim body yang gagal di-parse JSON.parse.",
    layer: "Controller",
    sample: errSample("MALFORMED_JSON", "Body bukan JSON yang valid — parser gagal di karakter tak terduga."),
  },
  {
    status: 401,
    code: "TOKEN_MISSING",
    message: "Header Authorization tidak ditemukan.",
    trigger: "Endpoint privat diakses tanpa Bearer token.",
    layer: "Middleware auth",
    sample: errSample("TOKEN_MISSING", "Header Authorization tidak ditemukan. Sertakan 'Bearer <access_token>'."),
  },
  {
    status: 401,
    code: "INVALID_CREDENTIALS",
    message: "Email atau password salah.",
    trigger: "Kredensial login tidak cocok di database.",
    layer: "Service",
    sample: errSample("INVALID_CREDENTIALS", "Email atau password salah."),
  },
  {
    status: 403,
    code: "FORBIDDEN",
    message: "Role tidak memiliki permission yang dibutuhkan.",
    trigger: "Token valid, tapi scope RBAC tidak cukup.",
    layer: "Middleware rbac.guard",
    sample: errSample("FORBIDDEN", "Role 'staff' tidak memiliki permission 'orders:update-status'.", {
      requiredPermission: "orders:update-status",
      currentRole: "staff",
    }),
  },
  {
    status: 404,
    code: "ORDER_NOT_FOUND",
    message: "Resource dengan id tersebut tidak ada.",
    trigger: "Repository mengembalikan null untuk id yang diminta.",
    layer: "Service → dari Repository",
    sample: errSample("ORDER_NOT_FOUND", "Pesanan 'ord_9999' tidak ditemukan."),
  },
  {
    status: 409,
    code: "STATE_CONFLICT",
    message: "Transisi status ditolak state machine.",
    trigger: "Misal pesanan 'delivered' diminta kembali 'pending'.",
    layer: "Service",
    sample: errSample("STATE_CONFLICT", "Transisi 'delivered' → 'pending' tidak diizinkan oleh state machine.", {
      currentStatus: "delivered",
      requested: "pending",
      allowedNext: [],
    }),
  },
  {
    status: 422,
    code: "VALIDATION_ERROR",
    message: "Payload gagal validasi schema Zod.",
    trigger: "Field wajib kosong, tipe salah, atau referensi tidak valid.",
    layer: "Controller (Zod)",
    sample: errSample("VALIDATION_ERROR", "Payload gagal validasi schema CreateOrderRequest.", [
      { field: "items.0.qty", message: "qty harus integer ≥ 1" },
      { field: "customerId", message: "customerId wajib diisi" },
    ]),
  },
  {
    status: 429,
    code: "RATE_LIMITED",
    message: "Terlalu banyak request dalam window ini.",
    trigger: "Melebihi 100 request/menit per IP+user.",
    layer: "Gateway",
    sample: errSample("RATE_LIMITED", "Terlalu banyak request. Coba lagi dalam 23 detik."),
  },
  {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Kesalahan tak terduka — detail hanya ke log.",
    trigger: "Exception yang tidak tertangkap; stack trace tidak bocor ke client.",
    layer: "errorHandler (global)",
    sample: errSample("INTERNAL_ERROR", "Terjadi kesalahan tak terduga di server."),
  },
];

/* ---------------- RBAC matrix ---------------- */

export const PERMISSIONS = [
  { key: "products:read", label: "Melihat katalog produk" },
  { key: "orders:read", label: "Melihat daftar & detail pesanan" },
  { key: "orders:create", label: "Membuat pesanan baru" },
  { key: "orders:update-status", label: "Mengubah status pesanan" },
  { key: "reports:read", label: "Membaca laporan pendapatan" },
  { key: "users:manage", label: "Kelola user (CRUD + nonaktifkan)" },
] as const;

export const RBAC_MATRIX: Record<string, boolean[]> = {
  "products:read": [true, true, true, true],
  "orders:read": [false, true, true, true],
  "orders:create": [false, true, true, true],
  "orders:update-status": [false, false, true, true],
  "reports:read": [false, false, true, true],
  "users:manage": [false, false, false, true],
};

export const RBAC_ROLES = ["Public", "Staff", "Manager", "Admin"];
