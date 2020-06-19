import * as vscode from 'vscode';
import * as path from 'path';

import { SFAPIOperations } from '../sfAPIOperations';
import { SFTreeItem } from '../schemaExplorer';
import { Constants } from '../constants';

export class SOQLView {
    private context: vscode.ExtensionContext;
    private currentPanel: vscode.WebviewPanel | any = undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private generateWebView(soqlString: string) {
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>SOQL</title>
                </head>
                <body>
                    <div style="width: 100%">
                    <textarea name="soql" rows="6" style="width: 90%;">
                        ${soqlString}
                    </textarea>
                    </div>
                </body>
                </html>`;
    }


    public displaySOQL(soqlString: string) {
        const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        if (this.currentPanel) {
            // If we already have a panel, show it in the target column
            this.currentPanel.webview.html = this.generateWebView(soqlString);
            this.currentPanel.reveal(columnToShowIn);
        } else {
            // Otherwise, create a new panel
            this.currentPanel = vscode.window.createWebviewPanel(
                'INFO',
                'More Info',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );
            this.currentPanel.webview.html = this.generateWebView(soqlString);

            // Reset when the current panel is closed
            this.currentPanel.onDidDispose(
                () => {
                    this.currentPanel = undefined;
                },
                null
            );
        }
    }
}