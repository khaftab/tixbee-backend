import express from "express";
import { createCharge } from "../controllers/payments";
import paymentValidator from "../validator/payment-validator";
import { validateRequest } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.post("/payments", requireAuth, paymentValidator, validateRequest, createCharge);

export default router;
