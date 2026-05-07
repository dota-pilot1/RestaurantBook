"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { useAuth } from "@/entities/user/model/authStore";
import { getRoleHomePath } from "@/entities/user/lib/roleRoutes";
import { AdminDashboard } from "@/features/admin-dashboard/AdminDashboard";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <RoleDashboardRedirect />
    </RequireAuth>
  );
}

function RoleDashboardRedirect() {
  const { user } = useAuth();
  const router = useRouter();
  const roleCode = user?.role.code;

  useEffect(() => {
    const homePath = getRoleHomePath(roleCode);
    if (homePath !== "/dashboard") {
      router.replace(homePath);
    }
  }, [roleCode, router]);

  if (roleCode === "ROLE_ADMIN") {
    return <AdminDashboard />;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-3">RestaurantBook</h1>
      <p className="text-muted-foreground max-w-md">
        역할별 시작 화면으로 이동 중입니다.
      </p>
    </main>
  );
}
