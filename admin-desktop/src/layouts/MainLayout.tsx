import { type ReactNode } from "react";
import Navbar from "../components/Navbar";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
