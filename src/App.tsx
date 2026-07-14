import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";
import RosterPage from "./pages/RosterPage";
import SeatingPage from "./pages/SeatingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/roster" replace />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/seating" element={<SeatingPage />} />
          <Route path="*" element={<Navigate to="/roster" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
