"use client";
import { useEffect, useRef, useState } from "react";
import {
  Color,
  Scene,
  Fog,
  PerspectiveCamera,
  Vector3,
  Vector2,
  Raycaster,
} from "three";
import ThreeGlobe from "three-globe";
import { useThree, Object3DNode, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";
declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: Object3DNode<ThreeGlobe, typeof ThreeGlobe>;
  }
}
import map from "../../data/map.json";
extend({ ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

type Position = {
  lat: string;
  lng: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

let numbersOfRings = [0];

export function Globe({ globeConfig, data }: WorldProps) {
  const [globeData, setGlobeData] = useState<
    | {
        lat: string;
        lng: string;
      }[]
    | null
  >(null);
  const { camera, gl } = useThree();
  const globeRef = useRef<ThreeGlobe | null>(null);
  const mouse = useRef(new Vector2());
  const raycaster = useRef(new Raycaster());
  const [isDragging, setIsDragging] = useState(false);

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => {
      setIsDragging(false);
      handleMouseClick();
    };

    const handleMouseClick = () => {
      if (isDragging) return;

      const globeElement = globeRef.current;
      if (!globeElement) return;

      // Calculate mouse position in normalized device coordinates
      mouse.current.x =
        (gl.domElement.width / 2 / gl.domElement.clientWidth) * 2 - 1;
      mouse.current.y =
        -(gl.domElement.height / 2 / gl.domElement.clientHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.current.setFromCamera(mouse.current, camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.current.intersectObject(globeElement, true);

      if (intersects.length > 0) {
        console.log("Globe clicked!", intersects[0].point);
        // Handle the click event here
      }
    };

    const canvasElement = gl.domElement;
    canvasElement.addEventListener("mousedown", handleMouseDown);
    canvasElement.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvasElement.removeEventListener("mousedown", handleMouseDown);
      canvasElement.removeEventListener("mouseup", handleMouseUp);
    };
  }, [camera, gl, isDragging]);

  useEffect(() => {
    if (globeRef.current) {
      _buildData();
      _buildMaterial();
    }
  }, [globeRef.current]);

  const _buildMaterial = () => {
    if (!globeRef.current) return;

    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    globeMaterial.color = new Color(globeConfig.globeColor);
    globeMaterial.emissive = new Color(globeConfig.emissive);
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
    globeMaterial.shininess = globeConfig.shininess || 0.2;
  };

  const _buildData = () => {
    const arcs = map.maps;
    let points = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      points.push({
        color: defaultProps.globeColor,
        size: defaultProps.pointSize,
        lat: arc.lat,
        lng: arc.lon,
      });
    }
    console.log(`points ${points}`);
    // remove duplicates for same lat and lng
    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) =>
          ["lat", "lng"].every(
            (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
          )
        ) === i
    );
    console.log("filteredPoints", filteredPoints);
    setGlobeData(filteredPoints);
  };

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(defaultProps.showAtmosphere)
        .atmosphereColor(defaultProps.atmosphereColor)
        .atmosphereAltitude(0.25)
        .hexPolygonColor((e) => {
          return defaultProps.polygonColor;
        });
      startAnimation();
    }
  }, [globeData]);

  const startAnimation = () => {
    // Convert lat and lon to numbers
    const arcs = map.maps;
    let points = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      points.push({
        color: defaultProps.globeColor,
        size: defaultProps.pointSize,
        name: arc.country,
        lat: arc.lat,
        lng: arc.lon,
      });
    }
    if (!globeRef.current || !globeData) return;
    console.log("creating points");
    globeRef.current
      .labelsData(points)
      .labelColor(() => "#EBB8DD") // Set label color to white
      .labelSize(1.3)
      .labelResolution(6)
      .labelText("name")
      .labelDotRadius(0.5)
      .labelAltitude(0.01)
      .pointsData(points)
      .pointColor(() => "#ffcb21")
      .pointAltitude(0)
      .pointRadius(0.2);
  };

  useEffect(() => {
    if (!globeRef.current || !globeData) return;
    const interval = setInterval(() => {
      if (!globeRef.current || !globeData) return;
      numbersOfRings = genRandomNumbers(
        0,
        data.length,
        Math.floor((data.length * 4) / 5)
      );

      globeRef.current.ringsData(
        globeData.filter((d, i) => numbersOfRings.includes(i))
      );
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [globeRef.current, globeData]);

  return (
    <>
      <threeGlobe ref={globeRef} />
    </>
  );
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0xffaaff, 0);
  }, []);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  const scene = new Scene();
  scene.fog = new Fog(0xffffff, 400, 2000);
  return (
    <Canvas scene={scene} camera={new PerspectiveCamera(50, aspect, 180, 1800)}>
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.1} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(-200, 500, 200)}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={new Vector3(-200, 500, 200)}
        intensity={0.8}
      />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={282}
        maxDistance={800}
        autoRotateSpeed={1}
        autoRotate={false}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}

export function hexToRgb(hex: string) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  return arr;
}
