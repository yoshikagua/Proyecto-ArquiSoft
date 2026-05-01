import { type ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        background: "linear-gradient(135deg, hsl(36, 58%, 58%) 0%, hsl(36, 50%, 48%) 100%)",
      }}
    >
      {/* Notas musicales decorativas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
        <span className="absolute left-[5%] top-[10%] font-serif text-8xl text-foreground">♪</span>
        <span className="absolute right-[8%] top-[15%] font-serif text-7xl text-foreground">♫</span>
        <span className="absolute left-[10%] bottom-[20%] font-serif text-9xl text-foreground">𝄞</span>
        <span className="absolute right-[5%] bottom-[10%] font-serif text-8xl text-foreground">♩</span>
        <span className="absolute left-[50%] top-[5%] font-serif text-6xl text-foreground">♬</span>
        <span className="absolute right-[30%] bottom-[5%] font-serif text-7xl text-foreground">♪</span>
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
