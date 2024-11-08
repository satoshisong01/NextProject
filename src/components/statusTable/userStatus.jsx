import { useState, useEffect } from "react";
import styles from "./userStatus.module.css";
import * as XLSX from "xlsx"; // XLSX 라이브러리 import

export default function UserStatus({
  users,
  selectedUser,
  selectedYear,
  selectedMonth,
  selectedDay,
}) {
  const [userDataEntries, setUserDataEntries] = useState([]);
  const [refundSummary, setRefundSummary] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user-data-entries/with-user-info");
        const data = await response.json();

        // users 배열을 기반으로 데이터 필터링
        const filteredData = data.filter((entry) =>
          users.some((user) => user.username === entry.maker)
        );

        // 날짜와 사용자 필터가 설정된 경우
        const finalFilteredData = filteredData.filter((entry) => {
          const createdAt = new Date(entry.created_at);
          const refundTime = entry.refund_time
            ? new Date(entry.refund_time)
            : null;

          // 구동 시작일과 환불일이 날짜 조건을 충족하는지 확인
          const matchesDate = (date) => {
            if (!date) return false;
            const yearMatches = selectedYear
              ? date.getFullYear() === parseInt(selectedYear)
              : true;
            const monthMatches = selectedMonth
              ? date.getMonth() + 1 === parseInt(selectedMonth)
              : true;

            // 일 선택이 없는 경우, 연도와 월까지만 비교
            if (!selectedDay) {
              return yearMatches && monthMatches;
            }

            // 일 선택이 있는 경우, 연도, 월, 일을 모두 비교
            const dayMatches = selectedDay
              ? date.getDate() === parseInt(selectedDay)
              : true;

            return yearMatches && monthMatches && dayMatches;
          };

          // 선택된 사용자 필터 확인
          const matchesSelectedUser = selectedUser
            ? entry.maker === selectedUser
            : true;

          // 날짜와 사용자 필터를 모두 만족하는지 확인
          return (
            (matchesDate(createdAt) || matchesDate(refundTime)) &&
            matchesSelectedUser
          );
        });

        // 환불수 합산 계산
        const summary = finalFilteredData.reduce((acc, entry) => {
          const creator = entry.created_by;
          if (!acc[creator]) {
            acc[creator] = 0;
          }
          acc[creator] += entry.refund_count
            ? parseInt(entry.refund_count, 10)
            : 0;
          return acc;
        }, {});

        setRefundSummary(summary);
        setUserDataEntries(finalFilteredData);
      } catch (error) {
        console.error("데이터 불러오기 오류:", error);
      }
    };

    fetchData();
  }, [users, selectedYear, selectedMonth, selectedDay, selectedUser]);

  // 엑셀로 다운로드하는 함수
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      userDataEntries.map((entry) => ({
        순번: entry.entry_id,
        아이디: entry.maker,
        신청일: new Date(entry.created_at).toLocaleDateString(),
        대행사: entry.created_by,
        "구동 시작일": new Date(entry.created_at).toLocaleDateString(),
        "구동 종료일": new Date(entry.time_limit).toLocaleDateString(),
        환불일: entry.refund_time
          ? new Date(entry.refund_time).toLocaleDateString()
          : "신청안함",
        환불수: entry.refund_count ?? "미정",
        상태: entry.refund_completed_time
          ? "환불완료"
          : entry.refund_time
          ? "환불대기"
          : "구동중",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Data");
    XLSX.writeFile(workbook, "사용자 데이터 상태.xlsx");
  };

  return (
    <div className={styles.container}>
      <h2>전체 데이터 총합</h2>
      <div className={styles.refundSummaryContainer}>
        {Object.entries(refundSummary).map(([creator, totalRefund]) => (
          <div key={creator} className={styles.refundSummaryCard}>
            <h3 className={styles.refundCreator}>{creator}</h3>
            <p className={styles.refundCount}>환불수: {totalRefund}개</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <h2>사용자 데이터 상태</h2>
        <button onClick={exportToExcel} className={styles.exportButton}>
          Excel 파일로 저장
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>순번</th>
            <th>아이디</th>
            <th>신청일</th>
            <th>대행사</th>
            <th>구동 시작일</th>
            <th>구동 종료일</th>
            <th>환불일</th>
            <th>환불수</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {userDataEntries.map((entry, index) => (
            <tr key={index}>
              <td>{entry.entry_id}</td>
              <td>{entry.maker}</td>
              <td style={{ color: "blue" }}>
                {new Date(entry.created_at).toLocaleDateString()}
              </td>
              <td>{entry.created_by}</td>
              <td>{new Date(entry.created_at).toLocaleDateString()}</td>
              <td>{new Date(entry.time_limit).toLocaleDateString()}</td>
              <td style={{ color: entry.refund_time ? "red" : "black" }}>
                {entry.refund_time
                  ? new Date(entry.refund_time).toLocaleDateString()
                  : "신청안함"}
              </td>
              <td>{entry.refund_count ?? "미정"}</td>
              <td
                style={{
                  color: entry.refund_completed_time
                    ? "blue"
                    : entry.refund_time
                    ? "red"
                    : "green",
                }}
              >
                {entry.refund_completed_time
                  ? "환불완료"
                  : entry.refund_time
                  ? "환불대기"
                  : "구동중"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
