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

    /*private flattenNestedData(soqlString : string, records: []) {
        let index = soqlString.indexOf('FROM');
        soqlString = soqlString.slice(0, index);
        const fieldsArray = soqlString.trim().split(',');
        let recObj: {};
        for(let index of fieldsArray) {
            

        }
        flattenedRecords: [];
        for(let index of records) {
            
            for(let index of fieldsArray) {

            }
            record: {};


        }
    }*/

    private async runSOQL(soqlString : string, username: string) {
        let records: any = [];
        console.log("runSOQL.userName: ", username);
        records = await this.promisifiedWithProgress(soqlString, username);
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
                    <div style="width: 100%">
                        <textarea id="soql-textarea" name="soql" rows="6" style="width: 90%;">${soqlString}</textarea>
                        <button onclick= "runSOQL();">Run Query</button>
                        <div id="query-result-container">
                            <table id="soql-table">
                            <th id="table-head">
                            </th>
                            <tbody id="table-body">
                            </tbody>
                            </table>
                        </div>
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

                        function renderTable(records) {
                            const soqlString = document.getElementById("soql-textarea").value;
                            let index = soqlString.indexOf('FROM');
                            const fieldsArray = soqlString.slice(0, index).replace(/^(SELECT)/i,"").trim().split(',').map(item => item.trim());
                            
                            let flattenedRecords = [];
                            
                            let soqlTable = document.getElementById("soql-table");
                            // let thElement = document.getElementById("table-head");
                            // let tableBodyElement = document.getElementById("table-body");
                            // //thElement.innerHTML = "";
                            // tableBodyElement.innerHTML = "";
                            soqlTable.innerHTML = "";
                            //var table = document.createElement("TABLE");
                    
                            var columnCount = fieldsArray.length;
                    
                            let theadRow = soqlTable.insertRow(-1);
                            for (let column of fieldsArray) {
                                var headerCell = document.createElement("TH");
                                headerCell.innerHTML = column;
                                theadRow.appendChild(headerCell);
                            }
                            soqlTable.appendChild(theadRow);
                            for(let record of records) {
                                console.log('record: ',record);
                                flattenedRecords.push(flattenObject(record));
                                //for(let field of fieldsArray) {
                                    //console.log('field: ',field);
                                    //console.log('flattenedRecord: ',flattenedRecord);
                                //}
                            }
                            let tBodyElement = "";
                            for (let record of flattenedRecords) {
                                row = soqlTable.insertRow(-1);
                                for (let field of fieldsArray) {
                                    var cell = row.insertCell(-1);
                                    cell.innerHTML = record[field];
                                }
                                soqlTable.appendChild(row);
                            }
                            
                        }

                        // Handle the message inside the webview
                        window.addEventListener('message', event => {
                            const message = event.data; // The JSON data our extension sent

                            switch (message.command) {
                                case 'displayQuery':
                                    console.log('displayQuery in html');
                                    renderTable(message.records);
                                    break;
                            }
                        });
                    </script>
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
                        const records = await this.runSOQL(message.text, username);
                            //if(records != null) {
                                console.log('records in panel: ',records);
                                this.currentPanel.webview.postMessage({ command: 'displayQuery', records: records});
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