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
