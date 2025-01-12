import express from "express";
import "express-async-errors";
import setRoutes from "./routes/routes";
import { currentuser, errorHandler } from "@kh-micro-srv/common";
import { NotFoundError } from "@kh-micro-srv/common";
import cookieSession from "cookie-session";
var cors = require("cors");

const app = express();
app.use(
  cors({
    origin: JSON.parse(process.env.ORIGIN_URL || "[]"),
    // origin: "http://localhost:5173",
    credentials: true, // This is to allow cookies to be sent from browser to server.
  })
);
// CORS is not required thoughout the app except in the queue service (Establish socket connection from browser). Because, all of the api calls are made from the frontend server side code not from the browser. So, we can remove the cors from all the services except the queue service.
// However, in future, if we need to make api calls from the browser, so, CORS will be required. So, we can keep it in all the services.
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cookieSession({
    signed: false, // Disable encryption on cookie because JWT is already encrypted. And other services need to read the cookie as well where they might not know decryption algorithm.
    secure: process.env.NODE_ENV !== "development", // Cookie will only be used if user is visiting our app over https connection. In test environment, we will not have https connection. So, we will set it to false.
    sameSite: process.env.NODE_ENV === "development" ? "strict" : "none", // This is to make sure that cookie is used in cross domain requests.
    // partitioned: true,
    // domain: "ticket.dev",
    expires: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7), // 7 days
  })
);

// The cookie will be in base64 format (done by cookie-session). To check the data in jwt website decode it to utf-8. The data will be in json format.

app.use(currentuser);

setRoutes(app);

app.all("*", () => {
  throw new NotFoundError();
});

// For sync functions, we can throw error and express will handle it. But for async functions, we need to use next(err) to handle the error. To make express handle async functions, we need to import "express-async-errors" package and that's it. Express will handle async functions as well just like sync functions.

app.use(errorHandler);
export default app;
