import { useState, useEffect } from "react";
import styles from "./pointTypeAdder.module.css";

export default function PointTypeAdder() {
  const [typeName, setTypeName] = useState("");
  const [description, setDescription] = useState("");
  const [pointTypes, setPointTypes] = useState([]); // 포인트 타입 목록 상태

  // 포인트 타입 목록 불러오기
  const fetchPointTypes = async () => {
    try {
      const response = await fetch("/api/point-types");
      if (!response.ok) throw new Error("포인트 타입을 불러오지 못했습니다.");
      const data = await response.json();
      setPointTypes(data);
    } catch (error) {
      console.error("포인트 타입 목록 오류:", error);
    }
  };

  // 컴포넌트가 처음 렌더링될 때 포인트 타입 목록 불러오기
  useEffect(() => {
    fetchPointTypes();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/point-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type_name: typeName, description }),
      });

      if (response.ok) {
        alert("포인트 타입이 추가되었습니다.");
        setTypeName("");
        setDescription("");
        fetchPointTypes(); // 목록 갱신
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.message}`);
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  // 포인트 타입 삭제 함수
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "정말로 이 포인트 타입을 삭제하시겠습니까?"
    );
    if (!confirmDelete) return; // "취소" 선택 시 함수 종료
    try {
      const response = await fetch(`/api/point-types/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("포인트 타입이 삭제되었습니다.");
        fetchPointTypes(); // 목록 갱신
      } else {
        alert(
          "포인트 타입 삭제에 실패했습니다. 해당 포인트가 할당된 아이디가 있는지 확인하세요"
        );
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>포인트 타입 추가</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>포인트 타입 이름:</label>
        <div>
          <input
            type="text"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            추가
          </button>
        </div>
      </form>

      {/* 포인트 타입 목록과 삭제 버튼 */}
      <div className={styles.pointTypeList}>
        <h3>포인트 타입 목록</h3>
        <ul>
          {pointTypes.map((type) => (
            <li key={type.type_id} className={styles.pointTypeItem}>
              {type.type_name}
              <button
                onClick={() => handleDelete(type.type_id)}
                className={styles.deleteButton}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
