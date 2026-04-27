import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import { Billing } from "../models/billingSchema.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

const authMiddleware = async (req, res, next) => {
	const authHeader = req.headers.authorization || "";
	const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
		? authHeader.slice(7).trim()
		: null;
	const cookieToken = req.cookies?.adminToken;
	const candidateTokens = [bearerToken, cookieToken].filter(Boolean);

	if (candidateTokens.length === 0) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	for (const token of candidateTokens) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
			const user = await User.findById(decoded.id);

			if (user) {
				req.user = user;
				return next();
			}
		} catch (error) {
			// Try the next candidate token if present.
		}
	}

	return res.status(401).json({ error: "Invalid token" });
};

router.get("/stats", authMiddleware, roleMiddleware("Admin"), async (req, res) => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const [totalPatients, totalDoctors, todayAppts, unpaidBills] = await Promise.all([
			User.countDocuments({ role: "Patient" }),
			User.countDocuments({ role: "Doctor" }),
			Appointment.countDocuments({
				appointment_date: { $gte: today, $lt: tomorrow },
			}),
			Billing.countDocuments({ status: "unpaid" }),
		]);

		res.json({ totalPatients, totalDoctors, todayAppts, unpaidBills });
	} catch (e) {
		console.error("Stats error:", e);
		res.status(500).json({ error: e.message });
	}
});

export default router;