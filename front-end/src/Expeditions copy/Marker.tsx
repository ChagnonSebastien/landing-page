import React from 'react';

interface Props {
  stop: boolean,
  lat: number,
  lng: number,
}

const Marker = (props: Props) => {
  let radius = props.stop ? 14 : 5;
  return (
    <div style={{
      position: 'absolute',
      width: radius,
      height: radius,
      left: -radius / 2,
      top: -radius / 2,

      border: `${props.stop ? "3" : "0"}px solid blue`,
      borderRadius: radius,
      backgroundColor: props.stop ? "white" : "red"
    }}>
    </div>
  );
}

export default Marker;