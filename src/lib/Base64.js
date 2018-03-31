export const Base64 = {
  encode(string) {
    return window.btoa(window.unescape(window.encodeURIComponent(string)));
  },
  decode(base64) {
    return window.decodeURIComponent(window.escape(window.atob(base64)));
  },
};

export const URLSafeBase64 = {
  encode(string) {
    return Base64.encode(string)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/[=]/g, "");
  },
  decode(string) {
    const pad = "=".repeat(Math.ceil(string.length / 4) * 4 - string.length);

    return Base64.decode((string + pad).replace(/-/g, "+").replace(/_/g, "/"));
  },
};
