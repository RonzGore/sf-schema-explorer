# Salesforce Schema Explorer

![Logo](./media/logo-64.png)

**Disclaimer** This is not an official extension from Salesforce.

Provides ability to explore the schema, namely Objects and fields in a readable format from within the IDE. Also enables targetted retrieval of schema changes made in Salesforce just by clicking on a refresh icon. It also enable users to generate simple SOQL from within the IDE. This extension requires users to have SalesforceDX CLI installed on their computer and works with both scratch orgs and Non-scratch orgs. 

It is highly recommended to use with Salesforce Extension Pack to get all the other good things salesforce official extension offers (https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode).

# Requirements


This VSCode extension works only once you have installed Salesforce CLI on your computer.

1. Install SFDX CLI from https://developer.salesforce.com/tools/sfdxcli based on your operating system.
2. Requires VSCode version 1.40 and beyond.

# Features

1. **Get a list of all the orgs which has been authenticated using SFDX CLI**

![List all Orgs](./media/connections.png)

2. **Shows Salesforce Objects from selected org.**

![List all Orgs](./media/sobjects.png)

3. **Shows all the Fields from the selected Object.**

![List all Orgs](./media/fields.png)

4. **Create a simple SOQL by clicking on the fields of your choice.**

*Note:* To use this feature user must be inside a VSCode Workspace/Project

![List all Orgs](./media/soql.png)