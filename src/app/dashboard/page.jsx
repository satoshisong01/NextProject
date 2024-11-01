// src/app/dashboard/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/Dashboard.module.css";
import SellerStatus from "../seller/SellerStatus";
import Data from "../../components/Data";
import ModifiedData from "../../components/ModifiedData";

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // 현재 사용자 아이디 상태 추가
  const [activeTab, setActiveTab] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username"); // 현재 사용자 아이디 가져오기
    console.log(token, "토큰못가져오지않나");

    if (role) {
      setRole(role);
      setCurrentUserId(username); // 현재 사용자 아이디 설정
      console.log("username", username);
      setActiveTab(role === "user" ? "데이터" : "셀러현황");
      setIsLoading(false);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("username"); // 사용자 아이디 정보 제거
    router.push("/login");
  };

  const getSidebarMenu = () => {
    if (role === "admin") {
      return ["셀러현황", "데이터", "수정된 데이터"];
    } else if (role === "subadmin") {
      return ["셀러현황", "데이터"];
    } else if (role === "user") {
      return [];
    }
    return [];
  };

  const handleTabClick = (tab) => setActiveTab(tab);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>대시보드</h1>
        <div className={styles.userInfo}>
          <span>
            {currentUserId ? `${currentUserId} 님` : "아이디 정보 없음"}
          </span>{" "}
          {/* 현재 사용자 아이디 표시 */}
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
          {activeTab === "수정된 데이터" && role === "admin" && (
            <ModifiedData />
          )}
        </div>
      </div>
    </div>
  );
}
