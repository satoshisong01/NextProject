import { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // xlsx 라이브러리 임포트
import styles from "./Data.module.css";
import DataTable from "./dataTable/dataTable";

export default function Data() {
  const [pointTypes, setPointTypes] = useState([]);
  const [selectedPointType, setSelectedPointType] = useState("");
  const [selectedPointScore, setSelectedPointScore] = useState("");
  const [selectedType, setSelectedType] = useState(null); // 선택된 포인트 타입 데이터를 저장
  const [textInputs, setTextInputs] = useState({});
  const [placeholders, setPlaceholders] = useState({});
  const [inputCount, setInputCount] = useState(7); // 초기값을 7로 설정

  useEffect(() => {
    fetchUserPointData();
  }, []);

  const fetchUserPointData = async () => {
    const username = localStorage.getItem("username");
    try {
      const response = await fetch(`/api/user-data?username=${username}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data, "555555555555");
        setPointTypes(data);
        // 선택된 포인트 타입의 현재 포인트를 갱신
        if (selectedPointType) {
          const selectedType = data.find(
            (type) => type.point_type_id === parseInt(selectedPointType)
          );
          setSelectedPointScore(selectedType ? selectedType.point_score : "");
          // setSelectedType(selected || null); // 선택된 타입 데이터를 저장
        }
      } else {
        console.error("사용자 포인트 데이터를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("데이터 가져오는 중 오류 발생:", error);
    }
  };

  const handleSubmitData = async () => {
    try {
      const currentTime = new Date();

      // `scheduled_times` 테이블에서 제한 시간을 가져오는 API 호출
      const timeResponse = await fetch("/api/time-setting");
      if (timeResponse.ok) {
        const { scheduled_time: scheduledTime } = await timeResponse.json();
        console.log("Scheduled Time:", scheduledTime);

        // 제한 시작 시간을 Date 객체로 변환
        const [startHours, startMinutes, startSeconds] = scheduledTime
          .split(":")
          .map(Number);
        const startTime = new Date();
        startTime.setHours(startHours, startMinutes, startSeconds, 0);

        // 제한 끝 시간을 24:00:00 (자정)으로 설정
        const endTime = new Date();
        endTime.setHours(24, 0, 0, 0); // 24:00:00, 즉 자정을 제한 끝으로 설정

        // 현재 시간이 제한 시작 시간(startTime) 이후이고, 자정(endTime) 이전이면 등록 불가
        if (currentTime >= startTime && currentTime < endTime) {
          alert(
            "등록 가능한 시간이 아닙니다. 지정된 시간부터 24:00:00까지는 등록할 수 없습니다."
          );
          return;
        }
      } else {
        console.error("제한 시간을 불러오지 못했습니다.");
        alert("등록 가능한 시간이 아닙니다.");
        return;
      }

      // 제한 시간이 아니라면 기존 데이터를 전송합니다.
      const payload = {
        pointTypeId: selectedPointType,
        inputs: textInputs,
      };

      console.log("전송할 payload:", payload);

      const response = await fetch("/api/user-data-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("데이터가 성공적으로 저장되었습니다.");
        fetchUserPointData();
      } else {
        alert("오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("데이터 저장 오류:", error);
      alert("데이터 저장 중 오류가 발생했습니다.");
    }
  };

  const handlePointTypeChange = (e) => {
    const pointTypeId = e.target.value;
    setSelectedPointType(pointTypeId);

    const selectedType = pointTypes.find(
      (type) => type.point_type_id === parseInt(pointTypeId)
    );
    setSelectedType(selectedType);
    setSelectedPointScore(selectedType ? selectedType.point_score : "");
    setPlaceholders(selectedType ? selectedType : {});
  };

  const handleTextInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "text1" && !/^\d*$/.test(value)) {
      alert("숫자만 입력 가능합니다.");
      return;
    }

    setTextInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 필드 추가 및 제거 핸들러
  const addInputs = () => setInputCount((prev) => prev + 7);
  const removeInputs = () => setInputCount((prev) => Math.max(prev - 7, 7));

  // 엑셀 파일을 읽어 데이터를 textInputs에 저장하고, 행 수에 따라 inputCount를 조정
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let newInputs = {};
        let rowCount = 0;

        jsonData.slice(1).forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            // 빈 값이 아닌 셀만 추가
            if (cell !== null && cell !== "") {
              newInputs[`text${rowCount * 7 + colIndex + 1}`] = cell;
            }
          });
          rowCount++;
        });

        setTextInputs(newInputs);
        setInputCount(rowCount * 7); // 총 필드 수를 업데이트
        alert("파일 데이터가 성공적으로 입력되었습니다.");
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <div className={styles.container}>
        <h2 className={styles.title}>데이터 입력</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>포인트 종류 선택:</label>
          <select
            value={selectedPointType}
            onChange={handlePointTypeChange}
            className={styles.select}
          >
            <option value="">포인트 종류 선택</option>
            {pointTypes.map((type) => (
              <option key={type.point_type_id} value={type.point_type_id}>
                {type.type_name}
              </option>
            ))}
          </select>
          {selectedPointScore !== "" && (
            <span className={styles.score}>
              현재 포인트: {selectedPointScore}
            </span>
          )}
        </div>

        <div className={styles.inputsContainer}>
          {Array.from({ length: inputCount }, (_, index) => (
            <div key={index} className={styles.field}>
              <input
                type="text"
                name={`text${index + 1}`}
                value={textInputs[`text${index + 1}`] || ""}
                onChange={handleTextInputChange}
                placeholder={placeholders[`text${index + 1}`] || ""}
                className={styles.input}
              />
            </div>
          ))}
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={addInputs} className={styles.controlButton}>
            +
          </button>
          <button onClick={removeInputs} className={styles.controlButton}>
            -
          </button>
          <button className={styles.submitButton} onClick={handleSubmitData}>
            데이터 등록
          </button>
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>엑셀 파일 업로드:</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className={styles.fileInput}
              />
            </div>
          </div>
        </div>
        <DataTable
          selectedType={selectedType}
          placeholders={placeholders}
          refreshData={fetchUserPointData}
        />
      </div>
    </div>
  );
}
