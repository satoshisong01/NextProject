import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

// POST 요청: 포인트 추가, 업데이트, 회수
// POST 요청: 포인트 추가, 업데이트, 회수
export async function POST(req) {
  const authError = authenticate(req, ["admin", "subadmin"]);

  const { username, point_type_id, point_score, added_by, isRevoke } =
    await req.json();

  if (!username || !point_type_id || !point_score || !added_by) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
    });
  }

  const connection = await connectToDatabase();
  const formattedDate = new Date().toISOString().slice(0, 19).replace("T", " ");
  let action = isRevoke ? "revoke" : ""; // 회수 시에는 "revoke"로 설정

  try {
    // 동일한 사용자와 포인트 타입이 이미 있는지 확인
    const [existingPoints] = await connection.execute(
      "SELECT point_score FROM points WHERE username = ? AND point_type_id = ?",
      [username, point_type_id]
    );

    if (isRevoke) {
      // 포인트 회수 로직
      if (
        existingPoints.length > 0 &&
        existingPoints[0].point_score >= point_score
      ) {
        await connection.execute(
          "UPDATE points SET point_score = point_score - ?, added_by = ?, point_created_at = ? WHERE username = ? AND point_type_id = ?",
          [point_score, added_by, formattedDate, username, point_type_id]
        );
        action = "revoke"; // 회수 액션 설정

        // points_log 테이블에 회수 기록 추가
        await connection.execute(
          "INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [
            username,
            point_type_id,
            action,
            point_score,
            added_by,
            formattedDate,
          ]
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Insufficient points to revoke" }),
          {
            status: 400,
          }
        );
      }
    } else {
      // 포인트 추가/업데이트 로직
      if (existingPoints.length > 0) {
        // 포인트 업데이트 및 point_total에 누적
        await connection.execute(
          "UPDATE points SET point_score = point_score + ?, point_total = point_total + ?, added_by = ?, point_created_at = ? WHERE username = ? AND point_type_id = ?",
          [
            point_score,
            point_score,
            added_by,
            formattedDate,
            username,
            point_type_id,
          ]
        );
        action = "update"; // 업데이트 액션 설정
      } else {
        // 새 포인트 추가 (point_total 초기값도 point_score로 설정)
        await connection.execute(
          "INSERT INTO points (username, point_type_id, point_score, point_total, added_by, point_created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [
            username,
            point_type_id,
            point_score,
            point_score,
            added_by,
            formattedDate,
          ]
        );
        action = "add"; // 추가 액션 설정
      }

      // 포인트 추가/업데이트를 points_log 테이블에 기록
      await connection.execute(
        "INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [username, point_type_id, action, point_score, added_by, formattedDate]
      );
    }

    await connection.end();
    return new Response(
      JSON.stringify({
        message: "포인트 처리 및 로그 기록이 성공적으로 완료되었습니다.",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("포인트 처리 및 로그 기록 중 오류 발생:", error);
    return new Response(
      JSON.stringify({ error: "포인트 처리 중 오류가 발생했습니다." }),
      {
        status: 500,
      }
    );
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
