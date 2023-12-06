    let presets = {};

    Prism.hooks.add('before-sanity-check', function (env) {
        env.code = env.element.innerText;
    });

    window.onload = function() {

        const editor = document.getElementById('editor');
        const filename = document.getElementById('filename');

        editor.addEventListener('input', function() {
            // call Prism.highlightAll() from console to highlight the code
            Prism.highlightAll();
            renderMarkup(editor.value);
            saveLocally();
        });

        filename.addEventListener('input', function() {
            adjustWidthToContent(filename);
            saveLocally();
        });

        editor.value = localStorage.getItem("editor");
        filename.value = localStorage.getItem("filename");


        fetch('../tags.json')
            .then(response => response.json())
            .then(data => {
                presets = data;
                renderMarkup(editor.value);
                adjustWidthToContent(filename);
            });
    };

    function downloadFile(url, fileName) {
        fetch(url, {
                method: 'get',
                mode: 'no-cors',
                referrerPolicy: 'no-referrer'
            })
            .then(res => res.blob())
            .then(res => {
                const aElement = document.createElement('a');
                aElement.setAttribute('download', fileName);
                const href = URL.createObjectURL(res);
                aElement.href = href
                aElement.setAttribute('target', '_blank');
                aElement.click();
                URL.revokeObjectURL(href);
            });
    };

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
        outputDiv.style = globalStyles;
        Prism.highlightAll();
    }
    
            

    function saveLocally() {
        const editor = document.getElementById('editor');
        const filename = document.getElementById('filename');
        localStorage.setItem("editor", editor.value);
        localStorage.setItem("filename", filename.value);
    }

    function adjustWidthToContent(input) {
        // Check if the input is empty
        if (!input.value) {
            // Reset to the minimum width specified in the CSS
            input.style.width = '';
            return;
        }

        const tempSpan = document.createElement('span');
        document.body.appendChild(tempSpan);

        // Apply the same font properties to the span
        tempSpan.style.fontFamily = getComputedStyle(input).fontFamily;
        tempSpan.style.fontSize = getComputedStyle(input).fontSize;
        tempSpan.style.letterSpacing = getComputedStyle(input).letterSpacing;
        tempSpan.style.whiteSpace = 'pre'; // To preserve spaces and tabs

        // Set the text of the span to the input value
        tempSpan.textContent = input.value;

        // Adjust the input width to the span width
        input.style.width = `${tempSpan.offsetWidth}px`;

        // Remove the temporary span element
        document.body.removeChild(tempSpan);
    }

    function saveToFile() {
        const text = document.getElementById('editor').value;
        const filename = document.getElementById('filename').value;
        const editor = document.getElementById('editor').value;

        if (!filename) {
            alert('Please enter a filename.');
            return;
        }
        // download the file via blob
        const blob = new Blob([text], {
            type: 'text/plain'
        });
        const url = URL.createObjectURL(blob);

        downloadFile(url, filename + ".markT");

    }

    function importFile(file) {
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");

        let editor = document.getElementById('editor');
        let filename = document.getElementById('filename');

        filename.value = file.name.split('.')[0];
        adjustWidthToContent(filename);

        // log result
        reader.onload = function(evt) {
            editor.value = evt.target.result

            renderMarkup(editor.value);
            saveLocally();
        }
    }

    function findAndReplace() {
        const findText = document.getElementById('findInput').value;
        const replaceText = document.getElementById('replaceInput').value;
        const editor = document.getElementById('editor');

        // if (!findText) {
        //     alert("Please enter the text to find.");
        //     return;
        // }

        // Replace the text
        editor.value = editor.value.split(findText).join(replaceText);

        // Re-render the markup and save the changes
        renderMarkup(editor.value);
        saveLocally();
    }
    document.addEventListener('DOMContentLoaded', function() {
    // Get the modal
    var modal = document.getElementById("findReplaceModal");

    // Get the <span> element that closes the modal
    var span;

    // set span to the close button
    span = document.getElementsByClassName("close")[0];


    const editor = document.getElementById('editor');
    const resizer = document.getElementById('resizer');
    const output = document.getElementById('output');
    let isResizing = false;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        document.body.classList.add('no-select');
    });


    document.addEventListener('mousemove', function(e) {
        if (!isResizing) {
            return;
        }
        let offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
        let containerWidth = editor.offsetWidth + output.offsetWidth;
        editor.style.width = (e.clientX - editor.offsetLeft) + 'px';
        output.style.width = (containerWidth - editor.offsetWidth - resizer.offsetWidth) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        isResizing = false;
        document.body.classList.remove('no-select');
    });

    // When the user clicks on <span> (x), close the modal
    // test
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.addEventListener("keydown", function(event) {
        if (event.key === 'Enter') {
            if (modal.style.display === "block") {
                event.preventDefault();
                findAndReplace();
            }
        }
    });

    // close modal on Esc
    document.addEventListener("keydown", function(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            modal.style.display = "none";
        }
    });

    // Listen for Ctrl + F
    document.addEventListener("keydown", function(event) {
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            modal.style.display = "block";
            // unselect the editor
            editor.blur();
        }
    });

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        document.body.classList.add('no-select');
    });

    document.addEventListener('mousemove', function(e) {
        // Only execute if isResizing is true
        if (!isResizing) {
            return;
        }

        let editorWidth = e.clientX - editor.offsetLeft;
        let outputWidth = document.body.offsetWidth - e.clientX;
        let containerWidth = editor.offsetWidth + output.offsetWidth;

        // Check if the resizer is within 100px of either wall
        if (editorWidth < 100) {
            editor.style.width = '0px';
            editor.style.display = "none";
            output.style.width = '100%';
            resizer.style.backgroundColor = "#ccc";
        } else if (editorWidth > 100 && outputWidth > 100) {
            editor.style.width = editorWidth + 'px';
            output.style.width = (containerWidth - editor.offsetWidth - resizer.offsetWidth) + 'px';
            editor.style.display = "block";
            resizer.style.backgroundColor = "transparent";
        }

        if (outputWidth < 100) {
            editor.style.width = '100%';
            output.style.display = "none";
            output.style.width = '0px';
            resizer.style.backgroundColor = "#ccc";
        } else if (outputWidth > 100 && editorWidth > 100) {
            editor.style.width = editorWidth + 'px';
            output.style.width = (containerWidth - editor.offsetWidth - resizer.offsetWidth) + 'px';
            output.style.display = "block";
            resizer.style.backgroundColor = "transparent";
        }
    });

    document.addEventListener('mouseup', function(e) {
        // Only execute if isResizing is true
        if (isResizing) {
            isResizing = false;
            document.body.classList.remove('no-select');
        }
    });
});