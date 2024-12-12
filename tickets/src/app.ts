import express from "express";
import "express-async-errors";
import setRoutes from "./routes/routes";
import { currentuser, errorHandler } from "@kh-micro-srv/common";
import { NotFoundError } from "@kh-micro-srv/common";
import cookieSession from "cookie-session";
var cors = require("cors");

const app = express();
// enable cors
app.use(
  cors({
    origin: ["https://localhost:3200", "http://localhost:5173"],
    credentials: true,
  })
);
app.set("trust proxy", true);
app.use(express.json({ limit: "10mb" })); // Increase JSON payload limit
app.use(
  cookieSession({
    signed: false, // Disable encryption on cookie because JWT is already encrypted. And other services need to read the cookie as well where they might not know decryption algorithm.
    secure: process.env.NODE_ENV !== "test", // Cookie will only be used if user is visiting our app over https connection. This is to make sure that cookie is not used over http connection.
    sameSite: process.env.NODE_ENV === "test" ? "strict" : "none", // This is to make sure that cookie is used in cross domain requests.
    // partitioned: true,
    // domain: "ticket.dev",
    expires: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7), // 7 days
  })
);

app.use(currentuser);

app.use((req, res, next) => {
  // Reset the cookie maxAge every time the user makes a request
  req.sessionOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  next();
});

setRoutes(app);

app.all("*", () => {
  throw new NotFoundError();
});

// For sync functions, we can throw error and express will handle it. But for async functions, we need to use next(err) to handle the error. To make express handle async functions, we need to import "express-async-errors" package and that's it. Express will handle async functions as well just like sync functions.

app.use(errorHandler);
export default app;

// The ingress controller has ssl certificate but it not signed by any CA. So, browser will prevent to visit the site. type "thisisunsafe" to bypass the warning...
