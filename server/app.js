const express = require('express');
const cors = require('cors');
const app = express();

const { Firestore, Timestamp } = require('@google-cloud/firestore');

// Instantiate a datastore client
const firestore = new Firestore();

app.use(cors());

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

app.get('/expeditions', (_, res) => {
  firestore.collection('expeditions').get()
    .then((expeditionsQuery) => {
      if (expeditionsQuery.empty) {
        res.status(204).send([]);
        return;
      }

      res.send(expeditionsQuery.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })));
    })
    .catch((reason) => res.status(500).send(reason));
});

app.get('/expeditions/:expeditionId', (req, res) => {
  firestore.collection('expeditions').doc(req.params.expeditionId).get()
    .then((expeditionSnapshot) => {
      if (!expeditionSnapshot.exists) {
        res.status(404).send('Expedition does not exist.');
        return;
      }

      res.send({
        id: expeditionSnapshot.id,
        ...expeditionSnapshot.data(),
      });
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

      const expedition = expeditionSnapshot.data();
      const { findTimeZone, getUnixTime } = require('timezone-support');
      const timezone = findTimeZone(expedition.timezone);

      const fromSplit = expedition.from.split('-');
      const fromData = { year: Number(fromSplit[0]), month: Number(fromSplit[1]), day: Number(fromSplit[2]), hours: 0, minutes: 0 };
      const expeditionFrom = new Date(getUnixTime(fromData, timezone))

      const toSplit = expedition.to.split('-');
      const toData = { year: Number(toSplit[0]), month: Number(toSplit[1]), day: Number(toSplit[2]), hours: 23, minutes: 59 };
      const expeditionTo = new Date(getUnixTime(toData, timezone))

      let query = firestore.collection('locationHistory').orderBy('timestamp', 'asc');
      if (req.query.date) {
        const reqSplit = req.query.date.split('-');
        const reqData = { year: Number(reqSplit[0]), month: Number(reqSplit[1]), day: Number(reqSplit[2]), hours: 0, minutes: 0 };
        const reqDate = new Date(getUnixTime(reqData, timezone));
        if (!(reqDate instanceof Date && !isNaN(reqDate))) {
          res.status(400).send('Invalid date format. The ISO format is required.');
          return;
        }

        if (expeditionFrom.getTime() > reqDate.getTime() || expeditionTo.getTime() < reqDate.getTime()) {
          res.status(404).send('The expedition was not active at the required date');
          return;
        }

        const to = new Date(reqDate)
        to.setDate(reqDate.getDate() + 1);
        query = query
          .where('timestamp', '>', Timestamp.fromDate(reqDate))
          .where('timestamp', '<', Timestamp.fromDate(to));
      } else {
        query = query
          .where('timestamp', '>', Timestamp.fromDate(expeditionFrom))
          .where('timestamp', '<', Timestamp.fromDate(expeditionTo))
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
    .catch((reason) => {
      console.error(reason);
      res.status(500).send(reason);
    });
});

app.get('/expeditions/:expeditionId/locationHistory/latest', (req, res) => {
  firestore.collection('expeditions').doc(req.params.expeditionId).get()
    .then(async (expeditionSnapshot) => {
      if (!expeditionSnapshot.exists) {
        res.status(404).send('Expedition does not exist.');
        return;
      }

      const expedition = expeditionSnapshot.data();
      const { findTimeZone, getUnixTime } = require('timezone-support');
      const timezone = findTimeZone(expedition.timezone);

      const fromSplit = expedition.from.split('-');
      const fromData = { year: Number(fromSplit[0]), month: Number(fromSplit[1]), day: Number(fromSplit[2]), hours: 0, minutes: 0 };
      const expeditionFrom = new Date(getUnixTime(fromData, timezone))

      const toSplit = expedition.to.split('-');
      const toData = { year: Number(toSplit[0]), month: Number(toSplit[1]), day: Number(toSplit[2]), hours: 23, minutes: 59 };
      const expeditionTo = new Date(getUnixTime(toData, timezone))

      let query = firestore.collection('locationHistory')
        .orderBy('timestamp', 'desc').limit(1)
        .where('timestamp', '>', Timestamp.fromDate(expeditionFrom))
        .where('timestamp', '<', Timestamp.fromDate(expeditionTo))

      const locationQuery = await query.get();
      if (locationQuery.empty) {
        res.status(404).send('No location has ever been recorded for this expedition.');
        return;
      }

      const { timestamp, location, ...otherData } = locationQuery.docs[0].data();
      res.send({
        ...otherData,
        location: { latitude: location.latitude, longitude: location.longitude },
        timestamp: timestamp.toMillis(),
      });

    })
    .catch((reason) => res.status(500).send(reason));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;