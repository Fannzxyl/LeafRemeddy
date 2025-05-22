// components/Section.jsx
import React from "react";

const Section = ({ title, content }) => {
  return (
    <div className="section min-h-screen flex flex-col justify-center items-center px-4 text-center">
      <h2 className="text-4xl font-bold mb-4">{title}</h2>
      <p className="max-w-2xl">{content}</p>
    </div>
  );
};

export default Section;
