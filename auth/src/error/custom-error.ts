export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message); // This will call the Error class constructor and will set the message property of the Error class. This is same as calling new Error(message). By doing this we can see the error message in the console. It will help us in debugging by logging.
    Object.setPrototypeOf(this, CustomError.prototype);
    // The above line is used to fix the issue of extending built-in classes. When we extend a built-in class, the prototype chain is not set properly. So, we are setting the prototype chain manually here.
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}

// We are implenting a abstract class just to make sure that any class that extends this class must implement the serializeErrors method correctly. (Not any typo)
// We can also make use of interface but then we have to add the interface in each error class that we create. So, we are using abstract class here.
