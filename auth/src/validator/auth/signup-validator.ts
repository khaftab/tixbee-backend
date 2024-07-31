import { body } from "express-validator";
import { User } from "../../models/User";
import { BadRequestError } from "../../error/bad-request-error";

export default [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail() // means it will convert the email to lowercase
    .custom(async (email) => {
      const emailId = await User.findOne({ email });
      if (emailId) {
        throw new BadRequestError("Email already exists");
      }
      return true;
    }),

  body("password")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Password must be between 4 and 20 characters"),
];
/*return Promise.reject("Username already exists");
Above line is same as below line or throw new Eror(). Because we have implemented same error in error/request-validation-error.ts file.
throw new Error("Username already exists!!!"); */
