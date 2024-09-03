const publishMock = jest.fn().mockImplementation((subject: string, data: string) => {
  return new Promise<void>((resolve, reject) => {
    resolve();
  });
});

export const natsWrapper = {
  client: {
    jetstream: () => {
      return { publish: publishMock };
    },

    // client: {
    //   jetstream: () => {
    //     return {
    //       publish: jest.fn().mockImplementation((subject: string, data: string) => {
    //         return new Promise<object>((resolve, reject) => {
    //           console.log("I am getting called");
    //           resolve({ data: "hak" });
    //         });
    //       }),
    //     };
    //   },
    jetstreamManager: () => {
      return new Promise<object>((resolve, reject) => {
        resolve({
          streams: {
            add: () => {
              return new Promise<void>((resolve, reject) => {
                resolve();
              });
            },
          },
        });
      });
    },
  },
};
// jest.fn().mockImplementation is used to mock the natsWrapper.client.jetstream().publish method. To test that we are publishing message by calling that function. We are using jest.fn() to create a mock function and then using mockImplementation to provide a custom implementation for the function.

/*
The key difference from the commented code is that we're creating these mocks outside of the client object. This means they're only created once, rather than every time jetstream() is called.

In the commented code, every time jetstream() was called, it would create a new mock for publish. This meant that even if you called publish(), the mock that Jest was checking hadn't actually been called.

With this new setup:

Every time jetstream() is called, it returns the same object with the same publish mock.
This means that no matter how many times you call jetstream(), you're always dealing with the same publishMock.

This extra step is not required when checking the jetstream function with toHaveBeenCalled().
 */
