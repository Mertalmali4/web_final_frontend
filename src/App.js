import React from "react";
import Login from "./pages/Login";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/dashboard'; // Giriş sonrası yönlenecek sayfa
import Register from './pages/Register'; // Giriş sonrası yönlenecek sayfa
import User from './pages/user';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
};

export default App;
