// src/app/api/users-basic/route.js
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function GET(request) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const connection = await connectToDatabase();

  try {
    // 모든 사용자 데이터 가져오기 쿼리
    const query = `SELECT * FROM users`;

    const [rows] = await connection.execute(query);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("사용자 데이터 가져오기 오류:", error);
    return new Response(JSON.stringify({ message: "데이터 가져오기 실패" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await connection.end();
  }
}
