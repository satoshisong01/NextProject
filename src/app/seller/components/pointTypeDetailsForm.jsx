import { useState, useEffect } from "react";
import styles from "./pointTypeDetailsForm.module.css";

export default function PointTypeDetailsForm() {
  const [fields, setFields] = useState({
    text1: "",
    text2: "",
    text3: "",
    text4: "",
    text5: "",
    text6: "",
    text7: "",
  });
  const [pointTypes, setPointTypes] = useState([]); // 포인트 타입 리스트
  const [selectedPointType, setSelectedPointType] = useState(""); // 선택된 포인트 타입

  // 포인트 타입 리스트 불러오기
  useEffect(() => {
    const fetchPointTypes = async () => {
      try {
        const response = await fetch("/api/point-types");
        if (response.ok) {
          const data = await response.json();
          setPointTypes(data);
        } else {
          console.error("포인트 타입 가져오기 실패");
        }
      } catch (error) {
        console.error("포인트 타입 가져오는 중 오류:", error);
      }
    };

    fetchPointTypes();
  }, []);

  // 포인트 타입 선택 시 해당 타입의 텍스트 필드 데이터 불러오기
  useEffect(() => {
    const fetchPointTypeDetails = async () => {
      if (selectedPointType) {
        try {
          const response = await fetch(
            `/api/point-type-details/${selectedPointType}`
          );
          if (response.ok) {
            const data = await response.json();
            setFields(data); // 가져온 데이터를 fields에 설정
          } else {
            setFields({
              text1: "",
              text2: "",
              text3: "",
              text4: "",
              text5: "",
              text6: "",
              text7: "",
            });
          }
        } catch (error) {
          setFields({
            text1: "",
            text2: "",
            text3: "",
            text4: "",
            text5: "",
            text6: "",
            text7: "",
          });
        }
      }
    };

    fetchPointTypeDetails();
  }, [selectedPointType]);

  // 입력 필드 값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    // 첫 번째 필드 (슬롯수)에 숫자만 입력되도록 조건 설정
    if (name === "text1" && !/^\d*$/.test(value)) {
      alert("숫자만 입력 가능합니다.");
      return;
    }
    setFields((prevFields) => ({
      ...prevFields,
      [name]: value,
    }));
  };

  // 포인트 타입 선택 핸들러
  const handleSelectChange = (e) => {
    setSelectedPointType(e.target.value);
  };

  // 필드 저장
  const handleSave = async () => {
    try {
      const response = await fetch("/api/point-type-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_id: selectedPointType,
          textFields: fields,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error("서버 오류:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>포인트 타입 별 데이터 필드</h2>
      <form className={styles.form}>
        <label className={styles.label}>
          포인트 타입 선택:
          <select
            value={selectedPointType}
            onChange={handleSelectChange}
            className={styles.select}
            required
          >
            <option value="">포인트 타입을 선택하세요</option>
            {pointTypes.map((type) => (
              <option key={type.type_id} value={type.type_id}>
                {type.type_name}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.mainBox}>
          {Object.keys(fields).map((fieldName, index) => (
            <div key={index} className={styles.fieldContainer}>
              <label className={styles.label}>
                {index === 0 ? "슬롯수" : `Text ${index + 1}: `}
                <input
                  type="text"
                  name={fieldName}
                  value={fields[fieldName]}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder={index === 0 ? "숫자만 입력" : ""}
                />
              </label>
            </div>
          ))}
        </div>
        <button type="button" onClick={handleSave} className={styles.button}>
          필드 이름 저장
        </button>
      </form>
    </div>
  );
}
