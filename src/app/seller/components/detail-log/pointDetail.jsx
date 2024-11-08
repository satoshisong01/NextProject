import { useState, useEffect } from "react";
import styles from "./pointDetail.module.css"; // 기존 스타일링 사용

export default function PointDetail({ selectedUsername }) {
  const [pointLogs, setPointLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTableVisible, setIsTableVisible] = useState(false); // 테이블 표시 상태 추가
  const [selectedMonth, setSelectedMonth] = useState(""); // 선택된 월
  const [selectedDay, setSelectedDay] = useState(""); // 선택된 일

  useEffect(() => {
    const fetchPointLogs = async () => {
      try {
        const response = await fetch("/api/points-log");
        if (!response.ok)
          throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");

        const data = await response.json();
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        // admin이 아닌 경우 로컬스토리지의 username과 addedBy가 일치하는 데이터 필터링
        const filteredData =
          storedRole === "admin"
            ? data
            : data.filter((log) => log.addedBy === storedUsername);

        setPointLogs(filteredData);
        setLoading(false);
      } catch (err) {
        console.error("오류 발생:", err);
        setError("데이터를 불러오는 데 실패했습니다.");
        setLoading(false);
      }
    };

    fetchPointLogs();
  }, []);

  const handleToggleTable = () => {
    setIsTableVisible((prev) => !prev);
  };

  // 선택된 월과 일에 맞는 데이터만 필터링
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDay(""); // 월 변경 시 일을 초기화
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
  };

  // 선택된 사용자와 월, 일에 따라 필터링된 데이터를 반환
  const filteredLogs = pointLogs.filter((log) => {
    const matchesUsername = selectedUsername
      ? log.username === selectedUsername
      : true;
    const logDate = new Date(log.date);
    const matchesMonth = selectedMonth
      ? logDate.getMonth() + 1 === parseInt(selectedMonth)
      : true;
    const matchesDay = selectedDay
      ? logDate.getDate() === parseInt(selectedDay)
      : true;
    return matchesUsername && matchesMonth && matchesDay;
  });

  // 월 및 일 목록 추출 (중복 제거)
  const monthOptions = Array.from(
    new Set(pointLogs.map((log) => new Date(log.date).getMonth() + 1))
  ).sort((a, b) => a - b);

  const dayOptions = selectedMonth
    ? Array.from(
        new Set(
          pointLogs
            .filter(
              (log) =>
                new Date(log.date).getMonth() + 1 === parseInt(selectedMonth)
            )
            .map((log) => new Date(log.date).getDate())
        )
      ).sort((a, b) => a - b)
    : [];

  if (loading) return <p>데이터를 불러오는 중...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>포인트 내역</h2>
      <div className={styles.controls}>
        <button onClick={handleToggleTable} className={styles.toggleButton}>
          {isTableVisible ? "테이블 닫기" : "테이블 열기"}
        </button>
        <label className={styles.dateLabel}>
          월 선택:
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className={styles.dateSelect}
          >
            <option value="">전체</option>
            {monthOptions.map((month, index) => (
              <option key={index} value={month}>
                {month}월
              </option>
            ))}
          </select>
        </label>
        <label className={styles.dateLabel}>
          일 선택:
          <select
            value={selectedDay}
            onChange={handleDayChange}
            className={styles.dateSelect}
            disabled={!selectedMonth} // 월이 선택되지 않으면 비활성화
          >
            <option value="">전체</option>
            {dayOptions.map((day, index) => (
              <option key={index} value={day}>
                {day}일
              </option>
            ))}
          </select>
        </label>
      </div>
      {isTableVisible && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>사용자</th>
              <th>포인트 내역</th>
              <th>날짜</th>
              <th>생성한 관리자</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <tr key={index}>
                  <td>{log.username}</td>
                  <td>
                    {log.date} - {log.pointType} ({log.pointScore}점,{" "}
                    {log.actionType})
                  </td>
                  <td>{log.date}</td>
                  <td>{log.addedBy}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">선택된 조건에 맞는 포인트 내역이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
