import { useState, useEffect } from "react";
import styles from "./modifiedDataTable.module.css";
import * as XLSX from "xlsx";

export default function ModifiedDataTable({
  selectedType,
  selectedUser,
  selectedDate,
  selectedAdmin,
}) {
  const [dataEntries, setDataEntries] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [extendRequests, setExtendRequests] = useState([]);

  const fetchDataEntries = async () => {
    try {
      let url = "/api/user-data-entries";
      const params = new URLSearchParams();

      if (selectedType) {
        params.append("type_id", selectedType.point_type_id);
      }
      if (selectedUser) {
        params.append("username", selectedUser);
      }
      if (selectedAdmin) {
        params.append("created_by", selectedAdmin); // 관리자 필터 추가
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log("data불러오는지봐야함", data);
        // selectedAdmin이 존재하면 데이터를 필터링하여 설정
        const filteredData = selectedAdmin
          ? data.filter((entry) => entry.created_by === selectedAdmin)
          : data;
        console.log("filteredData", filteredData);
        filterEntriesByDate(
          data.filter((entry) => entry.created_by === selectedAdmin),
          selectedDate
        );

        // 조건에 따라 요청 유형별로 데이터를 분류합니다.
        setEditRequests(
          filteredData.filter((entry) => entry.edit_request === 1)
        );
        setRefundRequests(
          filteredData.filter((entry) => entry.refund_request === 1)
        );
        setExtendRequests(
          filteredData.filter((entry) => entry.extend_request === 1)
        );
        setDataEntries(filteredData); // 전체 데이터를 설정
      } else {
        console.error("데이터 불러오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    }
    console.log(selectedAdmin);
  };

  useEffect(() => {
    fetchDataEntries();
    console.log("selectedType", selectedType);
  }, [selectedType, selectedUser, selectedAdmin]); // 선택된 포인트 종류나 사용자가 변경될 때마다 다시 불러오기

  // selectedDate가 변경될 때마다 필터링 수행
  useEffect(() => {
    if (dataEntries.length > 0) {
      filterEntriesByDate(dataEntries, selectedDate);
    }
  }, [selectedDate, dataEntries]);

  // 데이터를 날짜별로 필터링하는 함수
  // 날짜별로 필터링된 데이터를 분리하여 저장
  const filterEntriesByDate = (entries, date) => {
    console.log("entries", entries);
    if (!date) {
      setEditRequests(entries.filter((entry) => entry.edit_time));
      setRefundRequests(entries.filter((entry) => entry.refund_time));
      setExtendRequests(entries.filter((entry) => entry.extend_request_time));
      return;
    }

    const dateStr = date.toDateString();

    setEditRequests(
      entries.filter(
        (entry) =>
          entry.edit_time &&
          new Date(entry.edit_time).toDateString() === dateStr
      )
    );
    setRefundRequests(
      entries.filter(
        (entry) =>
          entry.refund_time &&
          new Date(entry.refund_time).toDateString() === dateStr
      )
    );
    setExtendRequests(
      entries.filter(
        (entry) =>
          entry.extend_request_time &&
          new Date(entry.extend_request_time).toDateString() === dateStr
      )
    );
  };

  const defaultHeaders = [
    "순번",
    "아이디",
    "생성한 관리자",
    "데이터1",
    "데이터2",
    "데이터3",
    "데이터4",
    "데이터5",
    "데이터6",
    "데이터7",
    "상태",
    "처리",
  ];

  const [headers, setHeaders] = useState(defaultHeaders);

  useEffect(() => {
    if (selectedType) {
      setHeaders([
        "순번",
        "아이디",
        "생성한 관리자",
        selectedType.text1 || "데이터1",
        selectedType.text2 || "데이터2",
        selectedType.text3 || "데이터3",
        selectedType.text4 || "데이터4",
        selectedType.text5 || "데이터5",
        selectedType.text6 || "데이터6",
        selectedType.text7 || "데이터7",
        "상태",
        "처리",
      ]);
    } else {
      setHeaders(defaultHeaders);
    }

    fetchDataEntries();
  }, [selectedType]);

  // 날짜를 "YYYY.MM.DD" 형식으로 변환하는 함수
  //   const formatDate = (dateString) => {
  //     const date = new Date(dateString);
  //     const year = date.getFullYear();
  //     const month = String(date.getMonth() + 1).padStart(2, "0");
  //     const day = String(date.getDate()).padStart(2, "0");
  //     return `${year}.${month}.${day}`;
  //   };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const handleAction = async (entryId, actionType, entry) => {
    let apiUrl = "";
    let payload = {};

    if (actionType === "확인") {
      apiUrl = `/api/user-data-entries/edit-confirm/${entryId}`;
    } else if (actionType === "완료") {
      apiUrl = `/api/user-data-entries/update-refund/${entryId}`;

      console.log("ent", entry);

      // 환불 예정 일수와 data1 값을 곱하여 refund_count 계산
      const refundDays = calculateRefundDays(
        entry.refund_time,
        entry.time_limit
      );
      const refundCount = refundDays > 0 ? refundDays * entry.data1 : 0;
      payload = { refund_count: refundCount, entry };
    } else if (actionType === "승인") {
      apiUrl = `/api/user-data-entries/approve-extend/${entryId}`;
      payload = { entry }; // entry 추가
    }

    try {
      const response = await fetch(apiUrl, {
        method: actionType === "완료" ? "PATCH" : "PATCH", // 모두 PATCH 메서드 사용
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchDataEntries(); // 변경 후 테이블 새로고침
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error(`${actionType} 요청 오류:`, error);
      alert(`${actionType} 요청 중 오류가 발생했습니다.`);
    }
  };

  const handleBulkComplete = async () => {
    try {
      const response = await fetch(
        "/api/user-data-entries/update-all-refunds",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // 모든 환불 요청 데이터 삭제 완료 메시지
        fetchDataEntries(); // 데이터 새로고침
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error("전체완료 요청 오류:", error);
      alert("전체완료 요청 중 오류가 발생했습니다.");
    }
  };

  const handleBulkConfirm = async () => {
    try {
      const response = await fetch("/api/user-data-entries/edit-confirm-all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // 모든 수정 요청 확인이 완료되었음을 알림
        fetchDataEntries(); // 변경 후 데이터 새로고침
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error("전체확인 요청 오류:", error);
      alert("전체확인 요청 중 오류가 발생했습니다.");
    }
  };

  const handleBulkApprove = async () => {
    try {
      const response = await fetch(
        "/api/user-data-entries/approve-all-extends",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message); // 모든 연장 요청 승인 완료 메시지
        fetchDataEntries(); // 데이터 새로고침
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error("전체승인 요청 오류:", error);
      alert("전체승인 요청 중 오류가 발생했습니다.");
    }
  };

  // 환불 예정 일수를 계산하는 함수
  const calculateRefundDays = (refundDate, timeLimit) => {
    const refundTime = new Date(refundDate);
    const limitTime = new Date(timeLimit);

    // 날짜 차이를 밀리초 단위로 계산한 후 일 단위로 변환
    const differenceInTime = limitTime - refundTime;
    const differenceInDays = Math.ceil(
      differenceInTime / (1000 * 60 * 60 * 24)
    );

    return differenceInDays > 0
      ? `${differenceInDays}일 환불예정`
      : "환불 가능 기간이 지났습니다";
  };

  const exportToExcel = (data, tableName) => {
    // 화면에 출력되는 테이블 정보만 저장
    const displayedData = data.map((entry) => ({
      순번: entry.entry_id,
      아이디: entry.maker,
      "생성한 관리자": entry.created_by,
      데이터1: entry.data1,
      데이터2: entry.data2,
      데이터3: entry.data3,
      데이터4: entry.data4,
      데이터5: entry.data5,
      데이터6: entry.data6,
      데이터7: entry.data7,
      상태: `${formatDate(entry.created_at)} 신청일\n${formatDate(
        new Date(new Date(entry.created_at).getTime() + 24 * 60 * 60 * 1000)
      )} ~ ${formatDate(entry.time_limit)} 까지 활성화됨`,
      처리:
        tableName === "수정 요청된 테이블"
          ? formatDate(entry.edit_time) + " 수정요청"
          : tableName === "환불 요청된 테이블"
          ? `${formatDate(entry.refund_time)} 환불요청\n${calculateRefundDays(
              entry.refund_time,
              entry.time_limit
            )}`
          : tableName === "연장 요청된 테이블"
          ? formatDate(entry.extend_request_time) + " 연장요청"
          : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(displayedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
    XLSX.writeFile(workbook, `${tableName}.xlsx`);
  };

  const renderTable = (
    data,
    title,
    actionLabel,
    bulkActionLabel,
    buttonClass
  ) => (
    <div className={styles.container}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "2px solid black",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <h2 className={styles.title}>{title}</h2>
          <button
            onClick={() => exportToExcel(data, title)}
            className={styles.exportButton}
          >
            Excel 파일로 저장
          </button>
        </div>
        {title === "수정 요청된 테이블" && editRequests.length > 0 && (
          <button
            onClick={handleBulkConfirm}
            className={`${styles.bulkActionButton} ${buttonClass}`}
          >
            {bulkActionLabel}
          </button>
        )}
        {title === "환불 요청된 테이블" && refundRequests.length > 0 && (
          <button
            onClick={handleBulkComplete}
            className={`${styles.bulkActionButton} ${buttonClass}`}
          >
            {bulkActionLabel}
          </button>
        )}
        {title === "연장 요청된 테이블" && extendRequests.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className={`${styles.bulkActionButton} ${buttonClass}`}
          >
            {bulkActionLabel}
          </button>
        )}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={styles.headerCell}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.entry_id} className={styles.row}>
              <td>{entry.entry_id}</td>
              <td>{entry.maker}</td>
              <td>{entry.created_by}</td>
              <td>{entry.data1}</td>
              <td>{entry.data2}</td>
              <td>{entry.data3}</td>
              <td>{entry.data4}</td>
              <td>{entry.data5}</td>
              <td>{entry.data6}</td>
              <td>{entry.data7}</td>
              <td>
                {formatDate(entry.created_at)} 신청일
                <br />
                {`${formatDate(
                  new Date(
                    new Date(entry.created_at).getTime() + 24 * 60 * 60 * 1000
                  )
                )} ~ ${formatDate(entry.time_limit)} 까지 활성화됨`}
                <br />
                {title === "수정 요청된 테이블" &&
                  formatDate(entry.edit_time) + " 수정요청"}
                {title === "환불 요청된 테이블" && (
                  <>
                    {formatDate(entry.refund_time)} 환불요청
                    <br />
                    {calculateRefundDays(entry.refund_time, entry.time_limit)}
                  </>
                )}
                {title === "연장 요청된 테이블" &&
                  formatDate(entry.extend_request_time) + " 연장요청"}
              </td>
              <td>
                <button
                  onClick={() =>
                    handleAction(entry.entry_id, actionLabel, entry)
                  }
                  className={buttonClass}
                >
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {renderTable(
        editRequests,
        "수정 요청된 테이블",
        "확인",
        "전체확인",
        styles.greenButton
      )}
      {renderTable(
        refundRequests,
        "환불 요청된 테이블",
        "완료",
        "전체완료",
        styles.redButton
      )}
      {renderTable(
        extendRequests,
        "연장 요청된 테이블",
        "승인",
        "전체승인",
        styles.blueButton
      )}
    </div>
  );
}
