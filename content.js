window.onload = function() {
  chrome.runtime.sendMessage({action: "getRegexList"}, function(response) {
    if (response && response.success && response.regexList) {
      Object.keys(response.regexList).forEach(name => {
        const pattern = new RegExp(response.regexList[name], 'g');
        const matches = document.documentElement.innerHTML.match(pattern);
        if (matches) {
          console.log(`Matches for ${name}:`, matches);
        }
      });
    } else {
      console.error('No response or regexList is undefined.');
    }
  });
};
