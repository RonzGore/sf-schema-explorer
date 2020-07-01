import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileUtil {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public displayContentInFile(displayString: string, fileName: string) {
        let filePath: string = '';
        const rootPath = vscode.workspace.rootPath || this.context.extensionPath;
        filePath = path.join(rootPath, fileName);
        fs.existsSync(filePath);
        fs.writeFileSync(filePath, displayString, 'utf8');
        var openPath = vscode.Uri.file(filePath);
        console.log('openPath: ',openPath);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    public static copyToClipboard(textToCopy: string) {
        vscode.env.clipboard.writeText(textToCopy);
    }
}
