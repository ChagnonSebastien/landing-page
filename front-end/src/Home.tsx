import React, { useCallback, useEffect, useMemo, useState } from 'react';

const Home = () => {
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);

  const profileHeight = useMemo(() => {
    if (windowWidth > windowHeight * 2) return `${90}%`;
    if (windowWidth * 2 < windowHeight) return `${90 * windowWidth / windowHeight}%`;
    return `${((windowWidth / windowHeight) * (1/3) + (1/3)) * 90}%`
  }, [windowWidth, windowHeight]);

  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize])

  return (
    <>
      <div
        style={{
          margin: '10%',
          position: 'absolute'
        }}
      >
        <h2
          style={{
            fontFamily: 'League Spartan',
            fontSize: '3rem',
          }}
        >
          Sébastien Chagnon
        </h2>
        <p
          style={{
            fontSize: '2rem',
          }}
        >
          Software Engineer
        </p>
        <div
          style={{
            fontSize: '1rem',
          }}
        >
          <a href="https://www.linkedin.com/in/sébastien-chagnon-b374a5159" target="_blank">Resume</a>
          &nbsp;|&nbsp;
          <a href="https://github.com/ChagnonSebastien" target="_blank">GitHub</a>
          &nbsp;|&nbsp;
          <a href="mailto: chagnon.s21@gmail.com" target="_blank">Contact</a>
        </div>
      </div>
      <img
        src="/outline.svg"
        alt="Sebastien Chagnon"
        style={{
          height: profileHeight,
          position: 'absolute',
          right: '5%',
          bottom: 0,
        }}
      />
    </>
  );
};

export default Home;