import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

import ExpeditionsList from './Expeditions';
import ExpeditionDetails from './Expeditions/Details';
import { MDBContainer } from 'mdbreact';
import './App.css';
import Home from './Home';
import World from './World/World_1';

const App = ()  => (
  <Router>
    <Switch>
      <Route exact path="/">
        <Home />
      </Route>
      <Route exact path="/expeditions">
        <MDBContainer size="xl">
          <ExpeditionsList />
        </MDBContainer>
      </Route>
      <Route path="/expeditions/:expeditionId">
        <ExpeditionDetails />
      </Route>
      <Route path="/world">
        <World />
      </Route>
      <Route>
        <h2>How did you get here?</h2>
        <p>This page doesn't seem to exist</p>
        <Link to="/">Return to Home</Link>
      </Route>
    </Switch>
  </Router>
);

export default App;
