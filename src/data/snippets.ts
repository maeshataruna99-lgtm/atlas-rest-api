/* ============================================================
   Atlas API — cuplikan kode, layer arsitektur, tree & stack
   ============================================================ */

export interface Snippet {
  id: string;
  tab: string;
  file: string;
  code: string;
}

export const SNIPPETS: Snippet[] = [
  {
    id: "prisma",
    tab: "schema.prisma",
    file: "prisma/schema.prisma",
    code: `// Atlas API — schema Prisma (PostgreSQL 16)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleName {
  STAFF
  MANAGER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String     @map("password_hash")
  name         String
  role         Role       @relation(fields: [roleId], references: [id])
  roleId       String     @map("role_id")
  orders       Order[]
  deletedAt    DateTime?  @map("deleted_at") // soft delete
  createdAt    DateTime   @default(now()) @map("created_at")

  @@map("users")
}

model Role {
  id          String       @id @default(cuid())
  name        RoleName     @unique
  permissions Permission[] @relation("RolePermissions")

  @@map("roles")
}

model Permission {
  id    String @id @default(cuid())
  key   String @unique // contoh: "orders:update-status"
  roles Role[] @relation("RolePermissions")

  @@map("permissions")
}

model Order {
  id         String      @id @default("ord_" + cuid())
  customer   Customer    @relation(fields: [customerId], references: [id])
  customerId String      @map("customer_id")
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(14, 2)
  items      OrderItem[]
  createdBy  User        @relation(fields: [createdById], references: [id])
  createdById String     @map("created_by_id")
  createdAt  DateTime    @default(now()) @map("created_at")

  @@index([status, createdAt]) // query daftar pesanan
  @@index([customerId])
  @@map("orders")
}

model OrderItem {
  id       String  @id @default(cuid())
  order    Order   @relation(fields: [orderId], references: [id])
  orderId  String  @map("order_id")
  product  Product @relation(fields: [productId], references: [id])
  productId String @map("product_id")
  qty      Int
  price    Decimal @db.Decimal(14, 2) // harga dibekukan saat order

  @@map("order_items")
}

model Product {
  id    String  @id @default(cuid())
  sku   String  @unique
  name  String
  price Decimal @db.Decimal(14, 2)
  stock Int     @default(0)

  @@map("products")
}`,
  },
  {
    id: "controller",
    tab: "controller.ts",
    file: "src/modules/orders/orders.controller.ts",
    code: `import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateOrderSchema, UpdateStatusSchema, OrderIdSchema } from "./orders.schema";
import { OrderService } from "./orders.service";
import { OrderRepository } from "./orders.repository";
import { prisma } from "../../lib/prisma";

// Composition root: rakit dependensi sekali di sini
const service = new OrderService(new OrderRepository(prisma));

export const orderRouter = Router();

// GET /api/v1/orders — staff, manager, admin
orderRouter.get(
  "/",
  authenticate,
  requirePermission("orders:read"),
  async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const result = await service.listOrders({ page, limit, status });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err); // semua error mengalir ke errorHandler global
    }
  }
);

// POST /api/v1/orders — validasi Zod sebelum menyentuh service
orderRouter.post(
  "/",
  authenticate,
  requirePermission("orders:create"),
  validate(CreateOrderSchema),
  async (req, res, next) => {
    try {
      const order = await service.createOrder(req.body, req.user.id);
      res.status(201).location(\`/api/v1/orders/\${order.id}\`)
         .json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/orders/:id/status — state machine dijaga di service
orderRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("orders:update-status"),
  validate(OrderIdSchema, "params"),
  validate(UpdateStatusSchema),
  async (req, res, next) => {
    try {
      const order = await service.transitionStatus(req.params.id, req.body.status);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);`,
  },
  {
    id: "service",
    tab: "service.ts",
    file: "src/modules/orders/orders.service.ts",
    code: `import { OrderRepository } from "./orders.repository";
import { NotFoundError, ConflictError } from "../../lib/errors";
import type { CreateOrderDto } from "./orders.schema";

// Aturan state machine — satu-satunya sumber kebenaran transisi status
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  async createOrder(dto: CreateOrderDto, actorId: string) {
    // 1. Validasi bisnis (bukan validasi format — itu tugas Zod)
    const customer = await this.repo.findCustomer(dto.customerId);
    if (!customer?.active)
      throw new NotFoundError("CUSTOMER_NOT_FOUND",
        \`Customer '\${dto.customerId}' tidak ditemukan atau nonaktif.\`);

    // 2. Kunci harga dari katalog saat ini, hitung total di server
    const items = await this.repo.priceItems(dto.items);
    const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

    // 3. Satu transaksi atomik: order + items + decrement stok
    return this.repo.createOrder({ dto, items, total, actorId });
  }

  async transitionStatus(id: string, next: OrderStatus) {
    const order = await this.repo.findById(id);
    if (!order)
      throw new NotFoundError("ORDER_NOT_FOUND",
        \`Pesanan '\${id}' tidak ditemukan.\`);

    const allowed = TRANSITIONS[order.status];
    if (!allowed.includes(next))
      throw new ConflictError("STATE_CONFLICT",
        \`Transisi '\${order.status}' -> '\${next}' tidak diizinkan.\`,
        { currentStatus: order.status, requested: next, allowedNext: allowed });

    return this.repo.updateStatus(id, next);
  }
}`,
  },
  {
    id: "repository",
    tab: "repository.ts",
    file: "src/modules/orders/orders.repository.ts",
    code: `import type { PrismaClient } from "@prisma/client";

// Satu-satunya layer yang boleh menyentuh Prisma.
// Service & controller tidak tahu-menahu soal query.
export class OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  findById(id: string) {
    return this.db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  }

  async listOrders({ page, limit, status }: ListOrdersQuery) {
    const [data, total] = await this.db.$transaction([
      this.db.order.findMany({
        where: status ? { status } : undefined,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.order.count({ where: status ? { status } : undefined }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  createOrder(input: NewOrderInput) {
    // Atomik: order, items, dan stok berkurang — atau tidak sama sekali
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.create({ data: input.data });
      await tx.orderItem.createMany({ data: input.items });
      await tx.product.updateMany({
        where: { id: { in: input.items.map((i) => i.productId) } },
        data: { stock: { decrement: 1 } },
      });
      return order;
    });
  }
}`,
  },
  {
    id: "errors",
    tab: "errors.ts",
    file: "src/lib/errors.ts",
    code: `// Hierarki error domain — semua turun dari ApiError
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends ApiError {
  constructor(code = "BAD_REQUEST", message: string, details?: unknown) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(code = "UNAUTHORIZED", message: string) {
    super(401, code, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(code = "FORBIDDEN", message: string, details?: unknown) {
    super(403, code, message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(code: string, message: string) {
    super(404, code, message);
  }
}

export class ConflictError extends ApiError {
  constructor(code: string, message: string, details?: unknown) {
    super(409, code, message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(details: unknown) {
    super(422, "VALIDATION_ERROR",
      "Payload gagal validasi schema.", details);
  }
}`,
  },
  {
    id: "errorHandler",
    tab: "error-handler.ts",
    file: "src/middleware/error.middleware.ts",
    code: `import { ZodError } from "zod";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";

// Satu handler global — format error konsisten di seluruh API
export function errorHandler(err: unknown, req: express.Request,
  res: express.Response, _next: express.NextFunction) {

  const requestId = req.headers["x-request-id"] as string ?? randomUUID();

  // 1. Error Zod dari middleware validasi -> 422
  if (err instanceof ZodError) {
    return res.status(422).json(envelope("VALIDATION_ERROR",
      "Payload gagal validasi schema.", err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })), requestId));
  }

  // 2. Error domain yang memang kita lempar
  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error({ err, requestId });
    return res.status(err.status).json(
      envelope(err.code, err.message, err.details, requestId));
  }

  // 3. Sisanya = bug. Log lengkap, tapi client hanya lihat pesan umum
  logger.error({ err, requestId, path: req.path });
  return res.status(500).json(envelope("INTERNAL_ERROR",
    "Terjadi kesalahan tak terduga di server.", undefined, requestId));
}

const envelope = (code: string, message: string, details?: unknown,
  requestId?: string) => ({
  success: false,
  error: { code, message, ...(details ? { details } : {}),
    requestId, timestamp: new Date().toISOString() },
});`,
  },
  {
    id: "rbac",
    tab: "rbac.middleware.ts",
    file: "src/middleware/rbac.middleware.ts",
    code: `import { ForbiddenError, UnauthorizedError } from "../lib/errors";

// 1. Verifikasi JWT + isi req.user
export function authenticate(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token)
    return next(new UnauthorizedError("TOKEN_MISSING",
      "Header Authorization tidak ditemukan."));

  try {
    const payload = verifyJwt(token, process.env.JWT_SECRET!);
    req.user = { id: payload.sub, role: payload.role,
      permissions: payload.scope };
    next();
  } catch {
    next(new UnauthorizedError("TOKEN_INVALID",
      "Token kedaluwarsa atau tidak valid."));
  }
}

// 2. Guard permission — dipetakan per route
export function requirePermission(permission: string) {
  return (req, _res, next) => {
    const has = req.user.permissions.includes("*")
      || req.user.permissions.includes(permission);

    if (!has)
      return next(new ForbiddenError("FORBIDDEN",
        \`Role '\${req.user.role}' tidak punya permission '\${permission}'.\`,
        { requiredPermission: permission, currentRole: req.user.role }));

    next();
  };
}`,
  },
  {
    id: "zod",
    tab: "orders.schema.ts",
    file: "src/modules/orders/orders.schema.ts",
    code: `import { z } from "zod";

// Validasi format di batas sistem — sebelum masuk domain
export const CreateOrderSchema = z.object({
  customerId: z.string({ required_error: "customerId wajib diisi" })
    .min(1, "customerId wajib diisi"),
  items: z.array(
    z.object({
      sku: z.string().min(1, "sku wajib diisi"),
      qty: z.number({ invalid_type_error: "qty harus angka" })
        .int("qty harus integer")
        .min(1, "qty minimal 1")
        .max(500, "qty maksimal 500"),
    }),
    { required_error: "items wajib berupa array" }
  ).min(1, "minimal 1 item"),
  notes: z.string().max(500).optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(
    ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
    { errorMap: () => ({ message: "status tidak dikenal" }) }
  ),
});

export const OrderIdSchema = z.object({
  id: z.string().regex(/^ord_[a-z0-9]+$/, "format id pesanan tidak valid"),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;`,
  },
  {
    id: "dockerfile",
    tab: "Dockerfile",
    file: "Dockerfile",
    code: `# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Buang devDependencies untuk image akhir
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# User non-root — praktik keamanan standar
RUN addgroup -S atlas && adduser -S atlas -G atlas
USER atlas

COPY --from=builder --chown=atlas:atlas /app/node_modules ./node_modules
COPY --from=builder --chown=atlas:atlas /app/dist ./dist
COPY --from=builder --chown=atlas:atlas /app/prisma ./prisma
COPY --from=builder --chown=atlas:atlas /app/package*.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]`,
  },
  {
    id: "compose",
    tab: "docker-compose.yml",
    file: "docker-compose.yml",
    code: `services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://atlas:atlas_secret@db:5432/atlas_db
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXPIRES_IN: 1h
      RATE_LIMIT_MAX: 100
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: atlas
      POSTGRES_PASSWORD: atlas_secret
      POSTGRES_DB: atlas_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U atlas -d atlas_db"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru

  adminer:
    image: adminer:4
    ports:
      - "8080:8080"   # inspeksi DB selama development

volumes:
  pgdata:`,
  },
  {
    id: "env",
    tab: ".env.example",
    file: ".env.example",
    code: `# --- Server ---
PORT=3000
NODE_ENV=development

# --- Database (dipakai Prisma) ---
DATABASE_URL=postgresql://atlas:atlas_secret@localhost:5432/atlas_db

# --- Auth ---
JWT_SECRET=ubah-dengan-64-karakter-acak
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12

# --- Rate limiting ---
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# --- Observability ---
LOG_LEVEL=debug
SENTRY_DSN=`,
  },
  {
    id: "test",
    tab: "orders.spec.ts",
    file: "src/modules/orders/__tests__/orders.spec.ts",
    code: `import request from "supertest";
import { app } from "../../../app";
import { seedTestDb, staffToken, managerToken, publicToken } from "../../test-utils";

describe("PATCH /api/v1/orders/:id/status", () => {
  beforeAll(() => seedTestDb());

  it("401 tanpa token", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/ord_1/status")
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_MISSING");
  });

  it("403 untuk role staff (butuh orders:update-status)", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/ord_1/status")
      .set("Authorization", \`Bearer \${staffToken()}\`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("409 untuk transisi yang melanggar state machine", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/ord_delivered/status")
      .set("Authorization", \`Bearer \${managerToken()}\`)
      .send({ status: "PENDING" });

    expect(res.status).toBe(409);
    expect(res.body.error.details.allowedNext).toEqual([]);
  });

  it("422 menyertakan detail field yang gagal", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", \`Bearer \${staffToken()}\`)
      .send({ customerId: "cus_1", items: [{ sku: "X", qty: 0 }] });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "items.0.qty" }),
      ])
    );
  });

  it("200 untuk transisi valid oleh manager", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/ord_1/status")
      .set("Authorization", \`Bearer \${managerToken()}\`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CONFIRMED");
  });
});`,
  },
];

