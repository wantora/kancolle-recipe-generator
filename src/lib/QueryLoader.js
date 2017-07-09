import {URLSafeBase64} from "./Base64";

const urlElement = document.createElement("a");
const QUERY_VERSION = "1";

export function generateURL(baseURL, selectedItems, panelKey) {
  urlElement.href = baseURL;
  
  if (selectedItems.length === 0) {
    urlElement.search = "";
  } else {
    const str = selectedItems.join("<>");
    urlElement.search = `?q=${encodeURIComponent(QUERY_VERSION + URLSafeBase64.encode(str))}`;
    urlElement.hash = `#${panelKey}`;
  }
  
  return urlElement.href;
}

export function loadURLQuery(url) {
  urlElement.href = url;
  
  const params = {};
  urlElement.search.replace(/^\?/, "").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    params[key] = decodeURIComponent(value);
  });
  
  if (params["q"]) {
    // Remove version
    const str = params["q"].replace(/^./, "");
    const selectedItems = URLSafeBase64.decode(str).split("<>");
    
    let panelKey = null;
    if (urlElement.hash.startsWith("#")) {
      panelKey = urlElement.hash.replace(/^#/, "");
    }
    
    return {
      selectedItems,
      panelKey,
    };
  }
  return null;
}
