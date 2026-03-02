import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const signUpSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(50),
    apellido: z.string().trim().min(1, "El apellido es obligatorio").max(50),
    email: z.string().trim().email("Ingresa un correo electrónico válido"),
    password: z
      .string()
      .min(5, "Mínimo 5 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos 1 mayúscula")
      .regex(/[0-9]/, "Debe incluir al menos 1 número")
      .regex(/[^A-Za-z0-9]/, "Debe incluir al menos 1 carácter especial"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type SignUpData = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields, dirtyFields },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const onSubmit = (data: SignUpData) => {
    toast.success("¡Cuenta creada! Ya puedes iniciar sesión. En tu correo te damos la bienvenida", {
      duration: 5000,
    });
    console.log("Sign up data:", { ...data, password: "***", confirmPassword: "***" });
  };

  const isFieldValid = (field: keyof SignUpData) =>
    dirtyFields[field] && !errors[field];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Nombre"
          error={errors.nombre?.message}
          valid={isFieldValid("nombre")}
          required
        >
          <Input
            {...register("nombre")}
            placeholder="Juan"
            className={fieldClass(errors.nombre?.message, isFieldValid("nombre"))}
          />
        </FormField>

        <FormField
          label="Apellido"
          error={errors.apellido?.message}
          valid={isFieldValid("apellido")}
          required
        >
          <Input
            {...register("apellido")}
            placeholder="García"
            className={fieldClass(errors.apellido?.message, isFieldValid("apellido"))}
          />
        </FormField>
      </div>

      <FormField
        label="Correo electrónico"
        error={errors.email?.message}
        valid={isFieldValid("email")}
        required
      >
        <Input
          {...register("email")}
          type="email"
          placeholder="correo@ejemplo.com"
          className={fieldClass(errors.email?.message, isFieldValid("email"))}
        />
      </FormField>


      <FormField
        label="Contraseña"
        error={errors.password?.message}
        valid={isFieldValid("password")}
        required
      >
        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className={fieldClass(errors.password?.message, isFieldValid("password")) + " pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Mínimo 5 caracteres, 1 mayúscula, 1 número y 1 carácter especial.
        </p>
      </FormField>

      <FormField
        label="Confirmar contraseña"
        error={errors.confirmPassword?.message}
        valid={isFieldValid("confirmPassword")}
        required
      >
        <div className="relative">
          <Input
            {...register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            className={fieldClass(errors.confirmPassword?.message, isFieldValid("confirmPassword")) + " pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>

      <Button
        type="submit"
        disabled={!isValid}
        className="w-full text-base font-medium transition-colors"
        size="lg"
      >
        Crear Cuenta
      </Button>
    </form>
  );
};

function fieldClass(error?: string, valid?: boolean) {
  if (error) return "border-destructive focus-visible:ring-destructive/30";
  if (valid) return "border-success focus-visible:ring-success/30";
  return "";
}

function FormField({
  label,
  error,
  valid,
  required,
  children,
}: {
  label: string;
  error?: string;
  valid?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
        {valid && <Check className="h-3.5 w-3.5 text-success" />}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default SignUpForm;
