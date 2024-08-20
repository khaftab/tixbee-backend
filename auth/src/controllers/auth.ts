import { Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { BadRequestError } from "@kh-micro-srv/common";

const currentUser = async (req: Request, res: Response) => {
  res.send({ currentUser: req.currentUser || null });
};

const signin = async (req: Request, res: Response) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (!existingUser) throw new BadRequestError("Invalid credentials");
  // existingUser.id returns the string representation of the _id field. 66a53b930eb0168e0501e46b
  // existingUser._id returns the ObjectId. new ObjectId('66a53b930eb0168e0501e46b')
  const { id, email } = existingUser;

  /* 
  MongoDB's ObjectId type is a special type in MongoDB, but when it's included in a JSON object (such as the payload of a JWT), it's automatically converted to a string. This is because JSON doesn't have a native representation for an ObjectId. jwt uses JSON.stringify() to convert the payload to a string, which converts the ObjectId to a string. 
  */

  // so basically, _id or id will do the same job below
  const userJwt = jwt.sign({ id, email }, process.env.JWT_KEY!);

  req.session = {
    // this will be added to req object (set jwt to client) by cookie-session middleware.
    jwt: userJwt,
  };
  res.status(200).send(existingUser);
};

const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Hashing can be done here as well. But we are doing it in pre save hook in User model (best practice).

  const user = new User({ email, password });
  await user.save();

  const userJwt = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_KEY!
  );

  req.session = {
    // this will be added to req object (set jwt to client) by cookie-session middleware.
    jwt: userJwt,
  };
  res.status(201).send(user);
};

const signout = async (req: Request, res: Response) => {
  req.session = null;
  res.send({});
};

export { signin, signup, currentUser, signout };
