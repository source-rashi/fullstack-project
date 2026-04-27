import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
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

const createDoctorSeedKey = (doctor) => {
  return `${String(doctor.firstName).trim().toLowerCase()}|${String(
    doctor.lastName
  )
    .trim()
    .toLowerCase()}|${String(doctor.doctorDepartment).trim().toLowerCase()}`;
};

const buildSeededDoctorPayload = (doctor, index) => {
  const localPart = `${doctor.firstName}.${doctor.lastName}.${doctor.doctorDepartment}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return {
    ...doctor,
    email: `${localPart}.mock${index + 1}@zeecare.local`,
    phone: `03${String(20000000 + index).slice(-8)}`,
    nic: `${String(3000000000000 + index).slice(-13)}`,
    dob: `1988-01-${String((index % 28) + 1).padStart(2, "0")}`,
    password: "Doctor@12345",
    role: "Doctor",
    docAvatar: {
      public_id: `seeded-doctor-${index + 1}`,
      url: "https://via.placeholder.com/300x300.png?text=Doctor",
    },
  };
};

const buildDefaultDoctorAvatar = (firstName, lastName) => {
  const normalizedName = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return {
    public_id: `doctor-default-${normalizedName || Date.now()}`,
    url: "https://via.placeholder.com/300x300.png?text=Doctor",
  };
};

const syncSeededDoctors = async () => {
  const existingDoctors = await User.find({ role: "Doctor" }).select(
    "firstName lastName doctorDepartment"
  );
  const existingKeys = new Set(
    existingDoctors.map((doctor) => createDoctorSeedKey(doctor))
  );

  const doctorsToInsert = SEEDED_DOCTORS.filter(
    (doctor) => !existingKeys.has(createDoctorSeedKey(doctor))
  ).map((doctor, index) => buildSeededDoctorPayload(doctor, index));

  if (doctorsToInsert.length === 0) {
    return 0;
  }

  await User.create(doctorsToInsert);
  return doctorsToInsert.length;
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

  if (phone.length !== 10) {
    return next(new ErrorHandler("Phone number must be exactly 10 digits.", 400));
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

export const doctorRegister = catchAsyncErrors(async (req, res, next) => {
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
    !doctorDepartment
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("Doctor With This Email Already Exists!", 400));
  }

  if (phone.length !== 10) {
    return next(new ErrorHandler("Phone number must be exactly 10 digits.", 400));
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
    docAvatar: buildDefaultDoctorAvatar(firstName, lastName),
  });

  generateToken(doctor, "Doctor Registered!", 200, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }
  if (role.toLowerCase() !== user.role.toLowerCase()) {
    return next(new ErrorHandler(`User Not Found With This Role!`, 400));
  }
  generateToken(user, "Login Successfully!", 201, res);
});

export const getSessionUser = catchAsyncErrors(async (req, res) => {
  const authCookieMap = [
    { cookieName: "adminToken", role: "Admin" },
    { cookieName: "doctorToken", role: "Doctor" },
    { cookieName: "patientToken", role: "Patient" },
  ];

  for (const { cookieName, role } of authCookieMap) {
    const token = req.cookies[cookieName];
    if (!token) {
      continue;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);

      if (user && user.role === role) {
        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          user,
        });
      }
    } catch (error) {
      // Ignore invalid/expired role cookie and continue checking others.
    }
  }

  return res.status(200).json({
    success: true,
    isAuthenticated: false,
    user: null,
  });
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

  if (phone.length !== 10) {
    return next(new ErrorHandler("Phone number must be exactly 10 digits.", 400));
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
  const seededCount = await syncSeededDoctors();
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({
    success: true,
    seeded: seededCount > 0,
    seededCount,
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
    .status(200)
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
    .status(200)
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
    .status(200)
    .cookie("doctorToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Doctor Logged Out Successfully.",
    });
});

// Get all users for admin
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// Delete user for admin
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }
  await User.findByIdAndDelete(id);
  res.status(200).json({
    success: true,
    message: "User deleted successfully.",
  });
});
