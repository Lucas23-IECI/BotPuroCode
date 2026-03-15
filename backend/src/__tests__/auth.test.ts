import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../index";
import { prisma } from "../lib/prisma";
import { signToken, type AuthPayload } from "../middleware/auth";
import bcrypt from "bcryptjs";

let adminToken: string;
let adminId: string;
let testUserId: string;

const TEST_EMAIL = `test_${Date.now()}@purocode.test`;
const ADMIN_EMAIL = `admin_${Date.now()}@purocode.test`;

beforeAll(async () => {
  // Create admin user
  const hash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.create({
    data: { email: ADMIN_EMAIL, nombre: "Test Admin", password: hash, rol: "ADMIN" },
  });
  adminId = admin.id;
  const payload: AuthPayload = { userId: admin.id, email: admin.email, rol: admin.rol };
  adminToken = signToken(payload);
});

afterAll(async () => {
  // Cleanup test data
  await prisma.passwordResetToken.deleteMany({
    where: { user: { email: { in: [TEST_EMAIL, ADMIN_EMAIL] } } },
  });
  await prisma.activityLog.deleteMany({
    where: { user: { email: { in: [TEST_EMAIL, ADMIN_EMAIL] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_EMAIL, ADMIN_EMAIL] } },
  });
  await prisma.$disconnect();
});

describe("Auth API", () => {
  // ─── Health ──────────────────────────────────
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  // ─── Register ────────────────────────────────
  it("POST /api/auth/register creates a user (admin only)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: TEST_EMAIL, nombre: "Test User", password: "Test123!", rol: "VENDEDOR" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(TEST_EMAIL);
    expect(res.body.rol).toBe("VENDEDOR");
    testUserId = res.body.id;
  });

  it("POST /api/auth/register rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: TEST_EMAIL, nombre: "Dup", password: "Test123!", rol: "VENDEDOR" });

    expect(res.status).toBe(409);
  });

  // ─── Login ───────────────────────────────────
  it("POST /api/auth/login succeeds with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "Test123!" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("POST /api/auth/login rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  // ─── /me ─────────────────────────────────────
  it("GET /api/auth/me returns current user", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ADMIN_EMAIL);
  });

  it("GET /api/auth/me rejects no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  // ─── Forgot password ────────────────────────
  it("POST /api/auth/forgot-password always returns success (anti-enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it("POST /api/auth/forgot-password with unknown email still returns 200", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "noexiste@nowhere.test" });

    expect(res.status).toBe(200);
  });

  // ─── Reset password ─────────────────────────
  it("POST /api/auth/reset-password rejects invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalidtoken123", newPassword: "NewPass123!" });

    expect(res.status).toBe(400);
  });

  // ─── Admin reset ────────────────────────────
  it("POST /api/auth/admin-reset/:userId resets password (auto-generate)", async () => {
    const res = await request(app)
      .post(`/api/auth/admin-reset/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.tempPassword).toBeDefined();
    expect(res.body.tempPassword.length).toBeGreaterThanOrEqual(8);
  });

  it("POST /api/auth/admin-reset/:userId resets password (manual)", async () => {
    const res = await request(app)
      .post(`/api/auth/admin-reset/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "ManualReset1!" });

    expect(res.status).toBe(200);
    expect(res.body.tempPassword).toBe("ManualReset1!");
  });

  it("POST /api/auth/admin-reset rejects non-admin", async () => {
    // Login as the test user to get a non-admin token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "ManualReset1!" });

    const userToken = loginRes.body.token;

    const res = await request(app)
      .post(`/api/auth/admin-reset/${adminId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(403);
  });

  // ─── Update user ─────────────────────────────
  it("PATCH /api/auth/users/:id updates user role", async () => {
    const res = await request(app)
      .patch(`/api/auth/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rol: "ADMIN" });

    expect(res.status).toBe(200);
    expect(res.body.rol).toBe("ADMIN");
  });
});
