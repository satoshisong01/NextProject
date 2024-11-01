// src/app/api/user-data-submit/route.js
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function POST(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  // request.json()으로 데이터를 추출
  const { pointTypeId, inputs } = await request.json();
  console.log("받은 pointTypeId:", pointTypeId); // pointTypeId 확인용 로그
  console.log("받은 inputs:", inputs); // inputs 객체 확인용 로그
  const { username } = request.user; // 인증된 사용자 이름

  const connection = await connectToDatabase();

  try {
    // 현재 사용자의 created_by 값을 조회합니다.
    const [userRows] = await connection.execute(
      `SELECT created_by FROM users WHERE username = ?`,
      [username]
    );

    if (userRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "사용자를 찾을 수 없습니다." }),
        { status: 404 }
      );
    }

    const createdBy = userRows[0].created_by;

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

    let currentPoints = pointRows[0].point_score;

    // inputs에서 첫 번째 필드 (text1, text8, ...) 값을 합산
    let totalDeduction = 0;
    Object.keys(inputs).forEach((key) => {
      if (
        key.startsWith("text") &&
        (parseInt(key.replace("text", "")) - 1) % 7 === 0
      ) {
        totalDeduction += parseInt(inputs[key]) || 0;
      }
    });

    console.log("총 차감할 포인트:", totalDeduction);

    if (currentPoints < totalDeduction) {
      return new Response(JSON.stringify({ error: "포인트가 부족합니다." }), {
        status: 400,
      });
    }

    // 포인트 차감
    await connection.execute(
      `UPDATE points SET point_score = point_score - ? WHERE username = ? AND point_type_id = ?`,
      [totalDeduction, username, pointTypeId]
    );

    // 데이터 추가 (차감 성공 시)
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 11); // 10일 후로 설정
    currentDate.setHours(0, 0, 0, 0); // 시간을 자정(00:00:00)으로 설정하여 다음날로 저장
    const timeLimit = `${currentDate.toISOString().slice(0, 10)} 00:00:00`;

    // 입력된 데이터에서 7개씩 나눠서 각 항목 저장
    const inputKeys = Object.keys(inputs);
    for (let i = 0; i < inputKeys.length; i += 7) {
      const chunk = Array(7)
        .fill(null)
        .map((_, idx) => inputs[`text${i + idx + 1}`] || null);

      await connection.execute(
        `INSERT INTO user_data_entries (
          type_id, created_by, maker, time_limit, data1, data2, data3, data4, data5, data6, data7
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pointTypeId, createdBy, username, timeLimit, ...chunk]
      );
    }

    return new Response(
      JSON.stringify({ message: "데이터 저장 성공 및 포인트 차감 완료" }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("데이터 저장 오류:", error);
    return new Response(JSON.stringify({ error: "데이터 저장 실패" }), {
      status: 500,
    });
  } finally {
    await connection.end();
  }
}
