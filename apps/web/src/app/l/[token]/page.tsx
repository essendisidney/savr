import { redirect } from "next/navigation";

/** Legacy share-list URLs — marketplace MVP sends them home. */
export default function LegacyShareRedirect() {
  redirect("/");
}
