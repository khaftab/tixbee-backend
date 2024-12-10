import { Schema, model, Document } from "mongoose";

interface OrderAttrs {
  _id?: string;
  userId: string;
  price: number;
  status: string;
}

interface OrderDoc extends Document {
  version: number;
  userId: string;
  price: number;
  status: string;
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
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false,
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
  constructor(attrs: OrderAttrs) {
    super(attrs);
  }
}

export { Order };
