import express from "express";
import { createTicket, getTicketById, getAllTickets, updateTicket } from "../controllers/tickets";
import ticketValidator from "../validator/tickets/ticket-validator";
import { validateRequest } from "@kh-micro-srv/common";
import { currentuser } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.get("/tickets", getAllTickets);
router.post("/tickets", requireAuth, ticketValidator, validateRequest, createTicket);
router.get("/tickets/:id", getTicketById);
router.put("/tickets/:id", requireAuth, ticketValidator, validateRequest, updateTicket);
// router.get("/signout", signout);

export default router;
