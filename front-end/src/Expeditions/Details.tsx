import React, { useState, useEffect } from 'react';

import { Row } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import Expedition from './Expedition';
import SpotPing from './SpotPing';
import server from '../server';
import axios from 'axios';

interface Props {
  match: {
    params: {
      expeditionId: string
    }
  }
}

const ExpeditionDetails = withRouter((props: Props)  => {
  const { match } = props;
  const { params } = match;
  const { expeditionId } = params;

  const [expedition, setExpedition] = useState<Expedition>();
  const [locationHistory, setLocationHistory] = useState<SpotPing[]>();
  const [latestLocation, setLatestLocation] = useState<SpotPing>();

  useEffect(() => console.log('dsf'))

  useEffect(() => {
    axios.all([
      server.get(`/expeditions/${expeditionId}`),
      server.get(`/expeditions/${expeditionId}/locationHistory`),
      server.get(`/expeditions/${expeditionId}/locationHistory/latest`),
    ])
      .then(axios.spread((
        expeditionResponse,
        locationHistoryResponse,
        latestLocationResponse
      ) => {
        setExpedition(expeditionResponse.data);
        setLocationHistory(locationHistoryResponse.data);
        setLatestLocation(latestLocationResponse.data);
      }))
      .catch((error: any) => console.error(error));
  }, [expeditionId]);

  return (
    <Row>
      <h1>{expedition?.name}</h1>
    </Row>
  );
});

export default ExpeditionDetails;
