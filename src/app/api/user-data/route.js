// API 경로: /api/user-data
import { connectToDatabase } from "../../../db/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  console.log("username✨✨✨", username);
  try {
    const connection = await connectToDatabase();

    const query = `
        SELECT 
          points.point_type_id,
          points.point_score,
          point_types.type_name,
          point_type_details.text1,
          point_type_details.text2,
          point_type_details.text3,
          point_type_details.text4,
          point_type_details.text5,
          point_type_details.text6,
          point_type_details.text7
        FROM 
          points
        JOIN 
          point_types ON points.point_type_id = point_types.type_id
        JOIN 
          point_type_details ON point_types.type_id = point_type_details.point_type_id
        WHERE 
          points.username = ?
      `;

    const [results] = await connection.execute(query, [username]);
    await connection.end();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("데이터 불러오기 오류:", error);
    return new Response(JSON.stringify({ error: "데이터 불러오기 오류" }), {
      status: 500,
    });
  }
}
