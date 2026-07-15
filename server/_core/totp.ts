import crypto from "node:crypto";

// RFC 6238 TOTP 구현 (외부 의존성 없이 node:crypto만 사용).
// 데모용이지만 표준 알고리즘(HMAC-SHA1, 30초 스텝, 6자리)을 그대로 따르므로
// Google Authenticator / Authy 등 일반 앱과 호환된다.

const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** 임의의 base32 시크릿 생성 (기본 20바이트 → 160비트). */
export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

/** 인증 앱 등록용 otpauth:// URI. */
export function otpauthUri(
  secret: string,
  account: string,
  issuer = "EduTech",
): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** 주어진 시각(ms)에 해당하는 TOTP 코드를 계산한다. */
function generateCode(secret: string, forTime: number): string {
  const counter = Math.floor(forTime / 1000 / STEP_SECONDS);
  const key = base32Decode(secret);

  const counterBuf = Buffer.alloc(8);
  // 64비트 카운터를 빅엔디언으로. (2^53 이내이므로 상위 워드는 사실상 0)
  counterBuf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/**
 * 사용자가 입력한 토큰을 검증한다. 시계 오차를 감안해 ±1 스텝(±30초)까지 허용.
 */
export function verifyTotp(
  secret: string,
  token: string,
  now = Date.now(),
): boolean {
  const normalized = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  for (let window = -1; window <= 1; window++) {
    const candidate = generateCode(secret, now + window * STEP_SECONDS * 1000);
    // 타이밍 안전 비교
    if (
      candidate.length === normalized.length &&
      crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(normalized))
    ) {
      return true;
    }
  }
  return false;
}

// ==================== base32 (RFC 4648) ====================
function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
