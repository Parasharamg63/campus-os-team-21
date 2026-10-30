import React from 'react';

export default function PhoneFrame({ isMobileView, children, role, onHomeClick }) {
  if (!isMobileView) {
    return <div className="desktop-layout">{children}</div>;
  }

  return (
    <div className="phone-mockup-wrapper">
      <div className="phone-device">
        {/* Top Speaker / Camera Grill matching Page 1 & 2 sketch */}
        <div className="phone-speaker-notch">
          <div className="speaker-line"></div>
          <div className="camera-dot"></div>
        </div>

        {/* Phone Content Screen */}
        <div className="phone-screen">
          {children}
        </div>

        {/* Bottom Hardware Home Button matching sketches */}
        <div className="phone-bottom-bezel">
          <button className="phone-home-btn" onClick={onHomeClick} title="Home Button">
            <div className="home-inner-ring"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
