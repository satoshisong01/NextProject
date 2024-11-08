// src/components/dataTable.jsx
import { useState, useEffect } from "react";
import styles from "./dataTable.module.css";
import * as XLSX from "xlsx"; // XLSX 라이브러리 import

export default function DataTable({ selectedType, placeholders, refreshData }) {
  const [dataEntries, setDataEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]); // 선택된 행의 ID 목록
  const [manualRefresh, setManualRefresh] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    entry_id: null,
    data1: "",
    data2: "",
    data3: "",
    data4: "",
    data5: "",
    data6: "",
    data7: "",
    initialData1: "", // 초기값 저장 필드 추가
  });
  const defaultHeaders = [
    "순번",
    "아이디",
    "생성한 관리자",
    "슬롯수",
    "데이터2",
    "데이터3",
    "데이터4",
    "데이터5",
    "데이터6",
    "데이터7",
    "상태",
    "요청",
  ];

  const [headers, setHeaders] = useState(defaultHeaders);

  const fetchDataEntries = async () => {
    try {
      const response = await fetch("/api/user-data-entries?usersend=usersend");
      if (response.ok) {
        const data = await response.json();
        setDataEntries(data);
        console.log("data@@", data);
      } else {
        console.error("데이터 불러오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    }
  };

  useEffect(() => {
    if (selectedType) {
      setHeaders([
        // "",
        "순번",
        "아이디",
        "생성한 관리자",
        selectedType.text1 || "슬롯수",
        selectedType.text2 || "데이터2",
        selectedType.text3 || "데이터3",
        selectedType.text4 || "데이터4",
        selectedType.text5 || "데이터5",
        selectedType.text6 || "데이터6",
        selectedType.text7 || "데이터7",
        "상태",
        "요청",
      ]);
    } else {
      setHeaders(defaultHeaders);
    }

    fetchDataEntries();
  }, [selectedType, manualRefresh]);

  const filteredEntries = dataEntries.filter(
    (entry) =>
      entry.type_id === selectedType?.point_type_id &&
      entry.refund_request !== 1
  );

  // 수동 새로고침 버튼 클릭 시 실행될 함수
  const handleRefresh = () => {
    setManualRefresh((prev) => !prev);
  };

  //   const handleCheckboxChange = (entryId) => {
  //     setSelectedEntries((prevSelected) =>
  //       prevSelected.includes(entryId)
  //         ? prevSelected.filter((id) => id !== entryId)
  //         : [...prevSelected, entryId]
  //     );
  //   };

  const handleEditClick = (entry) => {
    setEditMode(true);
    setEditData({
      entry_id: entry.entry_id,
      maker: entry.maker,
      created_by: entry.created_by,
      data1: entry.data1 || "",
      data2: entry.data2 || "",
      data3: entry.data3 || "",
      data4: entry.data4 || "",
      data5: entry.data5 || "",
      data6: entry.data6 || "",
      data7: entry.data7 || "",
      initialData1: entry.data1 || "", // 초기값 저장
      created_at: entry.created_at,
      time_limit: entry.time_limit,
      type_id: selectedType?.point_type_id,
      extend_request: entry.extend_request,
      extend_request_time: entry.extend_request_time,
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    // 첫 번째 필드(data1)는 수정 불가로 설정
    if (name === "data1") return;
    setEditData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditSave = async () => {
    if (!confirm("수정 요청을 제출하시겠습니까?")) return;

    try {
      // 수정 API 호출
      const updateResponse = await fetch(
        `/api/user-data-entries/update/${editData.entry_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editData, edit_request: 1 }), // edit_request 값을 1로 설정
        }
      );

      if (updateResponse.ok) {
        alert(
          "데이터가 성공적으로 수정되었습니다. 휴일을 제외한 다음날부터 반영됩니다."
        );
        refreshData(); // 데이터 업데이트 후 테이블 새로고침
      } else {
        alert("데이터 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("데이터 수정 오류:", error);
      alert("데이터 수정 중 오류가 발생했습니다.");
    } finally {
      setEditMode(false);
    }

    fetchDataEntries();
  };

  const handleRefund = async (entryId, requestType) => {
    const confirmMessage =
      requestType === "refund" ? "정말 환불 신청을 진행하시겠습니까?" : "";
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/user-data-entries/delete/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId, requestType }), // requestType 전달
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setManualRefresh((prev) => !prev); // 테이블 새로고침
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error(`${requestType} 요청 오류:`, error);
      alert(`${requestType} 요청 중 오류가 발생했습니다.`);
    }
    // try {
    //   const response = await fetch(`/api/refund-request`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ entry_id: entryId }),
    //   });

    //   if (response.ok) {
    //     const result = await response.json();
    //     alert(result.message);
    //     setManualRefresh((prev) => !prev); // 테이블 새로고침
    //   } else {
    //     const error = await response.json();
    //     alert(error.message);
    //   }
    // } catch (error) {
    //   console.error("환불 요청 오류:", error);
    //   alert("환불 요청 중 오류가 발생했습니다.");
    // }
  };

  const handleExtend = async (entryId) => {
    if (!confirm("정말 연장 요청을 진행하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/user-data-entries/extend/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setManualRefresh((prev) => !prev); // 테이블 새로고침
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error("연장 요청 오류:", error);
      alert("연장 요청 중 오류가 발생했습니다.");
    }
  };

  // 엑셀로 다운로드하는 함수
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredEntries.map((entry) => ({
        순번: entry.entry_id,
        아이디: entry.maker,
        생성한_관리자: entry.created_by,
        [selectedType.text1 || "데이터1"]: entry.data1,
        [selectedType.text2 || "데이터2"]: entry.data2,
        [selectedType.text3 || "데이터3"]: entry.data3,
        [selectedType.text4 || "데이터4"]: entry.data4,
        [selectedType.text5 || "데이터5"]: entry.data5,
        [selectedType.text6 || "데이터6"]: entry.data6,
        [selectedType.text7 || "데이터7"]: entry.data7,
        상태: `${new Date(
          entry.created_at
        ).toLocaleDateString()} 신청날짜 ~ ${new Date(
          entry.time_limit
        ).toLocaleDateString()}까지 활성화됨`,
        요청: entry.extend_request ? "연장요청됨" : "연장 없음",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Entries");
    XLSX.writeFile(workbook, "데이터 테이블.xlsx");
  };

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <h2 className={styles.title}>데이터 테이블</h2>
        <button onClick={handleRefresh} className={styles.refreshButton}>
          🔄 {/* 새로고침 아이콘 (회전 화살표 모양) */}
        </button>
        <button onClick={exportToExcel} className={styles.exportButton}>
          엑셀 다운로드
        </button>
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
          {filteredEntries.map((entry) => (
            <tr
              key={entry.entry_id}
              className={`${styles.row} ${styles.tableRow}`}
            >
              {/* <td>
                <input
                  type="checkbox"
                  checked={selectedEntries.includes(entry.entry_id)}
                  onChange={() => handleCheckboxChange(entry.entry_id)}
                />
              </td> */}
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
                {new Date(entry.created_at).toLocaleDateString()} 신청날짜
                <br />
                {`${new Date(
                  new Date(entry.created_at).getTime() + 24 * 60 * 60 * 1000
                ).toLocaleDateString()} ~ ${new Date(
                  entry.time_limit
                ).toLocaleDateString()} 까지 활성화됨`}
                <br />
                {entry.extend_request_time && (
                  <>
                    {new Date(entry.extend_request_time).toLocaleDateString()}{" "}
                    연장요청됨
                  </>
                )}
              </td>
              <td className={styles.btnbox}>
                <button
                  onClick={() => handleEditClick(entry)}
                  className={styles.actionButton}
                >
                  수정
                </button>
                <button
                  onClick={() => handleRefund(entry.entry_id, "refund")}
                  className={styles.actionButton}
                >
                  환불
                </button>
                {!entry.extend_request && (
                  <button
                    onClick={() => handleExtend(entry.entry_id)}
                    className={styles.actionButton}
                  >
                    연장
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editMode && (
        <div className={styles.editContainer}>
          <h3>수정하기</h3>
          <table className={styles.editTable}>
            <thead>
              <tr>
                {headers.slice(3, 10).map((header, index) => (
                  <th key={index} className={styles.headerCell}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    name="data1"
                    placeholder={placeholders?.text1 || ""}
                    value={editData.data1}
                    disabled // 필드를 완전히 비활성화
                    className={`${styles.inputField} ${styles.disabledInput}`} // 비활성화된 스타일 클래스 추가
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="data2"
                    placeholder={placeholders?.text2 || ""}
                    value={editData.data2}
                    onChange={handleEditInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="data3"
                    placeholder={placeholders?.text3 || ""}
                    value={editData.data3}
                    onChange={handleEditInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="data4"
                    placeholder={placeholders?.text4 || ""}
                    value={editData.data4}
                    onChange={handleEditInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="data5"
                    placeholder={placeholders?.text5 || ""}
                    value={editData.data5}
                    onChange={handleEditInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="data6"
                    placeholder={placeholders?.text6 || ""}
                    value={editData.data6}
                    onChange={handleEditInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="data7"
                    placeholder={placeholders?.text7 || ""}
                    value={editData.data7}
                    onChange={handleEditInputChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <button onClick={handleEditSave}>저장</button>
          <button onClick={() => setEditMode(false)}>취소</button>
        </div>
      )}
    </div>
  );
}
