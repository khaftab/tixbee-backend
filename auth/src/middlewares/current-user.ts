import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/*  If UserPayload being incorrectly typed no error will be thrown. TypeScript's type system is static and primarily used for development-time type checking. Since there are no type checks for the actual runtime values, TypeScript won't throw errors during execution. */
interface UserPayload {
  id: string;
  email: string;
  iat: number;
}
// This is a declaration merging. It's a way to extend the Request interface in Express. We are adding a new property called currentUser to the Request interface. This property will be used to store the payload of the JWT token.
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentuser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.jwt) {
    return next();
  }

  try {
    const payload = jwt.verify(req.session.jwt, process.env.JWT_KEY!) as UserPayload;

    req.currentUser = payload;
  } catch (err) {}

  next();
};
