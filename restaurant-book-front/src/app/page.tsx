"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/user/model/authStore";
import { getRoleHomePath } from "@/entities/user/lib/roleRoutes";

export default function Home() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(getRoleHomePath(user.role.code));
    else if (status === "anonymous") router.replace("/login");
  }, [status, user, router]);

  return null;
}
