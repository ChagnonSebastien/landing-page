const express = require('express');

const app = express();

const { Firestore } = require('@google-cloud/firestore');

// Instantiate a datastore client
const firestore = new Firestore();

app.get('/version', (_, res) => res.send('v1.0.0'));

app.get('/spot/batteryState', (_, res) => {
  firestore.collection('locationHistory').orderBy('timestamp').limit(1).get()
    .then((locationQuery) => {
      if (locationQuery.empty) {
        res.status(404).send();
        return;
      }
      
      res.send(locationQuery.docs[0].data().batteryState);
    })
    .catch((reason) => res.status(500).send(reason));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;