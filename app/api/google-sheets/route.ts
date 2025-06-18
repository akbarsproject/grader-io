import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { values } = body;

    if (!values || !Array.isArray(values)) {
      return NextResponse.json({ message: "Invalid request body. 'values' array is required." }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_SHEETS_TYPE,
        project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
        private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = process.env.GOOGLE_SHEETS_SHEET_NAME || "Sheet1!A:Z"; // Default to Sheet1!A:Z if not specified

    if (!spreadsheetId) {
      return NextResponse.json({ message: "GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set." }, { status: 500 });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    return NextResponse.json({ message: "Data successfully written to Google Sheet." }, { status: 200 });
  } catch (error) {
    console.error("Error writing to Google Sheet:", error);
    return NextResponse.json({ message: "Failed to write data to Google Sheet.", error: (error as Error).message }, { status: 500 });
  }
} 