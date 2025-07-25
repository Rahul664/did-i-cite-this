// Parse the bib file and return entries via callback
function parseBibFile(bibtexText, callback) {
  if (typeof bibtexParse === "undefined") {
    console.error("bibtexParse library not loaded.");
    alert("BibTeX parser not available.");
    return;
  }

  try {
    const entries = bibtexParse.toJSON(bibtexText);
    if (typeof callback === "function") {
      callback(entries);
    }
  } catch (error) {
    console.error("Error parsing BibTeX:", error);
    alert("There was a problem parsing your .bib file.");
  }
}

function duplicate_finder(entries) {
  const titleMap = {};
  const duplicates = [];

  entries.forEach(entry => {
    const title = entry.entryTags && entry.entryTags.title
      ? entry.entryTags.title.trim().toLowerCase()
      : null;
    if (!title) return;

    if (!titleMap[title]) {
      titleMap[title] = [];
    }
    titleMap[title].push(entry);
  });

  //include lists with more than one entry
  Object.values(titleMap).forEach(list => {
    if (list.length > 1) {
      duplicates.push(list);
    }
  });

  return duplicates;
}

function renderDuplicates(duplicates) {
  const container = document.getElementById('duplicates-list');
  if (!duplicates.length) {
    container.innerHTML = '<p>No duplicate citations found 🎉</p>';
    return;
  }

  let html = '';
  duplicates.forEach((group, idx) => {
    const title = group[0].entryTags.title || '(No Title)';
    html += `<div class="duplicate-group">
      <h3>Title ${idx + 1}: <span class="dup-title">${title}</span></h3>
      <table class="dup-table">
        <thead>
          <tr>
            <th>#</th>
            <th>BibTeX Key</th>
            <th>Author</th>
            <th>Year</th>
            <th>Entry Type</th>
          </tr>
        </thead>
        <tbody>
          ${group.map((entry, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${entry.citationKey || ''}</td>
              <td>${entry.entryTags.author || ''}</td>
              <td>${entry.entryTags.year || ''}</td>
              <td>${entry.entryType || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  });

  container.innerHTML = html;
  document.getElementById('results').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (!file) {
      alert("No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function(e) {
      let content = e.target.result;
      if (!content || typeof content !== "string" || content.trim() === "") {
        alert("The uploaded file is empty or not valid BibTeX.");
        return;
      }

      // remove all @String{...} blocks 
      content = content.replace(/@string\s*{[^{}]*({[^{}]*}[^{}]*)*}/gim, '');

      // remove any stray lines that look like BibTeX string definitions left behind
      content = content.replace(/^\s*{[A-Za-z0-9_]+\s*=\s*".*?"\s*}\s*$/gm, '');

      // remove all lines that start with 
      content = content.replace(/^\s*%.*$/gim, '');

      // remove empty lines left behind
      content = content.replace(/^\s*[\r\n]/gm, '');

      // collect the parsed entries
      parseBibFile(content, function(entries) {
        const duplicates = duplicate_finder(entries);

        const resultsDiv = document.getElementById('results');
        const duplicatesListDiv = document.getElementById('duplicates-list');
        resultsDiv.classList.remove('hidden');

          renderDuplicates(duplicates);
        // }
      });
    };

    reader.onerror = function(e) {
      alert("Error reading file.");
      console.error("File reading error:", e);
    };
  });
});

