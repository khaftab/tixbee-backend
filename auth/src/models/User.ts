import { Schema, model, Document, Date, Model } from "mongoose";
import { Password } from "../utils/passowrd";

interface UserAttrs {
  email: string;
  password: string;
}

interface UserDoc extends Document {
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  billingAddress?: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
  };
}
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    billingAddress: {
      name: {
        type: String,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
      postalCode: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      state: {
        type: String,
        required: false,
      },
      country: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      // This will ONLY modify the response if it is converted to JSON. In epxress res.send(user) implicitly converts the user to JSON. So, it will modify the JSON response. In nomral db calls, it will not modify the response.
      transform: (doc, ret) => {
        ret.id = ret._id; // Change _id to id for standardization.
        delete ret._id;
        delete ret.password;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  // Arrow function will not work here because we need to use this keyword.
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  next();
});

const MongoUser = model<UserDoc>("User", userSchema);

class User extends MongoUser {
  constructor(attrs: UserAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { User };
