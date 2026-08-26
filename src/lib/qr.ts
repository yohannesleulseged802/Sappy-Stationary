import QRCode from "qrcode";

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 512,
    errorCorrectionLevel: "H", // 30% recovery → safe to embed a center logo
    color: { dark: "#065F46", light: "#FFFFFF" },
  });
}