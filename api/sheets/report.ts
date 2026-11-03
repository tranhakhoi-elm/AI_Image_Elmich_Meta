import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { values } = req.body;
  
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return res.status(200).json({ success: false, error: "GOOGLE_SHEET_ID is missing in environment variables." });
  }

  let auth: any;
  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountJson) {
      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (parseError: any) {
        return res.status(200).json({
          success: false,
          error: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Vercel sometimes breaks formatting. Try removing newlines before pasting, or check for missing quotes. Detail: " + parseError.message
        });
      }
      
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
      
      if (!clientEmail || !privateKey) {
         return res.status(200).json({
            success: false,
            error: "Google Sheets credentials (GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY) are missing."
          });
      }

      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.replace(/^"|"$/g, '');
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    
    let targetRange = 'Sheet1!A:A';
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      if (meta.data.sheets && meta.data.sheets.length > 0) {
        const sheetTitle = meta.data.sheets[0].properties?.title || 'Sheet1';
        targetRange = `${sheetTitle}!A:A`;
      }
    } catch (metaError: any) {
      console.warn("Could not fetch spreadsheet metadata. Using default 'Sheet1'.", metaError.message);
    }
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    console.error("Error reporting to Google Sheets:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
