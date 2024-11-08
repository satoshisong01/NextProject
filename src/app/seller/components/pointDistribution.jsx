import { useState, useEffect } from "react";
import styles from "./pointDistribution.module.css";

export default function PointDistribution({ refresh }) {
  const [users, setUsers] = useState([]);
  const [pointTypes, setPointTypes] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPointType, setSelectedPointType] = useState("");
  const [pointScore, setPointScore] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [error, setError] = useState(null);
  const [manualRefresh, setManualRefresh] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const createdBy = localStorage.getItem("username");
        const role = localStorage.getItem("role");

        const apiEndpoint =
          role === "admin"
            ? "/api/users"
            : `/api/users?created_by=${createdBy}`;

        const response = await fetch(apiEndpoint);
        if (!response.ok)
          throw new Error("사용자 목록을 불러오는 중 오류 발생");

        const data = await response.json();
        const uniqueUsers = Array.from(
          new Map(data.map((user) => [user.username, user])).values()
        );
        setUsers(uniqueUsers);
      } catch (err) {
        console.error("사용자 목록을 불러오는 중 오류:", err);
        setError("사용자 목록을 불러오는 데 실패했습니다. 다시 시도해주세요.");
      }
    };

    const fetchPointTypes = async () => {
      try {
        const response = await fetch("/api/point-types");
        if (!response.ok) throw new Error("포인트 타입 불러오기 오류");

        const data = await response.json();
        setPointTypes(data);
      } catch (error) {
        console.error("포인트 타입 불러오기 중 오류:", error);
        setError("포인트 타입을 불러오는 데 실패했습니다. 다시 시도해주세요.");
      }
    };

    fetchUsers();
    fetchPointTypes();

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setAddedBy(storedUsername);
  }, [refresh, manualRefresh]);

  const handleRefresh = () => setManualRefresh((prev) => !prev);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // admin이 아닌 경우 시간 제한 검사 수행
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      const timeResponse = await fetch("/api/time-setting");
      if (timeResponse.ok) {
        const { scheduled_time: scheduledTime } = await timeResponse.json();
        const currentTime = new Date();
        const [startHours, startMinutes, startSeconds] = scheduledTime
          .split(":")
          .map(Number);

        const startTime = new Date();
        startTime.setHours(startHours, startMinutes, startSeconds, 0);

        const endTime = new Date();
        endTime.setHours(24, 0, 0, 0);

        if (currentTime >= startTime && currentTime < endTime) {
          alert("지금은 포인트 지급 가능한 시간이 아닙니다.");
          return;
        }
      } else {
        alert("시간 정보를 확인할 수 없습니다.");
        return;
      }
    }

    const pointData = {
      username: selectedUser,
      point_type_id: parseInt(selectedPointType),
      point_score: parseInt(pointScore),
      added_by: addedBy,
      point_created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointData),
      });

      if (response.ok) {
        alert("포인트가 성공적으로 지급되었습니다.");
        setPointScore("");
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.message}`);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  // 포인트 회수 함수
  const handleRevoke = async () => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      const timeResponse = await fetch("/api/time-setting");
      if (timeResponse.ok) {
        const { scheduled_time: scheduledTime } = await timeResponse.json();
        const currentTime = new Date();
        const [startHours, startMinutes, startSeconds] = scheduledTime
          .split(":")
          .map(Number);

        const startTime = new Date();
        startTime.setHours(startHours, startMinutes, startSeconds, 0);

        const endTime = new Date();
        endTime.setHours(24, 0, 0, 0);

        if (currentTime >= startTime && currentTime < endTime) {
          alert("지금은 포인트 회수 가능한 시간이 아닙니다.");
          return;
        }
      } else {
        alert("시간 정보를 확인할 수 없습니다.");
        return;
      }
    }

    const pointData = {
      username: selectedUser,
      point_type_id: parseInt(selectedPointType),
      point_score: parseInt(pointScore),
      added_by: addedBy,
      isRevoke: true,
    };

    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointData),
      });

      if (response.ok) {
        alert("포인트가 성공적으로 회수되었습니다.");
        setPointScore("");
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.message}`);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <div style={{ display: "flex" }}>
        <h2 className={styles.title}>포인트 지급 및 회수</h2>
        <button onClick={handleRefresh} className={styles.refreshButton}>
          🔄
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          사용자 선택:
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
            className={styles.select}
          >
            <option value="">사용자 선택</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.username}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          포인트 타입:
          <select
            value={selectedPointType}
            onChange={(e) => setSelectedPointType(e.target.value)}
            required
            className={styles.select}
          >
            <option value="">포인트 타입 선택</option>
            {pointTypes.map((type) => (
              <option key={type.type_id} value={type.type_id}>
                {type.type_name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          포인트 점수:
          <input
            type="number"
            value={pointScore}
            onChange={(e) => setPointScore(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" className={styles.button}>
            지급
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            className={styles.revokeButton}
          >
            회수
          </button>
        </div>
      </form>
    </div>
  );
}
