import { Schema, model, Document, Date, Model } from "mongoose";

interface UserAttrs {
  title: string;
  price: number;
  userId: string;
}
// We can also use the UserAttrs interface / or leave it as the output interface but it will not have createdAt and updatedAt properties.

/* 
interface UserModel extends Model<UserDoc> {
  findByEmail(email: string): Promise<UserDoc>;
} For adding custom methods to the model, we need to create a new interface that extends the Model interface and add the custom methods to it. 
*/

interface TicketDoc extends Document {
  title: string;
  price: number;
  userId: string;
  // createdAt: Date; // Remove createdAt, updatedAt if the schema does not have timestamp.
  // updatedAt: Date;
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
    userId: {
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

const MongoTicket = model<TicketDoc>("Ticket", ticketSchema);
// Use <UserDoc, UserModel> if it add custom methods. Otherwise we don't need that.

// Add custom static method
/*
userSchema.statics.findByEmail = function (email: string): Promise<UserDoc> {
  return this.findOne({ email }).exec();
}; Adding custom methods. As of now, we don't need to add any custom methods.
*/

class Ticket extends MongoTicket {
  constructor(attrs: UserAttrs) {
    // This will prevent creating new User with invalid key value.
    super(attrs);
  }
}

export { Ticket };

// Mongoose library is not fully supportive to typescript.
// new Schema<UserAttrs> UserAttrs interface will ensure that the object we pass to the schema is of type UserAttrs. That does not mean that creating a User out of the model will enforce the same interface.
// To enforce the same interface, we need to create a function that will create a User object and that function will enforce the UserAttrs interface.
// mongosh show dbs use auth show collections db.auth.find()
