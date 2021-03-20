import React, { CSSProperties, ReactElement, useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

import './World.css';
import { MDBContainer } from 'mdbreact';

const center: google.maps.LatLngLiteral = {
  lat: 45.5017,
  lng: -73.5673
};

const trips: Array<Array<google.maps.LatLngLiteral>> = [
  [
    { lat: 46.8139,  lng: -71.2080  }, // Quebec
    { lat: 48.5930,  lng: -64.2300  }, // Rivière aux Renard
    { lat: 46.9579,  lng: -56.3929  }, // Saint Pierre et Miquelon
    { lat: 38.7210,  lng: -27.2455  }, // Terceira
    { lat: 37.7448,  lng: -25.6873  }, // Sao Miguel
    { lat: 46.1603,  lng: -1.1511   }, // La Rochelle
    { lat: 43.3183,  lng: -1.9812   }, // San Sebastien
    { lat: 43.6108,  lng: 3.8767    }, // Montpellier
    { lat: 46.2044,  lng: 6.1432    }, // Geneva
    { lat: 48.8566,  lng: 2.3522    }, // Paris
    { lat: 46.1603,  lng: -1.1511   }, // La Rochelle
    { lat: 42.2406,  lng: -8.7207   }, // Vigo
    { lat: 41.1579,  lng: -8.6291   }, // Porto
    { lat: 38.7223,  lng: -9.1393   }, // Lisbon
    { lat: 32.7607,  lng: -16.9595  }, // Madeira
    { lat: 28.9712,  lng: -13.5660  }, // Lanzarotte
    { lat: 28.1173,  lng: -15.4571  }, // Gran Canaria
    { lat: 16.0994,  lng: -22.8854  }, // Boa Vista
    { lat: 16.8493,  lng: -25.0075  }, // São Vicente
    { lat: 12.1165,  lng: -61.6790  }, // Grenada
    { lat: 12.9714,  lng: -61.5635  }, // St Vincent and the Grenadines
    { lat: 13.8400,  lng: -60.9983  }, // St Lucie
    { lat: 14.6340,  lng: -61.1538  }, // Martinique
    { lat: 15.5088,  lng: -61.3801  }, // Dominique
    { lat: 16.2650,  lng: -61.5510  }, // Guadeloupe
    { lat: 17.1255,  lng: -61.8536  }, // Antigua
    { lat: 17.6361,  lng: -61.8442  }, // Barbuda
    { lat: 18.0647,  lng: -63.1168  }, // St Martin
    { lat: 18.4550,  lng: -64.4589  }, // British Virgin Islands
    { lat: 18.3412,  lng: -64.9348  }, // American Virgin Islands
    { lat: 18.3892,  lng: -66.0954  }, // Puerto Rico
    { lat: 21.5735,  lng: -72.0702  }, // Turks and Caicos
    { lat: 24.8072,  lng: -76.3102  }, // Bahamas
    { lat: 28.3882,  lng: -80.6155  }, // Cap Canaveral
    { lat: 32.0388,  lng: -81.2703  }, // Savanha
    { lat: 36.9308,  lng: -76.3097  }, // Norfolk
    { lat: 40.7128,  lng: -74.0060  }, // New York
    { lat: 44.9939,  lng: -73.3649  }, // Rouses Point
  ]
]

const destinations: Array<google.maps.LatLngLiteral> = [
  { lat: 45.5017,  lng: -73.5673  }, // Montreal
  { lat: 19.8968,  lng: -155.5828 }, // Hawaii
  { lat: 28.3852,  lng: -81.5639  }, // Disney
  { lat: 41.8781,  lng: -87.6298  }, // Chicago
]


const World: React.FC = (): ReactElement => {
  const { isLoaded } = useJsApiLoader({
    mapIds: ['ff532e43ea48df1a'],
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY ?? '',
  })

  const [map, setMap] = useState<google.maps.Map<Element> | null>(null)

  const [scroll, setScroll] = useState<number>(window.scrollY);
  const [height, setHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    const heightChangeListener = () => {
      if (map !== null) {
        const bounds = new google.maps.LatLngBounds();
        destinations.forEach((destination) => {
          bounds.extend(destination);
        })
        trips.forEach((trip) => {
          trip.forEach((destination) => {
            bounds.extend(destination);
          })
        })
        map.fitBounds(bounds);
      }
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

  const containerStyle = useMemo<CSSProperties>(() => {
    const marginPercentage = 10 * (scroll / height);
    return {
      width: `${100 - (2 * marginPercentage)}%`,
      margin: `0 ${marginPercentage}% 2rem ${marginPercentage}%`,
      height: `${height}px`,
    }
  }, [scroll, height]);

  return isLoaded ? (
    <div style={{ backgroundColor: '#EEE', overflowY: 'auto' }}>
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
        center={center}
        zoom={10}
        onLoad={(map) => {
          const bounds = new google.maps.LatLngBounds();
          destinations.forEach((destination) => {
            bounds.extend(destination);
          })
          trips.forEach((trip) => {
            trip.forEach((destination) => {
              bounds.extend(destination);
            })
          })
          map.fitBounds(bounds);
          setMap(map);
        }}
        onUnmount={() => setMap(null)}
      >
        {destinations.map((destination) => (
          <Marker position={destination} />
        ))}
        {trips.map((trip) => (
        <Polyline path={trip} options={{ strokeWeight: 2 }} />
        ))}
      </GoogleMap>
      
      <MDBContainer>
        <p>{scroll}</p>

        <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.</p>

        <p>Aenean massa.</p>

        <p>Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>

        <p>Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.</p>

        <p>Nulla consequat massa quis enim.</p>

        <p>Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.</p>

        <p>In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.</p>

        <p>Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus.</p>

        <p>Vivamus elementum semper nisi. Aenean vulputate eleifend tellus.</p>

        <p>Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim.</p>

        <p>Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus.</p>

        <p>Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet.</p>

        <p>Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus.</p>

        <p>Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.</p>

        <p>Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus.</p>

        <p>Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante.</p>

        <p>Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh.</p>

        <p>Donec sodales sagittis magna.</p>

        <p>Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero.</p>

        <p>Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus.</p>

        <p>Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla.</p>

        <p>Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia.</p>

        <p>Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris.</p>

        <p>Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing.</p>

        <p>Phasellus ullamcorper ipsum rutrum nunc. Nunc nonummy metus. Vestibulum volutpat pretium libero. Cras id dui.</p>

        <p>Aenean ut eros et nisl sagittis vestibulum. Nullam nulla eros, ultricies sit amet, nonummy id, imperdiet feugiat, pede. Sed lectus.</p>

        <p>Donec mollis hendrerit risus. Phasellus nec sem in justo pellentesque facilisis. Etiam imperdiet imperdiet orci. Nunc nec neque.</p>

        <p>Phasellus leo dolor, tempus non, auctor et, hendrerit quis, nisi. Curabitur ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo.</p>

        <p>Maecenas malesuada. Praesent congue erat at massa. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu.</p>

        <p>Phasellus accumsan cursus velit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac</p>
      </MDBContainer>
    </div>
  ) : <></>
}

export default React.memo(World);