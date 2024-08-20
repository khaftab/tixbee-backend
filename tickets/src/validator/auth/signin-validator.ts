import { body } from "express-validator";
import { User } from "../../models/User";
import { Password } from "../../utils/passowrd";
export default [
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email cannot be empty")
    .normalizeEmail() // means it will convert the email to lowercase
    .isEmail()
    .withMessage("Please enter a valid email")
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email });

      req.user = user;
      if (!user) {
        return Promise.reject("No user is exists with this email");
      }
      return true;
    }),

  body("password")
    .not()
    .isEmpty()
    .withMessage("Password cannot be empty")
    .custom(async (password, { req }) => {
      if (!req.user) {
        return true;
      }
      const result = req.user && (await Password.compare(req.user.password, password));

      if (!result) {
        return Promise.reject("Password is wrong");
      }
      return true;
    }),
];