/* ---------------- Layer arsitektur ---------------- */

export interface ArchLayer {
  id: string;
  name: string;
  file: string;
  role: string;
  bullets: string[];
  code: string;
}

export const ARCH_LAYERS: ArchLayer[] = [
  {
    id: "middleware",
    name: "Middleware",
    file: "src/middleware/*",
    role: "Gerbang lintas-pemotongan: auth JWT, guard RBAC, validasi Zod, rate limit, request logging.",
    bullets: [
      "Menolak request buruk sebelum menyentuh logika bisnis",
      "Mengisi req.user dari claim JWT untuk dipakai semua layer",
      "Error dilempar sebagai domain error, bukan res.json() manual",
    ],
    code: `// pipeline Express — urutan menentukan
app.use(helmet());
app.use(requestLogger);        // assign x-request-id
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.use("/api/v1/orders",
  authenticate,               // JWT -> req.user
  requirePermission("orders:read"),
  orderRouter);

app.use(notFoundHandler);     // 404 ROUTE_NOT_FOUND
app.use(errorHandler);        // satu format error global`,
  },
  {
    id: "controller",
    name: "Controller",
    file: "src/modules/orders/orders.controller.ts",
    role: "Penerjemah protokol HTTP: routing, parse input, delegasi ke service, tulis status code & envelope respons.",
    bullets: [
      "Nol logika bisnis — hanya orkestrasi request/response",
      "Validasi format dengan Zod sebelum menyentuh service",
      "Setiap handler dibungkus try/catch → next(err)",
    ],
    code: `orderRouter.post("/",
  validate(CreateOrderSchema),          // 422 kalau format salah
  async (req, res, next) => {
    try {
      const order = await service.createOrder(req.body, req.user.id);
      res.status(201)
         .location(\`/api/v1/orders/\${order.id}\`)
         .json({ success: true, data: order });
    } catch (err) {
      next(err);                        // biar errorHandler yang format
    }
  });`,
  },
  {
    id: "service",
    name: "Service",
    file: "src/modules/orders/orders.service.ts",
    role: "Jantung domain: aturan bisnis, state machine, transaksi antar-entitas. Framework-agnostic dan 100% unit-testable.",
    bullets: [
      "Tidak mengenal req/res — input DTO, output entity",
      "Melempar NotFoundError / ConflictError yang bermakna",
      "Ditest dengan repository palsu (in-memory fake)",
    ],
    code: `async transitionStatus(id: string, next: OrderStatus) {
  const order = await this.repo.findById(id);
  if (!order)
    throw new NotFoundError("ORDER_NOT_FOUND",
      \`Pesanan '\${id}' tidak ditemukan.\`);

  if (!TRANSITIONS[order.status].includes(next))
    throw new ConflictError("STATE_CONFLICT",
      \`Transisi ditolak state machine.\`,
      { currentStatus: order.status, allowedNext: TRANSITIONS[order.status] });

  return this.repo.updateStatus(id, next);
}`,
  },
  {
    id: "repository",
    name: "Repository",
    file: "src/modules/orders/orders.repository.ts",
    role: "Satu-satunya pintu ke data: query Prisma, pagination, transaksi atomik. Service tidak pernah mengimpor Prisma.",
    bullets: [
      "Query kompleks terpusat — mudah dioptimalkan & di-cache",
      "$transaction menjamin order + items + stok atomik",
      "Bisa diganti implementasi (cache, read replica) tanpa mengubah service",
    ],
    code: `createOrder(input: NewOrderInput) {
  return this.db.$transaction(async (tx) => {
    const order = await tx.order.create({ data: input.data });
    await tx.orderItem.createMany({ data: input.items });
    await tx.product.updateMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
      data: { stock: { decrement: 1 } },
    });
    return order;  // semua berhasil, atau tidak sama sekali
  });
}`,
  },
  {
    id: "prisma",
    name: "Prisma + PostgreSQL",
    file: "prisma/schema.prisma",
    role: "Sumber kebenaran skema: relasi, enum OrderStatus, index query panas, soft delete, dan migrasi versioned.",
    bullets: [
      "Type-safe end-to-end: skema DB → tipe TS → payload API",
      "Migrasi via prisma migrate, seed terpisah untuk dev/CI",
      "Berjalan sebagai container di docker-compose dengan healthcheck",
    ],
    code: `model Order {
  id         String      @id @default("ord_" + cuid())
  customer   Customer    @relation(fields: [customerId], references: [id])
  customerId String      @map("customer_id")
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(14, 2)
  items      OrderItem[]
  createdAt  DateTime    @default(now()) @map("created_at")

  @@index([status, createdAt])
  @@map("orders")
}`,
  },
];

