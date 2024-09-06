import { ContextualModal } from "modals/contextual_modal";
import sqlt from "main";
import { App, Notice } from "obsidian";

import { Table, TableOptions } from "database/table";

export class CreateDatabaseTableModal extends ContextualModal {
    constructor(app: App, plugin: sqlt) {
        super(app, plugin);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setText("New Database Table");
        contentEl.createEl("br")
        contentEl.createEl("small", { text: "Create a new table in the database with the following name and columns:" }).style.color = "gray";
        contentEl.createEl("hr").style.margin = "1rem 0";
        contentEl.createEl("input", { type: "text", placeholder: "Table Name", cls: "sqlt-new-database-table-name" }).style.width = "-webkit-fill-available";
        contentEl.createEl("hr").style.margin = "1rem 0";

        contentEl.createDiv({ cls: "sqlt-new-database-column-space" }, (colspace) => {
            const cols = colspace.createDiv({ cls: "sqlt-new-database-column-span" });
            cols.createDiv({ cls: "sqlt-new-database-column" }, (filler) => {
                filler.createDiv({}, (t1) => {
                    t1.createEl("p", { text: "Name", cls: "sqlt-new-database-column-label-special" }, (n) => {
                        n.style.textAlign = "center";
                        n.style.display = "inline";
                    });

                    t1.style.textAlign = "center";
                    t1.style.color = "gray";
                    t1.style.width = "-webkit-fill-available;";
                });

                filler.createDiv({ cls: "sqlt-new-database-column-type-input" }, (t2) => {
                    t2.createEl("p", { text: "Type", cls: "sqlt-new-database-column-label-special" }, (n) => {
                        n.style.display = "inline";
                    })

                    t2.style.margin = "-10px 0px -10px 0px";
                    t2.style.color = "gray";
                    t2.style.textAlign = "center";
                });
            });

            this.pushColumn(cols);

            colspace.createSpan({ cls: "sqlt-new-database-button-space" }, (buttonspace) => {
                buttonspace.createEl("button", { text: "New Column", cls: "sqlt-new-database-column-button" }).addEventListener("click", () => {
                    this.pushColumn(cols);
                });
                buttonspace.createEl("button", { text: "Create Table", cls: "sqlt-new-database-column-button" }).addEventListener("click", () => {
                    if (!contentEl.querySelector(".sqlt-new-database-table-name")?.value) {
                        new Notice("Table name cannot be empty.");
                        if(contentEl.querySelector(".sqlt-new-database-table-name")) contentEl.querySelector(".sqlt-new-database-table-name").style.border = "1px solid red";
                        return;
                    }
                    let colnames: string[] = []
                    let coltypes: string[] = []
                    contentEl.querySelectorAll("#actual-col-input").forEach((n) => {
                         colnames.push(n.value ? n.value : n.placeholder);
                    })
                    contentEl.querySelectorAll("#actual-col-type").forEach((t) => {
                        coltypes.push(t.value ? t.value : t.placeholder);
                    })
                    
                    let tabOps: TableOptions = {
                        name: contentEl.querySelector(".sqlt-new-database-table-name")?.value,
                        columns: colnames,
                        types: coltypes,
                    }
                    new Table(tabOps, this.plugin.manager);
                    new Notice("Table created successfully.");
                    this.close();
                });
            });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private pushColumn(element: HTMLElement) {
        element.createDiv({ cls: "sqlt-new-database-column" }, (collect) => {
            collect.createEl("input", { type: "text", placeholder: `Column ${element.children.length}`, attr: { id: "actual-col-input" } }).style.width = "-webkit-fill-available";
            collect.createEl("span", { cls: "sqlt-new-database-column-type-input" }, (gp) => {
                gp.createEl("select", { attr: { id: "actual-col-type" } }, (select) => {
                    select.createEl("option", { text: "TEXT", value: "TEXT" });
                    select.createEl("option", { text: "INTEGER", value: "INTEGER" });
                    select.createEl("option", { text: "REAL", value: "REAL" });
                    select.createEl("option", { text: "BLOB", value: "BLOB" });
                }).setAttribute("name", "type");
            });
        });

    }
}

