// src/app/api/user-data-submit/route.js
import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function POST(request) {
  const authError = authenticate(request, ["user", "admin", "subadmin"]);
  if (authError) return authError;

  const { pointTypeId, inputs } = await request.json();
  const { username } = request.user; // 인증된 사용자 이름

  const connection = await connectToDatabase();

  try {
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

    // 포인트 사용 로그 기록
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    await connection.execute(
      `INSERT INTO points_log (username, point_type_id, action, point_score, added_by, created_at)
       VALUES (?, ?, 'used', ?, ?, ?)`,
      [username, pointTypeId, totalDeduction, createdBy, currentDate]
    );

    // 데이터 추가 (차감 성공 시)
    const currentDateForTimeLimit = new Date();
    currentDateForTimeLimit.setDate(currentDateForTimeLimit.getDate() + 11); // 10일 후로 설정
    currentDateForTimeLimit.setHours(0, 0, 0, 0); // 시간을 자정(00:00:00)으로 설정하여 다음날로 저장
    const timeLimit = `${currentDateForTimeLimit
      .toISOString()
      .slice(0, 10)} 00:00:00`;

    const chunks = [];
    const inputKeys = Object.keys(inputs).map((key) =>
      parseInt(key.replace("text", ""))
    );

    for (let i = 0; i < Math.max(...inputKeys); i += 7) {
      const chunk = [
        inputs[`text${i + 1}`] || null,
        inputs[`text${i + 2}`] || null,
        inputs[`text${i + 3}`] || null,
        inputs[`text${i + 4}`] || null,
        inputs[`text${i + 5}`] || null,
        inputs[`text${i + 6}`] || null,
        inputs[`text${i + 7}`] || null,
      ];
      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      await connection.execute(
        `INSERT INTO user_data_entries (
      type_id, created_by, maker, time_limit, data1, data2, data3, data4, data5, data6, data7
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pointTypeId, createdBy, username, timeLimit, ...chunk]
      );
    }

    return new Response(
      JSON.stringify({
        message: "데이터 저장 성공 및 포인트 차감 및 로그 기록 완료",
      }),
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
