import express from "express";
import "express-async-errors";
import setRoutes from "./routes/routes";
import { errorHandler } from "./middlewares/error-handler";
import { NotFoundError } from "./error/not-found";
import cookieSession from "cookie-session";

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cookieSession({
    signed: false, // Disable encryption on cookie because JWT is already encrypted. And other services need to read the cookie as well where they might not know decryption algorithm.
    secure: process.env.NODE_ENV !== "test", // Cookie will only be used if user is visiting our app over https connection. This is to make sure that cookie is not used over http connection.
  })
);
setRoutes(app);

app.all("*", () => {
  throw new NotFoundError();
});

// For sync functions, we can throw error and express will handle it. But for async functions, we need to use next(err) to handle the error. To make express handle async functions, we need to import "express-async-errors" package and that's it. Express will handle async functions as well just like sync functions.

app.use(errorHandler);
export default app;

// The ingress controller has ssl certificate but it not signed by any CA. So, browser will prevent to visit the site. type "thisisunsafe" to bypass the warning...
