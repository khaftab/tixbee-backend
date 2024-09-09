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

export const createTicket = (
  title?: string,
  price?: number,
  category?: string,
  imagePublicId?: string,
  description?: string
) => {
  return request(app)
    .post("/api/tickets")
    .set("Cookie", getCookie())
    .send({
      title,
      price,
      category: category || "concert",
      imagePublicId: imagePublicId || "123",
      description: description || "test",
    });
};
