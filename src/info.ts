import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SFTreeItem } from './schemaExplorer';


export class Info {
    
    public static context: vscode.ExtensionContext;

    public static showMoreInfo(node: SFTreeItem) {
        Info.display(JSON.stringify(node.moreInfo, null, 2), 'Info.json');
    }

    public static display(displayString: string, fileName: string) {
        let filePath: string = '';
        const rootPath = vscode.workspace.rootPath || Info.context.extensionPath;
        filePath = path.join(rootPath, fileName);
        fs.existsSync(filePath);
        fs.writeFileSync(filePath, displayString, 'utf8');
        var openPath = vscode.Uri.file(filePath);
        console.log('openPath: ',openPath);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }
}