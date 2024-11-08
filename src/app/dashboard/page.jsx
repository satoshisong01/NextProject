"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/Dashboard.module.css";
import SellerStatus from "../seller/SellerStatus";
import Data from "../../components/Data";
import ModifiedData from "../../components/ModifiedData";
import { FaClock } from "react-icons/fa"; // 시간 아이콘 추가
import DataStatus from "@/components/DataStatus";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null); // 남은 시간을 저장하는 상태 추가
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    const expireTime = localStorage.getItem("expireTime");

    if (role && expireTime) {
      setRole(role);
      setCurrentUserId(username);
      setActiveTab(role === "user" ? "데이터" : "셀러현황");
      setIsLoading(false);

      // 남은 시간 계산 및 상태 설정
      updateRemainingTime(expireTime);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    // 매 초마다 남은 시간을 업데이트
    const intervalId = setInterval(() => {
      const expireTime = localStorage.getItem("expireTime");
      if (expireTime) {
        updateRemainingTime(expireTime);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const updateRemainingTime = (expireTime) => {
    const currentTime = new Date().getTime();
    const timeDifference = expireTime - currentTime;

    if (timeDifference <= 0) {
      alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
      handleLogout();
    } else {
      setTimeLeft(formatTime(timeDifference));
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("expireTime");
    router.push("/login");
  };

  const getSidebarMenu = () => {
    if (role === "admin" || role === "subadmin") {
      return ["셀러현황", "관리자요청 데이터", "데이터 현황"];
    } else if (role === "user") {
      return [];
    }
    return [];
  };

  const handleTabClick = (tab) => setActiveTab(tab);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>대시보드</h1>
        <div className={styles.userInfo}>
          <span className={styles.expireTime}>
            <FaClock className={styles.timeIcon} /> {timeLeft}
          </span>{" "}
          <span>
            {currentUserId ? `${currentUserId} 님  ` : "아이디 정보 없음"}
          </span>
          {/* 남은 시간 표시 */}
          <button onClick={handleLogout} className={styles.logoutButton}>
            로그아웃
          </button>
        </div>
      </header>

      <div className={styles.sidehome}>
        <div className={styles.sidebar}>
          {getSidebarMenu().map((menu) => (
            <button
              key={menu}
              onClick={() => handleTabClick(menu)}
              className={activeTab === menu ? styles.active : ""}
            >
              {menu}
            </button>
          ))}
        </div>

        <div className={styles.mainContent}>
          {activeTab === "셀러현황" && <SellerStatus />}
          {activeTab === "데이터" && <Data />}
          {activeTab === "관리자요청 데이터" && <ModifiedData />}
          {activeTab === "데이터 현황" && <DataStatus />}
        </div>
      </div>
    </div>
  );
}
