import { Schema, model, Document, Date, Model } from "mongoose";
import { Order, OrderStatus } from "./Order";

interface TicketAttrs {
  title: string;
  price: number;
}

interface TicketDoc extends Document {
  title: string;
  price: number;
  isReserved(): Promise<boolean>;
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
  },
  {
    timestamps: false,
    versionKey: false,
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
