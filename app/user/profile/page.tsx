import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile | Quotient",
  description: "Your account details and activity summary.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <ProfileClient
      user={{
        id: user?.id || "",
        name: user?.name ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
      }}
    />
  );
}
