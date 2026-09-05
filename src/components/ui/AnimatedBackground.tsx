import React from 'react';
import './AnimatedBackground.css';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="av-bg-effects">
      {/* Slow-moving gradient mesh orbs */}
      <div className="glow-orb orb-primary" />
      <div className="glow-orb orb-secondary" />
      <div className="glow-orb orb-tertiary" />

      {/* Floating particles layer */}
      <div className="particles-layer">
        <div className="particle p1 particle-glow" />
        <div className="particle p2" />
        <div className="particle p3 particle-glow" />
        <div className="particle p4" />
        <div className="particle p5" />
        <div className="particle p6 particle-glow" />
        <div className="particle p7" />
        <div className="particle p8 particle-glow" />
        <div className="particle p9" />
        <div className="particle p10" />
      </div>
    </div>
  );
};

export default AnimatedBackground;
