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
    credentials: true,
  })
);
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
    sameSite: process.env.NODE_ENV === "test" ? "strict" : "none",
    expires: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7),
  })
);

app.use(currentuser);

setRoutes(app);

app.all("*", () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
