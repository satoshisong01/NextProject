import { connectToDatabase } from "../../../db/db";

// GET: points_log 데이터를 가져오는 API
export async function GET(req, res) {
  const connection = await connectToDatabase();

  try {
    const [rows] = await connection.execute(`
      SELECT 
        pl.log_id,
        pl.username,
        pt.type_name,
        pl.action,
        pl.point_score,
        pl.point_total,
        pl.added_by,
        pl.created_at
      FROM 
        points_log pl
      JOIN 
        point_types pt ON pl.point_type_id = pt.type_id;
    `);

    // 가져온 데이터를 클라이언트가 이해할 수 있도록 가공
    const responseData = rows.map((row) => {
      const {
        log_id,
        username,
        type_name,
        action,
        point_score,
        created_at,
        added_by,
      } = row;

      // created_at을 로컬 시간대로 변환
      const localDate = new Date(created_at);
      const formattedDate = localDate
        .toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/. /g, "-")
        .replace(".", "");

      // actionType의 값을 한글로 변환
      let actionType;
      switch (action) {
        case "add":
        case "update":
          actionType = "추가";
          break;
        case "revoke":
          actionType = "회수";
          break;
        case "used":
          actionType = "사용";
          break;
        case "extends":
          actionType = "연장";
          break;
        default:
          actionType = "기타";
      }

      return {
        logId: log_id,
        username,
        pointType: type_name,
        actionType,
        pointScore: point_score,
        date: formattedDate, // 로컬 시간대의 날짜로 반환
        addedBy: added_by,
      };
    });

    // JSON 응답
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("points_log 데이터를 가져오는 중 오류:", error);
    return new Response(
      JSON.stringify({ error: "데이터를 가져오는 중 오류가 발생했습니다." }),
      {
        status: 500,
      }
    );
  } finally {
    await connection.end();
  }
}
