let presets = {};

Prism.hooks.add('before-sanity-check', function (env) {
    env.code = env.element.innerText;
});

function renderMarkup(text) {
    const stack = [];
    let currentText = '';
    let html = '';
    let globalStyles = '';

    // Function to escape HTML special characters
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\[/g, '&#091;')
            .replace(/\]/g, '&#093;')
            .replace(/{/g, '&#123;')
            .replace(/}/g, '&#125;');
    }

    // tag with params regex
    const tagWithParamsRegex = /\[(\w+):([^\]]+)\]/gs;

    function transformTagsWithParams(text) {
        return text.replace(tagWithParamsRegex, (match, tag, params, offset, string) => {
            // Extract the text following the tag up to the closing tag
            const closingTag = `[/]`;
            const closingTagIndex = string.indexOf(closingTag, offset);
            if (closingTagIndex === -1) {
                return match; // No closing tag found, return the original match
            }
    
            const linkText = string.slice(offset + match.length, closingTagIndex);

    
            // Check if the tag is a link
            if (tag === 'link') {
                const [url] = params.split(',');
                if (linkText) {
                return `<a href="${url}" target="_blank" style="color: inherit;">${escapeHTML(linkText)}</a>`;
                }
                return `<a href="${url}" target="_blank" style="color: inherit;">${escapeHTML(url)}</a>`;
            }
    
            // Return the original match if it's not a recognized tag
            return match;
        });
    }


    // Function to handle code block transformation
    function transformCodeBlocks(text) {

        const codeBlockRegex = /\[code:(\w+)\](.*?)\[\/\]/gs;
        return text.replace(codeBlockRegex, (match, lang, code) => {
            let formattedCode = escapeHTML(code);
            return `<pre><code class="language-${lang}">${formattedCode.replace("\n", "")}</code></pre>`;
        });
    }

    function applyStyles(text) {
        if (stack.length === 0) return text;
        
        let style = stack.map(preset => {
            if (preset.startsWith('#')) {
                if (preset.startsWith('##')) {
                    return `background-color: ${preset.slice(1)};`;
                }
                return `color: ${preset};`;
            }
            return presets[preset] || '';
        }).join(' ');
        return `<span style="${style}">${text}</span>`;
    }
    
    function applyGlobalStyles(tag) {
        if (presets[tag]) {
            globalStyles += presets[tag];
        } else if (tag.startsWith('#')) {
            if (tag.startsWith('##')) {
                globalStyles += `background-color: ${tag.slice(1)}; `;
            } else {
                globalStyles += `color: ${tag}; `;
            }
        }
    }
    text = transformCodeBlocks(text);

    // Transform code blocks before applying other styles
    text = transformTagsWithParams(text);

    // replace /<\/a>(.*?)\[\/\]/ with "</a>" 
    text = text.replace(/<\/a>(.*?)\[\/\]/gs, "</a>");
    
    const lines = text.split('\n');
        
    lines.forEach((line, index) => {     
        let i = 0;
        while (i < line.length) {
            if (line[i] === '[' || line[i] === '{') {
                const isGlobalTag = line[i] === '{';
                if (currentText) {
                    html += applyStyles(currentText);
                    currentText = '';
                }

                let j = i;
                while (j < line.length && line[j] !== (isGlobalTag ? '}' : ']')) {
                    j++;
                }

                if (j === line.length) {
                    currentText += line.slice(i);
                    break;
                }

                const tag = line.slice(i + 1, j);
                if (isGlobalTag) {
                    applyGlobalStyles(tag);
                } else {
                    if (tag[0] !== '/') {
                        stack.push(tag);
                    } else {
                        if (stack.length > 0) {
                            stack.pop();
                        }
                    }
                }
                
                i = j;
            } else {
                currentText += line[i];
            }
            i++;
        }

        if (currentText) {
            html += applyStyles(currentText);
            currentText = '';
        }

        // Add a line break after each line, except for the last one
        if (index < lines.length - 1) {
            html += '</br>';
        }
    });

    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = html;
    document.body.style = globalStyles;
    outputDiv.style = globalStyles;
    Prism.highlightAll();
}

function importFile(filename) {

    // fetch file from filename
    fetch(filename)
        .then(response => response.text())
        .then(data => {
            renderMarkup(data);
        });
}

// get data-file from the output div
function loadContent() {
    fetch('../../tags.json')
        .then(response => response.json())
        .then(data => {
            presets = data;
            const outputDiv = document.getElementById('output');
    const filename = outputDiv.dataset.file;
    importFile(filename);
        });
    
}

// on document load, load the content
document.addEventListener('DOMContentLoaded', loadContent);