// src/app/api/user-data-entries/edit-confirm/[entryId]/route.js
import { connectToDatabase } from "../../../../../db/db";
import { authenticate } from "../../../../../middleware/authenticate";

export async function PATCH(request, context) {
  const authError = authenticate(request, ["admin", "subadmin"]);
  if (authError) return authError;

  const { entryId } = await context.params; // URL에서 entryId 추출
  const connection = await connectToDatabase();

  try {
    const updateQuery = `
      UPDATE user_data_entries
      SET edit_request = 0,
      edit_time = NULL
      WHERE entry_id = ?
    `;

    const [result] = await connection.execute(updateQuery, [entryId]);

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
      JSON.stringify({ message: "수정 요청이 확인되었습니다." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("수정 요청 확인 오류:", error);
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
