import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

// GET: 기존 시간 가져오기
export async function GET() {
  const connection = await connectToDatabase();

  try {
    // 기존에 저장된 시간을 가져옴
    const [rows] = await connection.execute(
      `SELECT scheduled_time FROM scheduled_times LIMIT 1`
    );

    await connection.end();

    if (rows.length > 0) {
      // 기존 시간 반환
      return new Response(
        JSON.stringify({ scheduled_time: rows[0].scheduled_time }),
        {
          status: 200,
        }
      );
    } else {
      // 기존 시간이 없으면 기본값 반환
      return new Response(JSON.stringify({ scheduled_time: "09:00:00" }), {
        status: 200,
      });
    }
  } catch (error) {
    console.error("시간 가져오기 중 오류 발생:", error);
    return new Response(
      JSON.stringify({ error: "시간을 가져오는 데 실패했습니다." }),
      { status: 500 }
    );
  }
}

// POST: 새로운 시간 저장
export async function POST(req) {
  const { period, hour, minute } = await req.json();

  const authError = authenticate(req, ["admin"]);
  if (authError) return authError; // admin이 아닌 경우 접근을 막음

  // 오전/오후를 24시간 형식으로 변환
  let hourIn24Format = parseInt(hour, 10);
  if (period === "오후" && hourIn24Format !== 12) {
    hourIn24Format += 12;
  } else if (period === "오전" && hourIn24Format === 12) {
    hourIn24Format = 0;
  }

  const selectedTime = `${String(hourIn24Format).padStart(
    2,
    "0"
  )}:${minute}:00`; // HH:MM:SS 형식

  const connection = await connectToDatabase();

  try {
    // 기존 시간이 있는지 확인
    const [rows] = await connection.execute(
      `SELECT id FROM scheduled_times LIMIT 1`
    );

    if (rows.length > 0) {
      // 기존 시간이 있으면 업데이트
      await connection.execute(
        `UPDATE scheduled_times SET scheduled_time = ? WHERE id = ?`,
        [selectedTime, rows[0].id]
      );
    } else {
      // 기존 시간이 없으면 새로 삽입
      await connection.execute(
        `INSERT INTO scheduled_times (scheduled_time) VALUES (?)`,
        [selectedTime]
      );
    }

    await connection.end();
    return new Response(
      JSON.stringify({ message: "시간이 성공적으로 저장되었습니다." }),
      { status: 201 }
    );
  } catch (error) {
    console.error("시간 저장 중 오류 발생:", error);
    return new Response(
      JSON.stringify({ error: "시간 저장에 실패했습니다." }),
      { status: 500 }
    );
  }
}
