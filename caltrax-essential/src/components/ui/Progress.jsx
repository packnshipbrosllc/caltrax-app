import React from 'react';

export function Progress({ value, className = "", ...props }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`} {...props}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}
