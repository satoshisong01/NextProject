// components/LoadingSpinner.jsx
import React from "react";
import styles from "./LoadingSpinner.module.css"; // 스타일 파일 추가

export default function LoadingSpinner() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.paragraph}>로딩 중...</p>
    </div>
  );
}
