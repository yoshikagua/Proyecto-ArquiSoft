import { Navigate } from "react-router-dom";

// /dashboard redirige a /partituras (ver App.tsx)
const Dashboard = () => <Navigate to="/partituras" replace />;

export default Dashboard;
