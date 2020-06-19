import * as vscode from 'vscode';
import * as path from 'path';

import { SFAPIOperations } from '../sfAPIOperations';
import { SFTreeItem } from '../schemaExplorer';
import { Constants } from '../constants';

export class MetaInfo {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    private getJPPickerJSResource() : vscode.Uri {
        // Local path to main script run in the webview
        const jpPickerJSPathOnDisk = vscode.Uri.file(
            path.join(this.context.extensionPath, "src", "views", "lib", "jsonpath-picker.min.js")
        );
        return jpPickerJSPathOnDisk.with({ scheme: "vscode-resource" });
    }

    private getJPPickerCSSResource() : vscode.Uri {
        // Local path to main script run in the webview
        const jpPickerCSSPathOnDisk = vscode.Uri.file(
            path.join(this.context.extensionPath, "src", "views", "lib", "jsonpath-picker.min.css")
        );
        return jpPickerCSSPathOnDisk.with({ scheme: "vscode-resource" });
    }


    private generateWebView(moreInfo: string) {
        const jpPickerJSUri = this.getJPPickerJSResource();
        const jpPickerCSSUri = this.getJPPickerCSSResource();
        console.log('jpPickerJSUri: ',jpPickerJSUri);
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>More Info</title>
                    <link href="${jpPickerCSSUri}" rel="stylesheet" />
                    <script src="${jpPickerJSUri}"></script>
                </head>
                <body>
                    <pre id="json-renderer" class="json-tree"></pre>
                    <input style="display:none;" class="path" type="text">
                    <script>
                        function script() {
                            const $pathTarget = document.querySelectorAll('.path');
                            const $source = document.querySelector('#json-renderer');
                        
                            const defaultOpts = {
                                pathNotation: 'dots',
                                pickerIcon: '#x7f7'
                            };
                            JPPicker.render($source, ${moreInfo}, $pathTarget, defaultOpts);
                        }
                        script();
                    </script>
                </body>
                </html>`;
    }

    private displayMetaDataInfo(moreInfo: string) {
        let currentPanel: vscode.WebviewPanel | any = '';
        const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        if (currentPanel) {
            // If we already have a panel, show it in the target column
            currentPanel.reveal(columnToShowIn);
        } else {
            // Otherwise, create a new panel
            currentPanel = vscode.window.createWebviewPanel(
                'INFO',
                'More Info',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );
            currentPanel.webview.html = this.generateWebView(moreInfo);

            // Reset when the current panel is closed
            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null
            );
        }
    }

    public async showMoreInfoInWebView(node: SFTreeItem) {
        let moreInfo = node.moreInfo;
        if(node.contextValue === Constants.OBJECT_CONTEXT) {
            const objectInfo = await SFAPIOperations.describeObject(node.connection, node.name);
            delete objectInfo.fields;
            moreInfo = objectInfo;
        } 
        this.displayMetaDataInfo(JSON.stringify(moreInfo));
    }
}