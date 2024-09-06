import { FileSystemAdapter, Plugin, Vault, WorkspaceLeaf } from 'obsidian';

import { join } from 'path';
import { existsSync } from 'fs';

import { sqltSettings, sqltSettingsTab, DEFAULT_SETTINGS } from 'modals/settings_modal';
import { CreateDatabaseTableModal } from 'modals/create_database_table_modal';
import { DatabaseManager, DatabaseOptions } from 'database/database_manager';
import { VerboseDatabaseModal } from 'modals/create_database_verbose';
import { DATABASE_STATUS_VIEW_TYPE, DatabaseStatusView } from 'views/database_status';
import { registerTablePlugin } from 'editor_decorator/table_plugin';
import { BindingPromptModal } from 'modals/binding_prompt_modal';

export default class sqlt extends Plugin {
	settings: sqltSettings;
	database_options: DatabaseOptions = {
		verbose: console.log,
		nativeBinding: this.resolveBindingLocation(this.app.vault),
		vault: this.app.vault,
		name: ""
	};
	gui = {
		status_indicator: this.addStatusBarItem()
	}
	manager: DatabaseManager;
	base_path: string;

	async onload() {
		this.resolveBasePath();
		
		this.tryNativeBinding(this.database_options.nativeBinding);

		await this.loadSettings();
		this.database_options.name = this.settings.database_name
		this.manager = new DatabaseManager(this.app, this, this.database_options);

		this.manager.connectDatabase(() => this.resolveDatabaseStatus.bind(this)());

		this.registerView(DATABASE_STATUS_VIEW_TYPE, (leaf) => new DatabaseStatusView(leaf, this));
		this.resolveGUI();

		this.registerEditorExtension([registerTablePlugin(this.manager)]);

		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		this.addCommand({
			id: "create-new-database-simple",
			name: "New Database",
			callback: () => {
				this.manager.createDatabase(this.database_options, this.resolveDatabaseStatus.bind(this)());
			}
		});

		this.addCommand({
			id: "create-new-database-table",
			name: "New Database Table",
			checkCallback: (checking: boolean) => {
				if (this.manager.connected) {
					if (!checking) {
						new CreateDatabaseTableModal(this.app, this).open();
					}
					return true;
				}

				return false;
			},
			callback: () => {
				new VerboseDatabaseModal(this.app).open();
			}
		});

		this.addCommand({
			id: "force-reconnect-database",
			name: "Force Database Reconnect",
			callback: () => {
				this.manager.disconnectDatabase();
				this.manager.connectDatabase(() => this.resolveDatabaseStatus.bind(this)());
			}
		})

		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			If checking is true, we're simply "checking" if the command can be run.
		// 			If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new VerboseDatabaseModal(this.app).open();
		// 			}

		// 			This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new sqltSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	async onunload() {
		this.manager.disconnectDatabase();
		await this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateConnection() {
		this.settings.database_status = this.manager.connected;
		await this.saveSettings();
	}

	resolveBasePath() {
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			return this.base_path = this.app.vault.adapter.getBasePath();
		} else {
			return "INCORRECT THROW ERROR";
		}
	}

	resolveBindingLocation(vault: Vault): string {
		if(vault.adapter instanceof FileSystemAdapter) {
			let path = `${this.base_path}/.obsidian/plugins/sqlite-tables/lib/better_sqlite3.node`;
			if (existsSync(path)) {
				return path;
			} else {
				return "INVALID_NODE_BINDING_LOCATION"
			}
		} else {
			let path = join(__dirname, "lib/better_sqlite3.node");
			if (existsSync(path)) {
				return path;
			} else {
				return "INVALID_NODE_BINDING_LOCATION"
			}
		}
	}

	tryNativeBinding(location: string) {
		if (location === "INVALID_NODE_BINDING_LOCATION") {
			new BindingPromptModal(this.app, this).open();
		}
		else return;
	}

	resolveDatabaseStatus() {
		this.gui.status_indicator.setText("Database: " + (this.manager.connected ? "Connected" : "Disconnected"));
		this.updateConnection();
	}

	resolveGUI() {
		this.resolveDatabaseStatus();
		this.addRibbonIcon("database", "View Database", async (evt: MouseEvent) => {
			this.activateDatabaseStatusView()
		});
		// if (this.settings.show_new_table_button) {
		// 	this.addRibbonIcon("database", "New Database Table", async (evt: MouseEvent) => {
		// 		new CreateDatabaseTableModal(this.app, this).open();
		// 	});
		// }
	}

	async activateDatabaseStatusView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(DATABASE_STATUS_VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: DATABASE_STATUS_VIEW_TYPE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf as WorkspaceLeaf);
	}
}
