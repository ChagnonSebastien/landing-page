import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import expeditionsRoute from './routes/expedition';
import * as spotService from './services/spot';

const app = express();

app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method}:${req.url}`);
  next();
});
app.get('/', (_, res) => res.send('coucou ^^'));

app.get('/version', (_, res) => res.send('v1.0.0'));

app.get('/spot/batteryState', async (_, res) => {
  try {
    const batteryState = await spotService.getAllPoints();

    if (batteryState === undefined) {
      return res.status(404).send('No battery state has ever been recorded.');
    }

    return res.send(batteryState);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.use('/expeditions', expeditionsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;
