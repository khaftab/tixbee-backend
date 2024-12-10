import { Schema, model, Document } from "mongoose";

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
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const MongoPayment = model<PaymentDoc>("Payment", paymentSchema);

class Payment extends MongoPayment {
  constructor(attrs: PaymentAttrs) {
    super(attrs);
  }
}

export { Payment };
