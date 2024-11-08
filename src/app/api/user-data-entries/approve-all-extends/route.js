// src/app/api/user-data-entries/approve-all-extends/route.js
import { connectToDatabase } from "../../../../db/db";
import { authenticate } from "../../../../middleware/authenticate";

export async function PATCH(request) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const connection = await connectToDatabase();
  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    // 연장 요청이 있는 항목 가져오기
    const [entries] = await connection.execute(`
      SELECT * FROM user_data_entries WHERE extend_request = 1
    `);

    if (entries.length === 0) {
      return new Response(
        JSON.stringify({ message: "승인할 연장 요청 데이터가 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // extend_request가 1인 모든 항목을 승인 처리하고, time_limit을 10일 연장하는 쿼리
    const updateQuery = `
      UPDATE user_data_entries
      SET extend_request = 0,
          time_limit = DATE_ADD(time_limit, INTERVAL 10 DAY),
          extend_request_time = NULL
      WHERE extend_request = 1
    `;

    const [result] = await connection.execute(updateQuery);

    // 각 항목에 대해 로그 기록 추가
    for (const entry of entries) {
      const { entry_id, type_id, data1, created_by, maker } = entry;
      const pointScore = parseInt(data1, 10);

      // update 로그 기록
      await connection.execute(
        `INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [maker, type_id, "update", pointScore, created_by, currentTime]
      );

      // extends 로그 기록
      await connection.execute(
        `INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [maker, type_id, "extends", pointScore, created_by, currentTime]
      );
    }

    return new Response(
      JSON.stringify({
        message: "모든 연장 요청이 승인되고 로그가 기록되었습니다.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("전체 연장 요청 승인 및 로그 기록 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await connection.end();
  }
}
