import { connectToDatabase } from "../../../db/db";

// POST 요청: 포인트 추가 또는 업데이트
export async function POST(req) {
  const { username, point_type_id, point_score, added_by, point_created_at } =
    await req.json();

  if (!username || !point_type_id || !point_score || !added_by) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
    });
  }

  const connection = await connectToDatabase();
  const formattedDate = new Date(point_created_at)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    // 동일한 사용자와 포인트 타입이 이미 있는지 확인
    const [existingPoints] = await connection.execute(
      "SELECT point_score FROM points WHERE username = ? AND point_type_id = ?",
      [username, point_type_id]
    );

    if (existingPoints.length > 0) {
      // 동일한 포인트 타입이 있는 경우, 포인트 점수를 업데이트하여 합산
      await connection.execute(
        "UPDATE points SET point_score = point_score + ?, added_by = ?, point_created_at = ? WHERE username = ? AND point_type_id = ?",
        [point_score, added_by, formattedDate, username, point_type_id]
      );
    } else {
      // 동일한 포인트 타입이 없는 경우, 새로운 데이터를 삽입
      await connection.execute(
        "INSERT INTO points (username, point_type_id, point_score, added_by, point_created_at) VALUES (?, ?, ?, ?, ?)",
        [username, point_type_id, point_score, added_by, formattedDate]
      );
    }

    await connection.end();
    return new Response(
      JSON.stringify({ message: "Point processed successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("포인트 추가 중 오류 발생:", error);
    return new Response(JSON.stringify({ error: "Error processing point" }), {
      status: 500,
    });
  }
}

// GET 요청: 특정 사용자 또는 전체 사용자의 포인트 정보 가져오기
export async function GET(req) {
  const connection = await connectToDatabase();

  try {
    // 쿼리 파라미터에서 username 가져오기
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    let query = "SELECT * FROM points";
    const params = [];

    if (username) {
      query += " WHERE username = ?";
      params.push(username);
    }

    const [points] = await connection.execute(query, params);

    await connection.end();
    return new Response(JSON.stringify(points), { status: 200 });
  } catch (error) {
    console.error("포인트 조회 중 오류 발생:", error);
    return new Response(JSON.stringify({ error: "Error fetching points" }), {
      status: 500,
    });
  }
}
