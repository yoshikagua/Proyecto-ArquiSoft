import SignUpForm from "../components/SignUpForm";
import { Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import logo from "../assets/logo.png"; 

const Index = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-border/40 bg-card px-8 pb-8 pt-10 shadow-card">
        {/* Header inside card */}
        {/* Header inside card */}
<div className="mb-8 text-center">
  <div className="mb-6 flex justify-center">
    <div className="rounded-full ring-2 ring-secondary/40 ring-offset-2 ring-offset-card">
      <img
        src={logo}
        alt="Logo de la Biblioteca Musical"
        className="h-20 w-20 rounded-full object-cover shadow-md sm:h-24 sm:w-24"
      />
    </div>
  </div>

  <h1 className="font-serif text-3xl font-bold text-foreground">
    Crear Cuenta
  </h1>
  <p className="mt-2 text-sm text-muted-foreground">
    Únete a nuestra biblioteca de partituras musicales
  </p>
</div>

        <SignUpForm />

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">✦</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <span
            onClick={() => navigate("/login")}
            className="cursor-pointer font-medium text-secondary hover:underline transition-colors"
          >
            Iniciar sesión
          </span>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Index;