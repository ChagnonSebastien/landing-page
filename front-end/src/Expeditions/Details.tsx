import React, { useState, useEffect } from 'react';

import { Row } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import { Scatter } from 'react-chartjs-2';

import Expedition from './Expedition';
import SpotPing, { distanceBetweenGeoPoints } from './SpotPing';
import server from '../server';
import axios from 'axios';
import Vector2D from './Vector2D';

const calculateHeightProfile = (locationHistory: SpotPing[]) => {
  if (locationHistory.length === 0) {
    return [];
  }

  console.log(locationHistory);
  let profile: Vector2D[] = [{x: 0, y: locationHistory[0].elevation}]
  let distanceTraveled = 0;
  for (let i = 1; i < locationHistory.length; i += 1) {
    distanceTraveled += distanceBetweenGeoPoints(locationHistory[i - 1], locationHistory[i]);
    profile.push({x: distanceTraveled, y: locationHistory[i].elevation})
  }

  return profile;
};

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
  const [latestLocation, setLatestLocation] = useState<SpotPing>();

  const [locationHistory, setLocationHistory] = useState<SpotPing[]>();
  const [heightProfile, setHeightProfile] = useState<Vector2D[]>();

  

  useEffect(() => {
    axios.all([
      server.get(`/expeditions/${expeditionId}`),
      server.get(`/expeditions/${expeditionId}/locationHistory/latest`),
      server.get(`/expeditions/${expeditionId}/locationHistory`),
    ])
      .then(axios.spread((
        expeditionResponse,
        latestLocationResponse,
        locationHistoryResponse,
      ) => {
        setExpedition(expeditionResponse.data);
        setLatestLocation(latestLocationResponse.data);

        setLocationHistory(locationHistoryResponse.data);
        setHeightProfile(calculateHeightProfile(locationHistoryResponse.data));
      }))
      .catch((error: any) => console.error(error));
  }, [expeditionId]);

  return (
    <Row>
      <h1>{expedition?.name}</h1>
      <Scatter
        data={{
          datasets: [{
            data: heightProfile,
            showLine: true,
          }]
        }}
        options={{
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              position: 'bottom',
              scaleLabel: {
                display: true,
                labelString: 'Distance Traveled (km)'
              }
            }],
            yAxes: [{
              position: 'bottom',
              scaleLabel: {
                display: true,
                labelString: 'Height (m)'
              }
            }]
          }
        }}
      />
    </Row>
  );
});

export default ExpeditionDetails;
