import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SEEDED_DOCTORS } from "../utils/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== "placeholder" &&
    process.env.CLOUDINARY_API_KEY !== "placeholder" &&
    process.env.CLOUDINARY_API_SECRET !== "placeholder"
  );
};

const uploadDoctorAvatarLocally = async (docAvatar) => {
  const uploadsDir = path.join(__dirname, "..", "uploads", "doctors");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const extension = path.extname(docAvatar.name || "") || ".png";
  const fileName = `doctor-${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}${extension}`;
  const destinationPath = path.join(uploadsDir, fileName);

  await docAvatar.mv(destinationPath);

  const backendBaseUrl = (
    process.env.BACKEND_URL || `http://localhost:${process.env.PORT}`
  ).replace(/\/$/, "");

  return {
    public_id: fileName,
    url: `${backendBaseUrl}/uploads/doctors/${fileName}`,
  };
};

const seedFakeDoctorsIfEmpty = async () => {
  const doctorCount = await User.countDocuments({ role: "Doctor" });
  if (doctorCount > 0) {
    return false;
  }

  const seededDoctorsPayload = SEEDED_DOCTORS.map((doctor, index) => ({
    ...doctor,
    email: `demo.doctor${index + 1}@zeecare.local`,
    phone: `03${String(index + 100000000).slice(-9)}`,
    nic: `${String(index + 1000000000000).slice(-13)}`,
    dob: `1990-01-${String((index % 9) + 1).padStart(2, "0")}`,
    password: "doctor1234",
    role: "Doctor",
    docAvatar: {
      public_id: `seeded-doctor-${index + 1}`,
      url: "https://via.placeholder.com/300x300.png?text=Doctor",
    },
  }));

  await User.create(seededDoctorsPayload);
  return true;
};

export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, nic, dob, gender, password } =
    req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("User already Registered!", 400));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Patient",
  });
  generateToken(user, "User Registered!", 200, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, confirmPassword, role } = req.body;
  if (!email || !password || !confirmPassword || !role) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password & Confirm Password Do Not Match!", 400)
    );
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }
  if (role !== user.role) {
    return next(new ErrorHandler(`User Not Found With This Role!`, 400));
  }
  generateToken(user, "Login Successfully!", 201, res);
});

export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, nic, dob, gender, password } =
    req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("Admin With This Email Already Exists!", 400));
  }

  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Admin",
  });
  res.status(200).json({
    success: true,
    message: "New Admin Registered",
    admin,
  });
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar Required!", 400));
  }
  const { docAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype)) {
    return next(new ErrorHandler("File Format Not Supported!", 400));
  }
  const {
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    doctorDepartment,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment ||
    !docAvatar
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(
      new ErrorHandler("Doctor With This Email Already Exists!", 400)
    );
  }
  let uploadedAvatar;
  try {
    if (isCloudinaryConfigured()) {
      const cloudinaryResponse = await cloudinary.uploader.upload(
        docAvatar.tempFilePath
      );

      if (!cloudinaryResponse || cloudinaryResponse.error) {
        throw new Error("Cloudinary upload failed");
      }

      uploadedAvatar = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
    } else {
      uploadedAvatar = await uploadDoctorAvatarLocally(docAvatar);
    }
  } catch (error) {
    // If cloud upload fails, fallback to local storage for localhost workflows.
    try {
      uploadedAvatar = await uploadDoctorAvatarLocally(docAvatar);
    } catch (localUploadError) {
      console.error("Avatar upload failed:", localUploadError);
      return next(new ErrorHandler("Failed To Upload Doctor Avatar", 500));
    }
  }

  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Doctor",
    doctorDepartment,
    docAvatar: uploadedAvatar,
  });
  res.status(200).json({
    success: true,
    message: "New Doctor Registered",
    doctor,
  });
});

export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const seeded = await seedFakeDoctorsIfEmpty();
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({
    success: true,
    seeded,
    doctors,
  });
});

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

// Logout function for dashboard admin
export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("adminToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Admin Logged Out Successfully.",
    });
});

// Logout function for frontend patient
export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("patientToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Patient Logged Out Successfully.",
    });
});

// Logout function for doctor users
export const logoutDoctor = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("doctorToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Doctor Logged Out Successfully.",
    });
});
