import { useEffect, useState } from "react";
import styles from "./userTable.module.css";
import PointDetail from "./detail-log/pointDetail";
import * as XLSX from "xlsx";

export default function UserTable({ refresh, role }) {
  const [users, setUsers] = useState([]);
  const [pointTypes, setPointTypes] = useState([]); // 포인트 종류 목록 상태
  const [selectedPointType, setSelectedPointType] = useState("전체"); // "전체" 기본 선택
  const [manualRefresh, setManualRefresh] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState(""); // 선택된 사용자 이름 상태
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
            point_total,
            point_type_id, // 추가: point_type_id가 row 객체에 포함된 경우
            added_by,
          } = row;

          if (!acc[user_id]) {
            acc[user_id] = {
              user_id,
              username,
              role,
              created_at,
              created_by,
              points: {},
              point_total,
              added_by,
            };
          }

          // 각 포인트 종류별로 그룹화하여 포인트 정보를 저장합니다.
          if (type_name && point_type_id !== undefined) {
            // 추가: point_type_id 존재 여부 확인
            if (!acc[user_id].points[point_type_id]) {
              acc[user_id].points[point_type_id] = {
                type_name,
                point_total,
                point_score,
              };
            } else {
              // 이미 존재하는 포인트 종류라면 누적 계산을 수행
              acc[user_id].points[point_type_id].point_total += point_total;
              acc[user_id].points[point_type_id].point_score += point_score;
            }
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

  const exportToExcel = () => {
    // 현재 화면에 표시된 데이터를 기반으로 엑셀 파일 생성
    const tableData = users
      .filter(
        (user) =>
          selectedPointType === "전체" ||
          Object.values(user.points).some(
            (point) => point.type_name === selectedPointType
          )
      )
      .map((user) => ({
        ID: user.username,
        권한: user.role,
        생성날짜: new Date(user.created_at).toLocaleDateString(),
        생성한관리자: user.created_by,
        포인트종류및남은점수: Object.values(user.points)
          .filter(
            (point) =>
              selectedPointType === "전체" ||
              point.type_name === selectedPointType
          )
          .map((point) => `${point.type_name}: ${point.point_score} 점`)
          .join(", "),
        총포인트: Object.values(user.points)
          .filter(
            (point) =>
              selectedPointType === "전체" ||
              point.type_name === selectedPointType
          )
          .map((point) => `${point.type_name}: ${point.point_total} 점`)
          .join(", "),
        사용된포인트: Object.values(user.points)
          .filter(
            (point) =>
              selectedPointType === "전체" ||
              point.type_name === selectedPointType
          )
          .map(
            (point) =>
              `${point.type_name}: ${point.point_total - point.point_score} 점`
          )
          .join(", "),
        포인트추가자: user.added_by || "-",
      }));

    // SheetJS를 사용하여 Excel 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserTable");

    // Excel 파일 다운로드
    XLSX.writeFile(workbook, "사용자 현황.xlsx");
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
        <button onClick={exportToExcel} className={styles.exportButton}>
          Excel 파일로 저장
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>권한</th>
            <th>생성 날짜</th>
            <th>생성한 관리자</th>
            <th>포인트 종류 및 남은점수</th>
            <th>총 포인트</th>
            <th>사용된 포인트</th>
            <th>포인트 추가자</th>
            <th>관리 옵션</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter(
              (user) =>
                selectedPointType === "전체" ||
                Object.values(user.points).some(
                  (point) => point.type_name === selectedPointType
                )
            )
            .map((user) => (
              <tr key={user.user_id}>
                <td
                  onClick={() => setSelectedUsername(user.username)} // ID 클릭 시 선택된 사용자 설정
                  style={{ cursor: "pointer", color: "blue" }} // 클릭 가능 표시
                >
                  {user.username}
                </td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.created_by}</td>
                <td>
                  {Object.values(user.points)
                    .filter(
                      (point) =>
                        selectedPointType === "전체" ||
                        point.type_name === selectedPointType
                    )
                    .map((point) => (
                      <div key={point.type_name}>
                        {point.type_name}: {point.point_score} 점
                      </div>
                    ))}
                </td>
                <td>
                  {Object.values(user.points)
                    .filter(
                      (point) =>
                        selectedPointType === "전체" ||
                        point.type_name === selectedPointType
                    )
                    .map((point) => (
                      <div key={point.type_name}>
                        {point.type_name}: {point.point_total} 점
                      </div>
                    ))}
                </td>
                <td>
                  {Object.values(user.points)
                    .filter(
                      (point) =>
                        selectedPointType === "전체" ||
                        point.type_name === selectedPointType
                    )
                    .map((point) => (
                      <div key={point.type_name}>
                        {point.type_name}:{" "}
                        {point.point_total - point.point_score} 점
                      </div>
                    ))}
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
      <PointDetail selectedUsername={selectedUsername} />
    </div>
  );
}
