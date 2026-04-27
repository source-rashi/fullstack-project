import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import { Billing } from "../models/billingSchema.js";

const isUnknownDoctorBookingAllowed = () => {
  const envValue = process.env.APPOINTMENT_ALLOW_UNKNOWN_DOCTOR;
  if (typeof envValue === "undefined") {
    return true;
  }

  return String(envValue).toLowerCase() === "true";
};

const createDigits = (length) => {
  let digits = "";
  while (digits.length < length) {
    digits += Math.floor(Math.random() * 10);
  }

  return digits.slice(0, length);
};

const normalizeDoctorName = (value, fallbackValue) => {
  const trimmedValue = String(value || "").trim();
  if (trimmedValue.length >= 3) {
    return trimmedValue;
  }

  return `${trimmedValue}${fallbackValue}`.slice(0, 3).padEnd(3, "x");
};

const createDemoDoctor = async ({
  doctorFirstName,
  doctorLastName,
  department,
}) => {
  const normalizedFirstName = normalizeDoctorName(doctorFirstName, "Doc");
  const normalizedLastName = normalizeDoctorName(doctorLastName, "Tor");
  const uniqueToken = `${Date.now()}${createDigits(4)}`;
  const emailLocalPart = `${normalizedFirstName}.${normalizedLastName}.${uniqueToken}`
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");

  return User.create({
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: `${emailLocalPart}@hms.local`,
    phone: createDigits(10),
    nic: createDigits(13),
    dob: "1990-01-01",
    gender: "Male",
    password: "Doctor@12345",
    role: "Doctor",
    doctorDepartment: department,
    docAvatar: {
      public_id: `auto-demo-${uniqueToken}`,
      url: "https://via.placeholder.com/300x300.png?text=Doctor",
    },
  });
};

export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    appointment_date,
    department,
    doctor_firstName,
    doctor_lastName,
    hasVisited,
    address,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !appointment_date ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const doctorFirstNameValue = doctor_firstName.trim();
  const doctorLastNameValue = doctor_lastName.trim();

  if (!doctorFirstNameValue || !doctorLastNameValue) {
    return next(new ErrorHandler("Please provide a valid doctor name!", 400));
  }

  if (phone.length !== 10) {
    return next(new ErrorHandler("Phone number must be exactly 10 digits.", 400));
  }

  const matchedDoctors = await User.find({
    firstName: doctorFirstNameValue,
    lastName: doctorLastNameValue,
    role: "Doctor",
    doctorDepartment: department,
  });

  let resolvedDoctor;
  if (matchedDoctors.length === 0) {
    if (!isUnknownDoctorBookingAllowed()) {
      return next(new ErrorHandler("Doctor not found", 404));
    }

    resolvedDoctor = await createDemoDoctor({
      doctorFirstName: doctorFirstNameValue,
      doctorLastName: doctorLastNameValue,
      department,
    });
  } else if (matchedDoctors.length > 1) {
    resolvedDoctor = matchedDoctors[0];
  } else {
    resolvedDoctor = matchedDoctors[0];
  }

  const doctorId = resolvedDoctor._id;
  const patientId = req.user._id;
  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    appointment_date,
    department,
    doctor: {
      firstName: doctorFirstNameValue,
      lastName: doctorLastNameValue,
    },
    hasVisited,
    address,
    doctorId,
    patientId,
  });
  res.status(200).json({
    success: true,
    appointment,
    message: "Appointment Send!",
  });
});

export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});

export const getMyAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find({ patientId: req.user._id });
  res.status(200).json({
    success: true,
    appointments,
  });
});

export const getDoctorAppointments = catchAsyncErrors(
  async (req, res, next) => {
    const appointments = await Appointment.find({ doctorId: req.user._id });
    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const updateAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["Pending", "Accepted", "Rejected"];

    if (!status || !allowedStatuses.includes(status)) {
      return next(new ErrorHandler("Please provide a valid status!", 400));
    }

    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found!", 404));
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment Status Updated!",
    });
  }
);

export const cancelMyAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const appointment = await Appointment.findOne({
    _id: id,
    patientId: req.user._id,
  });

  if (!appointment) {
    return next(new ErrorHandler("Appointment not found!", 404));
  }

  if (appointment.status !== "Pending") {
    return next(
      new ErrorHandler("Only pending appointments can be cancelled!", 400)
    );
  }

  await appointment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully!",
  });
});

export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found!", 404));
  }
  await appointment.deleteOne();
  res.status(200).json({
    success: true,
    message: "Appointment Deleted!",
  });
});

export const approveAppointment = catchAsyncErrors(async (req, res) => {
  const appt = await Appointment.findByIdAndUpdate(
    req.params.id, { status: 'approved' }, { new: true }
  );
  res.json(appt);
});

export const completeAppointment = catchAsyncErrors(async (req, res) => {
  const appt = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'completed', doctorNotes: req.body.notes || '' },
    { new: true }
  ).populate('doctorId');

  // Auto-create billing if not already present
  const existing = await Billing.findOne({ appointmentId: appt._id });
  if (!existing) {
    const fee = appt.doctorId.consultationFee || 500;
    const tax = parseFloat((fee * 0.18).toFixed(2));
    await Billing.create({
      appointmentId: appt._id,
      patientId: appt.patientId,
      doctorId: appt.doctorId._id,
      amount: fee,
      tax,
      discount: 0,
      totalAmount: parseFloat((fee + tax).toFixed(2)),
      status: 'unpaid',
      paymentMethod: '',
      invoiceDate: new Date()
    });
  }
  res.json(appt);
});

export const cancelAppointment = catchAsyncErrors(async (req, res) => {
  const appt = await Appointment.findByIdAndUpdate(
    req.params.id, { status: 'cancelled' }, { new: true }
  );
  res.json(appt);
});
