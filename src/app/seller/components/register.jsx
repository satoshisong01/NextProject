import { useState, useEffect } from "react";
import styles from "./Register.module.css";

export default function Register({ onUserCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [createdBy, setCreatedBy] = useState("");
  const storedRole = localStorage.getItem("role");

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
    const roles = localStorage.getItem("role");
    event.preventDefault();

    const userData = { username, password, role, createdBy };
    const token = getTokenFromCookie();
    console.log("role", roles);
    if (roles !== "admin") {
      // 서버에서 지정된 제한 시간을 가져옴
      const timeResponse = await fetch("/api/time-setting");
      if (timeResponse.ok) {
        const { scheduled_time: scheduledTime } = await timeResponse.json();
        console.log("Scheduled Time:", scheduledTime);

        // 현재 시간을 가져옴
        const currentTime = new Date();
        const [scheduledHour, scheduledMinute, scheduledSecond] = scheduledTime
          .split(":")
          .map(Number);

        const startTime = new Date();
        startTime.setHours(scheduledHour, scheduledMinute, scheduledSecond, 0);

        // 종료 시간을 자정으로 설정 (24:00:00)
        const endTime = new Date();
        endTime.setHours(24, 0, 0, 0);

        // 현재 시간이 지정된 제한 시간 범위 내에 있는지 확인
        if (currentTime >= startTime && currentTime < endTime) {
          alert("사용자 생성은 현재 시간에 허용되지 않습니다.");
          return;
        }
      } else {
        alert("제한 시간을 확인할 수 없습니다.");
        return;
      }
    }

    console.log("Authorization Header:", `Bearer ${token}`);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        alert("사용자 생성 성공!");
        onUserCreated();
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
            {storedRole !== "subadmin" && (
              <option value="subadmin">부관리자</option>
            )}
          </select>
        </label>
        <button type="submit" className={styles.button}>
          생성
        </button>
      </form>
    </div>
  );
}
