import { Request, Response } from "express";
import { Ticket } from "../models/Ticket";
import { Order } from "../models/Order";
import { NotFoundError, OrderStatus, BadRequestError, logger } from "@kh-micro-srv/common";
import { natsWrapper } from "../nats-wrapper";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";
import { AddUserToQueuePublisher } from "../events/publishers/add-user-queue-publisher";

const EXPIRATION_WINDOW_SECONDS = 3 * 60;

const createOrder = async (req: Request, res: Response) => {
  // Find the ticket the user is trying to order in the database
  const ticket = await Ticket.findById(req.body.ticketId);
  if (!ticket) {
    throw new NotFoundError();
  }
  const existingOrder = await Order.find({
    userId: req.currentUser!.id,
    status: OrderStatus.Created,
    ticket: ticket.id,
  });
  if (existingOrder.length) {
    return res.status(206).send({ orderId: existingOrder[0].id });
  }
  // Make sure that this ticket is not already reserved
  const isReserved = await ticket.isReserved();
  if (isReserved === OrderStatus.Complete) {
    throw new BadRequestError("Ticket is already reserved");
  }

  if (isReserved === OrderStatus.Created) {
    logger.info("User added to the queue", { ticketId: ticket.id, userId: req.currentUser!.id });
    await new AddUserToQueuePublisher(natsWrapper.client).publish({
      ticketId: ticket.id,
      userId: req.currentUser!.id,
    });
    return res.status(202).send({ ticketId: ticket.id });
  }
  // Calculate an expiration date for this order
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS); // 15 minutes
  // // Build the order and save it to the database
  const order = new Order({
    userId: req.currentUser!.id,
    status: OrderStatus.Created,
    expiresAt: expiration,
    ticket,
  });
  await order.save();
  // Publish an event saying that an order was created
  logger.info("Order created", { orderId: order.id, ticketId: ticket.id });
  try {
    await new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      userId: order.userId,
      status: order.status,
      expiresAt: order.expiresAt.toISOString(), // isoString (utc format) is used to standardize the date format across different timezones.
      version: order.version,
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
      // version: order.version,
    });
  } catch (error) {
    logger.error(error);
  }

  res.status(201).send(order);
};

const getOrderById = async (req: Request, res: Response) => {
  // req.params.id is a string. like "66c6d8f4f2a83ed3e0942234"
  const order = await Order.find({ _id: req.params.id, userId: req.currentUser!.id }).populate(
    "ticket"
  ); // returns an array with one element

  if (!order.length) {
    throw new NotFoundError();
  }
  if (order[0].status !== OrderStatus.Complete) {
    order[0].ticket.ticketImagePublicId = "";
  }
  // @ts-ignore
  order[0].serverTime = new Date().toISOString();
  console.log(order[0]);

  res.status(200).send({ ...order[0].toObject(), serverTime: new Date().toISOString() });

  // res.status(200).send(order[0]);
};

const getAllOrders = async (req: Request, res: Response) => {
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const sortBy = req.query.sortBy === "price" ? "ticket.price" : "updatedAt";
  const filterBy = req.query.filterBy || "all";

  // Create the status filter
  let statusFilter = {};
  if (filterBy === "complete") {
    statusFilter = { status: "complete" };
  } else if (filterBy === "cancelled") {
    statusFilter = { status: "cancelled" };
  } else if (filterBy === "all") {
    statusFilter = { status: { $in: ["created", "complete", "cancelled"] } };
  }

  const currentPage = typeof req.query.page === "string" ? parseInt(req.query.page) : 1;
  const itemsPerPage = 6;

  const orders = await Order.aggregate([
    { $match: { userId: req.currentUser!.id, ...statusFilter } },
    { $lookup: { from: "tickets", localField: "ticket", foreignField: "_id", as: "ticket" } },
    { $unwind: "$ticket" },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: (currentPage - 1) * itemsPerPage },
    { $limit: itemsPerPage },
    {
      $addFields: {
        id: "$_id",
        "ticket.id": "$ticket._id",
        "ticket.ticketImagePublicId": {
          $cond: {
            if: { $ne: ["$status", "complete"] },
            then: "",
            else: "$ticket.ticketImagePublicId",
          },
        },
      },
    },
    { $project: { _id: 0, __v: 0, "ticket._id": 0, "ticket.__v": 0 } },
  ]);

  const totalOrders = await Order.countDocuments({ userId: req.currentUser!.id, ...statusFilter });

  res.status(200).send({ orders, totalOrders });
};

const deleteOrder = async (req: Request, res: Response) => {
  const order = await Order.find({ _id: req.params.id, userId: req.currentUser!.id }).populate(
    "ticket"
  ); // returns an array with one element

  if (!order.length) {
    throw new NotFoundError();
  }
  if (order[0].status === OrderStatus.Cancelled) {
    throw new BadRequestError("Order is already cancelled");
  }
  order[0].status = OrderStatus.Cancelled;
  await order[0].save();

  await new OrderCancelledPublisher(natsWrapper.client).publish({
    id: order[0].id,
    version: order[0].version,
    ticket: {
      id: order[0].ticket.id,
    },
    // version: order[0].version,
  });
  logger.info("Order cancelled", { orderId: order[0].id, ticketId: order[0].ticket.id });
  res.status(204).send(); // 204 means no content. Even if we send some content, it will not be shown in the response.
};

export { createOrder, getOrderById, getAllOrders, deleteOrder };
