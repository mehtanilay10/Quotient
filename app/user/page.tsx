import { redirect } from "next/navigation";

/**
 * `/user` is the account area root; the section pages live one level down
 * (`/user/profile`, `/user/progress`, …). Land visitors on the profile so the
 * sidebar's first entry is always where they start.
 */
export default function UserIndexPage() {
  redirect("/user/profile");
}
