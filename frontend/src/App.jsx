import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Calc from './Components/Calc/Calc';
import Login from './Components/Login/Login';
import Signup from './Components/Signup/Signup';
import Navbar from './Components/Navbar/Navbar';
import Table from './Components/Table/Table';
import StockDetails from './Components/StockDetails/StockDetails';
import LandingPage from './Components/LandingPage/LandingPage';
import IndividualStockDetail from './Components/LandingPage/IndividualStockDetail';
import Articles from './Components/Articles/Articles';
import TrackTrade from './Components/TrackTrade/TrackTrade';

function App() {
  const [count, setCount] = useState(0);

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <>
      <Routes>
        {/* Default route: Redirect "/" to "/landing-page" */}
        <Route path="/" element={<Navigate to="/landing-page" replace />} />

        <Route
          path="/landing-page"
          element={
            <>
              <Navbar />
              <LandingPage />
            </>
          }
        />

        <Route
          path="/track-trade"
          element={
            <>
              <Navbar />
              <TrackTrade />
            </>
          }
        />

        <Route
          path="/article"
          element={
            <>
              <Navbar />
              <Articles />
            </>
          }
        />

        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <Login />
            </>
          }
        />

        <Route
          path="/calculator"
          element={
            <>
              <Navbar />
              <Calc />
            </>
          }
        />

        <Route
          path="/stock/:symbol"
          element={
            <>
              <Navbar />
              <IndividualStockDetail />
            </>
          }
        />

        <Route
          path="/signup"
          element={
            <>
              <Navbar />
              <Signup />
            </>
          }
        />

        <Route
          path="/detailsTable"
          element={
            <>
              <Navbar />
              <Table />
            </>
          }
        />

        <Route
          path="/stockDetails/:reportId"
          element={
            <>
              <Navbar />
              <StockDetails />
            </>
          }
        />

        {/* Catch-all: Redirect to Landing Page for unknown routes */}
        <Route path="*" element={<Navigate to="/landing-page" replace />} />
      </Routes>
    </>
  );
}

export default App;
