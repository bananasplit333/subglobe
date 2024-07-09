"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

const World = dynamic(
  () => import("@/components/ui/globe").then((m) => m.World),
  {
    ssr: false,
  }
);
const globeConfig = {
  pointSize: 8,
  globeColor: "#062056",
  showAtmosphere: true,
  atmosphereColor: "#FFFFFF",
  atmosphereAltitude: 0.1,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

export default function Home() {
  const [targetCoordinates, setTargetCoordinates] = useState<
    { lat: string; lng: string } | undefined
  >();
  const [textInput, setTextInput] = useState<String>("");

  const handleCoordinateSubmit = (lat: string, lng: string) => {
    setTargetCoordinates({ lat, lng });
  };

  const placeHolders = ["Mexico", "Pakistan", "Phillipines", "Canada"];

  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-screen min-w-screen md:h-auto dark:bg-black bg-black relative w-full">
      <div className="max-w-7xl mx-auto w-full relative overflow-hidden h-full md:h-[60rem] px-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
          }}
          className="div"
        ></motion.div>
        <div className="absolute w-full bottom-0 inset-x-0 h-60 pointer-events-none select-none from-transparent dark:to-black to-white z-40" />
        <div className="absolute w-full -bottom-10 h-600 md:h-full z-10">
          <World
            globeConfig={globeConfig}
            data={
              targetCoordinates
                ? [targetCoordinates]
                : [{ lat: "13.089869", lng: "80.24590" }]
            }
          />
        </div>
      </div>
    </div>
  );
}
