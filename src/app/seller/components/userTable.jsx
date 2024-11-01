import { useEffect, useState } from "react";
import styles from "./userTable.module.css";

export default function UserTable({ refresh, role }) {
  const [users, setUsers] = useState([]);
  const [pointTypes, setPointTypes] = useState([]); // 포인트 종류 목록 상태
  const [selectedPointType, setSelectedPointType] = useState("전체"); // "전체" 기본 선택
  const [manualRefresh, setManualRefresh] = useState(false);
  // 사용자 데이터 및 포인트 타입 목록 불러오기
  useEffect(() => {
    const username = localStorage.getItem("username"); // 로컬스토리지에서 username 가져오기
    const apiEndpoint =
      role === "admin" ? "/api/users" : `/api/users?created_by=${username}`; // 쿼리 파라미터로 전달

    fetch(apiEndpoint)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`서버 응답 오류: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const userData = data.reduce((acc, row) => {
          const {
            user_id,
            username,
            role,
            created_at,
            created_by,
            point_id,
            type_name,
            point_score,
            added_by,
          } = row;

          if (!acc[user_id]) {
            acc[user_id] = {
              user_id,
              username,
              role,
              created_at,
              created_by,
              points: [],
              added_by,
            };
          }

          if (type_name) {
            acc[user_id].points.push({ point_id, type_name, point_score });
          }

          return acc;
        }, {});
        setUsers(Object.values(userData));
      })
      .catch((error) => console.error("사용자 데이터 불러오기 오류:", error));

    // 포인트 종류 목록 불러오기
    fetch("/api/point-types")
      .then((response) => response.json())
      .then((data) => setPointTypes([{ type_name: "전체" }, ...data])) // "전체" 옵션 추가
      .catch((error) => console.error("포인트 타입 불러오기 오류:", error));
  }, [refresh, manualRefresh]);

  // 확인 버튼 클릭 시 필터링 처리
  const handleCheckPoints = () => {
    console.log(`선택된 포인트 타입: ${selectedPointType}`);
  };

  // 수동 새로고침 버튼 클릭 시 실행될 함수
  const handleRefresh = () => {
    setManualRefresh((prev) => !prev);
  };

  const handleUpdatePassword = (userId) => {
    const newPassword = prompt("새 비밀번호를 입력하세요:");
    if (newPassword) {
      fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
        .then((response) => {
          if (response.ok) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
          } else {
            alert("비밀번호 변경에 실패했습니다.");
          }
        })
        .catch((error) => console.error("비밀번호 변경 오류:", error));
    }
  };

  const handleDeleteUser = (userId) => {
    if (confirm("정말 이 아이디를 삭제하시겠습니까?")) {
      fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.ok) {
            alert("사용자가 삭제되었습니다.");
            setUsers(users.filter((user) => user.user_id !== userId)); // 테이블에서 삭제된 사용자 제거
          } else {
            alert("사용자 삭제에 실패했습니다.");
          }
        })
        .catch((error) => console.error("사용자 삭제 오류:", error));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>사용자 현황</h2>
      <div className={styles.filterContainer}>
        <label>
          포인트 종류:
          <select
            value={selectedPointType}
            onChange={(e) => setSelectedPointType(e.target.value)}
            className={styles.select}
          >
            {pointTypes.map((type) => (
              <option key={type.type_name} value={type.type_name}>
                {type.type_name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleCheckPoints} className={styles.button}>
          확인
        </button>
        <button onClick={handleRefresh} className={styles.refreshButton}>
          🔄 {/* 새로고침 아이콘 (회전 화살표 모양) */}
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>권한</th>
            <th>생성 날짜</th>
            <th>생성한 관리자</th>
            <th>포인트 종류 및 점수</th>
            <th>포인트 추가자</th>
            <th>관리 옵션</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter(
              (user) =>
                selectedPointType === "전체" ||
                user.points.some(
                  (point) => point.type_name === selectedPointType
                )
            )
            .map((user) => (
              <tr key={user.user_id}>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.created_by}</td>
                <td>
                  {user.points.length > 0 ? (
                    user.points
                      .filter(
                        (point) =>
                          selectedPointType === "전체" ||
                          point.type_name === selectedPointType
                      )
                      .map((point) => {
                        return (
                          <div key={point.point_id}>
                            {point.type_name}: {point.point_score} 점
                          </div>
                        );
                      })
                  ) : (
                    <span>포인트 없음</span>
                  )}
                </td>
                <td>{user.added_by || "-"}</td>
                <td>
                  <button
                    style={{ width: "100px", marginBottom: "3px" }}
                    className={styles.optionButton}
                    onClick={() => handleUpdatePassword(user.user_id)}
                  >
                    비밀번호 변경
                  </button>
                  <button
                    style={{ width: "100px", marginTop: "3px" }}
                    className={styles.optionButton}
                    onClick={() => handleDeleteUser(user.user_id)}
                  >
                    아이디 삭제
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
