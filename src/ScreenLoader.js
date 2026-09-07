import React, { useEffect, useState } from "react";
import "./ScreenLoader.css";

const ScreenLoader = () => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 1000); // 1 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`loader-screen ${fadeOut ? "fade-out" : ""}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default ScreenLoader;
