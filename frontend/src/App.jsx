import { Route, Routes } from "react-router";
import { TaxonProvider } from "./context/TaxonContext.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";

function App() {
  return (
    <TaxonProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </TaxonProvider>
  );
}

export default App;
