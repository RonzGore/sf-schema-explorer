import * as vscode from 'vscode';

import { SFTreeItem } from './schemaExplorer';
import { Constants } from './constants';
import { FileUtil } from './fileUtil';
import { SOQLView } from './views/soql';

export class SOQL {
    private static objectName: string;
    private static fields: any;
    public context: vscode.ExtensionContext;
    public util: FileUtil;
    public soqlView: SOQLView;


    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.util = new FileUtil(context);
        this.soqlView = new SOQLView(context);
    }
    
    private static buildQueryForWebView(objectName: string, fields: any) : string {
        let query = 'SELECT ';
        for (let field of fields) {
            query += `${field}, `;
        }
        let index = query.lastIndexOf(',');
        query = query.slice(0, index);
        query += ` FROM ${objectName}`;
        return query;
    }

    private static buildQueryForFile(objectName: string, fields: any) : string {
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

    public prepareSOQLForMultiSelect(nodes: SFTreeItem[]) {
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

        return { 
            objectName: objectName,
            fields: fields
        };
    }

    public prepareSOQLInFileForMultiSelect(nodes: SFTreeItem[]) {
        const queryHelper = this.prepareSOQLForMultiSelect(nodes);
        if(queryHelper.objectName !== '') {
            this.util.displayContentInFile(SOQL.buildQueryForFile(queryHelper.objectName, queryHelper.fields), 'query.txt');
        }
    }

    public prepareSOQLInWebViewForMultiSelect(nodes: SFTreeItem[]) {
        const queryHelper = this.prepareSOQLForMultiSelect(nodes);
        if(queryHelper.objectName !== '') {
            this.soqlView.displaySOQL(SOQL.buildQueryForWebView(queryHelper.objectName, queryHelper.fields), nodes[0].username);
        }
    }

    public prepareSOQL(node: SFTreeItem) {
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
        return {
            objectName: SOQL.objectName, 
            fields: SOQL.fields
        }
    }

    public prepareSOQLInFile(node: SFTreeItem){
        const CONFIG = vscode.workspace.getConfiguration('Explorer');
        console.log(CONFIG.get('Multiselect'));
        if(CONFIG.get('Multiselect')) {
            // Do nothing
        } else {
            const queryHelper = this.prepareSOQL(node);
            if(SOQL.objectName) {
                this.util.displayContentInFile(SOQL.buildQueryForFile(queryHelper.objectName, 
                    queryHelper.fields), 'query.txt');
            }
        }
    }

    public prepareSOQLInWebView(node: SFTreeItem){
        const CONFIG = vscode.workspace.getConfiguration('Explorer');
        console.log(CONFIG.get('Multiselect'));
        if(CONFIG.get('Multiselect')) {
            // Do nothing
        } else {
            const queryHelper = this.prepareSOQL(node);
            if(SOQL.objectName) {
                this.soqlView.displaySOQL(SOQL.buildQueryForWebView(queryHelper.objectName, queryHelper.fields), node.username);
            }
        }
    }
}

