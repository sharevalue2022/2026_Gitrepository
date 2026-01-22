// Twilio SMS Integration for KingDate phone verification
import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  const data = await response.json();
  console.log('[Twilio] Connection response:', JSON.stringify(data, null, 2));
  
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings?.account_sid || !connectionSettings.settings?.api_key || !connectionSettings.settings?.api_key_secret)) {
    console.log('[Twilio] Settings found:', connectionSettings?.settings);
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendVerificationSMS(toPhoneNumber: string, code: string): Promise<boolean> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const formattedPhone = formatKoreanPhoneNumber(toPhoneNumber);
    
    await client.messages.create({
      body: `[킹데이트] 인증번호: ${code}\n5분 내로 입력해주세요.`,
      from: fromNumber,
      to: formattedPhone
    });
    
    return true;
  } catch (error) {
    console.error('Twilio SMS send error:', error);
    return false;
  }
}

function formatKoreanPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('010') || cleaned.startsWith('011') || cleaned.startsWith('016') || cleaned.startsWith('017') || cleaned.startsWith('018') || cleaned.startsWith('019')) {
    return '+82' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('82')) {
    return '+' + cleaned;
  }
  
  return '+82' + cleaned;
}
