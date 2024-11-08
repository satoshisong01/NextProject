// src/app/api/user-data-entries/request/[entryId]/route.js
import { connectToDatabase } from "../../../../../db/db";
import { authenticate } from "../../../../../middleware/authenticate";

export async function PATCH(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { entry_id, requestType } = await request.json();
  const connection = await connectToDatabase();

  try {
    if (requestType !== "refund") {
      return new Response(
        JSON.stringify({
          message: "잘못된 요청 유형입니다. 환불 요청만 허용됩니다.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 데이터 확인 쿼리
    const checkQuery = `
      SELECT * FROM user_data_entries
      WHERE entry_id = ? AND refund_request = 0
    `;

    const [rows] = await connection.execute(checkQuery, [entry_id]);

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
    const refundDate = new Date();
    const timeLimit = new Date(entry.time_limit);

    // 환불 예정 일수를 계산하고 differenceInDays 값을 구함
    const differenceInTime = timeLimit - refundDate;
    const differenceInDays = Math.ceil(
      differenceInTime / (1000 * 60 * 60 * 24)
    );
    const refundCount =
      differenceInDays > 0 ? differenceInDays * entry.data1 : 0;

    // 환불 요청 및 필요한 컬럼들 업데이트 쿼리
    const updateQuery = `
      UPDATE user_data_entries
      SET refund_request = 1, refund_time = NOW(), refund_count = ?, 
          solt_count = ?, maintitle = ?, differenceInDays = ?
      WHERE entry_id = ?
    `;

    const [result] = await connection.execute(updateQuery, [
      refundCount,
      entry.data1, // solt_count에 data1 값을 넣음
      entry.data2, // maintitle에 data2 값을 넣음
      differenceInDays, // differenceInDays 값을 넣음
      entry_id,
    ]);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ message: "환불 요청 처리 중 오류가 발생했습니다." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "환불 신청이 성공적으로 요청되었습니다.",
        refund_count: refundCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`환불 요청 처리 오류:`, error);
    return new Response(
      JSON.stringify({
        message: "환불 요청 중 서버 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    await connection.end();
  }
}
