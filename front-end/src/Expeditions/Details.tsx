import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

import { MDBRow, MDBCol, MDBBtn, MDBIcon, MDBCard, MDBCardImage, MDBCardBody} from 'mdbreact';
import DatePicker from 'react-date-picker';
import { withRouter } from 'react-router-dom';
import { Scatter } from 'react-chartjs-2';
import { getZonedTime, findTimeZone, getUnixTime } from 'timezone-support';

import Expedition from './Expedition';
import SpotPing, { distanceBetweenGeoPoints } from './SpotPing';
import server from '../server';
import Vector2D from './Vector2D';

const mapsContainerStyle = {
  width: '100%',
  height: '30rem',
};

interface ExpeditionData {
  expedition: Expedition
  lastPoint: SpotPing
  firstPoint: SpotPing
  locationHistory: SpotPing[]
}

const isValidDate = (before: Date, direction: number, expeditionData: ExpeditionData) => {
  const actualTime = { year: before.getUTCFullYear(), month: before.getUTCMonth() + 1, day: before.getUTCDate(), hours: 0, minutes: 0 };
  const actualDate = new Date(getUnixTime(actualTime, findTimeZone(expeditionData.expedition.timezone)));
  const nextActualDate = new Date(actualDate);
  nextActualDate.setDate(actualDate.getDate() + direction)
  if (nextActualDate.getTime() > expeditionData.lastPoint.timestamp) {
    return false;
  }
  
  if (nextActualDate.getTime() < expeditionData.firstPoint.timestamp - 86_400_000) {
    return false;
  }

  return true;
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

  const [expeditionData, setExpeditionData] = useState<ExpeditionData>();
  const [locationHistory, setLocationHistory] = useState<SpotPing[]>();

  const [dateFilter, setDateFilter] = useState<Date>(); // UTC Date

  const [map, setMap] = useState<google.maps.Map>();
  const [selectedPoint, setSelectedPoint] = useState<number>();
  const mapLoaded = useCallback((map: google.maps.Map) =>  setMap(map), [setMap]);

  const heightProfile = useMemo(() => {
    if (!locationHistory) return [];
    if (locationHistory.length === 0) return [];
  
    let profile: Vector2D[] = [{x: 0, y: locationHistory[0].elevation}]
    let distanceTraveled = 0;
    for (let i = 1; i < locationHistory.length; i += 1) {
      distanceTraveled += distanceBetweenGeoPoints(locationHistory[i - 1], locationHistory[i]);
      profile.push({x: distanceTraveled, y: locationHistory[i].elevation})
    }
  
    return profile;
  }, [locationHistory]);

  const firstPointDate = useMemo(() => {
    if (!expeditionData) return undefined;
    const zonedTime = getZonedTime(new Date(expeditionData?.firstPoint.timestamp), findTimeZone(expeditionData.expedition.timezone))
    return new Date(`${zonedTime.year}-${String(zonedTime.month).padStart(2, '0')}-${String(zonedTime.day).padStart(2, '0')} ${String(zonedTime.hours).padStart(2, '0')}:${String(zonedTime.minutes).padStart(2, '0')}:${String(zonedTime.seconds).padStart(2, '0')}`);
  }, [expeditionData]);

  const lastPointDate = useMemo(() => {
    if (!expeditionData) return undefined;
    const zonedTime = getZonedTime(new Date(expeditionData.firstPoint.timestamp), findTimeZone(expeditionData.expedition.timezone))
    return new Date(`${zonedTime.year}-${String(zonedTime.month).padStart(2, '0')}-${String(zonedTime.day).padStart(2, '0')} ${String(zonedTime.hours).padStart(2, '0')}:${String(zonedTime.minutes).padStart(2, '0')}:${String(zonedTime.seconds).padStart(2, '0')}`);
  }, [expeditionData]);

  useEffect(() => {
    if (!window.google) return;
    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
    if (locationHistory) {
      locationHistory.forEach((point) => bounds.extend(new google.maps.LatLng(point.location.latitude, point.location.longitude)));
    } else if (expeditionData) {
      expeditionData?.locationHistory.forEach((point) => bounds.extend(new google.maps.LatLng(point.location.latitude, point.location.longitude)));
      bounds.extend(new google.maps.LatLng(expeditionData.firstPoint.location.latitude, expeditionData.firstPoint.location.longitude));
      bounds.extend(new google.maps.LatLng(expeditionData.lastPoint.location.latitude, expeditionData.lastPoint.location.longitude));
    }
    map?.fitBounds(bounds);
  }, [map, locationHistory, expeditionData]);

  useEffect(() => {
    setLocationHistory(undefined);
    if (dateFilter) {
      const dateQuery = `?date=${dateFilter?.getUTCFullYear()}-${String(dateFilter?.getUTCMonth() + 1).padStart(2, '0')}-${String(dateFilter?.getUTCDate()).padStart(2, '0')}`;
      server.get(`/expeditions/${expeditionId}/locationHistory${dateQuery}`)
      .then((response) => {
        setLocationHistory(response.status === 204 ? [] : response.data);
      })
      .catch((error) => console.error(error));
    }
  }, [dateFilter, expeditionId]);

  useEffect(() => {
    server.get(`/expeditions/${expeditionId}`)
      .then((expeditionResponse) => {
        setExpeditionData(expeditionResponse.data);
      })
      .catch((error: any) => console.error(error));
  }, [expeditionId]);

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
      <MDBRow>
        <MDBCol>
          <MDBCard narrow>
            <MDBCardImage
              className='view view-cascade gradient-card-header cloudy-knoxville-gradient text-dark'
              cascade
              tag='div'
              style={{ overflow: 'visible' }}
            >
              <MDBRow>
                <MDBCol lg="6" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <h1>{expeditionData?.expedition.name}</h1>
                </MDBCol>
                <MDBCol lg="6" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {dateFilter
                    ? (
                      expeditionData
                        ? (
                          <>
                            <MDBBtn
                              style={{ flexShrink: '0' }}
                              floating
                              disabled={!isValidDate(dateFilter, -1, expeditionData)}
                              onClick={() => {
                                const newDate = new Date(dateFilter);
                                newDate.setDate(dateFilter.getDate() - 1);
                                setDateFilter(newDate);
                              }}
                            >
                              <MDBIcon icon="angle-double-left" />
                            </MDBBtn>
                            <DatePicker
                              format="yyyy-MM-dd"
                              minDate={new Date((new Date(expeditionData.expedition.from)).toUTCString().split(' ').slice(0, 4).join(' '))}
                              maxDate={new Date((new Date(new Date(expeditionData.expedition.to).getTime() - 86_400_000)).toUTCString().split(' ').slice(0, 4).join(' '))}
                              value={new Date(dateFilter.toUTCString().split(' ').slice(0, 4).join(' '))}
                              onChange={newDate => {
                                if (!newDate) {
                                  setDateFilter(undefined);
                                } else if (!Array.isArray(newDate)) {
                                  setDateFilter(new Date(`${newDate.toUTCString().split(' ').slice(0, 4).join(' ')} GMT+0000`));
                                }
                              }}
                            />
                            <MDBBtn
                              style={{ flexShrink: '0' }}
                              floating
                              disabled={!isValidDate(dateFilter, 1, expeditionData)}
                              onClick={() => {
                                const newDate = new Date(dateFilter);
                                newDate.setDate(dateFilter.getDate() + 1);
                                setDateFilter(newDate);
                              }}
                            >
                              <MDBIcon icon="angle-double-right" />
                            </MDBBtn>
                          </>
                        )
                        : null
                    ) : (
                      expeditionData
                        ? (
                          <MDBBtn
                            onClick={() => {
                              const zonedTime = getZonedTime(new Date(expeditionData.lastPoint.timestamp), findTimeZone(expeditionData.expedition.timezone))
                              const newFilter = new Date(`${zonedTime.year}-${String(zonedTime.month).padStart(2, '0')}-${String(zonedTime.day).padStart(2, '0')}`);
                              setDateFilter(newFilter);
                            }}
                          >
                            Daily Details
                          </MDBBtn>
                        ) : null
                    )}
                </MDBCol>
              </MDBRow>
            </MDBCardImage>
            <MDBCardBody cascade className='text-center'>
              <MDBRow>
                <MDBCol>
                  {expeditionData
                    ? (
                      <GoogleMap
                        mapContainerStyle={mapsContainerStyle}
                        onLoad={mapLoaded}
                      >
                        {
                          locationHistory?.filter((point: SpotPing) => (
                            expeditionData?.locationHistory.find((p: SpotPing) => p.timestamp === point.timestamp) === undefined ||
                            point.timestamp !== expeditionData.firstPoint.timestamp ||
                            point.timestamp !== expeditionData.lastPoint.timestamp
                          )).map((point: SpotPing, index: number, history: SpotPing[]) => {
                            const zonedTime = getZonedTime(new Date(point.timestamp), findTimeZone(expeditionData.expedition.timezone))
                            const markerDate = new Date(`${zonedTime.year}-${String(zonedTime.month).padStart(2, '0')}-${String(zonedTime.day).padStart(2, '0')} ${String(zonedTime.hours).padStart(2, '0')}:${String(zonedTime.minutes).padStart(2, '0')}:${String(zonedTime.seconds).padStart(2, '0')}`);
                            return (
                              <Marker
                                key={point.timestamp}
                                position={{lat: point.location.latitude, lng: point.location.longitude}}
                                icon={'http://icongal.com/gallery/download/446879/24/png'}
                                onClick={() => setSelectedPoint(point.timestamp)}
                                zIndex={1}
                              >
                                {point.timestamp === selectedPoint
                                  ? (
                                    <InfoWindow onCloseClick={() => setSelectedPoint(undefined)}>
                                      <p>{markerDate.toString().split(' ').slice(0, 5).join(' ')}</p>
                                    </InfoWindow>
                                  ) : null}
                              </Marker>
                            );
                          })
                        }
                        {
                          expeditionData.firstPoint.timestamp !== expeditionData.lastPoint.timestamp ? (
                            <Marker
                              key={expeditionData.firstPoint.timestamp}
                              position={{lat: expeditionData.firstPoint.location.latitude, lng: expeditionData.firstPoint.location.longitude}}
                              icon={'http://icongal.com/gallery/download/446879/24/png'}
                              onClick={() => setSelectedPoint(expeditionData.firstPoint.timestamp)}
                              zIndex={2}
                            >
                              {expeditionData.firstPoint.timestamp === selectedPoint
                                ? (
                                  <InfoWindow onCloseClick={() => setSelectedPoint(undefined)}>
                                    <p>{firstPointDate?.toString().split(' ').slice(0, 5).join(' ')}</p>
                                  </InfoWindow>
                                ) : null}
                            </Marker>
                          ) : null
                        }
                        {
                          expeditionData?.locationHistory.filter((point: SpotPing) => (
                            point.timestamp !== expeditionData.firstPoint.timestamp ||
                            point.timestamp !== expeditionData.lastPoint.timestamp
                          )).map((point: SpotPing) => {
                            const zonedTime = getZonedTime(new Date(point.timestamp), findTimeZone(expeditionData.expedition.timezone))
                            const markerDate = new Date(`${zonedTime.year}-${String(zonedTime.month).padStart(2, '0')}-${String(zonedTime.day).padStart(2, '0')} ${String(zonedTime.hours).padStart(2, '0')}:${String(zonedTime.minutes).padStart(2, '0')}:${String(zonedTime.seconds).padStart(2, '0')}`);
                            return (
                              <Marker
                                key={point.timestamp}
                                position={{lat: point.location.latitude, lng: point.location.longitude}}
                                icon={'http://icongal.com/gallery/download/447076/32/png'}
                                onClick={() => setSelectedPoint(point.timestamp)}
                                zIndex={3}
                              >
                                {point.timestamp === selectedPoint
                                  ? (
                                    <InfoWindow onCloseClick={() => setSelectedPoint(undefined)}>
                                      <p>{markerDate.toString().split(' ').slice(0, 5).join(' ')}</p>
                                    </InfoWindow>
                                  ) : null}
                              </Marker>
                            );
                          })
                        }
                        <Marker
                          key={expeditionData.lastPoint.timestamp}
                          position={{lat: expeditionData.lastPoint.location.latitude, lng: expeditionData.lastPoint.location.longitude}}
                          icon={'http://icongal.com/gallery/download/447373/32/png'}
                          onClick={() => setSelectedPoint(expeditionData.lastPoint.timestamp)}
                          zIndex={4}
                        >
                          {expeditionData.lastPoint.timestamp === selectedPoint
                            ? (
                              <InfoWindow onCloseClick={() => setSelectedPoint(undefined)}>
                                <p>{lastPointDate?.toString().split(' ').slice(0, 5).join(' ')}</p>
                              </InfoWindow>
                            ) : null}
                        </Marker>
                      </GoogleMap>
                  ) : null}
                </MDBCol>
                <MDBCol xl="6">
                  {/* <MDBRow>
                    <MDBCol>
                      <MDBCard>
                        <MDBCardBody>
                          Total Distance
                          <MDBIcon className="ml-2" icon="info-circle" />
                        </MDBCardBody>
                      </MDBCard>
                    </MDBCol>
                    <MDBCol>
                    <MDBCard>
                      <MDBCardBody>
                        Daily Distance
                        <MDBIcon className="ml-2" icon="info-circle" />
                      </MDBCardBody>
                    </MDBCard>
                    </MDBCol>
                  </MDBRow> */}
                  <MDBRow>
                    {dateFilter
                      ? (
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
                      ) : null}
                  </MDBRow>
                </MDBCol>
              </MDBRow>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
        
      </MDBRow>
    </LoadScript>
  );
});

export default memo(ExpeditionDetails);
