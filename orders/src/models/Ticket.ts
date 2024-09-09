import { Schema, model, Document, Date, Model } from "mongoose";
import { Order, OrderStatus } from "./Order";

interface TicketAttrs {
  _id?: string; // To create a new ticket with custom id.
  title: string;
  price: number;
  category: string;
  description: string;
  imagePublicId: string;
}

interface TicketDoc extends Document {
  title: string;
  price: number;
  category: string;
  description: string;
  imagePublicId: string;
  isReserved(): Promise<boolean>;
  version: number; // optimistic concurrency control will only be in action, when you try to update the document using save() method. It will not work with findOneAndUpdate() and other method that does not use save() method. Hence, it also does not increment the version number.
}

const ticketSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: "version", // Version key is not Required to work with optimistic concurrency control. We are adding this for better debugging. Mongoose internally keep track of the version to handle the concurrency control. But the value is same (internal and versionKey).,
    optimisticConcurrency: true, // Enable optimistic concurrency control. (Versioning)
    toJSON: {
      // This will ONLY modify the response if it is converted to JSON. In epxress res.send(user) implicitly converts the user to JSON. So, it will modify the JSON response. In nomral db calls, it will not modify the response.
      transform: (doc, ret) => {
        ret.id = ret._id; // Change _id to id for standardization.
        delete ret._id;
      },
    },
  }
);

ticketSchema.methods.isReserved = async function () {
  // this === the ticket document that we just called 'isReserved' on
  /*
    Make sure that this ticket is not already reserved
    Run query to look at all orders. Find an order where the ticket
    is the ticket we just found *and* the orders status is *not* cancelled
    If we find an order from that means the ticket *is* reserved
   */
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      $in: [
        // get orders with these statuses. (Excluding Cancelled)
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });
  return !!existingOrder;
};

const MongoTicket = model<TicketDoc>("Ticket", ticketSchema);

class Ticket extends MongoTicket {
  constructor(attrs: TicketAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { Ticket, TicketDoc };
