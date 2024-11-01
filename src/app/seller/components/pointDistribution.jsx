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
    // 사용자 목록 불러오기 함수
    const fetchUsers = async () => {
      try {
        const createdBy = localStorage.getItem("username"); // 로컬 스토리지에서 username 가져오기
        const role = localStorage.getItem("role"); // 로컬 스토리지에서 role 가져오기
        console.log(role);
        // role이 "admin"이면 전체 사용자 목록을 요청, 그 외에는 created_by가 현재 사용자와 일치하는 사용자만 가져옴
        const apiEndpoint =
          role === "admin"
            ? "/api/users"
            : `/api/users?created_by=${createdBy}`;

        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          throw new Error("사용자 목록을 불러오는 중 오류 발생");
        }

        const data = await response.json();

        // username을 기준으로 중복을 제거한 사용자 목록
        const uniqueUsers = Array.from(
          new Map(data.map((user) => [user.username, user])).values()
        );

        setUsers(uniqueUsers);
      } catch (err) {
        console.error("사용자 목록을 불러오는 중 오류:", err);
        setError("사용자 목록을 불러오는 데 실패했습니다. 다시 시도해주세요.");
      }
    };

    // 포인트 타입 목록 불러오기 함수
    const fetchPointTypes = async () => {
      try {
        const response = await fetch("/api/point-types");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("포인트 타입 불러오기 오류:", errorText);
          setError(
            "포인트 타입을 불러오는 데 실패했습니다. 다시 시도해주세요."
          );
          return;
        }
        const data = await response.json();
        setPointTypes(data);
      } catch (error) {
        console.error("포인트 타입 불러오기 중 오류:", error);
        setError(
          "포인트 타입을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요."
        );
      }
    };

    // 데이터 불러오기 함수 호출
    fetchUsers();
    fetchPointTypes();

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setAddedBy(storedUsername);
    }
  }, [refresh, manualRefresh]); // refresh와 manualRefresh 변경 시 데이터를 다시 불러옴

  // 수동 새로고침 버튼 클릭 시 실행될 함수
  const handleRefresh = () => {
    setManualRefresh((prev) => !prev);
  };

  // 폼 제출 함수
  const handleSubmit = async (event) => {
    event.preventDefault();

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

  // 오류 발생 시 오류 메시지 표시
  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <div style={{ display: "flex" }}>
        <h2 className={styles.title}>포인트 지급</h2>
        <button onClick={handleRefresh} className={styles.refreshButton}>
          🔄 {/* 새로고침 아이콘 (회전 화살표 모양) */}
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
        <button type="submit" className={styles.button}>
          지급
        </button>
      </form>
    </div>
  );
}
