import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SFTreeItem } from './schemaExplorer';


export class SOQL {
    private static objectName: string;
    private static fields: any;
    
    // TO Be used in a next version
    private static insertText(getText: (i:number) => string, i: number = 0, wasEmpty: boolean = false): vscode.Position {
        console.log('Inside insertText');
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) { return; }
    
        let sels = activeEditor.selections;
    
        if (i > 0 && wasEmpty)
        {
            sels[i - 1] = new vscode.Selection(sels[i - 1].end, sels[i - 1].end);
            activeEditor.selections = sels; // required or the selection updates will be ignored! 😱
        }
    
        if (i < 0 || i >= sels.length) { return; }
    
        let isEmpty = sels[i].isEmpty;
        activeEditor.edit(edit => edit.replace(sels[i], getText(i))).then(x => {
    
            this.insertText(getText, i + 1, isEmpty);
        });
        const position = activeEditor.selection.active;
        console.log('cursor position: ', position);
        return position;
    }

    // To be used in a next version
    public static prepareAndInsertQuery() {
        // const newQuery : Boolean;
        // let position : vscode.Position; 
        // let previousPosition : vscode.Position; 
        // const editor = vscode.window.activeTextEditor;
        // let newPosition : vscode.Position = [];
        // if(context === 'object') {
        //     newQuery = true;
        //     position = SOQL.insertText(x => text);
        //     newPosition = position.with(position.line+1, position.character+7);
        //     previousPosition = newPosition;
        // } else if(context = 'field' && newQuery) {
        //     var newSelection = new vscode.Selection(previousPosition, previousPosition);
        //     editor.selection = newSelection;
        //     if(newQuery) {

        //         position = SOQL.insertText(x => text);
        //     } else {
        //         position = SOQL.insertText(x => `,{text}`);
        //     }
        //     newPosition = position.with(position.line, position.character+text.length);
        // }
    }


    private static buildQuery(objectName: string, fields: any) : string {
        let query = 'SELECT\n';
        let count = 0;
        for (let field of fields) {
            if(count === fields.size-1) {
                query += `      ${field}\n`;
            } else {
                query += `      ${field},\n`;
            }
            count++;
        }
        query += `      FROM ${objectName}`;
        return query;
    }

    public static prepare(node: SFTreeItem) {
        
        let filePath: string = '';
        filePath = path.join(vscode.workspace.rootPath, `query.txt`);
        fs.existsSync(filePath);
        
        if(node.contextValue === 'object') {
            if(SOQL.objectName !== node.label) {
                SOQL.objectName = node.label;
                SOQL.fields = new Set();
            }
            
        } else if(node.contextValue === 'field') {
            if(SOQL.objectName !== node.parentNode) {
                SOQL.objectName = node.parentNode;
                SOQL.fields = new Set();
            }
            SOQL.fields.add(node.label);
        }
        if(SOQL.objectName) {
            fs.writeFileSync(filePath, SOQL.buildQuery(SOQL.objectName, SOQL.fields), 'utf8');
            var openPath = vscode.Uri.file(filePath);
            vscode.workspace.openTextDocument(openPath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        }
     }
}

