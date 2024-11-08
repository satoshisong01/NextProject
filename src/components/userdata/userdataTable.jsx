import { useState, useEffect } from "react";
import styles from "../modifiedDataTable/modifiedDataTable.module.css";
import * as XLSX from "xlsx";

export default function UserdataTable({
  selectedType,
  selectedUser,
  selectedDate,
  selectedAdmin,
}) {
  const [dataEntries, setDataEntries] = useState([]);

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
        const filteredData = selectedAdmin
          ? data.filter((entry) => entry.created_by === selectedAdmin)
          : data;
        setDataEntries(filteredData);
      } else {
        console.error("데이터 불러오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    }
  };

  useEffect(() => {
    fetchDataEntries();
  }, [selectedType, selectedUser, selectedAdmin]); // 선택된 포인트 종류나 사용자가 변경될 때마다 다시 불러오기

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
  ];

  const [headers, setHeaders] = useState(defaultHeaders);

  useEffect(() => {
    if (selectedType) {
      setHeaders([
        "순번",
        "아이디",
        "생성한 관리자",
        selectedType.text1 || "슬롯수",
        selectedType.text2 || "메인키워드",
        selectedType.text3 || "데이터3",
        selectedType.text4 || "데이터4",
        selectedType.text5 || "데이터5",
        selectedType.text6 || "데이터6",
        selectedType.text7 || "데이터7",
        "상태",
      ]);
    } else {
      setHeaders(defaultHeaders);
    }

    fetchDataEntries();
  }, [selectedType]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const exportToExcel = () => {
    const displayedData = dataEntries.map((entry) => ({
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
    }));

    const worksheet = XLSX.utils.json_to_sheet(displayedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Data");
    XLSX.writeFile(workbook, "사용자 데이터 상태.xlsx");
  };

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <h2>사용자 데이터 상태</h2>
        <button onClick={exportToExcel} className={styles.exportButton}>
          Excel 파일로 저장
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
          {dataEntries.map((entry) => (
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
