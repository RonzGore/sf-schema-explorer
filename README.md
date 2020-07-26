# Salesforce Schema Explorer

![Logo](./media/logo-128.png)

[![Version](https://vsmarketplacebadge.apphb.com/version/RohanGore.schema-explorer.png)](https://marketplace.visualstudio.com/items?itemName=RohanGore.schema-explorer)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/RohanGore.schema-explorer.png)](https://marketplace.visualstudio.com/items?itemName=RohanGore.schema-explorer)
[![Downloads](https://vsmarketplacebadge.apphb.com/downloads/RohanGore.schema-explorer.png)](https://marketplace.visualstudio.com/items?itemName=RohanGore.schema-explorer)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating/RohanGore.schema-explorer.png)](https://vsmarketplacebadge.apphb.com/rating/RohanGore.schema-explorer.svg)

**Disclaimer** This is not an official extension from Salesforce.

First of all thanks to [Neha Mishra](https://github.com/NehaMishraGitHub) for all her contribution and I hope to see more PRs coming from her.
I always wanted this feature to be part of any Salesforce based IDEs from the day
I stopped using Force.com IDE (an eclipse plugin). It used to have a nice Schema Explorer and Query Builder.
This extension is in early beta kind of a phase and in no way close to it's inspiration (Force.com IDEs Schema Explorer). 
Also it does not guarantee production grade results and may have bugs. But still giving it a try will not break your system 
or project!:laughing: :stuck_out_tongue_closed_eyes: So please give it a try.

Provides ability to explore the schema, namely Objects and fields in a readable format from within the IDE. Also enables targetted retrieval of schema changes made in Salesforce just by clicking on a refresh icon. It also enable users to generate simple SOQL from within the IDE. This extension requires users to have SalesforceDX CLI installed on their computer and works with both scratch orgs and Non-scratch orgs. 


It is highly recommended to use with Salesforce Extension Pack to get all the other good things [salesforce official extension](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode) offers.

# Requirements

This VSCode extension works only once you have installed Salesforce CLI on your computer.

1. Install SFDX CLI from [here](https://developer.salesforce.com/tools/sfdxcli) based on your operating system.
2. Requires VSCode version 1.40 and beyond. May work in older versions. Have not tested though! 

# Features 
## (No more switching back and forth to workbench or any other similar tools for Schema Exploration while you are busy writing awesome software in your IDE) 

![Schema Explorer](./media/sf-schema-explorer.gif)

1. **Get a list of all the orgs which have been authenticated using SFDX CLI**

![List all Orgs](./media/connections.png)

2. **Get more information about the orgs(we can also call them connections) and open them in browser**

![Info of Orgs and Open the Org](./media/org-info-open.gif)

3. **Get a list of Salesforce Objects(Including non customizable objects like ListViews, ApexClasses etc.) from the selected org and get a lot more info for any of these objects at the click of a button; whether the object is triggerable, searchable, child relationships etc.**

![List all Objects](./media/list-objects.gif)

4. **Get a list of all the Fields and parent relationship fields from the selected Object and get more info for any of these objects at the click of a button; whether the field is aggregatable, updateable etc.**

![List all fields](./media/list-fields.gif)

5. **Create and run SOQLs (parent relationships upto 5 levels are supported) by clicking on the fields/relationships of your choice. You can either work in single-select(Default) or multiselect mode**

![Create SOQLs](./media/CreateSOQL.png)

# Issue Reporting/Feature Requests

You can reach out to me via my twitter handle @RonzGore or create a Git Hub :octocat: Issue [here](https://github.com/RonzGore/sf-schema-explorer/issues).
Please find the templates for issues and feature requests [here](https://github.com/RonzGore/sf-schema-explorer/blob/master/.github/ISSUE_TEMPLATE/bug_report.md) and [here](https://github.com/RonzGore/sf-schema-explorer/blob/master/.github/ISSUE_TEMPLATE/feature_request.md).
This is not a commercial Software and I built it during my spare time to solve a simple problem of
looking into Salesforce Object and field names without getting out of my IDE. So I may not be able
to immediately respond back to an issue or a feature.
Though there are definitely plans to improve and adding more features (Please go through the Roadmap section) 
and if you feel there is a feature which is worth, feel free to reach out to me or contribute 
as this Software is open source. PRs are super welcome!

# Roadmap (Not in any particular order) :rocket:

1. Orgs Management(View more info
    1.a. View More info - Delivered
    1.b. Create,delete, clone and edit
2. Get Objects and fields metadata info (whether the field is updateable etc.) - Delivered
3. Salesforce Deployable Package Creation and Management. Once this is out, the extension name may need to be changed as it would no longer just be a Schema Explorer then (This one is my favorite and my Admin friends will love it!) :hearts:
4. Inline insertion of fields and queries in your code files
5. Support for complex queries with relationships - Delivered
6. Your requested or contributed features! :+1:

# Release Notes

### 0.5.1
1. Fixed the issue: 'Getting message that at least one org should be authenticated' even
when the orgs are authenticated. Thanks @dkadam77 for testing on a Windows machine and suggesting the fix.
2. Fields in the explorer render sorted-by field labels alphabatically. Earlier only
connections and objects were rendered alphabatically. 

### 0.5.0
1. Multilevel support upto 5 level for object and fields
2. Copy any field or object name to clip board
3. Generate and run SOQL query
4. Copy SOQL query to clipboard
5. Org, object and field info in a more user friendly and readable format
![Org, Object and Field Info More Readable](./media/MoreInfo.png)

### 0.2.6
1. Performance improvements while fetching objects and fields
2. Get More Info about objects and fields
3. Support for relationship fields
4. Support for multiselect while building SOQL queries
5. Support for non customizable objects like ListViews, Apex Class etc.
6. For Generating Queries, no more need to be in a Project or Workspace.

### 0.1.5

Initial Version released




# 
Enjoy!!
