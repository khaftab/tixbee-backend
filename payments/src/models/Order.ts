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
  constructor(attrs: OrderAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { Order };
// Exporting OrderStatus just to make it relevant (order related suff).
