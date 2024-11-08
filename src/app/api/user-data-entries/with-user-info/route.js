// src/app/api/user-data-entries/with-user-info/route.js
import { connectToDatabase } from "../../../../db/db";
import { authenticate } from "../../../../middleware/authenticate";

export async function GET(request) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const connection = await connectToDatabase();

  try {
    // JOIN을 사용하여 필요한 데이터 가져오기
    const query = `
      SELECT 
        ude.entry_id,
        ude.maker,
        ude.created_at,
        ude.created_by,
        ude.time_limit,
        ude.refund_time,
        ude.refund_completed_time,
        ude.refund_count,
        users.username AS agency_name
      FROM user_data_entries ude
      JOIN users ON users.username = ude.maker
    `;

    const [rows] = await connection.execute(query);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    await connection.end();
  }
}
