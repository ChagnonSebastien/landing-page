import React, { useEffect, useState } from 'react';

import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
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
    <Col xl="6">
      <Card>
        <Card.Img variant="top" src={expedition.image} />
        <Card.Body>
          <Card.Title>{expedition.name}</Card.Title>
          <Card.Text>{expedition.description}</Card.Text>
          <Button onClick={() => push(`/expeditions/${expedition.id}`)}>Details</Button>
        </Card.Body>
      </Card>
    </Col>
  )) ?? <Spinner animation="border" />;

  return (
    <Row className="justify-content-center">
      {expeditionCards}
    </Row>
  );
});

export default ExpeditionList;
