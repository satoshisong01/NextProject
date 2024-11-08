import { connectToDatabase } from "../../../../db/db";
import { authenticate } from "../../../../middleware/authenticate";

export async function GET(request) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const createdBy = searchParams.get("created_by");

  if (!createdBy) {
    return new Response(
      JSON.stringify({ message: "created_by 쿼리 파라미터가 필요합니다." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const connection = await connectToDatabase();

  try {
    // created_by 필드가 현재 username인 항목들 중에서 필요한 시간 필드가 있는 항목만 가져오기
    const query = `
      SELECT edit_time, refund_time, extend_request_time
      FROM user_data_entries
      WHERE created_by = ?
      AND (edit_time IS NOT NULL OR refund_time IS NOT NULL OR extend_request_time IS NOT NULL)
    `;

    const [rows] = await connection.execute(query, [createdBy]);

    // edit_time, refund_time, extend_request_time을 하나의 배열로 합쳐 중복 제거
    const highlightedDates = Array.from(
      new Set(
        rows
          .flatMap((row) => [
            row.edit_time,
            row.refund_time,
            row.extend_request_time,
          ])
          .filter((date) => date !== null)
      )
    );

    return new Response(JSON.stringify({ highlightedDates }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("데이터 검색 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await connection.end();
  }
}
