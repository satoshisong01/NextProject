import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

// GET: 포인트 타입 목록 조회
export async function GET() {
  const connection = await connectToDatabase();

  try {
    const [pointTypes] = await connection.execute("SELECT * FROM point_types");
    await connection.end();

    return new Response(JSON.stringify(pointTypes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("포인트 타입 목록 불러오기 오류:", error);
    await connection.end();
    return new Response(
      JSON.stringify({ error: "Error fetching point types" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST: 새로운 포인트 타입 추가
export async function POST(req) {
  const { type_name, description } = await req.json();

  // 미들웨어를 사용하여 인증 및 권한 검사를 수행합니다.
  const authError = authenticate(req, ["admin"]);
  if (authError) return authError; // admin이 아닌 경우 접근을 막음

  if (!type_name) {
    return new Response(
      JSON.stringify({ error: "Point type name is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const connection = await connectToDatabase();

  try {
    const [result] = await connection.execute(
      "INSERT INTO point_types (type_name, description) VALUES (?, ?)",
      [type_name, description]
    );
    await connection.end();

    return new Response(
      JSON.stringify({
        message: "Point type added successfully",
        pointTypeId: result.insertId, // 추가된 포인트 타입 ID 반환
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("포인트 타입 추가 중 오류 발생:", error);
    await connection.end();
    return new Response(JSON.stringify({ error: "Error adding point type" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
