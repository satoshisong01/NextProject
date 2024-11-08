// src/app/api/user-data-entries/approve-extend/[entryId]/route.js
import { connectToDatabase } from "../../../../../db/db";
import { authenticate } from "../../../../../middleware/authenticate";

export async function PATCH(request, context) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;
  const { entryId } = await context.params;
  const connection = await connectToDatabase();

  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    // 데이터 확인 쿼리
    const [rows] = await connection.execute(
      "SELECT * FROM user_data_entries WHERE entry_id = ?",
      [entryId]
    );

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "해당 데이터를 찾을 수 없습니다." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const entry = rows[0];

    // extend_request를 0으로 변경하고, time_limit을 10일 연장하는 쿼리
    const updateQuery = `
      UPDATE user_data_entries
      SET extend_request = 0,
          time_limit = DATE_ADD(time_limit, INTERVAL 10 DAY),
          extend_request_time = NULL
      WHERE entry_id = ? AND extend_request = 1
    `;
    const [result] = await connection.execute(updateQuery, [entryId]);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({
          message: "해당 요청을 찾을 수 없거나 이미 승인되었습니다.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 포인트 로그에 기록 추가
    const { type_id, data1, created_by } = entry;
    const pointScore = parseInt(data1, 10);

    // update 로그 기록
    await connection.execute(
      `INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entry.maker, type_id, "update", pointScore, created_by, currentTime]
    );

    // extends 로그 기록
    await connection.execute(
      `INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entry.maker, type_id, "extends", pointScore, created_by, currentTime]
    );

    return new Response(
      JSON.stringify({
        message: "연장 요청이 승인되고 로그가 기록되었습니다.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("연장 요청 승인 및 로그 기록 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await connection.end();
  }
}
