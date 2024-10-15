import { Schema, model, Document, Date, Model } from "mongoose";
import { Password } from "../utils/passowrd";

interface UserAttrs {
  email: string;
  password: string;
}
// We can also use the UserAttrs interface / or leave it as the output interface but it will not have createdAt and updatedAt properties.

/* 
interface UserModel extends Model<UserDoc> {
  findByEmail(email: string): Promise<UserDoc>;
} For adding custom methods to the model, we need to create a new interface that extends the Model interface and add the custom methods to it. 
*/

interface UserDoc extends Document {
  email: string;
  password: string;
  createdAt: Date; // Remove createdAt, updatedAt if the schema does not have timestamp.
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
// Use <UserDoc, UserModel> if it add custom methods. Otherwise we don't need that.

// Add custom static method
/*
userSchema.statics.findByEmail = function (email: string): Promise<UserDoc> {
  return this.findOne({ email }).exec();
}; Adding custom methods. As of now, we don't need to add any custom methods.
*/

class User extends MongoUser {
  constructor(attrs: UserAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { User };

// Mongoose library is not fully supportive to typescript.
// new Schema<UserAttrs> UserAttrs interface will ensure that the object we pass to the schema is of type UserAttrs. That does not mean that creating a User out of the model will enforce the same interface.
// To enforce the same interface, we need to create a function that will create a User object and that function will enforce the UserAttrs interface.
// mongosh show dbs use auth show collections db.auth.find()
