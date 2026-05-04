import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirige inmediatamente a /payments
  redirect("/payments");
}
