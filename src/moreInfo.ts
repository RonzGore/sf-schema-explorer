import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SFTreeItem } from './schemaExplorer';


export class Info {
    public static showMoreInfo(node: SFTreeItem) {
        let filePath: string = '';
        const rootPath = vscode.workspace.rootPath || '';
        filePath = path.join(rootPath, `Info.json`);
        fs.existsSync(filePath);
        fs.writeFileSync(filePath, JSON.stringify(node.moreInfo, null, 2));
        var openPath = vscode.Uri.file(filePath);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }
}