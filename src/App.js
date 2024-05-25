import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen flex flex-col font-serif">
        <header className="bg-emerald-500 py-4">
          <div className="container mx-auto flex justify-between items-center px-8">
            <p className="font-bold text-xl text-gray-100">ENOP</p>
            <nav>
              <ul className="flex space-x-4 text-white">
                <li className="text-xl">
                  <Link to="/">Home</Link>
                </li>
                <li className="text-xl">
                  <Link to="/about">About</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="container mx-auto flex-1 px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
