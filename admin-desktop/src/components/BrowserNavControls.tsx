import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

const BrowserNavControls = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    navigate(-1);
  };

  const goForward = () => {
    navigate(1);
  };

  const reload = () => {
    window.location.reload();
  };

  const buttonBase =
    "flex h-10 w-10 items-center justify-center rounded-full border border-secondary/25 bg-card/95 text-foreground shadow-md backdrop-blur-sm transition-all hover:border-primary/50 hover:text-primary hover:shadow-lg active:scale-95";

  return (
    <div className="fixed left-4 top-24 z-40 flex flex-col gap-2 rounded-2xl border border-secondary/20 bg-card/75 p-2 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={goBack}
        aria-label="Volver atrás"
        title="Volver atrás"
        className={buttonBase}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={goForward}
        aria-label="Avanzar"
        title="Avanzar"
        className={buttonBase}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={reload}
        aria-label="Recargar"
        title="Recargar"
        className={buttonBase}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <div className="mt-1 rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {location.pathname.replace(/^\//, "") || "inicio"}
      </div>
    </div>
  );
};

export default BrowserNavControls;