/* ---------------- Struktur folder ---------------- */

export const FOLDER_TREE = `atlas-api/
├─ docker-compose.yml        # api + postgres + redis + adminer
├─ Dockerfile                # multi-stage, user non-root
├─ .env.example
├─ prisma/
│  ├─ schema.prisma          # sumber kebenaran skema
│  ├─ migrations/            # migrasi versioned
│  └─ seed.ts                # data awal dev & CI
├─ src/
│  ├─ server.ts              # bootstrap HTTP
│  ├─ app.ts                 # Express app (terpisah, agar testable)
│  ├─ config/                # env → objek config tervalidasi
│  ├─ lib/
│  │  ├─ errors.ts           # hierarki ApiError
│  │  ├─ prisma.ts           # singleton client
│  │  └─ logger.ts           # pino + redact secret
│  ├─ middleware/
│  │  ├─ auth.middleware.ts      # verifikasi JWT
│  │  ├─ rbac.middleware.ts      # guard permission
│  │  ├─ validate.middleware.ts  # Zod → 422 + details
│  │  └─ error.middleware.ts     # handler global
│  └─ modules/
│     ├─ auth/                # controller · service · repo · schema
│     ├─ orders/              # + __tests__/ (unit & integrasi)
│     ├─ users/
│     ├─ products/
│     └─ reports/
└─ package.json               # dev · build · test · db:migrate · db:seed`;

