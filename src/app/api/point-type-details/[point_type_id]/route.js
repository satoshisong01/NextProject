import { connectToDatabase } from "../../../../db/db";

export async function GET(req, context) {
  const { point_type_id } = await context.params;

  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.execute(
      "SELECT point_type_id, text1, text2, text3, text4, text5, text6, text7 FROM point_type_details WHERE point_type_id = ?",
      [point_type_id]
    );
    await connection.end();

    if (rows.length > 0) {
      return new Response(JSON.stringify(rows[0]), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "데이터가 없습니다." }), {
        status: 404,
      });
    }
  } catch (error) {
    console.error("데이터 가져오기 오류:", error);
    return new Response(JSON.stringify({ error: "데이터베이스 오류" }), {
      status: 500,
    });
  }
}
