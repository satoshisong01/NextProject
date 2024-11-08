import { useState, useEffect } from "react";
import styles from "./DataStatus.module.css"; // 기존 스타일 유지
import UserStatus from "./statusTable/userStatus";
import LoadingSpinner from "./LoadingSpinner";

export default function DataStatus() {
  const [subadmins, setSubadmins] = useState([]);
  const [selectedSubadmin, setSelectedSubadmin] = useState("");
  const [users, setUsers] = useState([]);
  const [dataEntries, setDataEntries] = useState([]);
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [days, setDays] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const adminrole = localStorage.getItem("role");
  // 중복 제거 함수
  const removeDuplicates = (array, key) => {
    const uniqueKeys = new Set();
    return array.filter((item) => {
      if (!uniqueKeys.has(item[key])) {
        uniqueKeys.add(item[key]);
        return true;
      }
      return false;
    });
  };

  // Subadmin 리스트를 가져오는 함수
  const fetchSubadmins = async () => {
    try {
      const name = localStorage.getItem("username");
      const adminrole = localStorage.getItem("role");

      const response = await fetch("/api/users-basic");
      if (response.ok) {
        const data = await response.json();
        // role이 "user"가 아닌 사용자만 가져오기 (admin과 subadmin 포함)
        const filteredSubadmins = data.filter((user) => user.role !== "user");
        const uniqueSubadmins = removeDuplicates(filteredSubadmins, "username"); // 중복 제거

        if (adminrole === "admin") {
          // admin 역할이면 모든 subadmin 저장
          setSubadmins(uniqueSubadmins);
        } else {
          // 현재 사용자 이름과 일치하는 subadmin만 저장
          const matchedSubadmins = uniqueSubadmins.filter(
            (user) => user.username === name
          );
          setSubadmins(matchedSubadmins);
        }

        console.log("name", name);
        console.log("uni", uniqueSubadmins);
      } else {
        console.error("Subadmin 데이터 가져오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모든 user 목록을 가져오는 함수 (subadmin 제외)
  const fetchAllUsersExcludingSubadmins = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        const nonSubadminUsers = data.filter(
          (user) => !subadmins.some((sub) => sub.username === user.username)
        );
        const uniqueUsers = removeDuplicates(nonSubadminUsers, "username"); // 중복 제거
        setUsers(uniqueUsers);
      } else {
        console.error("User 데이터 가져오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    }
  };

  // 특정 subadmin의 하위 user를 가져오는 함수
  const fetchUsers = async (subadmin) => {
    console.log("선택된 Subadmin:", subadmin); // 디버깅용 로그 추가
    if (subadmin === "전체") {
      fetchAllUsersExcludingSubadmins();
      return;
    }
    try {
      const response = await fetch(`/api/users?created_by=${subadmin}`);
      if (response.ok) {
        const data = await response.json();
        console.log("data", data);
        const uniqueUsers = removeDuplicates(data, "username"); // 중복 제거
        console.log("unique", uniqueUsers);
        setUsers(uniqueUsers);
      } else {
        console.error("User 데이터 가져오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    }
  };

  // 날짜 데이터를 가져오는 함수
  const fetchDataEntries = async () => {
    try {
      const username = localStorage.getItem("username");
      const role = localStorage.getItem("role");
      let url = "/api/user-data-entries-basic";

      // admin이 아닌 경우에만 username을 쿼리에 추가
      if (role !== "admin" && username) {
        url += `?username=${encodeURIComponent(username)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDataEntries(data);

        // created_at과 refund_completed_time 기준으로 연, 월, 일 목록 추출
        const dates = data
          .flatMap((entry) => [
            new Date(entry.created_at),
            entry.refund_completed_time
              ? new Date(entry.refund_completed_time)
              : null,
          ])
          .filter(Boolean); // null 값을 제외

        const uniqueYears = [
          ...new Set(dates.map((date) => date.getFullYear())),
        ];
        setYears(uniqueYears.sort((a, b) => a - b));

        if (selectedYear) {
          const filteredDates = dates.filter(
            (date) => date.getFullYear() === parseInt(selectedYear)
          );
          const uniqueMonths = [
            ...new Set(filteredDates.map((date) => date.getMonth() + 1)),
          ];
          setMonths(uniqueMonths.sort((a, b) => a - b));
        }

        if (selectedYear && selectedMonth) {
          const filteredDates = dates.filter(
            (date) =>
              date.getFullYear() === parseInt(selectedYear) &&
              date.getMonth() + 1 === parseInt(selectedMonth)
          );
          const uniqueDays = [
            ...new Set(filteredDates.map((date) => date.getDate())),
          ];
          setDays(uniqueDays.sort((a, b) => a - b));
        }
      } else {
        console.error("데이터 불러오기 실패");
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
    }
  };

  useEffect(() => {
    fetchSubadmins();
    fetchDataEntries();
  }, []);

  useEffect(() => {
    fetchDataEntries();
  }, [selectedYear, selectedMonth]);

  const handleSubadminChange = (e) => {
    const subadmin = e.target.value;
    setSelectedSubadmin(subadmin);
    fetchUsers(subadmin);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedMonth("");
    setSelectedDay("");
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDay("");
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
  };

  return (
    <div className={styles.container}>
      {isLoading ? ( // 로딩 중일 때 스피너 표시
        <LoadingSpinner />
      ) : (
        <>
          <h2>데이터 현황</h2>

          <div className={styles.dateSelectContainer}>
            <label>
              연도:
              <select value={selectedYear} onChange={handleYearChange}>
                <option value="">전체</option>
                {years.map((year, index) => (
                  <option key={index} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              월:
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                disabled={!selectedYear}
              >
                <option value="">전체</option>
                {months.map((month, index) => (
                  <option key={index} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            </label>
            <label>
              일:
              <select
                value={selectedDay}
                onChange={handleDayChange}
                disabled={!selectedMonth}
              >
                <option value="">전체</option>
                {days.map((day, index) => (
                  <option key={index} value={day}>
                    {day}일
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.selectContainer}>
            <label>
              관리자 선택:
              <select value={selectedSubadmin} onChange={handleSubadminChange}>
                {adminrole === "admin" && <option value="전체">전체</option>}
                <option value="-">-선택-</option>
                {subadmins.map((sub, index) => (
                  <option key={index} value={sub.username}>
                    {sub.username}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <UserStatus
            users={users}
            subadmin={selectedSubadmin}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
          />
        </>
      )}
    </div>
  );
}
