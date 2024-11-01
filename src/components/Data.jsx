import { useState, useEffect } from "react";
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

  console.log("pointTypes", pointTypes);

  useEffect(() => {
    fetchUserPointData();
  }, []);

  const fetchUserPointData = async () => {
    const username = localStorage.getItem("username");
    try {
      const response = await fetch(`/api/user-data?username=${username}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
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
      const payload = {
        pointTypeId: selectedPointType, // 선택된 포인트 타입
        inputs: textInputs, // 텍스트 필드에 입력된 데이터
      };

      console.log("전송할 payload:", payload); // payload 확인용 로그 추가

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
        alert("포인트가 부족 합니다");
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
          {selectedPointScore && (
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
        </div>
        <DataTable selectedType={selectedType} />
      </div>
    </div>
  );
}
