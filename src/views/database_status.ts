import { CommonTable } from "database/common_table";
import { TableOptions } from "database/table";
import sqlt from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";

export const DATABASE_STATUS_VIEW_TYPE = "database-status-view";

export class DatabaseStatusView extends ItemView {
    plugin: sqlt;

    constructor(leaf: WorkspaceLeaf, plugin: sqlt) {
        super(leaf);
        this.plugin = plugin;
        this.plugin.manager
    }

    getViewType() {
        return DATABASE_STATUS_VIEW_TYPE;
    }

    getDisplayText() {
        return "Database Status View";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createSpan("span", (span) => {
            span.createEl("h1", { text: "Database Status" });

            span.createEl("p", { text: `Connected to: ${this.plugin.manager.connected ? this.plugin.manager.database_options.name: "INVALID"}` }).style.color = this.plugin.manager.connected ? "green" : "red";
        })
            
        this.plugin.manager.tables().forEach(table => {
            const temp_table = new CommonTable({ name: table } as TableOptions, this.plugin.manager)
            container.createEl("h2", { text: `Table "${table}" [${temp_table.size()} rows, ${temp_table.length()} columns]` });
        })
    }

    async onClose() {
        // Nothing to clean up.
    }
}