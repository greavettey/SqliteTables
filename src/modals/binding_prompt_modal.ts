import { App, FileSystemAdapter } from "obsidian";
import { ContextualModal } from "./contextual_modal";
import { existsSync, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import * as stream from "stream";;
import { finished } from 'stream/promises';
import { resolve } from "path";


export class BindingPromptModal extends ContextualModal {
	constructor(app: App, plugin: sqlt) {
		super(app, plugin);
	}

	onOpen() {
        let vault_location = "{OBSIDIAN DIRECTORY}/plugins/sqlite-tables/lib/"
        if (this.app.vault.adapter instanceof FileSystemAdapter) vault_location = `${this.app.vault.adapter.getBasePath()}/.obsidian/plugins/sqlite-tables/lib/`
            
		const { contentEl } = this;
        contentEl.setText("SQLite Tables");
        contentEl.createEl("h1", { text: "Unable to locate Better-Sqlite3 bindings." }).style.color = "red";
        contentEl.createEl("p").innerHTML = `Please ensure that you have the Better-Sqlite3 bindings installed. If you don't, you can either download them manually from the <a href="https://github.com/WiseLibs/better-sqlite3/releases/">Better-Sqlite3 repo's releases page</a>, and place them in the <strong>${vault_location}</strong> directory.`
        contentEl.createEl("p").innerHTML = `Alternatively, you can download and install the bindings automatically, through this plugin, by clicking the button below. This method downloads the bindings from the <a href="https://github.com/greavettey/SqliteTables/">SqliteTables GitHub repository</a>, which has been tested to work with this plugin.`
	
        contentEl.createEl("p", { text: "Once you've used either of these methods, relaunch Obsidian." });

        contentEl.createDiv({ cls: "sqlt-binding-button-space" }, (buttonspace) => {
            buttonspace.createEl("button", { text: "Download and Install", cls: "sqlt-binding-button" }).addEventListener("click", () => {
                this.downloadBindings();
            });
            buttonspace.createEl("button", { text: "Download Manually", cls: "sqlt-binding-button" }).addEventListener("click", () => { 
                location.href="https://github.com/WiseLibs/better-sqlite3/releases/"
            })
        })

    }

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

    async downloadBindings() {
        let res = await fetch("https://github.com/greavettey/SqliteTables/releases/download/" + this.plugin.manifest.version + "/better_sqlite3.node")
        let location = this.plugin.base_path + "/lib/"

        if (!existsSync(location)) await mkdir(location); //Optional if you already have downloads directory

        const destination = resolve(location, "better_sqlite3.node");
        const fileStream = createWriteStream(destination, { flags: 'wx' });
        await finished(stream.Readable.fromWeb(res.body).pipe(fileStream));
    }
}

