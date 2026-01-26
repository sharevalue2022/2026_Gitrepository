import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";
import * as FileSystem from "expo-file-system";

/**
 * Converts a blob URL to base64 (for web platform)
 */
async function blobToBase64(blobUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // dataUrl format: "data:image/jpeg;base64,/9j/4AAQ..."
      const [header, base64Data] = dataUrl.split(",");
      const mimeType = header.match(/data:(.*);base64/)?.[1] || "image/jpeg";
      resolve({ base64: base64Data, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads a local photo to the server and returns the HTTP URL.
 * Uses base64 encoding for reliable React Native uploads.
 * @param localUri - The local file URI (e.g., from ImagePicker)
 * @returns The HTTP URL of the uploaded photo
 */
export async function uploadPhoto(localUri: string): Promise<string> {
  console.log("[uploadPhoto] Starting upload for:", localUri);
  console.log("[uploadPhoto] Platform:", Platform.OS);

  // Extract filename from URI
  const uriParts = localUri.split("/");
  const fileName = uriParts[uriParts.length - 1] || "photo.jpg";

  let base64: string;
  let mimeType: string;

  console.log("[uploadPhoto] Reading file as base64...");

  // Handle web (blob URLs) vs native (file:// URIs)
  if (Platform.OS === "web") {
    console.log("[uploadPhoto] Using web blob conversion...");
    const result = await blobToBase64(localUri);
    base64 = result.base64;
    mimeType = result.mimeType;
  } else {
    // Native: use expo-file-system
    console.log("[uploadPhoto] Using native FileSystem...");

    // Determine MIME type from extension
    const extension = fileName.split(".").pop()?.toLowerCase();
    mimeType = "image/jpeg";
    if (extension === "png") mimeType = "image/png";
    else if (extension === "gif") mimeType = "image/gif";
    else if (extension === "webp") mimeType = "image/webp";

    base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  console.log("[uploadPhoto] Base64 length:", base64.length);
  console.log("[uploadPhoto] MIME type:", mimeType);

  const baseUrl = getApiUrl();
  const uploadUrl = `${baseUrl}api/upload/photo-base64`;

  console.log("[uploadPhoto] Upload URL:", uploadUrl);
  console.log("[uploadPhoto] Sending request...");

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64,
      mimeType,
      fileName,
    }),
  });

  console.log("[uploadPhoto] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[uploadPhoto] Upload failed:", errorText);
    throw new Error(`Photo upload failed: ${errorText}`);
  }

  const data = await response.json();
  console.log("[uploadPhoto] Response data:", data);

  if (!data.success || !data.url) {
    throw new Error(data.message || "Photo upload failed");
  }

  console.log("[uploadPhoto] Success! URL:", data.url);
  return data.url;
}
