import mongoose, { Schema, model, Document, Model } from "mongoose";
import { OrderStatus } from "@kh-micro-srv/common";
import { TicketDoc } from "./Ticket";

interface UserAttrs {
  userId: string;
  status: OrderStatus;
  expiresAt: Date; // mongoose.Schema.Types.Date will show error while setting expiresAt in Order object. So, use Date.
  ticket: TicketDoc;
}

interface OrderDoc extends Document {
  userId: string;
  status: OrderStatus;
  expiresAt: Date;
  ticket: TicketDoc;
  version: number;
}
const orderSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Created, // optional
    },
    expiresAt: {
      type: mongoose.Schema.Types.Date,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
  },
  {
    timestamps: true,
    versionKey: "version",
    optimisticConcurrency: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const MongoOrder = model<OrderDoc>("Order", orderSchema);

class Order extends MongoOrder {
  constructor(attrs: UserAttrs) {
    super(attrs);
  }
}

export { Order, OrderStatus };
