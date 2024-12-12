import express from "express";
import {
  createTicket,
  getTicketById,
  getTicketsByCategory,
  updateTicket,
  deleteTicket,
} from "../controllers/tickets";
import ticketValidator from "../validator/tickets/ticket-validator";
import { validateRequest } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.get("/tickets/category/:category", getTicketsByCategory);
router.post("/tickets", requireAuth, ticketValidator, validateRequest, createTicket);
router.get("/tickets/:id", getTicketById);
router.put("/tickets/:id", requireAuth, ticketValidator, validateRequest, updateTicket);
router.delete("/tickets/:id", requireAuth, deleteTicket);
// router.get("/signout", signout);

export default router;
