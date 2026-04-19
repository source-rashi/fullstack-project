import test, { after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

test("GET /api/v1/user/admin/me rejects unauthenticated request", async () => {
  const response = await request(app).get("/api/v1/user/admin/me");

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("GET /api/v1/appointment/patient/my rejects unauthenticated request", async () => {
  const response = await request(app).get("/api/v1/appointment/patient/my");

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("POST /api/v1/message/send validates required payload", async () => {
  const response = await request(app).post("/api/v1/message/send").send({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("GET /api/v1/user/doctors returns seeded doctors list", async () => {
  const response = await request(app).get("/api/v1/user/doctors");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.doctors));
  assert.ok(response.body.doctors.length > 0);
});
