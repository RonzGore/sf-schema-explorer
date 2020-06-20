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

    private async runSOQL(soqlString : string, username: string) {
        let records: any = [];
        let message = 'Fetch successful';
        console.log("runSOQL.userName: ", username);

        records = await this.promisifiedWithProgress(soqlString, username);
        return records;
        // vscode.window.withProgress({
		// 	location: vscode.ProgressLocation.Notification,
		// 	title: "Fetching records......",
		// 	cancellable: false
		// },async (progress: any, token: any) => {
		// 	console.log(progress, token);
		// 	try {
		// 		const conn = await SFAPIOperations.getConnection(userName);
        //         records = await SFAPIOperations.fetchRecords(conn, soqlString);
        //         records.forEach(function(index: any){ delete index.attributes });
        //         console.log('runSOQL: ',records); // This line is just to check connection validity
        //         vscode.window.showInformationMessage(message, {modal: false});
        //         return records;
		// 	} catch(error) {
		// 		message = 'Unable to fetch records';
		// 		vscode.window.showErrorMessage(error.message, {modal: false});
		// 	}
        // });
        //return records;
    }

    private promisifiedWithProgress = (soqlString : string, userName: string) => new Promise((resolve, reject) => {
        let message = 'Fetch successful';
        vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Fetching records......",
			cancellable: false
		},async (progress: any, token: any) => {
			console.log(progress, token);
			try {
				const conn = await SFAPIOperations.getConnection(userName);
                const records = await SFAPIOperations.fetchRecords(conn, soqlString);
                records.forEach(function(index: any){ delete index.attributes });
                console.log('runSOQL: ',records); // This line is just to check connection validity
                vscode.window.showInformationMessage(message, {modal: false});
                //return records;
                resolve(records);
			} catch(error) {
                message = 'Unable to fetch records';
                vscode.window.showErrorMessage(error.message, {modal: false});
                reject(error);
			}
        });
    })

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
                        <textarea id="soql-textarea" name="soql" rows="6" style="width: 90%;">${soqlString}</textarea>
                        <button onclick= "runSOQL();">Run Query</button>
                        <div id="query-result-container">
                        </div>
                    </div>
                    //scripts here
                    <script>
                        function runSOQL() {
                            const soqlString = document.getElementById("soql-textarea").value;
                            const vscode = acquireVsCodeApi();
                            vscode.postMessage({
                                command: 'runSOQL',
                                text: soqlString
                            });
                        }
                        // Handle the message inside the webview
                        window.addEventListener('message', event => {
                            const message = event.data; // The JSON data our extension sent

                            switch (message.command) {
                                case 'displayQuery':
                                    console.log('displayQuery in html');
                                    break;
                            }
                        });
                    </script>
                </body>
                </html>`;
    }


    public displaySOQL(soqlString: string, userName: string) {
        console.log("userName: ",userName);
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

            // Handle messages from the webview
            this.currentPanel.webview.onDidReceiveMessage(
               async (message: { command: any; text: string; }) => {
                    switch (message.command) {
                      case 'runSOQL':
                        //this.runSOQL(message.text, userName);
                        const records = await this.runSOQL(message.text, userName);
                            //if(records != null) {
                                console.log('records in panel: ',records);
                                this.currentPanel.webview.postMessage({ command: 'displayQuery' });
                            //}
                        return;
                    }
                },
                undefined,
                this.context
            );
        }
    }
}