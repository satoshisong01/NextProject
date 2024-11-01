import { useState, useEffect } from "react";
import styles from "./timeSelector.module.css";

export default function TimeSelector() {
  const [period, setPeriod] = useState("오전");
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("00");

  // 기존에 저장된 시간 불러오기
  useEffect(() => {
    const fetchSavedTime = async () => {
      try {
        const response = await fetch("/api/time-setting", {
          method: "GET",
        });
        const data = await response.json();
        if (response.ok && data.scheduled_time) {
          // 기존 시간을 24시간 형식에서 오전/오후, 시간, 분으로 분해
          const [hours, minutes] = data.scheduled_time.split(":");
          const intHour = parseInt(hours, 10);
          setPeriod(intHour >= 12 ? "오후" : "오전");
          setHour(intHour > 12 ? intHour - 12 : intHour === 0 ? 12 : intHour);
          setMinute(minutes);
        }
      } catch (error) {
        console.error("시간 불러오기 중 오류 발생:", error);
      }
    };

    fetchSavedTime();
  }, []);

  // 오전/오후 선택 핸들러
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  // 시간 선택 핸들러
  const handleHourChange = (e) => {
    setHour(e.target.value);
  };

  // 분 선택 핸들러
  const handleMinuteChange = (e) => {
    setMinute(e.target.value);
  };

  // 기준 시간 설정
  const handleSetStandardTime = async () => {
    try {
      const response = await fetch("/api/time-setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          hour,
          minute,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error("시간 저장 중 오류 발생:", error);
      alert("시간 저장에 실패했습니다.");
    }
  };

  return (
    <div style={{ marginLeft: "100px" }}>
      <h2 className={styles.title}>시간 설정</h2>
      <div className={styles.container}>
        {/* 오전/오후 선택 */}
        <select
          value={period}
          onChange={handlePeriodChange}
          className={styles.select}
        >
          <option value="오전">오전</option>
          <option value="오후">오후</option>
        </select>

        {/* 시간 선택 */}
        <select
          value={hour}
          onChange={handleHourChange}
          className={styles.select}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}시
            </option>
          ))}
        </select>

        {/* 분 선택 */}
        <select
          value={minute}
          onChange={handleMinuteChange}
          className={styles.select}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={String(i).padStart(2, "0")}>
              {String(i).padStart(2, "0")}분
            </option>
          ))}
        </select>

        <button onClick={handleSetStandardTime} className={styles.button}>
          기준시간
        </button>
      </div>
    </div>
  );
}
