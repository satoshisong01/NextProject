// src/app/api/users/[userId]/route.js
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../../../db/db";

// DELETE: 특정 사용자 삭제
export async function DELETE(request, context) {
  const { userId } = await context.params;
  const connection = await connectToDatabase();

  try {
    const [result] = await connection.execute(
      "DELETE FROM users WHERE user_id = ?",
      [userId]
    );
    await connection.end();

    if (result.affectedRows > 0) {
      return new Response(
        JSON.stringify({ message: "User deleted successfully" }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }
  } catch (error) {
    console.error("사용자 삭제 중 오류 발생:", error);
    return new Response(JSON.stringify({ message: "Error deleting user" }), {
      status: 500,
    });
  }
}

// PUT: 특정 사용자 비밀번호 업데이트
export async function PUT(request, context) {
  const { userId } = await context.params;
  const { password } = await request.json();

  if (!password) {
    return new Response(JSON.stringify({ error: "Password is required" }), {
      status: 400,
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await connectToDatabase();

    const [result] = await connection.execute(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );
    await connection.end();

    if (result.affectedRows > 0) {
      return new Response(
        JSON.stringify({ message: "Password updated successfully" }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }
  } catch (error) {
    console.error("비밀번호 업데이트 중 오류 발생:", error);
    return new Response(
      JSON.stringify({ message: "Error updating password" }),
      { status: 500 }
    );
  }
}
