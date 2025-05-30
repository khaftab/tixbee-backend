import app from "../app";
import request from "supertest";
import jwt from "jsonwebtoken";

// global.signup better not add something to the global object.

export const getCookie = () => {
  const id = (Math.random() * 1000000000).toFixed();
  const email = "test@test.com";

  const token = jwt.sign({ id, email }, process.env.JWT_KEY!);
  const session = { jwt: token };
  const sessionJSON = JSON.stringify(session);
  const base64 = Buffer.from(sessionJSON).toString("base64");
  return [`session=${base64}`];
};

// cookie-session middleware uses base64 data. So, jwt data should be in base64 format for both request and response.

export const createOrder = (ticketId: string) => {
  return request(app).post("/api/orders").set("Cookie", getCookie()).send({ ticketId });
};

export const createOrderWithCookie = (ticketId: string, cookie: string[]) => {
  return request(app).post("/api/orders").set("Cookie", cookie).send({ ticketId });
};
