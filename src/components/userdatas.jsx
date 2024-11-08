import { useState, useEffect } from "react";
import styles from "./data.module.css";
import UserdataTable from "./userdata/userdataTable";
// import styles from "./userdatas.module.css"; // 컴포넌트의 스타일을 위한 CSS 파일

export default function Userdatas() {
  const [highlightedDates, setHighlightedDates] = useState([]); // 강조할 날짜
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [monthOptions, setMonthOptions] = useState([]);
  const [dayOptions, setDayOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pointTypes, setPointTypes] = useState([]);
  const [selectedPointType, setSelectedPointType] = useState("");
  const [textFields, setTextFields] = useState({});
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [adminList, setAdminList] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [filteredUserList, setFilteredUserList] = useState([]);

  useEffect(() => {
    fetchUserList(); // 사용자 리스트를 먼저 불러옵니다.
    fetchPointTypes(); // 포인트 타입 데이터를 불러옵니다.
    fetchHighlightedDates(); // 강조할 날짜 가져오기
  }, []);

  const fetchHighlightedDates = async () => {
    const createdBy = localStorage.getItem("username");
    try {
      const response = await fetch(
        `/api/user-data-entries/highlight-dates?created_by=${createdBy}`
      );
      if (response.ok) {
        const data = await response.json();
        const dates = data.highlightedDates.map((date) => new Date(date));
        setHighlightedDates(dates);
        setMonthOptions(getUniqueMonths(dates));
      } else {
        console.error("강조할 날짜를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error("강조할 날짜 가져오는 중 오류 발생:", error);
    }
  };

  const getUniqueMonths = (dates) => {
    const months = dates.map(
      (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
    return [...new Set(months)];
  };

  const getDaysForMonth = (month) => {
    const days = highlightedDates
      .filter(
        (date) =>
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}` === month
      )
      .map((date) => String(date.getDate()).padStart(2, "0"));

    return [...new Set(days)]; // 중복 제거된 일자 리스트 반환
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    setSelectedDay(""); // 일자 초기화
    const days = getDaysForMonth(month);
    setDayOptions(days);
  };

  const handleDayChange = (e) => {
    const day = e.target.value;
    setSelectedDay(day);

    if (selectedMonth && day) {
      const [year, month] = selectedMonth.split("-");
      setSelectedDate(new Date(year, parseInt(month) - 1, parseInt(day)));
    }
  };

  const fetchUserList = async () => {
    const createdBy = localStorage.getItem("username");
    try {
      const response = await fetch(`/api/users?created_by=${createdBy}`);
      if (response.ok) {
        const data = await response.json();
        // 중복 제거 - username을 기준으로 중복된 사용자 제거
        const uniqueUsers = Array.from(
          new Map(data.map((user) => [user.username, user])).values()
        );

        // 관리자 리스트 생성 (created_by 필드 기준으로 중복 제거)
        const uniqueAdmins = Array.from(
          new Set(data.map((user) => user.created_by))
        ).filter((admin) => admin); // null 값 필터링

        setUserList(uniqueUsers);
        setAdminList(uniqueAdmins);
        setFilteredUserList(uniqueUsers); // 초기화 시 전체 사용자 설정
      } else {
        console.error("사용자 리스트를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("사용자 리스트 가져오는 중 오류 발생:", error);
    }
  };

  const fetchPointTypes = async () => {
    try {
      const response = await fetch(`/api/point-types`);
      if (response.ok) {
        const data = await response.json();
        setPointTypes(data);
      } else {
        console.error("포인트 타입 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("포인트 타입 목록 가져오는 중 오류 발생:", error);
    }
  };

  const fetchPointTypeDetails = async (typeId) => {
    try {
      const response = await fetch(`/api/point-type-details/${typeId}`);
      if (response.ok) {
        const data = await response.json();
        setTextFields(data);
      } else {
        console.error("포인트 타입 상세 정보를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("포인트 타입 상세 정보 가져오는 중 오류 발생:", error);
    }
  };

  const handlePointTypeChange = (e) => {
    const pointTypeId = e.target.value;
    setSelectedPointType(pointTypeId);

    if (pointTypeId) {
      fetchPointTypeDetails(pointTypeId);
    } else {
      setTextFields({});
    }
  };

  const handleAdminChange = (e) => {
    const admin = e.target.value;
    setSelectedAdmin(admin);
    setSelectedUser(""); // 사용자 선택 초기화

    // 선택한 관리자가 만든 사용자만 필터링하여 표시
    if (admin) {
      const filteredUsers = userList.filter(
        (user) => user.created_by === admin
      );
      setFilteredUserList(filteredUsers);
    } else {
      setFilteredUserList(userList);
    }
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  return (
    <div>
      <div className={styles.container}>
        <h2 className={styles.title}>사용자 요청 데이터</h2>

        <div className={styles.calendarContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>월 선택:</label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className={styles.select}
            >
              <option value="">월 선택</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>일 선택:</label>
            <select
              value={selectedDay}
              onChange={handleDayChange}
              className={styles.select}
            >
              <option value="">일 선택</option>
              {dayOptions.map((day, index) => (
                <option key={`day-${day}-${index}`} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>포인트 종류 선택:</label>
            <select
              value={selectedPointType}
              onChange={handlePointTypeChange}
              className={styles.select}
            >
              <option value="">포인트 종류 선택</option>
              {pointTypes.map((type) => (
                <option key={`type-${type.type_id}`} value={type.type_id}>
                  {type.type_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.calendarContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>관리자 선택:</label>
            <select
              value={selectedAdmin}
              onChange={handleAdminChange}
              className={styles.select}
            >
              <option value="">관리자 선택</option>
              {adminList.map((admin) => (
                <option key={admin} value={admin}>
                  {admin}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>사용자 선택:</label>
            <select
              value={selectedUser}
              onChange={handleUserChange}
              className={styles.select}
            >
              <option value="">사용자 선택</option>
              {filteredUserList.map((user) => (
                <option key={`user-${user.user_id}`} value={user.username}>
                  {user.username} - {user.role}
                </option>
              ))}
            </select>
          </div>
        </div>
        <UserdataTable
          selectedType={textFields}
          selectedUser={selectedUser}
          selectedDate={selectedDate}
          selectedAdmin={selectedAdmin}
        />
      </div>
    </div>
  );
}
