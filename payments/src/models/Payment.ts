import { Schema, model, Document } from "mongoose";
import { OrderStatus } from "@kh-micro-srv/common";

interface PaymentAttrs {
  orderId: string;
  stripeId: string;
}

interface PaymentDoc extends Document {
  orderId: string;
  stripeId: string;
}

const paymentSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    stripeId: {
      type: String,
      required: true,
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

const MongoPayment = model<PaymentDoc>("Payment", paymentSchema);

class Payment extends MongoPayment {
  constructor(attrs: PaymentAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { Payment };
// Exporting OrderStatus just to make it relevant (order related suff).
