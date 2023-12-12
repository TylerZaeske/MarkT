[title]Customizable Tags[/]

Previously, tags were static, and could not have parameters. That made varying font sizes be very annoying to implement. I would just have to have a bunch of different tags with different names that would correspond with different font sizes. Now, tags with parameters are possible meaning I can do things like this
[code:markt]
[font:arial]
[color:red]
[bgcolor:red]
[size:20px]
[/code]
This saves a lot of time and gives in general much more customizability to the user. They can also still be combined with previous tags to create infinite combinations.

There are now 3 different types of tags.

[size:20px][underline]Static tags[/][/]
Tags that have one css value that is applied to the text

[size:20px][underline]Customizable tags[/][/]
Tags that can take parameters and apply that parameter to a predefined css value

[size:20px][underline]differing html tags[/][/]
These are special tags that can be used to embed content other than a span element into the response. An example of this is the [underline]youtube[/] tag to embed videos or the [underline]link[/] tag to have embedded links. These tags can also take paremters.

I have also created a custom prism.js extension that works with MarkT:
[code:markt]
{font:arial}
This will be in arial
[color:#ff0000]
This will be in red
[/]
[/code]