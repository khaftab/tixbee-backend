import express from "express";
import { createCharge, webhook } from "../controllers/payments";
import paymentValidator from "../validator/payment-validator";
import { logger, validateRequest } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.post("/", express.json(), requireAuth, paymentValidator, validateRequest, createCharge);
router.post("/webhook", express.raw({ type: "application/json" }), webhook);
router.get("/test", (req, res) => {
  logger.info("Env chekc in payments route", {
    JWT_KEY: process.env.JWT_KEY,
    MONGO_URI: process.env.MONGO_URI,
    NATS_URL: process.env.NATS_URL,
    SERVICE_NAME: process.env.SERVICE_NAME,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_KEY: process.env.STRIPE_KEY,
    TIXBEE_SOURCE_TOKEN: process.env.TIXBEE_SOURCE_TOKEN,
    ORIGIN_URL: process.env.ORIGIN_URL,
  });
  res.send("Payments service is running.");
});

export default router;
