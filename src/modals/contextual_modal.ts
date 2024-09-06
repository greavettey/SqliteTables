import sqlt from "main";
import { App, Modal } from "obsidian";

/**
 * ContextualModal class for the SQLite Tables plugin.
 * Extends Obsidian's Modal class to inject the plugin context into the modal.
 */
export class ContextualModal extends Modal {
    plugin: sqlt;

    constructor(app: App, plugin: sqlt) {
        super(app);
        this.injectPlugin(plugin);
    }

    private injectPlugin(plugin: sqlt) {
        this.plugin = plugin;
    }

    onOpen() {
    }

    onClose() {
    }
}

