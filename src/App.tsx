import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { SearchPage } from './pages/Search';
import { MyLists } from './pages/MyLists';
import { CreateList } from './pages/CreateList';
import { Results } from './pages/Results';
import { AllOffers } from './pages/AllOffers';
import { Contribute } from './pages/Contribute';
import { Profile } from './pages/Profile';
import { MarketPanel } from './pages/MarketPanel';
import { EconomyDetails } from './pages/EconomyDetails';
import { BottomNav } from './components/layout/BottomNav';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background pb-20">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/lists" element={<MyLists />} />
            <Route path="/lists/new" element={<CreateList />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/results" element={<Results />} />
            <Route path="/offers" element={<AllOffers />} />
            <Route path="/market" element={<MarketPanel />} />
            <Route path="/economy-details" element={<EconomyDetails />} />
          </Routes>
        </AnimatePresence>
        <BottomNav />
      </div>
    </Router>
  );
}
