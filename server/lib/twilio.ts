// Twilio SMS Integration for KingDate phone verification
import twilio from 'twilio';

function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error(
      'Twilio credentials not set. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env file'
    );
  }

  return { accountSid, authToken, phoneNumber };
}

export function getTwilioClient() {
  const { accountSid, authToken } = getTwilioCredentials();
  return twilio(accountSid, authToken);
}

export function getTwilioFromPhoneNumber() {
  const { phoneNumber } = getTwilioCredentials();
  return phoneNumber;
}

export async function sendVerificationSMS(toPhoneNumber: string, code: string): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const fromNumber = getTwilioFromPhoneNumber();

    const formattedPhone = formatKoreanPhoneNumber(toPhoneNumber);

    console.log(`[Twilio] Sending SMS to ${formattedPhone} from ${fromNumber}`);

    await client.messages.create({
      body: `[킹데이트] 인증번호: ${code}\n5분 내로 입력해주세요.`,
      from: fromNumber,
      to: formattedPhone
    });

    console.log('[Twilio] SMS sent successfully');
    return true;
  } catch (error) {
    console.error('[Twilio] SMS send error:', error);
    return false;
  }
}

function formatKoreanPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If starts with Korean mobile prefixes (010, 011, 016, 017, 018, 019)
  if (cleaned.startsWith('010') || cleaned.startsWith('011') ||
      cleaned.startsWith('016') || cleaned.startsWith('017') ||
      cleaned.startsWith('018') || cleaned.startsWith('019')) {
    return '+82' + cleaned.substring(1);
  }

  // If already starts with 82 (country code)
  if (cleaned.startsWith('82')) {
    return '+' + cleaned;
  }

  // Otherwise, assume Korean number without prefix
  return '+82' + cleaned;
}
