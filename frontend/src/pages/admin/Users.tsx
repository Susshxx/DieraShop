import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    api.get<any[]>("/admin/users").then(setUsers).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl mb-6">Users</h1>
      <div className="border border-border rounded-lg bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted text-xs uppercase"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Joined</th><th className="text-left p-3">Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">{u.full_name || "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.phone || "—"}</td>
                <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
