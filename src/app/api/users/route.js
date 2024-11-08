// src/app/api/users/route.js
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

// GET: 모든 사용자 조회 (admin 계정 제외)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const createdBy = searchParams.get("created_by");

  const connection = await connectToDatabase();

  try {
    const query =
      createdBy && createdBy !== "admin"
        ? `SELECT users.user_id, users.username, users.role, users.created_at, users.created_by,
               points.point_id, points.point_score, points.point_total, points.point_type_id, points.added_by, points.point_created_at,
               point_types.type_name
          FROM users
          LEFT JOIN points ON users.username = points.username
          LEFT JOIN point_types ON points.point_type_id = point_types.type_id
          WHERE users.username != 'admin' AND users.created_by = ?`
        : `SELECT users.user_id, users.username, users.role, users.created_at, users.created_by,
               points.point_id, points.point_score, points.point_total, points.point_type_id, points.added_by, points.point_created_at,
               point_types.type_name
          FROM users
          LEFT JOIN points ON users.username = points.username
          LEFT JOIN point_types ON points.point_type_id = point_types.type_id
          WHERE users.username != 'admin'`;

    const [users] =
      createdBy && createdBy !== "admin"
        ? await connection.execute(query, [createdBy])
        : await connection.execute(query);

    await connection.end();
    return new Response(JSON.stringify(users), { status: 200 });
  } catch (error) {
    console.error("포인트 정보가 포함된 사용자 데이터 불러오기 오류:", error);
    return new Response(
      JSON.stringify({
        error: "포인트 정보가 포함된 사용자 데이터 불러오기 오류",
      }),
      { status: 500 }
    );
  }
}

// POST: 새로운 사용자 생성
export async function POST(req) {
  console.log("POST 요청 도달"); // 추가된 로그
  console.log("Authorization Header:", req.headers.get("Authorization")); // 추가된 로그

  // 미들웨어를 사용하여 인증 및 권한 검사를 수행합니다.
  const authError = authenticate(req, ["admin", "subadmin"]);
  if (authError) return authError; // admin이 아닌 경우 접근을 막음

  const { username, password, role, createdBy } = await req.json();
  console.log("서버에서 받은 데이터:", { username, password, role, createdBy });

  if (!username || !password || !role || !createdBy) {
    console.error("필수 필드 누락:", { username, password, role, createdBy });
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
    });
  }

  const connection = await connectToDatabase();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // 중복된 사용자 이름 체크
    const [existingUser] = await connection.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      console.warn("사용자 이름 중복:", username);
      await connection.end();
      return new Response(
        JSON.stringify({ error: "Username already exists" }),
        { status: 409 } // 409 Conflict
      );
    }

    // 중복이 아닌 경우에만 사용자 생성
    const [result] = await connection.execute(
      "INSERT INTO users (username, password, role, created_at, created_by) VALUES (?, ?, ?, NOW(), ?)",
      [username, hashedPassword, role, createdBy]
    );
    await connection.end();
    console.log("사용자 생성 성공:", result);

    return new Response(
      JSON.stringify({
        message: "User added successfully",
        id: result.insertId,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("사용자 추가 중 오류 발생:", error);
    return new Response(JSON.stringify({ error: "User addition failed" }), {
      status: 500,
    });
  }
}
