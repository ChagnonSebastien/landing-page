import React, { useState, useEffect, memo, useMemo, CSSProperties } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

import { useRouteMatch } from 'react-router-dom';
import { getZonedTime, findTimeZone, getUnixTime } from 'timezone-support';

import Expedition from './Expedition';
import SpotPing, { distanceBetweenGeoPoints } from './SpotPing';
import server from '../server';
import Vector2D from './Vector2D';

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

interface Match {
  expeditionId: string
}

const ExpeditionDetails = ()  => {
  
  const match = useRouteMatch<Match>();

  const { isLoaded } = useJsApiLoader({
    mapIds: ['ff532e43ea48df1a'],
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY ?? '',
  })

  const [map, setMap] = useState<google.maps.Map<Element> | null>(null)

  const [scroll, setScroll] = useState<number>(window.scrollY);
  const [height, setHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    const heightChangeListener = () => {
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', heightChangeListener);

    const scrollChangeListener = () => setScroll(window.scrollY);
    window.addEventListener('scroll', scrollChangeListener);

    return () => {
      window.removeEventListener('resize', heightChangeListener);
      window.removeEventListener('scroll', scrollChangeListener);
    };
  }, []);

  const { expeditionId } = match.params;

  const [expeditionData, setExpeditionData] = useState<ExpeditionData>();
  const [locationHistory, setLocationHistory] = useState<SpotPing[]>();

  const [dateFilter, setDateFilter] = useState<Date>(); // UTC Date

  const [selectedPoint, setSelectedPoint] = useState<number>();

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

  const containerStyle = useMemo<CSSProperties>(() => {
    return {
      width: '100%',
      height: `${height}px`,
    }
  }, [height]);

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

  const days = useMemo(() => [
    ...(typeof expeditionData?.firstPoint !== 'undefined' ? [expeditionData.firstPoint] : []),
    ...(expeditionData?.locationHistory ?? []),
  ], [expeditionData]);

  const scrollMultiplier = 0.8;

  const scrollPercentage = useMemo(() => (
    Math.round(scroll * 1000 / (height * days.length * scrollMultiplier - height)) / 1000
  ), [scroll, height, days, scrollMultiplier]);


  const mapCenter = useMemo<google.maps.LatLngLiteral | null>(() => {
    if (days.length === 0) return null;

    let prev = Math.floor(scrollPercentage * scrollMultiplier * days.length);

    const addon = (scrollPercentage * scrollMultiplier * days.length) - prev;
    return {
      lat: days[prev].location.latitude * (1 - addon) + days[prev + 1].location.latitude * (addon),
      lng: days[prev].location.longitude * (1 - addon) + days[prev + 1].location.longitude * (addon),
    }
  }, [scrollPercentage, days, scrollMultiplier])

  if (!isLoaded || typeof expeditionData === 'undefined' || days.length === 0 || mapCenter === null) {
    return null;
  }

  return (
    <div
      style={{
        height: `${days.length * scrollMultiplier * 100}%`,
      }}
    >
      <div style={{
        height: '100%',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
      }}>
        <GoogleMap
          options={{
            draggable: false,
            zoomControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            mapId: 'ff532e43ea48df1a',
          } as google.maps.MapOptions}
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={13}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
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
      </div>
      {
        days
          .map((day, i, a) => {
            const offset = i / a.length;
            const closeness = scrollPercentage - (i / (a.length - 1));
            let distanceFromCenter = (3 - Math.abs(closeness * a.length)) / 3;
            if (distanceFromCenter < 0) distanceFromCenter = 0;

            const date = new Date(day.timestamp);

            return { label: date.toISOString().split('T')[0], offset, closeness, distanceFromCenter };
          })
          .filter((data) => data.distanceFromCenter > 0)
          .map(({ label, distanceFromCenter, offset }) => (
            <span
              style={{
                fontSize: '35px',
                fontWeight: 'bold',
                textShadow: `3px 3px 6px rgb(255, 255, 255, ${Math.sin(distanceFromCenter)}), -3px 3px 6px rgb(255, 255, 255, ${Math.sin(distanceFromCenter)}), 3px -3px 6px rgb(255, 255, 255, ${Math.sin(distanceFromCenter)}), -3px -3px 6px rgb(255, 255, 255, ${Math.sin(distanceFromCenter)})`,
                position: 'fixed',
                right: `${Math.sin(distanceFromCenter) * 40}px`,
                top: `${(height / 2) + (offset - scrollPercentage) * days.length * 50}px`,
                color: `rgb(0, 0, 0, ${Math.sin(distanceFromCenter)})`
              }}
            >
              {label}
            </span>
          ))
      }
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        margin: '10px'
      }}>
        {scrollPercentage}
      </div>
    </div>
  );
};

export default memo(ExpeditionDetails);
