import os

filename = input("File: ")

foldername = filename.split("/")[-1].split(".")[0]

print(foldername)

os.system("mkdir " + foldername)

os.system(f"cp script.js styles.css index.html {filename} " + foldername)

with open(foldername + "/index.html", "r") as f:
    content = f.read()

content = content.replace("{TITLE}", foldername.replace("_", " "))
content = content.replace("{FILE}", filename)

with open(foldername + "/index.html", "w") as f:
    f.write(content)