import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export function authenticate(req, allowedRoles = []) {
  // 쿠키에서 토큰 가져오기
  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.log("토큰이 없습니다.");
    return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("디코딩된 토큰 정보:", decoded); // 디버그 로그 추가
    req.user = decoded;

    // 권한 검사: allowedRoles가 비어 있지 않고 사용자의 역할이 포함되지 않으면 접근 거부
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      console.log("권한 부족:", decoded.role);
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    return null; // 인증 성공
  } catch (error) {
    console.error("토큰 검증 오류:", error);
    return NextResponse.json(
      { error: "유효하지 않은 토큰입니다." },
      { status: 401 }
    );
  }
}
