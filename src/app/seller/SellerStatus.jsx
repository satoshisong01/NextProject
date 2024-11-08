import { useState, useEffect } from "react";
import Register from "./components/register";
import UserTable from "./components/userTable";
import PointDistribution from "./components/pointDistribution";
import PointTypeAdder from "./components/pointTypeAdder";
import PointTypeDetailsForm from "./components/pointTypeDetailsForm";
import TimeSelector from "./components/timeSelector";

export default function SellerStatus() {
  const [refresh, setRefresh] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // 로컬 스토리지에서 역할을 가져와 상태에 설정
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  const handleUserCreated = () => {
    setRefresh((prev) => !prev); // 상태를 토글하여 UserTable을 리프레시
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Register onUserCreated={handleUserCreated} />
        {role === "admin" && <TimeSelector />}
      </div>
      <UserTable refresh={refresh} role={role} />
      <div style={{ display: "flex", width: "100%" }}>
        {role === "admin" && <PointTypeAdder />}
        <PointDistribution refresh={refresh} />
      </div>
      {role === "admin" && <PointTypeDetailsForm />}
    </div>
  );
}
