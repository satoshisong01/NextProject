import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function POST(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { pointTypeId, username, updatedPoints } = await request.json();
  console.log("포인트 업데이트 요청:", {
    pointTypeId,
    username,
    updatedPoints,
  });

  const connection = await connectToDatabase();

  try {
    // 포인트 조회
    const [pointRows] = await connection.execute(
      `SELECT point_score FROM points WHERE username = ? AND point_type_id = ?`,
      [username, pointTypeId]
    );

    if (pointRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "사용자의 포인트 정보를 찾을 수 없습니다." }),
        { status: 404 }
      );
    }

    // 포인트 업데이트
    await connection.execute(
      `UPDATE points SET point_score = ? WHERE username = ? AND point_type_id = ?`,
      [updatedPoints, username, pointTypeId]
    );

    return new Response(
      JSON.stringify({ message: "포인트가 성공적으로 업데이트되었습니다." }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("포인트 업데이트 오류:", error);
    return new Response(JSON.stringify({ error: "포인트 업데이트 실패" }), {
      status: 500,
    });
  } finally {
    await connection.end();
  }
}
