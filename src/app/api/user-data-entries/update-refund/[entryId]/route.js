// src/app/api/user-data-entries/update-refund/[entryId]/route.js
import { connectToDatabase } from "../../../../../db/db";
import { authenticate } from "../../../../../middleware/authenticate";

export async function PATCH(request, { params }) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const { entryId } = params; // URL에서 entryId 추출
  const connection = await connectToDatabase();

  try {
    // 데이터 확인 쿼리
    const checkQuery = `
      SELECT * FROM user_data_entries
      WHERE entry_id = ? AND refund_request = 1
    `;

    const [rows] = await connection.execute(checkQuery, [entryId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "해당하는 데이터를 찾을 수 없습니다." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const entry = rows[0];
    const refundDate = new Date(entry.refund_time);
    const timeLimit = new Date(entry.time_limit);

    // 환불 예정 일수를 계산하고 refund_count 값을 구함
    const differenceInTime = timeLimit - refundDate;
    const differenceInDays = Math.ceil(
      differenceInTime / (1000 * 60 * 60 * 24)
    );
    const refundCount =
      differenceInDays > 0 ? differenceInDays * entry.data1 : 0;

    // refund_count와 완료 시간을 업데이트하는 쿼리
    const updateQuery = `
      UPDATE user_data_entries
      SET refund_count = ?, refund_completed_time = CURRENT_TIMESTAMP
      WHERE entry_id = ?
    `;

    await connection.execute(updateQuery, [refundCount, entryId]);

    return new Response(
      JSON.stringify({
        message:
          "환불 요청된 데이터가 확인되었으며 환불일과 완료 시간이 업데이트되었습니다.",
        refund_count: refundCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("환불 요청 확인 및 업데이트 오류:", error);
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
