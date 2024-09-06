import sqlt from "main";
import { PluginSettingTab, App, Setting, setIcon } from "obsidian";

export class sqltSettingsTab extends PluginSettingTab {
	plugin: sqlt;

	constructor(app: App, plugin: sqlt) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl  } = this;

		containerEl.empty();

		const general_group = containerEl.createSpan();
		general_group.createEl("h2", { text: "General", cls: "sqlt-settings-header" })

		const general_description_span = general_group.createSpan({ cls: "sqlt-settings-span" })
		general_description_span.createEl("p", { text: "Configure the settings for the SQLite Tables plugin.", cls: "sqlt-settings-description" })
		general_description_span.createEl("p", { text: "Created by Axel Greavette.", cls: "sqlt-settings-credits" })

		// DEFINE SETTINGS WITH NAMES IN ORDER TO MODIFY BEHAVIOR PROGRMATICALLY

		const database_name_setting = new Setting(general_group)
			.setName("Database Name")
			.setDesc("The name you'd like to give to the SQLite database.")
			.addText(text => text
				.setPlaceholder("sqlite_tables")
				.setValue(this.plugin.settings.database_name)
				.onChange(async (value) => {
					this.plugin.settings.database_name = value;
					await this.plugin.saveSettings();
				})); 
		
		const show_new_table_setting = new Setting(general_group)
			.setName("Show \"New Database Table\" button")
			.setDesc("Toggle whether or not the \"New Database Table\" button should be shown in the sidebar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.show_new_table_button)
				.onChange(async (value) => {
					this.plugin.settings.show_new_table_button = value;
					await this.plugin.saveSettings();
				})
			);

		const database_status_setting = new Setting(general_group)
			.setName("Database Status")
			.setDesc(this.plugin.settings.database_status && this.plugin.settings.debug_mode ? `Loaded ${this.plugin.manager.debug.table_count} tables, ${this.plugin.manager.debug.column_count} columns, and ${this.plugin.manager.debug.row_count} rows.` : "")
			.addText(text => {
				text.inputEl.readOnly = true;
				text.inputEl.style.textAlign = "right"; 
				text.inputEl.style.border = "none";
				text.inputEl.style.color = this.plugin.settings.database_status ? "green" : "red";

				text.inputEl.value = this.plugin.settings.database_status ? "Connected" : "Disconnected";
			})

		
		// DEBUG SETTINGS
		const debug_group = containerEl.createSpan({ cls: "sqlt-settings-debug-span" })
		debug_group.hidden = !this.plugin.settings.debug_mode;
		debug_group.createEl("h2", { text: "Debug", cls: "sqlt-settings-header" })

		const debug_description_span = debug_group.createSpan({ cls: "sqlt-settings-span" })
		debug_description_span.createEl("p", { text: "Keep an eye to the ground.", cls: "sqlt-settings-description" })
		setIcon(debug_description_span.createDiv({ cls: "sqlt-settings-svg" }), "bug")

		const toggle_debug_mode_setting = new Setting(general_group)
            .setName("Debug Mode")
            .setDesc("Enable more verbose logging to the console, as well as otherwise-hidden functions used for development.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debug_mode)
                .onChange(async (value) => {
                    this.plugin.settings.debug_mode = value;
					database_status_setting.setDesc(this.plugin.settings.database_status && this.plugin.settings.debug_mode ? `Loaded ${this.plugin.manager.debug.table_count} tables, ${this.plugin.manager.debug.column_count} columns, and ${this.plugin.manager.debug.row_count} rows.` : "")
					debug_group.hidden = !value;
					await this.plugin.saveSettings();
                })
			);
		
		const debug_disconnect_setting = new Setting(debug_group)
				.setName("Disconnect Database")
				.setDesc("Disconnect from the current database.")
				.setDisabled(!this.plugin.settings.database_status)
				.addButton(button => button
					.setButtonText("Disconnect")
					.onClick(async () => {
						this.plugin.manager.disconnectDatabase();
						this.plugin.resolveDatabaseStatus();
						database_status_setting.controlEl.children[0].value = "Disconnected";
						database_status_setting.controlEl.children[0].style.color = "red";
						debug_disconnect_setting.setDisabled(true);
					})
				);

		const debug_reconnect_setting = new Setting(debug_group)
			.setName("Force Database Reconnect")
			.setDesc("Force a reconnection to the current database.")
			.addButton(button => button
				.setButtonText("Reconnect")
				.onClick(async () => {
					debug_disconnect_setting.setDisabled(false);
					this.plugin.manager.disconnectDatabase();
					this.plugin.manager.connectDatabase(() => this.plugin.resolveDatabaseStatus());
					database_status_setting.controlEl.children[0].value = this.plugin.settings.database_status ? "Connected" : "Disconnected";
					database_status_setting.controlEl.children[0].style.color = this.plugin.settings.database_status ? "green" : "red";
				})
			);
	}
}

export interface sqltSettings {
	database_name: string;
	debug_mode: boolean;
	database_status: boolean;
	show_new_table_button: boolean;
}

export const DEFAULT_SETTINGS: sqltSettings = {
	database_name: "sqlite_tables",
	debug_mode: false,
	database_status: false,
	show_new_table_button: true
}