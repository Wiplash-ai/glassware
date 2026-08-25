const CAPTURE_KEY = "glassware.pendingCapture.v1";
const EDITOR_TAB_KEY = "glassware.editorTab.v1";
const BILLING_HOSTS = {
  checkout: "checkout.stripe.com",
  portal: "billing.stripe.com",
};

chrome.runtime.onInstalled.addListener(() => {
  void chrome.contextMenus.removeAll().then(() => {
    chrome.contextMenus.create({
      id: "glassware-capture-page",
      title: "Capture page with GlassWare",
      contexts: ["page"],
    });
  });
});

async function openEditor() {
  const editorUrl = chrome.runtime.getURL("app/app.html");
  const stored = await chrome.storage.session.get(EDITOR_TAB_KEY);
  const tabId = stored[EDITOR_TAB_KEY];
  if (Number.isInteger(tabId)) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url?.startsWith(editorUrl)) {
        await chrome.tabs.update(tabId, { active: true });
        if (Number.isInteger(tab.windowId)) await chrome.windows.update(tab.windowId, { focused: true });
        return tab;
      }
    } catch {
      // The previous editor tab was closed.
    }
  }
  const tab = await chrome.tabs.create({ url: editorUrl });
  if (Number.isInteger(tab.id)) await chrome.storage.session.set({ [EDITOR_TAB_KEY]: tab.id });
  return tab;
}

chrome.action.onClicked.addListener(() => {
  void openEditor();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "glassware.open-billing-page") return false;
  void (async () => {
    try {
      const expectedHost = BILLING_HOSTS[message.purpose];
      const url = new URL(message.url);
      if (!expectedHost || url.protocol !== "https:" || url.hostname !== expectedHost || url.username || url.password) {
        throw new Error("Glassware rejected an unsafe billing URL.");
      }
      const tab = await chrome.tabs.create({ url: url.toString(), active: true });
      sendResponse({ ok: true, tabId: tab.id });
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Billing page failed to open." });
    }
  })();
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.storage.session.get(EDITOR_TAB_KEY).then((stored) => {
    if (stored[EDITOR_TAB_KEY] === tabId) return chrome.storage.session.remove(EDITOR_TAB_KEY);
    return undefined;
  });
});

async function captureAndOpen(tab) {
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  await chrome.storage.local.set({
    [CAPTURE_KEY]: { dataUrl, sourceUrl: tab.url, capturedAt: new Date().toISOString() },
  });
  await openEditor();
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "glassware-capture-page") return;
  if (!tab?.id) return;
  void captureAndOpen(tab);
});
