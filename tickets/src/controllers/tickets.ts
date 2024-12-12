import { Request, Response } from "express";
import { Ticket, ticketCategory } from "../models/Ticket";
import { NotFoundError, NotAuthorizedError, BadRequestError, logger } from "@kh-micro-srv/common";
import { TicketCreatedPublisher } from "../events/publishers/ticket-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import { TicketUpdatePublisher } from "../events/publishers/ticket-update-publisher";

const createTicket = async (req: Request, res: Response) => {
  const { title, price, category, thumbnailImagePublicId, ticketImagePublicId, description } =
    req.body;

  const ticket = new Ticket({
    title,
    price,
    userId: req.currentUser!.id,
    category,
    thumbnailImagePublicId,
    ticketImagePublicId,
    description,
  });
  await ticket.save();
  new TicketCreatedPublisher(natsWrapper.client).publish({
    id: ticket.id,
    title: ticket.title,
    price: ticket.price,
    category: ticket.category,
    thumbnailImagePublicId: ticket.thumbnailImagePublicId,
    ticketImagePublicId: ticket.ticketImagePublicId,
    description: ticket.description,
    userId: ticket.userId,
    version: ticket.version,
    orderId: null,
  }); // it is better to use ticket.title rather than req.body.title. Because we might perform some pre-save hooks on the ticket model that could change the value.
  logger.info("Ticket created", { userId: req.currentUser!.id, ticketId: ticket.id });
  res.status(201).send(ticket);
};

const getTicketById = async (req: Request, res: Response) => {
  // req.params.id is a string. like "66c6d8f4f2a83ed3e0942234"
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new NotFoundError();
  }
  if (ticket.userId !== (req.currentUser && req.currentUser.id)) {
    ticket.ticketImagePublicId = ""; // hide the ticket image if the user is not the owner of the ticket
  }
  res.status(200).send(ticket);
};

const getTicketsByCategory = async (req: Request, res: Response) => {
  const category = req.params.category;
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const sortBy = req.query.sortBy === "price" ? "price" : "updatedAt";
  const filterBy = req.query.filterBy || "all"; // mytickets, all. myTickets will show only the tickets created by the user.
  const currentPage = typeof req.query.page === "string" ? parseInt(req.query.page) : 1;
  const itemPerPage = 6;

  if (!category || !Object.keys(ticketCategory).includes(category)) {
    throw new BadRequestError("Category does not exist");
  }

  let filter: any = { category, orderStatus: { $ne: "complete" } };

  if (category === "all") {
    // get all tickets
    delete filter.category;
  }
  if (filterBy === "mytickets") {
    req.currentUser && (filter.userId = req.currentUser!.id);
    if (!req.currentUser) {
      throw new NotAuthorizedError();
    }
  }

  const tickets = await Ticket.aggregate([
    { $match: filter },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: (currentPage - 1) * itemPerPage },
    { $limit: itemPerPage },
    {
      $addFields: {
        id: "$_id",
        // "id": "$_id",
        ticketImagePublicId: {
          $cond: {
            if: { $ne: ["$userId", req.currentUser && req.currentUser.id] },
            then: "",
            else: "$ticketImagePublicId",
          },
        },
      },
    },
    { $project: { _id: 0, __v: 0 } },
  ]);

  const totalTickets = await Ticket.countDocuments(filter);

  res.status(200).send({ tickets, totalTickets });
};

const updateTicket = async (req: Request, res: Response) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new NotFoundError();
  }
  if (ticket.orderId) {
    throw new BadRequestError("Cannot edit a reserved ticket");
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
    category: ticket.category,
    thumbnailImagePublicId: ticket.thumbnailImagePublicId,
    ticketImagePublicId: ticket.ticketImagePublicId,
    description: ticket.description,
    userId: ticket.userId,
    version: ticket.version,
    orderId: ticket.orderId,
  });
  res.status(200).send(ticket);
};

const deleteTicket = async (req: Request, res: Response) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new NotFoundError();
  }
  if (ticket.orderId) {
    throw new BadRequestError("Cannot delete a reserved ticket");
  }
  if (ticket.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }
  // delete ticket
  await ticket.deleteOne({ _id: ticket.id });
  res.status(204).send({}); // 204 means no content
};

export { createTicket, getTicketById, getTicketsByCategory, updateTicket, deleteTicket };
