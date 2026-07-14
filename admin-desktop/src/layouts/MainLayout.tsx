import { type ReactNode } from "react";
import Navbar from "../components/Navbar";
import BrowserNavControls from "../components/BrowserNavControls";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BrowserNavControls />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
