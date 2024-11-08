// src/app/api/points/delete/route.js
import { connectToDatabase } from "../../../../db/db";

export async function POST(req, res) {
  const { username, point_type_id, point_score, added_by } = await req.json();

  if (!username || !point_type_id || !point_score) {
    return new Response(
      JSON.stringify({
        message: "사용자, 포인트 타입 및 포인트 점수를 모두 제공해야 합니다.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const db = await connectToDatabase();

  try {
    const query = `
      UPDATE points
      SET point_score = point_score - ?
      WHERE username = ? AND point_type_id = ? AND added_by = ?`;

    const [result] = await db.execute(query, [
      point_score,
      username,
      point_type_id,
      added_by,
    ]);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ message: "해당 사용자의 포인트를 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "포인트가 성공적으로 회수되었습니다." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("포인트 회수 중 오류:", error);
    return new Response(
      JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await db.end();
  }
}
