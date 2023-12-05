presets = {
    "glow": "text-shadow: 0 0 5px currentColor;",
    "unglow": "text-shadow: none;",
    "bold": "font-weight: bold;",
    "italic": "font-style: italic;",
    "underline": "text-decoration: underline;",
    "strike": "text-decoration: line-through;",
    "sup": "vertical-align: super; font-size: smaller;",
    "sub": "vertical-align: sub; font-size: smaller;",
    "small": "font-size: smaller;",
    "large": "font-size: larger;",
}

# create one documentation markdown file that contains all the presets and their css effects
with open("docs.md", "w") as f:
    f.write("# Available Tags\n\n")
    for preset in presets:
        f.write(f"## {preset}\n\n")
        f.write(f"```css\n" + presets[preset].replace('; ', ';').replace(';', ';\n') + "```\n\n")