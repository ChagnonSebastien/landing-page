import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

import ExpeditionsList from './Expeditions';
import ExpeditionDetails from './Expeditions/Details';
import { MDBContainer } from 'mdbreact';
import Navigation from './Navigation';

const App = ()  => (
  <Router>
    <div className="fixed-sn light-blue-skin">
      <Navigation>
        <MDBContainer size="xl">
          <Switch>
            <Route exact path="/">
              <h1>Home</h1>
            </Route>
            <Route exact path="/expeditions">
              <ExpeditionsList />
            </Route>
            <Route path="/expeditions/:expeditionId">
              <ExpeditionDetails />
            </Route>
            <Route>
              <h2>How did you get here?</h2>
              <p>This page doesn't seem to exist</p>
              <Link to="/">Return to Home</Link>
            </Route>
          </Switch>
        </MDBContainer>
      </Navigation>
    </div>
  </Router>
);

export default App;
