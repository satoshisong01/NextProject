import { connectToDatabase } from "../../../../db/db";

export async function DELETE(req, { params }) {
  // params를 비동기로 접근하여 type_id를 가져옵니다.
  const { type_id } = await params;

  try {
    const connection = await connectToDatabase();
    const [result] = await connection.execute(
      "DELETE FROM point_types WHERE type_id = ?",
      [type_id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ error: "포인트 타입을 찾을 수 없습니다." }),
        {
          status: 404,
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "포인트 타입이 삭제되었습니다." }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("포인트 타입 삭제 중 오류 발생:", error);
    return new Response(JSON.stringify({ error: "포인트 타입 삭제 오류" }), {
      status: 500,
    });
  }
}
