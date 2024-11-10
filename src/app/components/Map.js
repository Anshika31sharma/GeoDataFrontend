import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MapWithNoSSR = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
  }
);

const MapComponent = ({ points }) => {
  const mapContainerRef = useRef(null);
  const [distance, setDistance] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [map, setMap] = useState(null);
  const [clickedPoints, setClickedPoints] = useState([]);

  const initialCenter = [9.1135, 24.5825];
  const initialZoom = 5;
  const convertDistance = (meters, unit) => {
    if (unit === "km") {
      return (meters / 1000).toFixed(2);
    }
    return (meters * 0.000621371).toFixed(2);
  };
  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYW5zaGlrYTMxc2hhcm1hIiwiYSI6ImNtM2J2dHU1djFvNXMyanI2aGF6a25zdzQifQ.eLvcslTeNFxaYyjSzh-lsg";

    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: initialCenter,
      zoom: initialZoom,
    });
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true,
      },
    });

    newMap.addControl(draw);

    newMap.on("click", (e) => {
      if (clickedPoints.length < 2) {
        const newPoint = [e.lngLat.lng, e.lngLat.lat];
        setClickedPoints((prevPoints) => [...prevPoints, newPoint]);

        if (clickedPoints.length === 1) {
          const [pointA, pointB] = clickedPoints;
          const totalDistance = calculateDistance(pointA, pointB);
          setDistance(totalDistance);
        }
      }
    });

    setMap(newMap);

    return () => newMap.remove();
  }, [clickedPoints]);

  const calculateDistance = (pointA, pointB) => {
    const R = 6371000;
    const lat1 = pointA[1] * (Math.PI / 180);
    const lat2 = pointB[1] * (Math.PI / 180);
    const lon1 = pointA[0] * (Math.PI / 180);
    const lon2 = pointB[0] * (Math.PI / 180);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const handleUnitToggle = () => {
    setDistanceUnit((prevUnit) => (prevUnit === "km" ? "miles" : "km"));
  };

  return (
    <div className="map-container">
      <div
        className="map"
        ref={mapContainerRef}
        style={{ height: "500px" }}
      ></div>

      <div className="distance-info">
        <p>
          <strong>Distance:</strong> {convertDistance(distance, distanceUnit)}{" "}
          {distanceUnit}
        </p>
        <button onClick={handleUnitToggle}>
          Toggle to {distanceUnit === "km" ? "Miles" : "Kilometers"}
        </button>
      </div>

      <div className="points-list">
        <h3>Points:</h3>
        {points.map((point, index) => (
          <p key={index}>
            {point.label}: {point.lat}, {point.lon}
          </p>
        ))}
      </div>
    </div>
  );
};

export default MapComponent;
