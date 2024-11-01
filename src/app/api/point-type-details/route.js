import { connectToDatabase } from "../../../db/db";
import { authenticate } from "../../../middleware/authenticate";

export async function POST(req) {
  const { type_id, textFields } = await req.json();

  // 미들웨어를 사용하여 인증 및 권한 검사를 수행합니다.
  const authError = authenticate(req, ["admin"]);
  if (authError) return authError; // admin이 아닌 경우 접근을 막음

  if (!type_id || !textFields) {
    return new Response(
      JSON.stringify({ error: "type_id와 textFields 값이 필요합니다." }),
      { status: 400 }
    );
  }

  const connection = await connectToDatabase();

  try {
    // 먼저 해당 point_type_id가 이미 존재하는지 확인
    const [existing] = await connection.execute(
      "SELECT * FROM point_type_details WHERE point_type_id = ?",
      [type_id]
    );

    if (existing.length > 0) {
      // 데이터가 이미 존재하면 업데이트
      await connection.execute(
        `
        UPDATE point_type_details 
        SET text1 = ?, text2 = ?, text3 = ?, text4 = ?, text5 = ?, text6 = ?, text7 = ? 
        WHERE point_type_id = ?
      `,
        [
          textFields.text1,
          textFields.text2,
          textFields.text3,
          textFields.text4,
          textFields.text5,
          textFields.text6,
          textFields.text7,
          type_id,
        ]
      );
    } else {
      // 데이터가 없으면 새로 추가
      await connection.execute(
        `
        INSERT INTO point_type_details (point_type_id, text1, text2, text3, text4, text5, text6, text7)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          type_id,
          textFields.text1,
          textFields.text2,
          textFields.text3,
          textFields.text4,
          textFields.text5,
          textFields.text6,
          textFields.text7,
        ]
      );
    }

    await connection.end();
    return new Response(
      JSON.stringify({
        message: "포인트 타입 데이터가 추가/업데이트되었습니다.",
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("포인트 타입 데이터 추가/업데이트 중 오류 발생:", error);
    return new Response(
      JSON.stringify({
        error: "포인트 타입 데이터 추가/업데이트 중 오류 발생",
      }),
      {
        status: 500,
      }
    );
  }
}
