// src/app/api/user-data-entries/update-all-refunds/route.js
import { connectToDatabase } from "../../../../db/db";
import { authenticate } from "../../../../middleware/authenticate";

export async function PATCH(request) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const connection = await connectToDatabase();

  try {
    // refund_request가 1이고 refund_count가 NULL인 모든 항목을 선택하는 쿼리
    const selectQuery = `
      SELECT entry_id, refund_time, time_limit, data1
      FROM user_data_entries
      WHERE refund_request = 1 AND refund_completed_time IS NULL
    `;

    const [rows] = await connection.execute(selectQuery);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "업데이트할 환불 요청 데이터가 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    for (const entry of rows) {
      const refundDate = new Date(entry.refund_time);
      const timeLimit = new Date(entry.time_limit);
      const differenceInTime = timeLimit - refundDate;
      const differenceInDays = Math.ceil(
        differenceInTime / (1000 * 60 * 60 * 24)
      );
      const refundCount =
        differenceInDays > 0 ? differenceInDays * entry.data1 : 0;

      // refund_count와 완료 시간을 정확하게 계산하고 업데이트
      const updateQuery = `
        UPDATE user_data_entries
        SET refund_count = ?,  refund_completed_time = CURRENT_TIMESTAMP
        WHERE entry_id = ?
      `;

      await connection.execute(updateQuery, [refundCount, entry.entry_id]);
    }

    return new Response(
      JSON.stringify({
        message: "모든 환불 요청 데이터가 업데이트되었습니다.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("전체 환불 요청 업데이트 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await connection.end();
  }
}
