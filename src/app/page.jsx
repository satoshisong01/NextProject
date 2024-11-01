// src/app/page.jsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login"); // 로그인 페이지로 리다이렉트
  }, [router]);

  return null;
}