/* ---------------- Stack ---------------- */

export const STACK = [
  { name: "Node.js 20 LTS", note: "runtime" },
  { name: "TypeScript 5.7", note: "strict mode" },
  { name: "Express 4", note: "HTTP layer" },
  { name: "Prisma 5", note: "type-safe ORM" },
  { name: "PostgreSQL 16", note: "primary store" },
  { name: "Redis 7", note: "cache + rate limit" },
  { name: "Zod", note: "validasi schema" },
  { name: "JWT + bcrypt", note: "auth & hashing" },
  { name: "Jest + Supertest", note: "96% coverage" },
  { name: "Docker Compose", note: "dev = prod" },
  { name: "Pino", note: "structured log" },
  { name: "ESLint + Husky", note: "CI guard" },
];

/* ---------------- Perintah lokal ---------------- */

export const RUN_COMMANDS = [
  { step: "01", note: "Clone & masuk direktori", cmd: "git clone https://github.com/username/atlas-api.git && cd atlas-api" },
  { step: "02", note: "Salin config environment", cmd: "cp .env.example .env" },
  { step: "03", note: "Jalankan API + Postgres + Redis + Adminer", cmd: "docker compose up -d --build" },
  { step: "04", note: "Migrasi skema & isi data seed", cmd: "docker compose exec api npx prisma migrate deploy && npm run db:seed" },
  { step: "05", note: "Verifikasi — atau buka http://localhost:3000/docs", cmd: "curl http://localhost:3000/health" },
];
