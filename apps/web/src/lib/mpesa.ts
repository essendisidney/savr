/**
 * Safaricom Daraja B2C + STK — production-shaped, dry-run by default.
 * Set MPESA_DRY_RUN=false and paste sandbox/prod keys to hit Daraja.
 */

export type B2CRequest = {
  amountKes: number;
  phone: string; // 2547...
  occasion: string;
  remarks: string;
  originatorConversationId: string;
};

export type B2CResult = {
  dryRun: boolean;
  conversationId: string;
  originatorConversationId: string;
  responseCode?: string;
  responseDescription?: string;
  raw?: unknown;
};

export type StkPushRequest = {
  amountKes: number;
  phone: string;
  accountReference: string;
  transactionDesc: string;
};

export type StkPushResult = {
  dryRun: boolean;
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode?: string;
  customerMessage?: string;
  raw?: unknown;
};

function isDryRun(): boolean {
  return process.env.MPESA_DRY_RUN !== "false";
}

function baseUrl(): string {
  const env = process.env.MPESA_ENV === "production" ? "production" : "sandbox";
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

function stkTimestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getMpesaAccessToken(): Promise<string> {
  if (isDryRun()) return "dry-run-token";

  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("Missing MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(
    `${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: string };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3599) * 1000,
  };
  return data.access_token;
}

export async function initiateStkPush(req: StkPushRequest): Promise<StkPushResult> {
  const phone = normalizeMsisdn(req.phone);
  const amount = Math.max(1, Math.round(req.amountKes));

  if (isDryRun()) {
    const checkoutRequestId = `DRY-STK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.info("[mpesa:dry-run] STK", {
      amount,
      phone,
      accountReference: req.accountReference,
      checkoutRequestId,
    });
    return {
      dryRun: true,
      checkoutRequestId,
      merchantRequestId: `DRY-MR-${Date.now()}`,
      responseCode: "0",
      customerMessage: "Dry-run STK — no money moved; treated as paid into escrow",
    };
  }

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_STK_CALLBACK_URL;
  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("Missing M-Pesa STK env (MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_STK_CALLBACK_URL)");
  }

  const timestamp = stkTimestamp();
  const token = await getMpesaAccessToken();
  const payload = {
    BusinessShortCode: shortcode,
    Password: stkPassword(shortcode, passkey, timestamp),
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: req.accountReference.slice(0, 12),
    TransactionDesc: req.transactionDesc.slice(0, 13),
  };

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`STK request failed: ${res.status} ${JSON.stringify(raw)}`);
  }

  const data = raw as {
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    ResponseCode?: string;
    CustomerMessage?: string;
  };

  return {
    dryRun: false,
    checkoutRequestId: data.CheckoutRequestID ?? "",
    merchantRequestId: data.MerchantRequestID ?? "",
    responseCode: data.ResponseCode,
    customerMessage: data.CustomerMessage,
    raw,
  };
}

export async function initiateB2C(req: B2CRequest): Promise<B2CResult> {
  const phone = normalizeMsisdn(req.phone);
  const amount = Math.max(1, Math.round(req.amountKes));

  if (isDryRun()) {
    const conversationId = `DRY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.info("[mpesa:dry-run] B2C", {
      amount,
      phone,
      occasion: req.occasion,
      remarks: req.remarks,
      originatorConversationId: req.originatorConversationId,
      conversationId,
    });
    return {
      dryRun: true,
      conversationId,
      originatorConversationId: req.originatorConversationId,
      responseCode: "0",
      responseDescription: "Dry-run accepted — no money moved",
    };
  }

  const shortcode = process.env.MPESA_SHORTCODE;
  const initiator = process.env.MPESA_INITIATOR_NAME;
  const security = process.env.MPESA_SECURITY_CREDENTIAL;
  const resultUrl = process.env.MPESA_B2C_RESULT_URL;
  const timeoutUrl = process.env.MPESA_B2C_TIMEOUT_URL;
  if (!shortcode || !initiator || !security || !resultUrl || !timeoutUrl) {
    throw new Error("Missing M-Pesa B2C env (shortcode, initiator, security, result/timeout URLs)");
  }

  const token = await getMpesaAccessToken();
  const payload = {
    InitiatorName: initiator,
    SecurityCredential: security,
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: shortcode,
    PartyB: phone,
    Remarks: req.remarks.slice(0, 100),
    QueueTimeOutURL: timeoutUrl,
    ResultURL: resultUrl,
    Occasion: req.occasion.slice(0, 100),
    OriginatorConversationID: req.originatorConversationId,
  };

  const res = await fetch(`${baseUrl()}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`B2C request failed: ${res.status} ${JSON.stringify(raw)}`);
  }

  const data = raw as {
    ConversationID?: string;
    OriginatorConversationID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
  };

  return {
    dryRun: false,
    conversationId: data.ConversationID ?? "",
    originatorConversationId: data.OriginatorConversationID ?? req.originatorConversationId,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    raw,
  };
}

export function mpesaIsDryRun(): boolean {
  return isDryRun();
}
