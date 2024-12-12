import { Schema, model, Document, Date, Model } from "mongoose";

export const ticketCategory = {
  conference: "Conference",
  lecture: "Lecture",
  workshop: "Workshop",
  auction: "Auction",
  concert: "Concert",
  theater: "Theater",
  other: "Other",
  all: "All",
};

interface UserAttrs {
  title: string;
  price: number;
  userId: string;
  category: string;
  description: string;
  thumbnailImagePublicId: string;
  ticketImagePublicId: string;
}

interface TicketDoc extends Document {
  title: string;
  price: number;
  userId: string;
  version: number;
  orderId: string;
  category: string;
  description: string;
  thumbnailImagePublicId: string;
  ticketImagePublicId: string;
  orderStatus: string;
  createdAt: Date;
  updatedAt: Date;
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
    },
    category: {
      type: String,
      required: true,
      enum: Object.keys(ticketCategory),
    },
    description: {
      type: String,
      required: true,
    },
    thumbnailImagePublicId: {
      type: String,
      required: true,
    },
    ticketImagePublicId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String, // This will be null if the ticket is not reserved.
      default: null,
    },
    orderStatus: {
      type: String,
      default: null,
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

const MongoTicket = model<TicketDoc>("Ticket", ticketSchema);

class Ticket extends MongoTicket {
  constructor(attrs: UserAttrs) {
    super(attrs);
  }
}

export { Ticket };
