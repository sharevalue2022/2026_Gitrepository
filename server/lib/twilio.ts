// Solapi SMS Integration for KingDate phone verification
import { SolapiMessageService } from "solapi";

function getSolapiCredentials() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const fromNumber = process.env.SOLAPI_FROM_NUMBER;

  if (!apiKey || !apiSecret || !fromNumber) {
    throw new Error(
      "Solapi credentials not set. Please set SOLAPI_API_KEY, SOLAPI_API_SECRET, and SOLAPI_FROM_NUMBER in .env file",
    );
  }

  return { apiKey, apiSecret, fromNumber };
}

export function getSolapiClient() {
  const { apiKey, apiSecret } = getSolapiCredentials();
  return new SolapiMessageService(apiKey, apiSecret);
}

export function getSolapiFromPhoneNumber() {
  const { fromNumber } = getSolapiCredentials();
  return fromNumber;
}

export async function sendVerificationSMS(
  toPhoneNumber: string,
  code: string,
): Promise<boolean> {
  try {
    const client = getSolapiClient();
    const fromNumber = getSolapiFromPhoneNumber();

    const formattedPhone = formatKoreanPhoneNumber(toPhoneNumber);

    console.log(`[Solapi] Sending SMS to ${formattedPhone} from ${fromNumber}`);

    await client.sendOne({
      to: formattedPhone,
      from: fromNumber,
      text: `[킹데이트] 인증번호: ${code}\n5분 내로 입력해주세요.`,
    });

    console.log("[Solapi] SMS sent successfully");
    return true;
  } catch (error) {
    console.error("[Solapi] SMS send error:", error);
    return false;
  }
}

export async function sendSMS(
  toPhoneNumber: string,
  message: string,
): Promise<boolean> {
  try {
    const client = getSolapiClient();
    const fromNumber = getSolapiFromPhoneNumber();

    const formattedPhone = formatKoreanPhoneNumber(toPhoneNumber);

    console.log(`[Solapi] Sending SMS to ${formattedPhone} from ${fromNumber}`);

    await client.sendOne({
      to: formattedPhone,
      from: fromNumber,
      text: message,
    });

    console.log("[Solapi] SMS sent successfully");
    return true;
  } catch (error) {
    console.error("[Solapi] SMS send error:", error);
    return false;
  }
}

function formatKoreanPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // If starts with Korean mobile prefixes (010, 011, 016, 017, 018, 019)
  if (
    cleaned.startsWith("010") ||
    cleaned.startsWith("011") ||
    cleaned.startsWith("016") ||
    cleaned.startsWith("017") ||
    cleaned.startsWith("018") ||
    cleaned.startsWith("019")
  ) {
    // Solapi expects Korean numbers in 01XXXXXXXXX format (without +82)
    return cleaned;
  }

  // If starts with 82 (country code), remove it
  if (cleaned.startsWith("82")) {
    return "0" + cleaned.substring(2);
  }

  // If starts with +82, remove it
  if (phone.startsWith("+82")) {
    return "0" + cleaned.substring(2);
  }

  // Otherwise, return as-is
  return cleaned;
}
