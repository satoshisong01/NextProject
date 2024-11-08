// src/app/api/user-data-entries/edit-confirm-all/route.js
import { connectToDatabase } from "../../../../db/db";
import { authenticate } from "../../../../middleware/authenticate";

export async function PATCH(request) {
  // 사용자 인증 및 권한 확인
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const connection = await connectToDatabase();

  try {
    // edit_request가 1인 모든 항목을 수정하는 쿼리
    const updateQuery = `
      UPDATE user_data_entries
      SET edit_request = 0,
      edit_time = NULL
      WHERE edit_request = 1
    `;

    const [result] = await connection.execute(updateQuery);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ message: "수정 요청된 데이터가 없습니다." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "모든 수정 요청이 확인되었습니다." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("전체 수정 요청 확인 오류:", error);
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
