import * as express from 'express';

const blogMessages = express();

blogMessages.use('/', (request, response) => {
  response.send("0.1");
});

export default blogMessages;