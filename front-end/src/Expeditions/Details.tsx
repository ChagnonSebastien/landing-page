import React, { useState, useEffect, memo } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

import { MDBRow, MDBCol, MDBBtn } from 'mdbreact';
import { withRouter } from 'react-router-dom';
import { Scatter } from 'react-chartjs-2';

import Expedition from './Expedition';
import SpotPing, { distanceBetweenGeoPoints } from './SpotPing';
import server from '../server';
import axios from 'axios';
import Vector2D from './Vector2D';

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

  const [dateFilter, setDateFilter] = useState<Date>();
  const [locationHistory, setLocationHistory] = useState<SpotPing[]>();
  const [heightProfile, setHeightProfile] = useState<Vector2D[]>();

  const [map, setMap] = useState<google.maps.Map>();

  useEffect(() => {
    if (!window.google) return;
    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
    locationHistory?.forEach((point) => bounds.extend(new google.maps.LatLng(point.location.latitude, point.location.longitude)));
    map?.fitBounds(bounds);
  }, [map, locationHistory]);

  useEffect(() => {
    if (!dateFilter) return;
    const date = `${dateFilter?.getFullYear()}-${String(dateFilter?.getMonth() + 1).padStart(2, '0')}-${String(dateFilter?.getDate()).padStart(2, '0')}`
    server.get(`/expeditions/${expeditionId}/locationHistory?date=${date}`)
      .then((response) => {
        setLocationHistory(response.data);
        setHeightProfile(calculateHeightProfile(response.data));
      })
      .catch((error) => console.error(error));
  }, [dateFilter, expeditionId]);

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
    <>
      <h1>{expedition?.name}</h1>
      <MDBRow>
        <MDBCol>
          <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
          >
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '35rem' }}
              onLoad={(map: google.maps.Map) =>  setMap(map)}
            >
              {locationHistory?.map((point: SpotPing, index: number) => (
                <Marker
                  key={point.timestamp}
                  position={{lat: point.location.latitude, lng: point.location.longitude}}
                  icon={index === locationHistory.length - 1 ? 'http://icongal.com/gallery/download/447373/32/png' : 'http://icongal.com/gallery/download/446879/24/png'}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </MDBCol>
      </MDBRow>
      <MDBRow>
        <MDBCol style={{ textAlign: 'center' }}>
          {dateFilter
            ? (
              <>
                <MDBBtn
                  size="lg"
                  variant="outline-dark"
                  onClick={() => {
                    const newDate = new Date(dateFilter);
                    newDate.setDate(dateFilter.getDate() - 1);
                    setDateFilter(newDate);
                  }}
                >
                  «
                </MDBBtn>
                <span className="mx-4 align-middle" style={{ fontSize: '1.5rem' }}>{dateFilter.toDateString()}</span>
                <MDBBtn
                  size="lg"
                  variant="outline-dark"
                  onClick={() => {
                    const newDate = new Date(dateFilter);
                    newDate.setDate(dateFilter.getDate() + 1);
                    setDateFilter(newDate);
                  }}
                >
                  »
                </MDBBtn>
              </>
            ) : (
              <MDBBtn onClick={() => setDateFilter(new Date(latestLocation?.timestamp ?? new Date()))}>Jump to today</MDBBtn>
            )}
        </MDBCol>
      </MDBRow>
      {dateFilter
        ? (
          <MDBRow>
            <MDBCol>
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
            </MDBCol>
          </MDBRow>
        ) : null}
    </>
  );
});

export default memo(ExpeditionDetails);
