// 다른 모듈(cloudinary, openai 등)이 import 시점에 환경 변수를 읽으므로
// 반드시 가장 먼저 import 되어야 한다.
import dotenv from "dotenv";

// .env.local이 우선, 없으면 .env (이미 설정된 환경 변수는 덮어쓰지 않음)
dotenv.config({ path: [".env.local", ".env"], quiet: true });
