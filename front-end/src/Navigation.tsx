import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';

import { MDBSideNav, MDBIcon, MDBSideNavNav, MDBSideNavLink, MDBNavbar, MDBNavbarBrand, MDBNavbarNav, MDBNavItem } from 'mdbreact';

interface Props {
  children?: React.ReactNode,
  location: {
    pathname: string,
  }
}

const BREAK_WIDTH = 1400;

const Navigation = withRouter((props: Props) => {
  const { children, location } = props;
  const { pathname } = location;

  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [showSideBar, setShowSideBar] = useState<boolean>(false);

  const handleResize = () => setWindowWidth(window.innerWidth);
  
  useEffect(() => setShowSideBar(false), [pathname]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [])

  return (
    <>
      <MDBSideNav
        logo="/mountain_logo.png"
        triggerOpening={showSideBar}
        breakWidth={BREAK_WIDTH}
        bg="https://mdbootstrap.com/img/Photos/Others/sidenav4.jpg"
        // @ts-ignore
        mask="strong"
        fixed
      >
        <li>
          <ul className="social">
            <li><a href="https://github.com/ChagnonSebastien" target="_blank" rel="noopener noreferrer"> <MDBIcon fab icon="github" /> </a></li>
            <li><a href="https://gitlab.com/ChagnonSebastien" target="_blank" rel="noopener noreferrer"> <MDBIcon fab icon="gitlab" /> </a></li>
          </ul>
        </li>
        <MDBSideNavNav>
          <MDBSideNavLink topLevel to="/" exact>
            <MDBIcon icon="home" className="mr-2" /> Home
          </MDBSideNavLink>
          <MDBSideNavLink topLevel to="/expeditions">
            <MDBIcon icon="mountain" className="mr-2" /> Expeditions
          </MDBSideNavLink>
          <MDBSideNavLink topLevel to="/contact">
            <MDBIcon icon="envelope" className="mr-2" /> Contact me
          </MDBSideNavLink>
        </MDBSideNavNav>
      </MDBSideNav>
      <MDBNavbar
        style={{ paddingLeft: windowWidth > BREAK_WIDTH ? '210px' : '16px' }}
        double
        expand="xs"
        fixed="top"
        scrolling
      >
        <MDBNavbarNav left>
          <MDBNavItem>
            <div
              onClick={() => setShowSideBar((prevShow) => !prevShow)}
              style={{
                lineHeight: "32px",
                marginRight: "1em",
                verticalAlign: "middle"
              }}
            >
              <MDBIcon icon="bars" color="white" size="2x" />
            </div>
          </MDBNavItem>
          <MDBNavbarBrand>
            Tracker
          </MDBNavbarBrand>
        </MDBNavbarNav>
      </MDBNavbar>
      <main
        style={{
          margin: "0 6%",
          paddingTop: "5.5rem",
          paddingLeft: windowWidth > BREAK_WIDTH ? "240px" : "0"
        }}
      >
        {children}
      </main>
    </>
  );
});

export default Navigation;
