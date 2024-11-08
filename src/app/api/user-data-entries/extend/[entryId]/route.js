// src/app/api/user-data-entries/extend/[entryId]/route.js
import { connectToDatabase } from "../../../../../db/db";
import { authenticate } from "../../../../../middleware/authenticate";

export async function PATCH(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { entry_id } = await request.json(); // 요청에서 entry_id 가져오기
  const connection = await connectToDatabase();

  try {
    // 연장 요청 쿼리 설정
    const updateQuery = `
      UPDATE user_data_entries 
      SET extend_request = 1, extend_request_time = NOW()
      WHERE entry_id = ?
    `;
    const queryParams = [entry_id];

    const [result] = await connection.execute(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ message: "해당 데이터를 찾을 수 없습니다." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "연장 요청이 성공적으로 처리되었습니다." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("연장 요청 처리 오류:", error);
    return new Response(
      JSON.stringify({ message: "연장 요청 중 서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    await connection.end();
  }
}
