let presets = {};

Prism.hooks.add('before-sanity-check', function (env) {
    env.code = env.element.innerText;
});

Prism.languages.markt = {
    'local-tag': {
        pattern: /(\[\/?.+\])/,
    },
    // match global tags
    'global-tag': {
        pattern: /(\{\/?.+\})/
    }
};


function assignCustomizableTag(tag, params) {
    if (tag == "font") {
        return `font-family: ${params};`;
    }

    if (tag == "size") {
        return `font-size: ${params};`;
    }

    if (tag == "color") {
        return `color: ${params};`;
    }

    if (tag == "bgcolor") {
        return `background-color: ${params};`;
    }
}


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
            } else if (tag === 'img') {
                const [url, width, height] = params.split(',');
                return `<img src="${url}" alt="${linkText}" width="${width}" height="${height}">`;
            } else if (tag === 'youtube') {
                const [url, width, height] = params.split(',');

                videoId = url.split('v=')[1];
                newurl = `htt ps://www.youtube.com/embed/${videoId}`;

                return `<iframe width="${width || 600}" height="${height || 338}" src="${newurl}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            } else if (tag == 'font') {
                // add font css to the styles of the already made tag
                const [font] = params.split(',');
                return `<span style="font-family: ${font};">${linkText}</span>`;
            }
    
            // Return the original match if it's not a recognized tag
            return match;
        });
    }


    // Function to handle code block transformation
    function transformCodeBlocks(text) {

        const codeBlockRegex = /\[code:(\w+)\](.*?)\[\/code\]/gs;
        return text.replace(codeBlockRegex, (match, lang, code) => {
            let formattedCode = escapeHTML(code);
            return `<pre><code class="language-${lang}">${formattedCode.replace("\n", "")}</code></pre>`;
        });
    }

    function applyStyles(text) {
        if (stack.length === 0) return text;
        
        let style = stack.map(preset => {
            return presets[preset] || '';
        }).join(' ');

        // apply customizable tags
        for (let i = 0; i < stack.length; i++) {
            if (stack[i].split(":")[1] != undefined) {
                tag = stack[i].split(":")[0];
                params = stack[i].split(":")[1].split(",");

                // START OF CUSTOMIZABLE TAG DECLARATIONS
                style += assignCustomizableTag(tag, params);
            }
            
        }
        

        return `<span style="${style}">${text}</span>`;
    }
    
    function applyGlobalStyles(tag) {
        if (presets[tag]) {
            globalStyles += presets[tag];
        } else if (tag.split(":")[1] != undefined) {
            tagName = tag.split(":")[0];
            params = tag.split(":")[1];


            // START OF CUSTOMIZABLE TAG DECLARATIONS
            globalStyles += assignCustomizableTag(tagName, params);
        }
    }
    text = transformCodeBlocks(text);

    // Transform code blocks before applying other styles
    text = transformTagsWithParams(text);

    // replace /<\/a>(.*?)\[\/\]/ with "</a>" 
    text = text.replace(/<\/a>(.*?)\[\/\]/gs, "</a>");

    // replace /<\/span>(.*?)\[\/\]/ with "</span>"
    text = text.replace(/<\/span>(.*?)\[\/\]/gs, "</span>");
    
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