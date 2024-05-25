import React from "react";
import about1 from "../images/about_1.png";
import about2 from "../images/about_2.png";
import about3 from "../images/about_3.png";
import "../App.css";

function About() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col font-serif">
      <main className="container mx-auto flex-1 px-4">
        <div className="bg-white shadow-md p-6 rounded-md">
          <div className="flex flex-col space-y-4">
            <img src={about1} alt="About 1" />
            <img src={about2} alt="About 2" />
            <img src={about3} alt="About 3" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default About;
