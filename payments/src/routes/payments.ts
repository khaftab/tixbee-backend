import express from "express";
import { createCharge, webhook } from "../controllers/payments";
import paymentValidator from "../validator/payment-validator";
import { validateRequest } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.post("/", express.json(), requireAuth, paymentValidator, validateRequest, createCharge);
router.post("/webhook", express.raw({ type: "application/json" }), webhook);

export default router;
