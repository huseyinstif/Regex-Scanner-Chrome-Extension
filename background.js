chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message:", request);

    if (request.action === 'executeScript' && request.tabId) {
        console.log("Preparing to execute script on tab:", request.tabId);

        const scriptFunction = (pattern) => {
            console.log("Executing script with pattern:", pattern);
            const regex = new RegExp(pattern, 'g');
            const matches = [...document.body.innerText.matchAll(regex)].map(m => m[0]);
            return matches;
        };

        chrome.scripting.executeScript({
            target: { tabId: request.tabId },
            function: scriptFunction,
            args: [request.pattern]
        }).then((results) => {
            console.log("Script executed. Results:", results);
            if (results && results[0] && results[0].result.length > 0) {
                sendResponse({ success: true, results: results[0].result });
            } else {
                sendResponse({ success: false, error: "No results found." });
            }
        }).catch((error) => {
            console.error("Error executing script:", error);
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
});
