import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
  opacity?: number;
}

export function BrandLogo({ size = 200, opacity = 1 }: BrandLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ opacity }}
    >
      {/* Blue Shape - Top Left */}
      <Path
        d="M 50 40 C 20 20, 10 90, 40 110 C 70 130, 100 100, 110 60 C 115 30, 80 60, 50 40 Z"
        fill="#3B82F6"
        fillOpacity={0.9}
      />
      {/* Orange Shape - Top Right */}
      <Path
        d="M 100 40 C 130 10, 190 40, 180 90 C 170 140, 130 150, 100 120 C 70 90, 80 70, 100 40 Z"
        fill="#F97316"
        fillOpacity={0.9}
      />
      {/* Yellow Shape - Bottom Center */}
      <Path
        d="M 70 100 C 60 90, 120 80, 140 110 C 160 140, 110 180, 80 160 C 50 140, 80 110, 70 100 Z"
        fill="#EAB308"
        fillOpacity={0.9}
      />
    </Svg>
  );
}
