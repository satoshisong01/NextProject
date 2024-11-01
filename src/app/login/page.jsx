"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/LoginForm.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // API 요청을 통해 사용자 인증
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        // credentials: "include", // 쿠키 포함 설정(서버가 설정한 쿠키를 클라이언트가 자동으로 포함)
      });

      if (response.ok) {
        // 인증 성공 시 JWT 토큰과 역할 정보를 반환받음
        const { token, role } = await response.json();

        // localStorage에 토큰과 역할 정보를 저장
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("username", username);

        // 대시보드로 이동
        router.push("/dashboard");
      } else {
        // 인증 실패 시 경고 메시지
        alert("아이디 또는 비밀번호가 잘못되었습니다.");
      }
    } catch (error) {
      console.error("로그인 요청 실패:", error);
      alert("로그인 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="아이디"
          required
        />
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
        />
        <button type="submit" className={styles.button}>
          로그인
        </button>
      </form>
    </div>
  );
}
