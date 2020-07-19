import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect, Link } from 'react-router-dom';

import ExpeditionsList from './Expeditions';
import ExpeditionDetails from './Expeditions/Details';
import { MDBContainer } from 'mdbreact';

const App = ()  => (
  <Router>
    <MDBContainer>
      <Switch>
        <Route exact path="/">
          <Redirect to="/expeditions" />
        </Route>
        <Route exact path="/expeditions">
          <ExpeditionsList />
        </Route>
        <Route path="/expeditions/:expeditionId">
          <ExpeditionDetails />
        </Route>
        <Route>
          <h2>How dod you get here?</h2>
          <p>This page doesn't seem to exist</p>
          <Link to="/">Return to Home</Link>
        </Route>
      </Switch>
    </MDBContainer>
  </Router>
);

export default App;
