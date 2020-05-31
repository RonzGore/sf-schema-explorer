'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { SFSchemaProvider, SFTreeItem } from './schemaExplorer'; 
import { SOQL } from './soql';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "schema-explorer" is now active!');
	
	const sFSchemaProvider = new SFSchemaProvider();
	vscode.window.registerTreeDataProvider('schemaExplorer', sFSchemaProvider);
	vscode.commands.registerCommand('schemaExplorer.refreshEntry', () => sFSchemaProvider.refresh());
	vscode.commands.registerCommand('schemaExplorer.refreshNodeAndChildren', (node: SFTreeItem) => sFSchemaProvider.refreshNodeAndChildren(node));
	// Todo: Implement in next version - ddescribe field info and object info in a web-view within VSCode
	// vscode.commands.registerCommand('schemaExplorer.describeField',  (node: SFTreeItem) => SOQL.prepare(node));
	vscode.commands.registerCommand('schemaExplorer.insertObject', (node: SFTreeItem) => SOQL.prepare(node));
	vscode.commands.registerCommand('extension.insertField', (node: SFTreeItem) => SOQL.prepare(node));
}

// this method is called when your extension is deactivated
export function deactivate() {}
