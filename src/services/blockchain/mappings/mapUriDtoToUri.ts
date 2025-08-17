import type { Uri } from "../../../modals/uri.model";

const DEFAULT_IPFS_GATEWAY = "https://ipfs.io"; // cámbialo si prefieres: p.ej. "https://cloudflare-ipfs.com"

/** Convierte ipfs://... o ipns://... a URL HTTP amigable para <img> */
function normalizeImageForBrowser(
  image: string,
  gw = DEFAULT_IPFS_GATEWAY
): string {
  if (!image) return image;

  // data URLs y http(s) ya sirven tal cual
  if (
    image.startsWith("data:") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  // ipfs://<cid>[/path]
  if (image.startsWith("ipfs://")) {
    let path = image.slice("ipfs://".length);
    if (path.startsWith("ipfs/")) path = path.slice(5); // normaliza ipfs://ipfs/<cid>
    return `${gw.replace(/\/$/, "")}/ipfs/${path}`;
  }

  // ipns://<name>[/path]
  if (image.startsWith("ipns://")) {
    const path = image.slice("ipns://".length);
    return `${gw.replace(/\/$/, "")}/ipns/${path}`;
  }

  // CID “pelado” (v0: Qm..., v1: bafy...) con o sin path
  const isCidWithOptionalPath =
    /^(Qm[1-9A-Za-z]{44}|bafy[1-9A-Za-z]{40,})(?:\/.*)?$/.test(image);
  if (isCidWithOptionalPath) {
    return `${gw.replace(/\/$/, "")}/ipfs/${image}`;
  }

  // fallback: devolver tal cual
  return image;
}

function decodeBase64DataUrl(input: string): string {
  // quita encabezado data:* si existe
  let b64 = input.replace(/^[^,]*,/, "");
  // normaliza base64 url-safe
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  // padding
  if (b64.length % 4 !== 0) b64 += "=".repeat(4 - (b64.length % 4));
  // decode
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function mapUriDtoToUri(uri: string): Uri {
  // Soporta:
  // - data:application/json;base64,<...>
  // - base64 crudo
  // - JSON plano
  let jsonString: string;

  console.log("Mapping URI DTO to URI:", uri);

  const looksLikeDataUrl = uri.startsWith("data:");
  const looksLikeBase64 = /^[A-Za-z0-9+/_-]+={0,2}$/.test(uri);

  if (looksLikeDataUrl || looksLikeBase64) {
    jsonString = decodeBase64DataUrl(uri);
  } else {
    jsonString = uri; // ya es JSON plano
  }

  const parsed = JSON.parse(jsonString) as Partial<Uri> & { image?: string };

  if (!parsed?.name || !parsed?.description || !parsed?.image) {
    throw new Error("Invalid URI structure: missing required properties");
  }

  return {
    name: parsed.name,
    description: parsed.description,
    // 👇 aquí convertimos ipfs:// o CID a una URL HTTP válida para <img src="...">
    image: normalizeImageForBrowser(parsed.image),
  };
}
