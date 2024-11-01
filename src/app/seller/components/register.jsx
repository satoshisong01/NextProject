import { useState, useEffect } from "react";
import styles from "./Register.module.css";

export default function Register({ onUserCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [createdBy, setCreatedBy] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setCreatedBy(storedUsername);
    }
  }, []);

  const getTokenFromCookie = () => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userData = { username, password, role, createdBy };
    const token = getTokenFromCookie();

    console.log("Authorization Header:", `Bearer ${token}`); // Authorization 헤더 값 로그 출력

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Authorization 헤더에 토큰 추가
        },
        credentials: "include", // 쿠키 자동 전송 설정
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        alert("사용자 생성 성공!");
        onUserCreated(); // 성공 시에만 트리거 호출
      } else if (response.status === 409) {
        alert("오류: 사용자 이름이 중복되었습니다");
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.message}`);
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>사용자 생성</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          사용자 이름:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          비밀번호:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          유형:
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={styles.select}
          >
            <option value="user">사용자</option>
            <option value="subadmin">부관리자</option>
          </select>
        </label>
        <button type="submit" className={styles.button}>
          생성
        </button>
      </form>
    </div>
  );
}
