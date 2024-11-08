// src/app/api/user-data-entries/update/[entryId]/route.js
import { connectToDatabase } from "../../../../../db/db";
import { authenticate } from "../../../../../middleware/authenticate";

export async function PATCH(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  // 요청에서 수정할 데이터를 받아옵니다.
  const { entry_id, data1, data2, data3, data4, data5, data6, data7 } =
    await request.json();
  const connection = await connectToDatabase();

  try {
    // 수정 쿼리 설정
    const updateQuery = `
      UPDATE user_data_entries 
      SET data1 = ?, data2 = ?, data3 = ?, data4 = ?, data5 = ?, data6 = ?, data7 = ?, 
          edit_time = NOW(), edit_request = 1
      WHERE entry_id = ?
    `;

    const queryParams = [
      data1,
      data2,
      data3,
      data4,
      data5,
      data6,
      data7,
      entry_id,
    ];

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
      JSON.stringify({ message: "데이터가 성공적으로 수정되었습니다." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("데이터 수정 오류:", error);
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
