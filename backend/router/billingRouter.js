import express from "express";
import { Billing } from "../models/billingSchema.js";
import { isPatientAuthenticated } from "../middlewares/auth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get('/patient/:patientId', isPatientAuthenticated, async (req, res) => {
  try {
    const bills = await Billing.find({ patientId: req.params.patientId })
      .populate('appointmentId')
      .populate('doctorId', 'firstName lastName doctorDepartment')
      .sort({ invoiceDate: -1 });
    res.json(bills);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/all', roleMiddleware('Admin'), async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate('appointmentId')
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .sort({ invoiceDate: -1 });
    res.json(bills);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', isPatientAuthenticated, async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const bill = await Billing.findByIdAndUpdate(req.params.id, { status, paymentMethod }, { new: true });
    res.json(bill);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;