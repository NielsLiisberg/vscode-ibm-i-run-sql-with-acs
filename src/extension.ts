import * as vscode from 'vscode';
import * as cp from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Activation ACS ');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable =  vscode.commands.registerCommand('extension.ibmiRunSqlFromAcs', async (p1) => {


		// Run the ACS plugin for SQL
		const config = vscode.workspace.getConfiguration("ibm-i-run-sql-from-acs")
		let   host:string    = config.get('host')   || '' 
		const schema:string  = config.get('schema') || ''
		const acsjar:string  = config.get('acsjar') || ''
		
		if ( acsjar <= '' ) {
			vscode.window.showInformationMessage('You need to configure the bundle jar "IBM i run SQL with ACS" ')
			return
		}

		let hosts = host.replace(/[\W_]+/g,' ').split(' ')
		if  (hosts.length >1) {
			const newhost  = await vscode.window.showQuickPick(hosts, { placeHolder: 'Host to run the SQL.' })
			if (! newhost) return 
			host = newhost || ''
		}

		let cmd = `java -jar ${acsjar} /plugin=rss /autorun=0  /file="${p1.path}"`
		
		if ( host > '') {
			cmd += ` /system=${host} `
		}

		if ( schema > '') {
			cmd += ` /database=${schema}  `
		}

		const rc = cp.exec(cmd , (err: any , stdout: string, stderr: string) => {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (err) {
				console.log('error: ' + err);
			}
		});
	});
	
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
