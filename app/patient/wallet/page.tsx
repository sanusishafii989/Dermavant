import { redirect } from "next/navigation";

export default function PatientWalletRedirect() {
  redirect("/patient/dashboard/wallet");
}
