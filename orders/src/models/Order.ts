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
    timestamps: false,
    versionKey: "version",
    optimisticConcurrency: true,
    toJSON: {
      // This will ONLY modify the response if it is converted to JSON. In epxress res.send(user) implicitly converts the user to JSON. So, it will modify the JSON response. In nomral db calls, it will not modify the response.
      transform: (doc, ret) => {
        ret.id = ret._id; // Change _id to id for standardization.
        delete ret._id;
      },
    },
  }
);

const MongoOrder = model<OrderDoc>("Order", orderSchema);

class Order extends MongoOrder {
  constructor(attrs: UserAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { Order, OrderStatus };
// Exporting OrderStatus just to make it relevant (order related suff).
