import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType, MatchDecorator } from "@codemirror/view"
import { DatabaseManager } from "database/database_manager"
import { CommonTable } from "database/common_table"
import { TableOptions } from "database/table"

export function registerTablePlugin(database_manager: DatabaseManager) {
    class TableWidget extends WidgetType {
        constructor(readonly table: string) {
            super()
        }

        toDOM() {
            const span_element = document.createElement("span")
            // span_element.setText("" + JSON.stringify(new CommonTable({ name: this.table } as TableOptions, database_manager).flatten()))
            const table_element = span_element.createEl("table");
            const header_row = table_element.createEl("tr");

            const c_table = new CommonTable({ name: this.table } as TableOptions, database_manager).flatten();

            c_table.column_key.forEach((column) => {
                header_row.createEl("th", { text: column })
            })
            c_table.row_data.forEach(c_table_row => {
                const table_element_row = table_element.createEl("tr");
                c_table_row.forEach(val => {
                    table_element_row.createEl("td", { text: JSON.stringify(val) })
                })
            })
            
            return span_element;
        }

        ignoreEvent() { return false }
    }   

    const matcher = new MatchDecorator({
        regexp: /\[\[sqlt\("([\w]+)"\)\]\]/g,
        decoration: match => Decoration.replace({
            widget: new TableWidget(match[1]),
        })
    })

    const tables = ViewPlugin.fromClass(class {
            tables: DecorationSet;

            constructor(view: EditorView) {
                this.tables = matcher.createDeco(view)
            }
            update(update: ViewUpdate) {
                this.tables = matcher.updateDeco(update, this.tables)
            }
        }, {    
            decorations: instance => instance.tables,
            provide: plugin => EditorView.atomicRanges.of(view => {
                return view.plugin(plugin)?.tables || Decoration.none
            })
        }
    )

    return tables;
}

