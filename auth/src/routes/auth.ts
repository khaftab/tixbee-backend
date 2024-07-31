import express from "express";
import { currentUser, signin, signout, signup } from "../controllers/auth";
import signupValidator from "../validator/auth/signup-validator";
import signinValidator from "../validator/auth/signin-validator";
import { validateRequest } from "../middlewares/validate-request";
import { currentuser } from "../middlewares/current-user";
import { requireAuth } from "../middlewares/require-auth";

const router = express.Router();

router.get("/currentuser", currentuser, currentUser);
router.post("/signin", signinValidator, validateRequest, signin);
router.post("/signup", signupValidator, validateRequest, signup);
router.get("/signout", signout);

export default router;
