import { Request, Response } from "express";
import { Ticket } from "../models/Ticket";
import { NotFoundError, NotAuthorizedError } from "@kh-micro-srv/common";
import mongoose from "mongoose";
import { TicketCreatedPublisher } from "../events/publishers/ticket-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import { TicketUpdatePublisher } from "../events/publishers/ticket-update-publisher";

const createTicket = async (req: Request, res: Response) => {
  const { title, price } = req.body;

  const ticket = new Ticket({
    title,
    price,
    userId: req.currentUser!.id, // we are sure that currentUser middleware will run before this middleware. And it is behind the requireAuth middleware.
  });
  await ticket.save();
  new TicketCreatedPublisher(natsWrapper.client).publish({
    id: ticket.id,
    title: ticket.title,
    price: ticket.price,
    userId: ticket.userId,
  }); // it is better to use ticket.title rather than req.body.title. Because we might perform some pre-save hooks on the ticket model that could change the value.
  res.status(201).send(ticket);
};

const getTicketById = async (req: Request, res: Response) => {
  // req.params.id is a string. like "66c6d8f4f2a83ed3e0942234"
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new NotFoundError();
  }
  res.status(200).send(ticket);
};

const getAllTickets = async (req: Request, res: Response) => {
  const tickets = await Ticket.find({});
  res.status(200).send(tickets);
};

const updateTicket = async (req: Request, res: Response) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new NotFoundError();
  }
  if (ticket.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }
  ticket.set(req.body);
  await ticket.save();
  await new TicketUpdatePublisher(natsWrapper.client).publish({
    id: ticket.id,
    title: ticket.title,
    price: ticket.price,
    userId: ticket.userId,
    // version: ticket.version,
  });
  res.status(200).send(ticket);
};

export { createTicket, getTicketById, getAllTickets, updateTicket };
