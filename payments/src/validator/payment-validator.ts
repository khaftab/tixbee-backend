import { body } from "express-validator";

const paymentValidator = [
  body("token").not().isEmpty().withMessage("Token is required"),
  body("orderId").not().isEmpty().withMessage("Order Id is required"),
];

export default paymentValidator;
