const express = require('express');

const app = express();

const { Firestore, Timestamp } = require('@google-cloud/firestore');

// Instantiate a datastore client
const firestore = new Firestore();

app.get('/version', (_, res) => res.send('v1.0.0'));

app.get('/spot/batteryState', (_, res) => {
  firestore.collection('locationHistory').orderBy('timestamp').limit(1).get()
    .then((locationQuery) => {
      if (locationQuery.empty) {
        res.status(404).send('No battery state has ever been recorded.');
        return;
      }
      
      res.send(locationQuery.docs[0].data().batteryState);
    })
    .catch((reason) => res.status(500).send(reason));
});

app.get('/expeditions/:expeditionId/locationHistory', (req, res) => {
  firestore.collection('expeditions').doc(req.params.expeditionId).get()
    .then(async (expeditionSnapshot) => {
      if (!expeditionSnapshot.exists) {
        res.status(404).send('Expedition does not exist.');
        return;
      }

      let query = firestore.collection('locationHistory').orderBy('timestamp', 'asc');
      if (req.query.date) {
        const from = new Date(Date.parse(req.query.date));
        if (!(from instanceof Date && !isNaN(from))) {
          res.status(400).send('Invalid date format. The ISO format is required.');
          return;
        }

        const to = new Date(from)
        to.setDate(from.getDate() + 1);
        query = query
          .where('timestamp', '>', Timestamp.fromDate(from))
          .where('timestamp', '<', Timestamp.fromDate(to));
      } else {
        query = query
          .where('timestamp', '>', expeditionSnapshot.data().from)
          .where('timestamp', '<', expeditionSnapshot.data().to)
          .where('messageType', '==', 'OK');
      }

      const locationQuery = await query.get();
      if (locationQuery.empty) {
        res.status(204).send([]);
        return;
      }

      res.send(locationQuery.docs.map((docSnapshot) => {
        const { timestamp, location, ...otherData } = docSnapshot.data();
        return {
          ...otherData,
          location: { latitude: location.latitude, longitude: location.longitude },
          timestamp: timestamp.toMillis(),
        }
      }));

    })
    .catch((reason) => res.status(500).send(reason));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;