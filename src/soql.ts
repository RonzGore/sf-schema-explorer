import * as vscode from 'vscode';

import { SFTreeItem } from './schemaExplorer';
import { Info } from './info';
import { Constants } from './constants';

export class SOQL {
    private static objectName: string;
    private static fields: any;
    public static context: vscode.ExtensionContext;
    
    // TO Be used in a next version
    // private static insertText(getText: (i:number) => string, i: number = 0, wasEmpty: boolean = false): vscode.Position {
    //     console.log('Inside insertText');
    //     let activeEditor = vscode.window.activeTextEditor;
    //     if (!activeEditor) { return; }
    
    //     let sels = activeEditor.selections;
    
    //     if (i > 0 && wasEmpty)
    //     {
    //         sels[i - 1] = new vscode.Selection(sels[i - 1].end, sels[i - 1].end);
    //         activeEditor.selections = sels; // required or the selection updates will be ignored! 😱
    //     }
    
    //     if (i < 0 || i >= sels.length) { return; }
    
    //     let isEmpty = sels[i].isEmpty;
    //     activeEditor.edit(edit => edit.replace(sels[i], getText(i))).then(x => {
    
    //         this.insertText(getText, i + 1, isEmpty);
    //     });
    //     const position = activeEditor.selection.active;
    //     console.log('cursor position: ', position);
    //     return position;
    // }

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
            if(count === 0) {
                query += `      ${field}\n`;
            } else {
                query += `      ,${field}\n`;
            }
            count++;
        }
        query += `FROM ${objectName}`;
        return query;
    }

    public static prepareSOQLForMultiSelect(nodes: SFTreeItem[]) {
        let objectName: string = '';
        let fields = [];
        for(let count=0; count <nodes.length; count++) {
            if(nodes[count].contextValue === Constants.OBJECT_CONTEXT && objectName === '') {
                objectName = nodes[count].name;
            } else if(nodes[count].contextValue === Constants.FIELD_CONTEXT) {
                if(objectName === '') {
                    objectName = nodes[count].parentNode;
                    fields.push(nodes[count].name);
                } else if(nodes[count].parentNode === objectName) { // Consider only fields from one selected object at a time
                    fields.push(nodes[count].name);
                }
            }
        }
        console.log('objectName: ', objectName);
        console.log('fields: ', fields);
        if(objectName !== '') {
            //Info.display(SOQL.buildQuery(objectName, fields), 'query.txt');
        }
    }

    

    public static prepare(node: SFTreeItem, nodes: SFTreeItem[]) {
        const CONFIG = vscode.workspace.getConfiguration('Explorer');
        console.log(CONFIG.get('Multiselect'));
        // Checking if multiselect mode is off
        if(CONFIG.get('Multiselect')) {
            // Do nothing
        } else {
            if(node.contextValue === Constants.OBJECT_CONTEXT ) {
                if(SOQL.objectName !== node.label) {
                    SOQL.objectName = node.label;
                    SOQL.fields = new Set();
                }
            } else if(node.contextValue === Constants.FIELD_CONTEXT) {
                if(SOQL.objectName !== node.parentNode) {
                    SOQL.objectName = node.parentNode;
                    SOQL.fields = new Set();
                }
                SOQL.fields.add(node.name);
            }
            if(SOQL.objectName) {
                //Info.display(SOQL.buildQuery(SOQL.objectName, SOQL.fields), 'query.txt');
            }
        }
    }
}

