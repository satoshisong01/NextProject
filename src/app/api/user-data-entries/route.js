// src/app/api/user-data-entries/route.js
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function GET(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { username, role } = request.user; // 인증된 사용자 정보 가져오기
  const connection = await connectToDatabase();

  // URL에서 쿼리 파라미터 추출
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get("type_id");
  const selectedUsername = searchParams.get("username");
  const usersend = searchParams.get("usersend"); // usersend 값 가져오기
  console.log("usersend", usersend);

  try {
    // 기본 쿼리 설정
    let query = `
      SELECT * 
      FROM user_data_entries 
      WHERE refund_completed_time IS NULL
    `;
    const queryParams = [];

    // usersend 값에 따라 maker 또는 created_by 필터 적용
    if (role !== "admin") {
      if (usersend) {
        query += " AND maker = ?";
      } else {
        query += " AND created_by = ?";
      }
      queryParams.push(username);
    }

    // typeId와 selectedUsername 필터 조건 추가 (typeId가 undefined가 아닐 때만)
    if (typeId !== "undefined" && typeId) {
      query += " AND type_id = ?";
      queryParams.push(typeId);
    }
    if (selectedUsername) {
      query += " AND maker = ?";
      queryParams.push(selectedUsername);
    }

    const [rows] = await connection.execute(query, queryParams);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    return new Response(JSON.stringify({ error: "데이터 조회 실패" }), {
      status: 500,
    });
  } finally {
    await connection.end();
  }
}
