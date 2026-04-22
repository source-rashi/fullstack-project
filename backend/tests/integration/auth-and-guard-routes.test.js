import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { dbConnection } from "../../database/dbConnection.js";
import { User } from "../../models/userSchema.js";
import { Appointment } from "../../models/appointmentSchema.js";
import { Message } from "../../models/messageSchema.js";

process.env.MONGO_DB_NAME = "MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM_TEST";

const uniqueSuffix = () => `${Date.now()}${Math.floor(Math.random() * 100000)}`;

const buildDigits = (base, length) => {
  return String(base).replace(/\D/g, "").slice(0, length).padStart(length, "0");
};

const createUserPayload = ({ role, doctorDepartment } = {}) => {
  const suffix = uniqueSuffix();
  const payload = {
    firstName: `User${suffix}`.slice(0, 10),
    lastName: `Test${suffix}`.slice(0, 10),
    email: `user.${suffix}@example.com`,
    phone: buildDigits(`03${suffix}`, 11),
    nic: buildDigits(`42${suffix}`, 13),
    dob: "1990-01-01",
    gender: "Male",
    password: "Pass12345",
    role,
  };

  if (doctorDepartment) {
    payload.doctorDepartment = doctorDepartment;
  }

  return payload;
};

const loginAndGetCookies = async ({ email, password, role }) => {
  const response = await request(app).post("/api/v1/user/login").send({
    email,
    password,
    confirmPassword: password,
    role,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.ok(response.headers["set-cookie"]?.length > 0);

  return response.headers["set-cookie"];
};

before(async () => {
  await dbConnection();
});

beforeEach(async () => {
  await Promise.all([
    Appointment.deleteMany({}),
    Message.deleteMany({}),
    User.deleteMany({}),
  ]);
});

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

test("appointment booking auto-creates doctor in demo-safe mode", async () => {
  const previousFlag = process.env.APPOINTMENT_ALLOW_UNKNOWN_DOCTOR;
  process.env.APPOINTMENT_ALLOW_UNKNOWN_DOCTOR = "true";

  try {
    const suffix = uniqueSuffix();
    const patientPayload = {
      firstName: "Patient",
      lastName: `Demo${suffix}`.slice(0, 8),
      email: `patient.demo.${suffix}@example.com`,
      phone: buildDigits(`03${suffix}`, 11),
      nic: buildDigits(`88${suffix}`, 13),
      dob: "1996-06-06",
      gender: "Female",
      password: "Patient12345",
    };

    const registerResponse = await request(app)
      .post("/api/v1/user/patient/register")
      .send(patientPayload);

    assert.equal(registerResponse.status, 200);

    const doctorFirstName = "Noor";
    const doctorLastName = "Asif";
    const appointmentPayload = {
      firstName: patientPayload.firstName,
      lastName: patientPayload.lastName,
      email: patientPayload.email,
      phone: patientPayload.phone,
      nic: patientPayload.nic,
      dob: patientPayload.dob,
      gender: patientPayload.gender,
      appointment_date: "2030-03-03",
      department: "ENT",
      doctor_firstName: doctorFirstName,
      doctor_lastName: doctorLastName,
      hasVisited: false,
      address: "House 55, Example Block, Sample City",
    };

    const createAppointmentResponse = await request(app)
      .post("/api/v1/appointment/post")
      .set("Cookie", registerResponse.headers["set-cookie"])
      .send(appointmentPayload);

    assert.equal(createAppointmentResponse.status, 200);
    assert.equal(createAppointmentResponse.body.success, true);
    assert.equal(
      createAppointmentResponse.body.appointment.doctor.firstName,
      doctorFirstName
    );
    assert.equal(
      createAppointmentResponse.body.appointment.doctor.lastName,
      doctorLastName
    );

    const createdDoctor = await User.findOne({
      firstName: doctorFirstName,
      lastName: doctorLastName,
      role: "Doctor",
      doctorDepartment: "ENT",
    });

    assert.ok(createdDoctor);
    assert.equal(
      String(createAppointmentResponse.body.appointment.doctorId),
      String(createdDoctor._id)
    );
  } finally {
    if (typeof previousFlag === "undefined") {
      delete process.env.APPOINTMENT_ALLOW_UNKNOWN_DOCTOR;
    } else {
      process.env.APPOINTMENT_ALLOW_UNKNOWN_DOCTOR = previousFlag;
    }
  }
});

test("patient register, login, and logout flow works", async () => {
  const suffix = uniqueSuffix();
  const password = "Patient123";
  const patientPayload = {
    firstName: "Patient",
    lastName: `Test${suffix}`.slice(0, 8),
    email: `patient.${suffix}@example.com`,
    phone: buildDigits(`03${suffix}`, 11),
    nic: buildDigits(`99${suffix}`, 13),
    dob: "1995-04-05",
    gender: "Female",
    password,
  };

  const registerResponse = await request(app)
    .post("/api/v1/user/patient/register")
    .send(patientPayload);

  assert.equal(registerResponse.status, 200);
  assert.equal(registerResponse.body.success, true);
  assert.ok(
    registerResponse.headers["set-cookie"]
      ?.join(";")
      .includes("patientToken=")
  );

  const loginResponse = await request(app).post("/api/v1/user/login").send({
    email: patientPayload.email,
    password,
    confirmPassword: password,
    role: "Patient",
  });

  assert.equal(loginResponse.status, 201);
  assert.equal(loginResponse.body.success, true);

  const logoutResponse = await request(app)
    .post("/api/v1/user/patient/logout")
    .set("Cookie", loginResponse.headers["set-cookie"]);

  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutResponse.body.success, true);
});

test("doctor self-registration creates doctor session", async () => {
  const suffix = uniqueSuffix();
  const password = "Doctor12345";
  const doctorPayload = {
    firstName: "Doctor",
    lastName: `Self${suffix}`.slice(0, 8),
    email: `doctor.self.${suffix}@example.com`,
    phone: buildDigits(`03${suffix}`, 11),
    nic: buildDigits(`77${suffix}`, 13),
    dob: "1993-03-03",
    gender: "Male",
    password,
    doctorDepartment: "ENT",
  };

  const registerResponse = await request(app)
    .post("/api/v1/user/doctor/register")
    .send(doctorPayload);

  assert.equal(registerResponse.status, 200);
  assert.equal(registerResponse.body.success, true);
  assert.equal(registerResponse.body.user.role, "Doctor");
  assert.ok(
    registerResponse.headers["set-cookie"]
      ?.join(";")
      .includes("doctorToken=")
  );

  const doctorMeResponse = await request(app)
    .get("/api/v1/user/doctor/me")
    .set("Cookie", registerResponse.headers["set-cookie"]);

  assert.equal(doctorMeResponse.status, 200);
  assert.equal(doctorMeResponse.body.success, true);
  assert.equal(doctorMeResponse.body.user.role, "Doctor");
});

test("admin can add new admin and read all messages", async () => {
  const admin = await User.create({
    ...createUserPayload({ role: "Admin" }),
    email: `admin.${uniqueSuffix()}@example.com`,
    password: "Admin12345",
  });

  const adminCookies = await loginAndGetCookies({
    email: admin.email,
    password: "Admin12345",
    role: "Admin",
  });

  const messageResponse = await request(app).post("/api/v1/message/send").send({
    firstName: "Alice",
    lastName: "Smith",
    email: `contact.${uniqueSuffix()}@example.com`,
    phone: "03001234567",
    message: "This is a valid support message for testing.",
  });

  assert.equal(messageResponse.status, 200);
  assert.equal(messageResponse.body.success, true);

  const allMessagesResponse = await request(app)
    .get("/api/v1/message/getall")
    .set("Cookie", adminCookies);

  assert.equal(allMessagesResponse.status, 200);
  assert.equal(allMessagesResponse.body.success, true);
  assert.ok(Array.isArray(allMessagesResponse.body.messages));
  assert.ok(allMessagesResponse.body.messages.length >= 1);

  const addAdminPayload = {
    firstName: "Second",
    lastName: "Admin",
    email: `second.admin.${uniqueSuffix()}@example.com`,
    phone: "03111222333",
    nic: buildDigits(uniqueSuffix(), 13),
    dob: "1992-01-01",
    gender: "Male",
    password: "Admin67890",
  };

  const addAdminResponse = await request(app)
    .post("/api/v1/user/admin/addnew")
    .set("Cookie", adminCookies)
    .send(addAdminPayload);

  assert.equal(addAdminResponse.status, 200);
  assert.equal(addAdminResponse.body.success, true);
  assert.equal(addAdminResponse.body.admin.role, "Admin");
});

test("appointment lifecycle supports patient and admin actions", async () => {
  const doctor = await User.create({
    ...createUserPayload({ role: "Doctor", doctorDepartment: "Cardiology" }),
    email: `doctor.${uniqueSuffix()}@example.com`,
    password: "Doctor12345",
    gender: "Female",
  });

  const patientPassword = "Patient12345";
  const patientPayload = {
    firstName: "Priya",
    lastName: `Shah${uniqueSuffix()}`.slice(0, 8),
    email: `patient.lifecycle.${uniqueSuffix()}@example.com`,
    phone: "03001112223",
    nic: buildDigits(uniqueSuffix(), 13),
    dob: "1998-08-08",
    gender: "Female",
    password: patientPassword,
  };

  const registerResponse = await request(app)
    .post("/api/v1/user/patient/register")
    .send(patientPayload);

  assert.equal(registerResponse.status, 200);
  const patientCookies = registerResponse.headers["set-cookie"];

  const appointmentPayload = {
    firstName: patientPayload.firstName,
    lastName: patientPayload.lastName,
    email: patientPayload.email,
    phone: patientPayload.phone,
    nic: patientPayload.nic,
    dob: patientPayload.dob,
    gender: patientPayload.gender,
    appointment_date: "2030-01-01",
    department: doctor.doctorDepartment,
    doctor_firstName: doctor.firstName,
    doctor_lastName: doctor.lastName,
    hasVisited: false,
    address: "House 12, Main Street, Test City",
  };

  const createAppointmentResponse = await request(app)
    .post("/api/v1/appointment/post")
    .set("Cookie", patientCookies)
    .send(appointmentPayload);

  assert.equal(createAppointmentResponse.status, 200);
  assert.equal(createAppointmentResponse.body.success, true);

  const appointmentId = createAppointmentResponse.body.appointment._id;

  const myAppointmentsResponse = await request(app)
    .get("/api/v1/appointment/patient/my")
    .set("Cookie", patientCookies);

  assert.equal(myAppointmentsResponse.status, 200);
  assert.equal(myAppointmentsResponse.body.success, true);
  assert.ok(Array.isArray(myAppointmentsResponse.body.appointments));
  assert.equal(myAppointmentsResponse.body.appointments.length, 1);

  const admin = await User.create({
    ...createUserPayload({ role: "Admin" }),
    email: `admin.lifecycle.${uniqueSuffix()}@example.com`,
    password: "Admin12345",
  });

  const adminCookies = await loginAndGetCookies({
    email: admin.email,
    password: "Admin12345",
    role: "Admin",
  });

  const updateResponse = await request(app)
    .put(`/api/v1/appointment/update/${appointmentId}`)
    .set("Cookie", adminCookies)
    .send({ status: "Accepted" });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.success, true);

  const cancelAcceptedResponse = await request(app)
    .delete(`/api/v1/appointment/patient/cancel/${appointmentId}`)
    .set("Cookie", patientCookies);

  assert.equal(cancelAcceptedResponse.status, 400);
  assert.equal(cancelAcceptedResponse.body.success, false);

  const pendingAppointmentResponse = await request(app)
    .post("/api/v1/appointment/post")
    .set("Cookie", patientCookies)
    .send({
      ...appointmentPayload,
      appointment_date: "2030-02-01",
    });

  assert.equal(pendingAppointmentResponse.status, 200);

  const pendingAppointmentId = pendingAppointmentResponse.body.appointment._id;
  const cancelPendingResponse = await request(app)
    .delete(`/api/v1/appointment/patient/cancel/${pendingAppointmentId}`)
    .set("Cookie", patientCookies);

  assert.equal(cancelPendingResponse.status, 200);
  assert.equal(cancelPendingResponse.body.success, true);

  const deleteResponse = await request(app)
    .delete(`/api/v1/appointment/delete/${appointmentId}`)
    .set("Cookie", adminCookies);

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.success, true);

  const doctorLoginResponse = await request(app).post("/api/v1/user/login").send({
    email: doctor.email,
    password: "Doctor12345",
    confirmPassword: "Doctor12345",
    role: "Doctor",
  });

  assert.equal(doctorLoginResponse.status, 201);

  const doctorAppointmentsResponse = await request(app)
    .get("/api/v1/appointment/doctor/my")
    .set("Cookie", doctorLoginResponse.headers["set-cookie"]);

  assert.equal(doctorAppointmentsResponse.status, 200);
  assert.equal(doctorAppointmentsResponse.body.success, true);
});
