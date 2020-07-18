import React, { useEffect, useState } from 'react';

import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import server from './server';
import Expedition from './Expedition';

const App = ()  => {
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
          <Button variant="primary">Details</Button>
        </Card.Body>
      </Card>
    </Col>
  )) ?? <Spinner animation="border" />;

  return (
    <Container>
      <Row>
        {expeditionCards}
      </Row>
    </Container>
  );
}

export default App;
