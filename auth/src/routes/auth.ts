import express from "express";
import { currentUser, getUser, signin, signout, signup, updateUser } from "../controllers/auth";
import signupValidator from "../validator/auth/signup-validator";
import signinValidator from "../validator/auth/signin-validator";
import updateUserValidator from "../validator/auth/update-user-validator";
import { validateRequest } from "@kh-micro-srv/common";
import { currentuser } from "@kh-micro-srv/common";
import { requireAuth } from "@kh-micro-srv/common";

const router = express.Router();

router.get("/currentuser", currentuser, currentUser);
router.get("/user", requireAuth, getUser);
router.post("/signin", signinValidator, validateRequest, signin);
router.post("/signup", signupValidator, validateRequest, signup);
router.put("/update", requireAuth, updateUserValidator, validateRequest, updateUser);
router.get("/signout", signout);

export default router;
