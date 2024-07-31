import { CustomError } from "./custom-error";

export class DatabaseConnectionError extends CustomError {
  reason = "Error connecting to database";
  statusCode = 500;
  constructor() {
    super("Error connecting to database");
    // Only because we are extending a built in class
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeErrors() {
    return [{ message: this.reason }];
  }
}

// By extending the CustomError class, we are making sure that the DatabaseConnectionError class must implement the serializeErrors method correctly which is returning the exact datastucre that we want to send back to the client.
