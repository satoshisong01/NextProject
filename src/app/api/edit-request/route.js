// src/app/api/edit-request/route.js
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function POST(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const {
    entry_id,
    maker,
    created_by,
    data1,
    data2,
    data3,
    data4,
    data5,
    data6,
    data7,
    created_at,
    time_limit,
    type_id,
  } = await request.json();

  // MySQL 형식으로 날짜-시간 변환
  const formattedCreatedAt = new Date(created_at)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  // time_limit에 하루를 더해 MySQL 형식으로 변환
  const newTimeLimit = new Date(time_limit);
  newTimeLimit.setDate(newTimeLimit.getDate() + 1); // 하루를 더함
  const formattedTimeLimit = newTimeLimit
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const connection = await connectToDatabase();

  try {
    await connection.execute(
      `INSERT INTO edit_requests (
          entry_id, maker, created_by, type_id, data1, data2, data3, data4, data5, data6, data7, created_at, time_limit, request_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        entry_id,
        maker,
        created_by,
        type_id,
        data1,
        data2,
        data3,
        data4,
        data5,
        data6,
        data7,
        formattedCreatedAt,
        formattedTimeLimit,
      ]
    );

    return new Response(
      JSON.stringify({ message: "수정 요청이 성공적으로 제출되었습니다." }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("수정 요청 데이터 저장 오류:", error);
    return new Response(JSON.stringify({ error: "수정 요청 실패" }), {
      status: 500,
    });
  } finally {
    await connection.end();
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get("type_id");
  const username = searchParams.get("username");

  const connection = await connectToDatabase();

  try {
    // `typeId`와 `username` 값이 `undefined`이거나 빈 문자열일 경우 전체 데이터 반환
    let query = "SELECT * FROM edit_requests";
    const queryParams = [];

    if (typeId && typeId !== "undefined") {
      query += " WHERE type_id = ?";
      queryParams.push(typeId);
    }
    if (username && username !== "undefined") {
      query += queryParams.length ? " AND" : " WHERE";
      query += " maker = ?";
      queryParams.push(username);
    }

    const [rows] = await connection.execute(query, queryParams);
    await connection.end();

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("edit_requests 데이터를 불러오는 중 오류:", error);
    return new Response(JSON.stringify({ error: "데이터 불러오기 오류" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
