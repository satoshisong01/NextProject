// src/components/dataTable.jsx
import { useState, useEffect } from "react";
import styles from "./DataTable.module.css";

export default function DataTable({ selectedType }) {
  const [dataEntries, setDataEntries] = useState([]);
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
        selectedType.text1 || "데이터1",
        selectedType.text2 || "데이터2",
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
  }, [selectedType]);

  // fetchData function will be added when API is ready

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>데이터 테이블</h2>
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
          {dataEntries.map((entry, index) => (
            <tr
              key={entry.entry_id}
              className={`${styles.row} ${styles.tableRow}`}
            >
              <td>{index + 1}</td>
              <td>{entry.username}</td>
              <td>{entry.created_by}</td>
              <td>{entry.data1}</td>
              <td>{entry.data2}</td>
              <td>{entry.data3}</td>
              <td>{entry.data4}</td>
              <td>{entry.data5}</td>
              <td>{entry.data6}</td>
              <td>{entry.data7}</td>
              <td>{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
