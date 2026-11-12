import { redirect } from "next/navigation";

export default function InscriptionRedirect() {
  // Seul l'administrateur peut créer des comptes : redirection vers /login
  redirect("/login");
}
