import React, { useEffect, useState } from 'react';
import { MDBRow, MDBCol, MDBCard, MDBBtn, MDBCardImage, MDBCardBody, MDBCardTitle, MDBCardText, MDBSpinner } from 'mdbreact';

import server from '../server';
import Expedition from './Expedition';
import { withRouter } from 'react-router-dom';

interface Props {
  history: {
    push: Function
  }
}

const ExpeditionList = withRouter((props: Props)  => {
  const { history } = props;
  const { push } = history

  const [expeditions, setExpeditions] = useState<Expedition[]>();

  useEffect(() => {
    server.get('/expeditions')
      .then((response) => setExpeditions(response.data))
      .catch((error) => console.error(error));
  }, []);

  let expeditionCards = expeditions?.map((expedition) => (
    <MDBCol xl="6">
      <MDBCard>
        <MDBCardImage variant="top" src={expedition.image} />
        <MDBCardBody>
          <MDBCardTitle>{expedition.name}</MDBCardTitle>
          <MDBCardText>{expedition.description}</MDBCardText>
          <MDBBtn onClick={() => push(`/expeditions/${expedition.id}`)}>Details</MDBBtn>
        </MDBCardBody>
      </MDBCard>
    </MDBCol>
  )) ?? <MDBSpinner animation="border" />;

  return (
    <MDBRow className="justify-content-center">
      {expeditionCards}
    </MDBRow>
  );
});

export default ExpeditionList;
