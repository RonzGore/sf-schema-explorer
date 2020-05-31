import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as sfcore from '@salesforce/core';

import { Config } from './config';

export class SFSchemaProvider implements vscode.TreeDataProvider<SFTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<SFTreeItem | undefined> = new vscode.EventEmitter<SFTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<SFTreeItem | undefined> = this._onDidChangeTreeData.event;

	readonly CONNECTION_CONTEXT: string = 'connection';
	readonly OBJECT_CONTEXT: string = 'object';
	readonly FIELD_CONTEXT: string = 'field';


	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: SFTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: SFTreeItem): Thenable<SFTreeItem[]> {
		
		//vscode.window.showInformationMessage('No SFTreeItem in empty workspace');
		if (element) {
			if(element.contextValue === this.OBJECT_CONTEXT) {
				return Promise.resolve(this.getFields(element.connection, element.label));
			// }else if(element.label !== 'Objects' && element.label !== 'Packages' ) {
			// 	return Promise.resolve(this.getFixedChildren(element.description));
			} else if(element.contextValue === this.CONNECTION_CONTEXT) {
				return Promise.resolve(this.getSObjects(element.username));
			}  else {
				return Promise.resolve([]);
			}
		} else {
			return Promise.resolve(this.getConnections());
		}

	}

	private async getConnections(): SFTreeItem[] {
		const connections: any[] | PromiseLike<any[]> = [];
		const orgInfoList = await Config.getAllAliases();
		console.log('orgInfoList: ', orgInfoList);
		orgInfoList.forEach((key, value) => {
			// try {
			// 	const sfConnection = await Config.getConnection(value);
			// 	await sfConnection.query("SELECT Id, Name FROM Account");
			// }catch(error) {
			// 	console.error(error);
			// 	value = `${value}-Inactive`;
			// }
			const connection = new SFTreeItem(key, value, vscode.TreeItemCollapsibleState.Collapsed);
			connection.username = value;
			connection.setContext(this.CONNECTION_CONTEXT);
			connections.push(connection);
		});
		return connections;
	}

	private async getSObjects(username: string) : SFTreeItem[] {
		const conn = await Config.getConnection(username);
		console.log('connection accessToken', conn.accessToken);
		const metadata = await Config.getObjects(conn);
		console.log('metadata.length: ', metadata.length);
		const sObjects: SFTreeItem[] = [];
		for(let count=0; count < metadata.length; count++ ) {
			const sObject = new SFTreeItem(metadata[count].fullName, metadata[count].fullName, 
				vscode.TreeItemCollapsibleState.Collapsed);
			sObject.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark','objects.svg'), null);
			sObject.setContext(this.OBJECT_CONTEXT);
			sObject.connection = conn;
			sObjects.push(sObject);
		}
		return sObjects;
	}
	
	private async getFields(conn: sfcore.Connection, sObjectName: string) : SFTreeItem[] {
		const metadata = await Config.fetchFields(conn, sObjectName);
		console.log('metadata.length: ', metadata.length);
		const sObjectFields: SFTreeItem[] = [];
		for(let count=0; count < metadata.length; count++ ) {
			const sObjectField = new SFTreeItem(metadata[count].fullName, 
				metadata[count].fullName, vscode.TreeItemCollapsibleState.None);
			sObjectField.setCommand({
					command: 'extension.insertField',
					title: '',
					arguments: [sObjectField]});
			sObjectField.parentNode = sObjectName;
			sObjectField.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark', 'fields.svg'), null);
			sObjectField.setContext(this.FIELD_CONTEXT);
			sObjectFields.push(sObjectField);
		}
		return sObjectFields;
	}

	public checkConnection(node: SFTreeItem) {
		node.setDescription(`${node.description}-Inactive`);
	}

	// private getFixedChildren(username: string): SFTreeItem[] {
	// 	const connections: SFTreeItem[] = [];
	// 	const objects = new SFTreeItem('Objects', 'List of Salesforce Objects', vscode.TreeItemCollapsibleState.Collapsed);
	// 	objects.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark', 'folder-container.svg'), null);
	// 	objects.username = username;
	// 	connections.push(objects);
	// 	const packages = new SFTreeItem('Packages', 'List of Deployable packages', vscode.TreeItemCollapsibleState.Collapsed);
	// 	packages.setIconPath( path.join(__filename, '..', '..', 'resources', 'dark', 'folder-dist.svg'), null);
	// 	connections.push(packages);
	// 	return connections;
	// }
}

export class SFTreeItem extends vscode.TreeItem {
	
	public username: string;
	public connection: sfcore.Connection;
	public parentNode: string;

	constructor(
		public readonly label: string,
		public description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label}-${this.description}`;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'connection.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'connection.svg')
	};

	public setIconPath(light: string, dark: string): void {
		this.iconPath.light = light || dark;
		this.iconPath.dark = dark || light;
	}

	public setContext(context: string): void {
		this.contextValue = context;
	}
	
	public setCommand(command: vscode.Command) {
		this.command = command;
	}

	public setDescription(description: string) {
		this.description = description;
	}
}