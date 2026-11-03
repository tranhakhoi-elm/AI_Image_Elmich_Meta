// Module dùng chung cho mọi route backend cần truy cập Google Cloud
// (Firestore + Cloud Storage) bằng cùng 1 Service Account đang được dùng
// cho tích hợp Google Sheets. Cả server.ts (Express) và api/*.ts (Vercel)
// đều import từ đây để tránh lặp lại logic parse credentials.
import { Firestore } from "@google-cloud/firestore";
import { Storage, Bucket } from "@google-cloud/storage";

interface ServiceAccountCredentials {
  project_id?: string;
  client_email: string;
  private_key: string;
}

let cachedCredentials: ServiceAccountCredentials | null | undefined;

export function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  if (cachedCredentials !== undefined) return cachedCredentials;

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      cachedCredentials = JSON.parse(serviceAccountJson);
    } catch (err: any) {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON không phải JSON hợp lệ:", err.message);
      cachedCredentials = null;
    }
    return cachedCredentials;
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  if (clientEmail && privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.replace(/^"|"$/g, "");
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
    cachedCredentials = {
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      client_email: clientEmail,
      private_key: privateKey,
    };
    return cachedCredentials;
  }

  cachedCredentials = null;
  return null;
}

let firestoreClient: Firestore | null = null;

/** Trả về client Firestore, hoặc null nếu chưa cấu hình đủ credentials. */
export function getFirestore(): Firestore | null {
  const credentials = getServiceAccountCredentials();
  if (!credentials) return null;

  if (!firestoreClient) {
    firestoreClient = new Firestore({
      projectId: credentials.project_id || process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }
  return firestoreClient;
}

let storageClient: Storage | null = null;

/** Trả về Bucket đã cấu hình, hoặc null nếu thiếu credentials hoặc GCS_BUCKET_NAME. */
export function getBucket(): Bucket | null {
  const credentials = getServiceAccountCredentials();
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!credentials || !bucketName) return null;

  if (!storageClient) {
    storageClient = new Storage({
      projectId: credentials.project_id || process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }
  return storageClient.bucket(bucketName);
}
