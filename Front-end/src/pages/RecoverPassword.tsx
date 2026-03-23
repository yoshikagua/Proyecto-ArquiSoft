import { Mail } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "@/layouts/AuthLayout";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo electrónico es obligatorio." })
    .email({ message: "Por favor, ingresa un correo electrónico válido." }),
});

type FormData = z.infer<typeof schema>;

const RecoverPassword = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = (data: FormData) => {
    navigate("/verify-code");
  };

  return (
    <AuthLayout>
      <div className="rounded-xl border border-border bg-card p-8 shadow-xl sm:p-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/logo.png"
            alt="Partituras"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-center font-serif text-3xl font-semibold text-foreground">
          Recuperar contraseña
        </h1>

        {/* Description */}
        <p className="mb-8 text-center text-sm leading-relaxed text-muted-foreground">
          Ingresa tu correo electrónico y te enviaremos un código para
          restablecer tu contraseña.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                className={`w-full rounded-lg border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${errors.email
                    ? "border-destructive focus:ring-destructive"
                    : "border-input focus:border-primary"
                  }`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isDirty || !isValid}
            className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar código
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-accent underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RecoverPassword;
