import { DEFAULT_MAPPING_URL } from "./shared/sources";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "fetchDefaultMapping") return;

  fetch(DEFAULT_MAPPING_URL, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        sendResponse(null);
        return;
      }
      sendResponse(await response.json());
    })
    .catch(() => sendResponse(null));

  return true;
});
