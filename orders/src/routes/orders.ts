import express from "express";
import { createOrder, getOrderById, getAllOrders, deleteOrder } from "../controllers/orders";
import orderValidator from "../validator/orders/order-validator";
import { validateRequest } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.get("/orders", requireAuth, getAllOrders);
router.post("/orders", requireAuth, orderValidator, validateRequest, createOrder);
router.get("/orders/:id", requireAuth, getOrderById);
router.patch("/orders/:id", requireAuth, deleteOrder);
// router.get("/signout", signout);

export default router;
