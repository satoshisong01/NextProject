import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function POST(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { entry_id } = await request.json();

  const connection = await connectToDatabase();

  try {
    // user_data_entries 테이블에서 entry_id에 해당하는 행의 데이터를 가져옵니다.
    const [entryRows] = await connection.execute(
      `SELECT * FROM user_data_entries WHERE entry_id = ?`,
      [entry_id]
    );

    if (entryRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "해당 데이터를 찾을 수 없습니다." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const entry = entryRows[0];
    const newTimeLimit = new Date(entry.time_limit);
    newTimeLimit.setDate(newTimeLimit.getDate() + 1);
    const formattedTimeLimit = newTimeLimit
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // refund_requests 테이블에 데이터를 삽입합니다.
    await connection.execute(
      `INSERT INTO refund_requests (
          entry_id, maker, created_by, type_id, data1, data2, data3, data4, data5, data6, data7, created_at, time_limit, refund_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        entry.entry_id,
        entry.maker,
        entry.created_by,
        entry.type_id,
        entry.data1,
        entry.data2,
        entry.data3,
        entry.data4,
        entry.data5,
        entry.data6,
        entry.data7,
        entry.created_at,
        formattedTimeLimit,
      ]
    );

    return new Response(
      JSON.stringify({ message: "환불 요청이 성공적으로 제출되었습니다." }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("환불 요청 데이터 저장 오류:", error);
    return new Response(JSON.stringify({ error: "환불 요청 실패" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await connection.end();
  }
}
