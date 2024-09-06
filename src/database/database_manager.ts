import Database from "better-sqlite3";
import { existsSync } from "fs";
import sqlt from "main";
import { App, FileSystemAdapter, Notice, Vault } from "obsidian";
import { CommonTable } from "./common_table";
import { TableOptions } from "./table";

export interface DatabaseOptions {
	verbose: (message?: any, ...optionalParams: any[]) => void;	// eslint-disable-line @typescript-eslint/no-explicit-any
	nativeBinding: string;
    vault: Vault;
    name: string;
}

export class DatabaseManager {
    app: App;
    plugin: sqlt;

    database: Database.Database | null = null;
    connected = false;
    database_options: DatabaseOptions;

	cached: {
		table_count: number;
		tables: string[];
	} = {
		table_count: -999,
		tables: []
	}

	debug: {
		table_count: number;
		row_count: number;
		column_count: number;
	} = {
		table_count: 0,
		row_count: 0,
		column_count: 0
	}

    /**
     * 
     * @param {App} app Obsidian app instance
     * @param {sqlt} plugin SQLTabels plugin instance
     * @param {DatabaseOptions} database_options DatabaseOptions object to use for database creation and connection.
     */
    constructor(app: App, plugin: sqlt, database_options: DatabaseOptions) { 
        this.app = app;
        this.plugin = plugin;
        this.database_options = database_options;
    }

    /**
     * Connect to an existing database (specified in the constructor).
     * @param {() => void} callback Callback function to run after the database is connected. Commonly used to update the GUI
     * @returns {void}
     */
    connectDatabase(callback: () => void): void {
        const { vault, name } = this.database_options;
		if (vault.adapter instanceof FileSystemAdapter && existsSync(`${vault.adapter.getBasePath()}/${name}.db`)) {
			this.database = new Database(`${vault.adapter.getBasePath()}/${name}.db`, { verbose: this.plugin.database_options.verbose, nativeBinding: this.plugin.database_options.nativeBinding });
			this.connected = true;

			this.cached.tables = this.tables();
			this.tableCount(true); // should always recheck anyways. 

			// debug only!! 
			if(this.plugin.settings.debug_mode === true) {
				this.tables().forEach(t => {
					const table_instance = new CommonTable({ name: t } as TableOptions, this);
					console.log(`Table "${t}" has ${table_instance.size()} rows and ${table_instance.length()} columns.`);
					this.debug.row_count += table_instance.size();
					this.debug.column_count += table_instance.length();
				})
				this.debug.table_count = this.tableCount(true);
			}

			new Notice("Database loaded successfully.");
		} else {
			this.connected = false;
			new Notice("Database could not be loaded.");
			new Notice("Try reloading the app or using the \"New Database\" command.");
			if (this.plugin.settings.debug_mode) {
				console.error("Database does not exist or could not be found.");
			}
		}
		return callback();
	}

    /**
     * Disconnect from the current database.
     * @returns {void}
     */
	disconnectDatabase(): void {
		this.database?.close();
		this.connected = false;
		this.database = null;
	}

    /**
     * Create a new database.
     * @param {DatabaseOptions} database_options DatabaseOptions object to use for database creation
     * @param {() => void} callback Callback function called after the database is created. Commonly used to update the GUI
     * @returns {void}
     */
	createDatabase(database_options: DatabaseOptions, callback: () => void): void {
        const { vault, name } = this.database_options;
		if(vault.adapter instanceof FileSystemAdapter) {
			if (!existsSync(`${vault.adapter.getBasePath()}/${name}.db`)) {
				new Database(`${vault.adapter.getBasePath()}/${name}.db`, { verbose: this.plugin.database_options.verbose, nativeBinding: this.plugin.database_options.nativeBinding });
				this.connectDatabase(callback);
			} else {
				new Notice("Database already exists.");
				if (this.plugin.settings.debug_mode) {
					console.error("Database already exists.");
				}
			}
            return callback();
		}
	}

    /**
     * Destroy an existing database.
     * @param {Vault} vault Current vault
     * @param {string} name Name of the database
     * @param {() => void} callback Callback function to run after the database is destroyed. Commonly used to update the GUI
     * @returns {void}
     */
	destroyDatabase(vault: Vault, name: string, callback: () => void): void {
		if(vault.adapter instanceof FileSystemAdapter && existsSync(`${vault.adapter.getBasePath()}/${name}.db`)) {
			this.disconnectDatabase();
			vault.adapter.remove(`${vault.adapter.getBasePath()}/${name}.db`).then(() => {
				new Notice("Succesfully destoryed Database.");
			}).catch(e => {
				new Notice("Database could not be destroyed.");
				if (this.plugin.settings.debug_mode) {
					console.error(e);
				}
			});
			return callback();
		} else {
			new Notice("Database could not be destroyed.");
            //return callback();
		}
	}

	// INSPECTION METHODS

	/**
	 * Get the number of tables in the current database.
	 * @returns {number} Number of tables
	 */
	tableCount(force_recache = false): number {
		if (force_recache || this.cached.table_count === -999 || !this.cached || "table_count" in this.cached === false || this.cached.table_count === null) {
			this.cached.table_count = this.tables().length;
		}
		return this.cached.table_count;
	}

	/**
	 * Get the names of all tables in the current database.
	 * @returns {string[]} Array of table names
	 */
	tables(): string[] {
		return this.database?.prepare("SELECT name FROM sqlite_master WHERE type='table';").all().map((row: { name: string }) => row.name) || [];
	}

}