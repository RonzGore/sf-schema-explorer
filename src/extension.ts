'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { SFSchemaProvider, SFTreeItem, SFSchemaExplorer } from './schemaExplorer'; 
import { SOQL } from './soql';
import { Info } from './info';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "schema-explorer" is now active!');
	console.dir(context.globalState);
	console.log(context.extensionPath);
	new SFSchemaExplorer(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
