import { Metadata } from "next";
import { NotesClient } from "./NotesClient";

export const metadata: Metadata = {
  title: "Notes | Quotient",
  description: "View and manage your lesson notes.",
};

export default function NotesPage() {
  return <NotesClient />;
}
