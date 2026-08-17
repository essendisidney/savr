import { redirect } from "next/navigation";

/** Drops live on Saved — one place for watches. */
export default function AlertsRedirect() {
  redirect("/saved");
}
