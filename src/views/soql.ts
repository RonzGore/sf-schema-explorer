import * as vscode from 'vscode';
import * as path from 'path';

import { SFAPIOperations } from '../sfAPIOperations';
import { FileUtil } from '../fileUtil';
import { SFTreeItem } from '../schemaExplorer';
import { Constants } from '../constants';

export class SOQLView {
    private context: vscode.ExtensionContext;
    private currentPanel: vscode.WebviewPanel | any = undefined;
    private static queryResult: [] | any = undefined;
    private static oldSoqlString: string;
    

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private async runSOQL(soqlString : string, username: string) {
        let records: any = [];
        console.log("runSOQL.userName: ", username);
        records = await this.promisifiedWithProgress(soqlString, username);
        SOQLView.queryResult = records;
        SOQLView.oldSoqlString = soqlString;
        return records;
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
                    <div style="width: 100%; mqrgin-top: 2% !important">
                        <textarea class="soql-textarea" id="soql-textarea" name="soql" rows="6">${soqlString}</textarea>
                    </div>
                    <div class="buttons-div">
                        <button class="query-button" onclick="runSOQL();">Run Query</button>
                        <button class="clipboard-button" onclick="copyToClipboard();">Copy to Clipboard</button>
                        </div>
                    <div id="query-result-container" style="overflow-x:auto; overflow-y:auto;">
                        
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                        function runSOQL() {
                            const soqlString = document.getElementById("soql-textarea").value;
                            vscode.postMessage({
                                command: 'runSOQL',
                                text: soqlString
                            });
                        }

                        function copyToClipboard() {
                            const soqlString = document.getElementById("soql-textarea").value;
                            vscode.postMessage({
                                command: 'copyToClipboard',
                                text: soqlString
                            });
                        }

                        const flattenObject = function(ob) {
                            var toReturn = {};
                            
                            for (var i in ob) {
                                if (!ob.hasOwnProperty(i)) continue;
                                
                                if ((typeof ob[i]) == 'object') {
                                    var flatObject = flattenObject(ob[i]);
                                    for (var x in flatObject) {
                                        if (!flatObject.hasOwnProperty(x)) continue;
                                        
                                        toReturn[i + '.' + x] = flatObject[x];
                                    }
                                } else {
                                    toReturn[i] = ob[i];
                                }
                            }
                            return toReturn;
                        };

                        function splitSOQLString(soqlString) {
                            let index = soqlString.indexOf('FROM');
                            return soqlString.slice(0, index).replace(/^(SELECT)/i,"").trim().split(',').map(item => item.trim());  
                        }

                        function renderTable(records,oldSOQLString) {
                            let soqlString = "";
                            if(!oldSOQLString) {
                                soqlString = document.getElementById("soql-textarea").value;
                            } else {
                                soqlString = oldSOQLString;
                            }
                            const fieldsArray = splitSOQLString(soqlString);
                            let flattenedRecords = [];
                            for(let record of records) {
                                flattenedRecords.push(flattenObject(record));
                            }

                            let queryContainer = document.getElementById("query-result-container");
                            queryContainer.innerHTML = "";
                            if(flattenedRecords.length > 0) {
                                queryContainer.appendChild(generateHTMLtable(fieldsArray, flattenedRecords));
                            } else {
                                queryContainer.innerHTML = "<H4>No Records Returned.</H4>";
                            }
                            
                        }

                        function generateHTMLtable(fieldsArray, flattenedRecords) {
                            let soqlTable = document.createElement('TABLE');
                            soqlTable.classList.add("soql-table");
                            soqlTable.innerHTML = "";                    
                            var columnCount = fieldsArray.length;
                    
                            let theadRow = soqlTable.insertRow(-1);
                            for (let column of fieldsArray) {
                                var headerCell = document.createElement("TH");
                                headerCell.innerHTML = column;
                                theadRow.appendChild(headerCell);
                            }
                            soqlTable.appendChild(theadRow);
                            
                            let tBodyElement = "";
                            for (let record of flattenedRecords) {
                                row = soqlTable.insertRow(-1);
                                for (let field of fieldsArray) {
                                    var cell = row.insertCell(-1);
                                    cell.innerHTML = record[field] ? record[field] : "";
                                }
                                soqlTable.appendChild(row);
                            }
                            return soqlTable;
                        }

                        // Handle the message inside the webview
                        window.addEventListener('message', event => {
                            const message = event.data; // The JSON data our extension sent

                            switch (message.command) {
                                case 'displayQuery':
                                    console.log('displayQuery in html');
                                    renderTable(message.records);
                                    break;
                                case 're-renderTable':
                                    console.log('SOQLView.queryResult: ',message.records);
                                    console.log('SOQLView.oldSoqlString: ',message.soqlString);
                                    renderTable(message.records, message.soqlString);
                            }
                        });
                    </script>
                    <style>
                        body.vscode-light {
                            color: black;
                        }

                        body.vscode-dark {
                            color: #a8abaff2;
                        }
                      
                        body.vscode-high-contrast {
                            color: red;
                        }

                        .query-button {
                            margin: 1%;
                            background-color: #0a77e8;
                            border-color: #0a77e8;
                            padding: 5px;
                        }

                        .clipboard-button {
                            margin: 1%;
                            background-color: #8a8f92;
                            border-color: #8a8f92;
                            padding: 5px;
                        }

                       .soql-textarea {
                            width: 100%;
                            font-size: medium;
                            color: inherit;
                        }


                        body.vscode-dark .query-button {
                            color: #eaf1f1;
                        }

                        body.vscode-light .query-button {
                            color: #f8f8f9;
                        }


                        body.vscode-dark .clipboard-button {
                            color: #eaf1f1; /*#f8f8f9*/
                        }

                        body.vscode-light .clipboard-button {
                            color: #f8f8f9;
                        }
                        

                        body.vscode-dark .soql-textarea {
                            color: #a8abaff2;
                            background-color: #2d38454f;
                        }
                        
                        body.vscode-light .soql-textarea {
                            color: #46484af2;
                            background-color: #bfc6ce4f;
                        }

                        body.vscode-dark .soql-table, td, th {
                            border: 1px solid #eaf1f185; /*#474a4a85*/
                        }

                        body.vscode-light .soql-table, td, th {
                            border: 1px solid #474a4a85;
                        }
                        
                        table.soql-table {
                            border-collapse: collapse;
                            width: 100%;
                            height: auto;
                            
                        }
                        
                        th {
                            height: 30px;
                        }
                    </style>
                </body>
                </html>`;
    }


    public displaySOQL(soqlString: string, username: string) {
        console.log("userName: ",username);
        const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        if (this.currentPanel) {
            // If we already have a panel, show it in the target column
            this.currentPanel.webview.html = this.generateWebView(soqlString);
            this.currentPanel.name = `${username} - Query Runner`;
            console.log('SOQLView.queryResult in currentPanel: ',SOQLView.queryResult);
            console.log('SOQLView.oldSoqlString: ',SOQLView.oldSoqlString);
            if(SOQLView.queryResult) { 
                this.currentPanel.webview.postMessage({ command: 're-renderTable', soqlString: SOQLView.oldSoqlString, records: SOQLView.queryResult});
            }
            this.currentPanel.reveal(columnToShowIn);
        } else {
            // Otherwise, create a new panel
            this.currentPanel = vscode.window.createWebviewPanel(
                'SOQL',
                `${username} - Query Runner`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );
            
            this.currentPanel.webview.html = this.generateWebView(soqlString);
            this.currentPanel.webview.postMessage({ command: 're-renderTable', soqlString: SOQLView.oldSoqlString, records: SOQLView.queryResult});
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
                        case 'copyToClipboard': {
                            FileUtil.copyToClipboard(message.text);
                            //this.currentPanel.webview.postMessage({ command: 'Copied'});
                            return;
                        }                            

                        case 'runSOQL': {
                            console.log('message.command: ',message.command);
                            const records = await this.runSOQL(message.text, username);
                            console.log('records in panel: ',records);
                            this.currentPanel.webview.postMessage({ command: 'displayQuery', records: records});
                            return;
                        }
                        return;
                    }
                },
                undefined,
                this.context
            );
        }
    }
}