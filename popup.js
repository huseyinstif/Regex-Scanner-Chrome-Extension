function changeTab(tabName) {
  console.log("Changing tab to:", tabName);
  let tabcontents = document.getElementsByClassName("tab-pane");
  for (let tabcontent of tabcontents) {
    tabcontent.classList.remove("active");
  }
  let tablinks = document.getElementsByClassName("nav-link");
  for (let tablink of tablinks) {
    tablink.classList.remove("active");
    if(tablink.getAttribute("data-target") === `#${tabName}`) {
      tablink.classList.add("active");
    }
  }
  let tab = document.getElementById(tabName);
  if (tab) {
    tab.classList.add("active");
  } else {
    console.error("Tab with ID", tabName, "not found.");
  }
}




document.addEventListener('DOMContentLoaded', function() {
  loadSavedRegexes();
  findMatches();
  document.getElementById('saveButton').addEventListener('click', saveRegex);
  document.getElementById('manageTab').addEventListener('click', () => changeTab('manage'));
});

function saveRegex() {
  const name = document.getElementById('regexName').value.trim();
  const pattern = document.getElementById('regexPattern').value.trim();
  console.log("Attempting to save regex:", name, pattern);

  if (name && pattern) {
      chrome.storage.sync.get({regexList: {}}, function(data) {
          data.regexList[name] = pattern;
          chrome.storage.sync.set({regexList: data.regexList}, function() {
              console.log("Regex saved successfully:", name);
              alert('Regex saved successfully!');
              loadSavedRegexes();
          });
      });
  } else {
      console.log("Name and pattern are required for saving regex.");
      alert('Name and pattern are required!');
  }
}

function loadSavedRegexes() {
  console.log("Loading saved regexes...");
  chrome.storage.sync.get({regexList: {}}, function(data) {
    console.log("Retrieved regex list:", data.regexList);
    if (Object.keys(data.regexList).length === 0) {
        console.log("No regex patterns found in storage.");
    }
      const savedRegexesDiv = document.getElementById('savedRegexes');
      savedRegexesDiv.innerHTML = '';
      Object.entries(data.regexList).forEach(([name, pattern]) => {
          const div = document.createElement('div');
          div.className = 'alert alert-secondary';
          div.textContent = `${name}: ${pattern}`;
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.onclick = function() { deleteRegex(name); };
          div.appendChild(deleteButton);
          savedRegexesDiv.appendChild(div);
      });
  });
}

function deleteRegex(name) {
  console.log("Deleting regex:", name);
  chrome.storage.sync.get({regexList: {}}, function(data) {
      delete data.regexList[name];
      chrome.storage.sync.set({regexList: data.regexList}, function() {
          console.log("Regex deleted:", name);
          loadSavedRegexes();
      });
  });
}


function findMatches() {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (!tabs.length || !tabs[0].id) {
          console.error("No active tab found.");
          return;
      }
      const currentTabId = tabs[0].id;
      chrome.storage.sync.get({regexList: {}}, data => {
          const resultsContainer = document.getElementById('find-results');
          resultsContainer.innerHTML = '';

          if (Object.entries(data.regexList).length === 0) {
              resultsContainer.textContent = 'No regex patterns to search.';
              return;
          }

          let patternsProcessed = 0;
          const totalPatterns = Object.entries(data.regexList).length;

          Object.entries(data.regexList).forEach(([name, pattern]) => {
              chrome.runtime.sendMessage({
                  action: 'executeScript',
                  tabId: currentTabId,
                  pattern: pattern
              }, response => {
                  if (chrome.runtime.lastError) {
                      console.error(chrome.runtime.lastError.message);
                      patternsProcessed++;
                      if (patternsProcessed === totalPatterns) {
                          updateUIAfterAllPatternsProcessed();
                      }
                      return; 
                  }

                  if (response && response.success && response.results.length > 0) {
                      const matchesFoundElement = document.createElement('div');
                      matchesFoundElement.textContent = `Matches for "${name}": [${response.results.join(", ")}]`;
                      resultsContainer.appendChild(matchesFoundElement);
                  } else {
                      const noMatchElement = document.createElement('div');
                      noMatchElement.textContent = `No matches found for "${name}".`;
                      resultsContainer.appendChild(noMatchElement);
                  }
                  patternsProcessed++;
                  if (patternsProcessed === totalPatterns) {
                      updateUIAfterAllPatternsProcessed();
                  }
              });
          });
      });
  });
}

function updateUIAfterAllPatternsProcessed() {
  console.log("All patterns processed.");
}


document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(navLink => navLink.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(tabPane => tabPane.classList.remove('active'));
    const targetId = this.getAttribute('data-target');
    document.querySelector(targetId).classList.add('active');
    this.classList.add('active');
  });
});