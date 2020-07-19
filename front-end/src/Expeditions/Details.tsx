import React, { useState, useEffect, memo } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

import { Row, Col } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import { Scatter } from 'react-chartjs-2';

import Expedition from './Expedition';
import SpotPing, { distanceBetweenGeoPoints } from './SpotPing';
import server from '../server';
import axios from 'axios';
import Vector2D from './Vector2D';

const scaleToDistanceRatios = [
  { zoom: 20, size: 1128.497220 },
  { zoom: 19, size: 2256.994440 },
  { zoom: 18, size: 4513.988880 },
  { zoom: 17, size: 9027.977761 },
  { zoom: 16, size: 18055.955520 },
  { zoom: 15, size: 36111.911040 },
  { zoom: 14, size: 72223.822090 },
  { zoom: 13, size: 144447.644200 },
  { zoom: 12, size: 288895.288400 },
  { zoom: 11, size: 577790.576700 },
  { zoom: 10, size: 1155581.153000 },
  { zoom: 9 , size: 2311162.307000 },
  { zoom: 8 , size: 4622324.614000 },
  { zoom: 7 , size: 9244649.227000 },
  { zoom: 6 , size: 18489298.450000 },
  { zoom: 5 , size: 36978596.910000 },
  { zoom: 4 , size: 73957193.820000 },
  { zoom: 3 , size: 147914387.600000 },
  { zoom: 2 , size: 295828775.300000 },
  { zoom: 1 , size: 591657550.500000 }
]

const calculateHeightProfile = (locationHistory: SpotPing[]): Vector2D[] => {
  if (locationHistory.length === 0) {
    return [];
  }

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
      server.get(`/expeditions/${expeditionId}/locationHistory?date=2020-07-16`),
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
    <>
      <h1>{expedition?.name}</h1>
      <Row>
        <Col>
          <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
          >
            {locationHistory
              ? (
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '35rem'
                  }}
                  onLoad={map => {
                    const windowRef: any = window;
                    const bounds = new windowRef.google.maps.LatLngBounds();
                    locationHistory?.forEach((point) => bounds.extend(new windowRef.google.maps.LatLng(point.location.latitude, point.location.longitude)));
                    map.fitBounds(bounds);
                  }}
                >
                  {locationHistory?.map((point: SpotPing) => (
                    <Marker
                      key={point.timestamp}
                      position={{lat: point.location.latitude, lng: point.location.longitude}}
                    />
                  ))}
                </GoogleMap>
              ) : null}
          </LoadScript>
        </Col>
      </Row>
      <Row>
        <Col>
          <Scatter
            data={{
              datasets: [{
                data: heightProfile,
                showLine: true,
                lineTension: 0.2,
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
        </Col>
      </Row>
    </>
  );
});

export default memo(ExpeditionDetails);
