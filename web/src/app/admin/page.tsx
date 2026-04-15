import { checkAdminSession } from "./actions";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  return <AdminClient initiallyAuthed={await checkAdminSession()} />;
}
