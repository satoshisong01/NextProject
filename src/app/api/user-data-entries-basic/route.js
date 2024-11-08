// src/app/api/user-data-entries-basic/route.js
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function GET(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  const connection = await connectToDatabase();

  try {
    let query = `
      SELECT * 
      FROM user_data_entries
      WHERE 1=1
    `;
    const queryParams = [];

    // username이 존재할 경우 쿼리 조건 추가 (admin은 제외)
    if (username) {
      query += " AND created_by = ?";
      queryParams.push(username);
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
