import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../db/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  const { username, password } = await request.json();

  try {
    const db = await connectToDatabase();
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    const user = rows[0];

    if (!user) {
      console.error("사용자가 존재하지 않습니다.");
      return NextResponse.json(
        { error: "존재하지 않는 사용자입니다." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("비밀번호가 일치하지 않습니다.");
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("생성된 토큰:", token); // 추가된 로그

    const response = NextResponse.json({ role: user.role });
    response.cookies.set("token", token, {
      httpOnly: false, // 클라이언트 자바스크립트로 접근 가능
      secure: process.env.NODE_ENV === "production", // HTTPS 전용
      sameSite: "lax", // CSRF 방지용 설정
      path: "/", // 전체 사이트에서 유효
    });

    return response;
  } catch (error) {
    console.error("서버 오류 발생:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
