"use client";

import { useState, useRef, useEffect } from "react";

export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip if clicked outside on touch devices
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
      ref={tooltipRef}
    >
      {children}
      {show && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-48 sm:left-1/2 sm:w-64 sm:-translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white shadow-lg pointer-events-none">
          {text}
          <div className="absolute bottom-[-4px] right-3 h-2 w-2 rotate-45 bg-neutral-900 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
}
