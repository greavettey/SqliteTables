# SQLite Tables for Obsidian

This is an Obsidian plugin attempting to implement similar behaviors to *Notion's* "databases". It allows for the creation of tables shared across multiple notes and exposes APIs to modify them and work with them using SQL.

## It is currently **very** early in development, and many features are not yet implemented. Things could break, and really the only way its usable is with SQL knowledge. I'm publishing it now so that hopefully someone can help a bit.

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

Features:
- [x] Create tables/databases in notes
- [x] Tables/databases can be shared across notes

Planned features:
- [ ] Full UI for creating and modifying rows, entries, and table/database contents
- [ ] Full coverage of SQL API
- [ ] Better looking tables

## Building from source

1. Clone this repo
2. Run `npm i` to install dependencies
3. Run `npm run dev` to compile the plugin
4. Copy the `manifest.json`, `main.js`, and `styles.css` to your vault's `.obsidian/plugins/SQLite Tables/` folder

Eventually I'll have a release version that can be installed directly from the Obsidian plugin store and prebuilt binaries on the release page. 

## How can I help?

Thanks for asking! Clone this repo and start working on some of the planned features. I'm super open feature suggestions and ideas, and I'll try to review PRs as quickly as I can.

## Issues

If you have any problems or find any bugs, please open an issue on the GitHub repo. I'll look at it as soon as I can and hopefully we can fix it. Please remember though, this is very, very early in development, so you should not be using this for anything important.

## License

This project is licensed under the MIT License. You can find the full license in the `LICENSE` file. 

Thank you to the Obsidian team, and to the BetterSQLite team. 