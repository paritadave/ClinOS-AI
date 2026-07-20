import { getAccessToken } from "./googleAuth";

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
}

/**
 * Sends an email using the Gmail REST API (users.messages.send)
 * Requires standard base64url encoding of an RFC 2822 formatted message.
 */
export async function sendGmailEmail({ to, subject, bodyHtml }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: "No active Google OAuth access token found. Please sign in with Google first." };
  }

  try {
    // Construct the RFC 2822 message
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      bodyHtml
    ];

    const emailContent = emailLines.join("\r\n");

    // base64url-encode the message safely
    const utf8Bytes = new TextEncoder().encode(emailContent);
    let binary = "";
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64 = btoa(binary);
    const base64url = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64url
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Ignored
      }
      const errMsg = errorJson?.error?.message || errorText || "Unknown API response error";
      return { success: false, error: `Gmail API Error: ${errMsg}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error("Failed to send Gmail message:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
