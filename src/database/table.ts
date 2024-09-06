import Database from "better-sqlite3";
import { DatabaseManager } from "database/database_manager";

export interface TableOptions {
    name: string;
    columns: string[] | null;
    types: string[] | null;
    encoding: string | null;
}

export interface FlatTable {
    column_key: string[];
    row_data: string[][];
    length: number;
}

/**
 * Helper class to manage and represent tables within the database.
 */
export class Table {
    name: string;
    columns: string[];
    types: string[] | null;
    encoding = "utf8";
    database: Database.Database | null;

    /**
     * Create a new table instance.
     * If a table with the same name already exists, it will not be created, and instead a reference to the existing table will be returned.
     * @param {TableOptions} tableOptions TableOptions object containing the table's name, columns, and types. 
     * @param {DatabaseManager} database Valid DatabaseManager instance to create the table in
     */
    constructor(tableOptions: TableOptions, database: DatabaseManager) {
        this.name = tableOptions.name;
        this.columns = tableOptions.columns || [];
        this.types = tableOptions.types;
        this.database = database.database;
        
        // I KNOW IT ISN'T NULL HOLY SHIT 
        // @ts-ignore: Object is possibly 'null'.
        if (this.columns.length > 0 && this.types !== null && this.types.length === this.columns.length) this.database?.exec(`CREATE TABLE IF NOT EXISTS ${this.name} (${this.columns.map((col, i) => `${col} ${this.types[i]}`).join(", ")})`);
    }

    /**
     * Insert values into a the table, creating a new row. 
     * Equivalent to SQL's `INSERT INTO`. 
     * @param {string[]} values Array of values to insert into the row
     * @returns {Table} Table instance reflecting changes made
     */
    insert(values: string[]): Table {
        this.database?.prepare(`INSERT INTO ${this.name} (${this.columns?.join(", ")}) VALUES (${values.join(", ")})`).run();
        return this;
    }

    /**
     * Select columns from a table.
     * Equivalent to SQL's `SELECT` statement. 
     * @param {string[]} columns  Array of columns to select
     * @returns {unknown[] | undefined} Array of results if any
     */
    select(columns: string[]): unknown[] | undefined {
        return this.database?.prepare(`SELECT ${columns.join(", ")} FROM ${this.name}`).all();
    }

    /**
     * Update a value within the table.
     * Equivalent to SQL's `UPDATE` statement.
     * @param {string[]} column  Column to update
     * @param {string} value Value to insert into the column
     * @param {string} condition  Conditional statement to find the row to update 
     * @returns {Table} Table instance reflecting changes made
     */
    update(column: string, value: string, condition: string): Table {
        this.database?.prepare(`UPDATE ${this.name} SET ${column} = ${value} WHERE ${condition}`).run();
        return this;
    }

    /**
     * Delete a row within the table. 
     * Equivalent to SQL's `DELETE` statement.
     * @param {string} condition Conditional to find the row to delete
     * @returns {Table} Table instance reflecting changes made
     */
    delete(condition: string): Table {
        this.database?.prepare(`DELETE FROM ${this.name} WHERE ${condition}`).run();
        return this;
    }

    /**
     * Drop the table. 
     * Equivalent to SQL's `DROP TABLE` statement. 
     */
    drop(): void {
        this.database?.exec(`DROP TABLE IF EXISTS ${this.name}`);
    }

    /**
     * Flatten the table into a more readable, TS-friendly, format. 
     * @returns {FlatTable} FlatTable instance representing the table
     */
    flatten(): FlatTable {
        const d = [...this.database?.prepare(`SELECT * FROM ${this.name}`).all().map((row: { [key: string]: string }) => this.columns.map((col: string) => row[col])) || []];
        return {
            column_key: this.columns, 
            row_data: d,
            length: d.length
        };
    }
}