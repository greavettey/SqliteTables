import { DatabaseManager } from "./database_manager";
import { Table, TableOptions } from "./table";

export interface CommonTableCache {
    table_count: number;
    table_names: string[];

    row_count: number;
    column_count: number;

    all: {
        [table: string]: {
            column_count: number,
            row_count: number
        };
    }
}

/**
 * Helper class to quickly access common data from a table. 
 * ! This class can only be used to access existing tables. If you need to create a new table in the event that your table does not exist, use the {Table} class.
 * ! This class is not meant to be used for complex operations. Use the Table class if you need that. 
 */
export class CommonTable extends Table {
    cache: CommonTableCache = {
        table_count: 0,
        table_names: [],
        row_count: 0,
        column_count: 0,
        all: {}
    };

    /**
     * 
     * @param {TableOptions} tableOptions TableOptions object to use for database connection.
     * @param {DatabaseManager} database DatabaseManager instance to use for database manipulations.
     */
    constructor(tableOptions: TableOptions, database: DatabaseManager) {
        if (!database.cached.tables.includes(tableOptions.name)) {
            throw new Error(`Table "${tableOptions.name}" does not exist in the database. CommonTable cannot be created.`);
        }

        super(tableOptions, database);

        this.columns = this.database?.prepare(`PRAGMA table_info(${this.name})`).all().map((col: { name: string }) => col.name) ? this.database?.prepare(`PRAGMA table_info(${this.name})`).all().map((col: { name: string }) => col.name) : [];
    }

    /**
     * @returns {number} Number of rows in the table
     */
    size(): number {
        return super.select(["*"])?.length || 0;
    }

    /**
     * @returns {number} Number of columns in the table
     */
    length(): number {
        return this.columns?.length || 0;
    }
}