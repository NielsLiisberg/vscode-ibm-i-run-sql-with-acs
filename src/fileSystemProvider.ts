/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as Client from 'ssh2';
import * as path from 'path';
import * as vscode from 'vscode';


export class File implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data?: Uint8Array;

    constructor(name: string) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export class Dirent implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;
    name: string;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export type Entry = File | Directory;

type NewType = Promise<[string, vscode.FileType][]>;

export class IbmiFS implements vscode.FileSystemProvider {

    root = new Directory('')
    client: any  = new Client()
    sysconfig: any
    sftp: any
    initialized: boolean = false
    buildProcsDone = false

    
    
    constructor() {
        console.log(vscode.env.appRoot)
    }

    async initialize  (): Promise<string> {
        return new Promise<string>(async (resolve, _reject) => {

            let me = this

            me.sysconfig = vscode.workspace.getConfiguration('ibmifs');
            console.log("Initializing")
            if (me.initialized) {
                resolve("ok")
            } 

            me.initialized = true

            if (!me.sysconfig.host) {
                let result = await vscode.window.showInputBox({
                    placeHolder: 'Enter name of your IBM i'
                })
                await vscode.workspace.getConfiguration('ibmifs').update('host', result);
                me.sysconfig = vscode.workspace.getConfiguration('ibmifs');
                vscode.workspace.updateWorkspaceFolders(0, 0, { 
                    uri: vscode.Uri.parse('ibmifs:/'), 
                    name: me.sysconfig.host
                })
            }
            if (!me.sysconfig.user) {
                let result = await vscode.window.showInputBox({
                    placeHolder: 'Enter user id on your IBM i ' + me.sysconfig.host
                })
                await vscode.workspace.getConfiguration('ibmifs').update('user', result);
                me.sysconfig = vscode.workspace.getConfiguration('ibmifs');
            }
            if (!me.sysconfig.password) {
                let result = await vscode.window.showInputBox({
                    placeHolder: 'Enter your password on ' + me.sysconfig.host + ' for ' + me.sysconfig.user
                })
                await vscode.workspace.getConfiguration('ibmifs').update('password', result)
                me.sysconfig = vscode.workspace.getConfiguration('ibmifs')
            }

            if (!me.sysconfig.libraries) {
                let result = await vscode.window.showInputBox({
                    placeHolder: 'Enter list of libraries, Generic*, *ALL (Seperated by blanks)'
                })
                await vscode.workspace.getConfiguration('ibmifs').update('libraries', result)
                me.sysconfig = vscode.workspace.getConfiguration('ibmifs')
            }
            if (!me.sysconfig.sourcefiles) {
                let result = await vscode.window.showInputBox({
                    placeHolder: 'Enter list of sourcefiles, Generic*, *ALL (Seperated by blanks)'
                })
                await vscode.workspace.getConfiguration('ibmifs').update('sourcefiles', result);
                me.sysconfig = vscode.workspace.getConfiguration('ibmifs')
            }
            me.client.connect({
                host: me.sysconfig.host,
                user: me.sysconfig.user,
                password: me.sysconfig.password
            })

            me.client.on('ready', async () => {
                console.log("Connection ready")
                this.client.sftp(async (err:any, sftp:any) => {
                    me.sftp = sftp
                    await me.buildProcs()
                    console.log("... initialized")
                    resolve("")
                })
            })
        })
    }

    // --- manage file metadata
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        console.log('Stat:' + uri.fsPath);
        return new  ibmiStat (uri.fsPath);
    }

    /*
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        return this._stat(uri.fsPath);
    }
    */
    /*
    async _stat(path: string): Promise<vscode.FileStat> {
        const res = await _.statLink(path);
        return new FileStat(res.stat, res.isSymbolicLink);
    }
    */
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        return this._readDirectory(uri);
    }
/*
readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        console.log('Load: ' + uri.fsPath);
        if (uri.fsPath == '/') {
            const result: [string, vscode.FileType][] = [];
            result.push(['/QSYS.LIB/', vscode.FileType.Directory]);
            return this.log(result);
        
        } else if (uri.fsPath == '/QSYS.LIB/') {
            const result: [string, vscode.FileType][] = [];
            result.push([ this.sysconfig.filter[0].library + '.LIB/' , vscode.FileType.Directory]);
            //result.push([ uri.fsPath + '/' + this.sysconfig.filter[0].library + '.LIB' , vscode.FileType.Directory]);
            return this.log(result);
            
        } else if (uri.fsPath == '/QSYS.LIB/') {
        //} else if (uri.fsPath == '/QSYS.LIB/' + this.sysconfig.filter[0].library+ '.LIB/') {
            const result: [string, vscode.FileType][] = [];
            for (let i = 0; i < this.sysconfig.filter.length; i++) {
                const child = this.sysconfig.filter[i];
                const dirent = uri.fsPath  + child.file + '.FILE';
                //const dirent = child.file + '.FILE';
                //console.log("My dirs" + dirent);
                result.push([dirent, vscode.FileType.Directory]);
            }
            return this.log(result);
        } else {
            console.log("Get list" + uri.fsPath);
            return this._readDirectory(uri);
        }
    }
*/

    lookupdirent(entry:string, dirent:[string,vscode.FileType][]): number {
        for (let i:number=0; i<dirent.length; i++) {
            if (dirent[i][0] == entry) {
                return i;
            }
        }
        return -1
    }  


    async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]>{
        console.log("Open of:" + uri.fsPath)
        if (uri.fsPath == '/' || ! this.sysconfig) {
            await this.initialize() 
        }
        const result: [string, vscode.FileType][] = []
        const pathDepth = uri.fsPath == '/' ? 0 : uri.fsPath.split("/").length -1
        const libs      = this.sysconfig.libraries.split(" ") 
        const srcfiles  = this.sysconfig.sourcefiles.split(" ") 
        

        switch (pathDepth) {
            // Root
            case 0: { 
                const result: [string, vscode.FileType][] = [];
                result.push(['QSYS.LIB', vscode.FileType.Directory]);
                return Promise.resolve(result);
            }
            // Libraries 
            case 1: {
                const result: [string, vscode.FileType][] = [];    
                for (let i = 0; i < libs.length; i++) {
                    const dirent = libs[i];
                    if (this.lookupdirent (dirent , result) == -1) {
                        result.push([ dirent + '.LIB', vscode.FileType.Directory ]);
                    } 
                }
                return Promise.resolve(result);
            }
            // Files
            case 2: {
                const result: [string, vscode.FileType][] = []
                const lib: string = uri.fsPath.split("/")[2]
                for (let i = 0; i < libs.length; i++) {
                    const clib = libs[i]
                    if  (lib == clib  + '.LIB') {
                        for (let j = 0; j < srcfiles.length; j++) {
                            const dirent = srcfiles[j]
                            //const dirent = uri.fsPath  + child.file + '.FILE';
                            if (this.lookupdirent (dirent , result) == -1) {
                                result.push([dirent + '.FILE', vscode.FileType.Directory ])
                            }
                        }
                    }
                }
                return Promise.resolve(result);
            }
            case 3: {
                const children= await this.readdir(uri.fsPath); 
                for (let i = 0; i < children.length; i++) { 
                    const child = children[i]
                    //console.dir(child);
                    //const stat = await this._stat(path.join(uri.fsPath, child));
                    //result.push([ child.name, child.type == 'd' ? vscode.FileType.Directory : vscode.FileType.File]);
                    result.push([ child.name, vscode.FileType.File])
                }
                return Promise.resolve(result);
            }
        }
        return []
    }

    



    async exec (cmd: string): Promise<string> {
        console.log(path);
        const myssh = this.client;
        return new Promise<string>((resolve: (arg0: string) => void, _reject: any) => {

            console.log(cmd)
            var outstr = ''

            myssh.exec(cmd, (err:any, stream:any) => {
                if (err) throw err;
                stream.on('close', () => {
                    console.log('Stream :: close');
                    //myssh.end();
                    resolve(outstr)
                    stream.destroy()
                }).on('data', (data:any) => {
                    outstr += data
                }).on('error', (data:any) => {
                    _reject(data)
                    stream.destroy()
                })
            })
        })
    }

    async runSQL (sql: string): Promise<string> {
        const sqlEsc = sql.replace(/\'/g,"''").replace(/\"/g,"\\\"")
        const cmd = `system -i -O  "call QSYS/QZDFMDB2 parm('${sqlEsc}')" | iconv -f CP1252 -t utf-8`
        return await this.exec (cmd);
    }

    async runSQLquery (sql: string): Promise<string> {
        const sqlEsc = sql.replace(/\'/g,"''").replace(/\"/g,"\\\"")
        const cmd = `system -i -O  "call QSYS/QZDFMDB2 parm('${sqlEsc}')"  | sed '1,3d' | sed '/RECORD/d' | iconv -f CP1252 -t utf-8`
        return await this.exec (cmd);
    }

    async runcmd (cmd: string): Promise<string>  {
        return await this.exec( `system -i -O  "${cmd}"`);
    }
    

    async readdir(path: string): Promise<Dirent[]> {
        const me = this
        console.log(". . read dir . . " + path)

        const obj = this.splitPath2object(path); 
        obj.mbr = "*"
        const mbrtype = "*"

        return new Promise<Dirent[]>(async (resolve, _reject) => {
            let buf:string = await me.runSQLquery(`
                Select '{"file":"'  
                concat trim (TABLE_PARTITION) 
                concat '.' concat trim(ifnull(source_type, 'UNKNOWN')) 
                concat  '","size":'  
                concat varchar(number_ROWS * avgrowsize)  
                concat  ',"ctime":"'  
                concat TO_CHAR(CREATE_TIMESTAMP, 'YYYY-MM-DD HH:MM:SS') 
                concat  '","mtime":"' 
                concat TO_CHAR(LAST_SOURCE_UPDATE_TIMESTAMP, 'YYYY-MM-DD HH:MM:SS') 
                concat  '"},' as rowdata
                from table(qsys2.partition_statistics('${obj.lib}         ' , '${obj.file}         ')) a 
                where  (system_table_member like replace(trim('${obj.mbr}') ,'*' , '%'))
                and   (source_type like replace(trim('${mbrtype}') ,'*' , '%'))
            `)

            let resarr:Dirent[] = []; 
            let res = JSON.parse('[' + buf + 'null]');
            for (let row in  res) {
                let currow = res[row]
                if (currow) {
                    let entity:Dirent  = {
                        name : currow.file,
                        type : vscode.FileType.File,
                        size : currow.size,
                        mtime: currow.mtime,
                        ctime: currow.ctime
                    }
                    resarr.push(entity)
                }
            }
            resolve(resarr);
        })
 
        /* WORKS !!!  
        return new Promise<Client.ListingElement[]>((resolve, _reject) => {
            this.client.list(path, (_err, l) => {
                console.log(".... get data" )
                resolve(l);
            });
        })
        */
    }

    /*
            function) {
                if (err) throw err;
                console.dir(list);
                c.end();
              });

            fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
        });
    }
    */


    // --- manage file contents

    readFile(uri: vscode.Uri): Buffer  | Thenable<Buffer> {
        if (uri.fsPath == uri.fsPath.toLowerCase()) {
            const fullName = "/Users/nli/workspace"  + uri.fsPath    // TODO !!!
            console.log("Read" + fullName)
            return fs.readFileSync(fullName);
        }
        return this.filereader(uri.fsPath);
    }


    convertName(path: string) {
        const fa = path.split('/')
        const fileName = '/' 
            + fa[1].split('.')[0] + '.LIB/' 
            + fa[2].split('.')[0] + '.LIB/' 
            + fa[3].split('.')[0] + '.FILE/' 
            + fa[4].split('.')[0] + '.MBR'
        return fileName
    }

    splitPath2object (path: string) {
        const fa = path.split('/')
        return  {
            "lib"  : fa[2].split('.')[0],
            "file" : fa[3].split('.')[0],
            "mbr"  : fa[4] ? fa[4].split('.')[0] : null
        }
    }


    filereader (path: string): Promise<Buffer> {
        const me = this
        const myssh = this.client;
        const fullName = this.convertName(path);

        return new Promise<Buffer >(async (resolve: (arg0: Buffer) => void, _reject: any) => {

            const tempFile = `/tmp/vsCode-${Date.now()}.tmp`
            await me.runcmd ( `CPYTOSTMF FROMMBR('${fullName}') TOSTMF('${tempFile}') STMFOPT(*REPLACE) STMFCCSID(1208)`)      
            
            let buf:string = ""
            const stream = me.sftp.createReadStream(tempFile,{   
                encoding: 'utf8'
            })
            stream.on('error',  (err:any) => { 
                _reject(err.message)
                console.log(err.message)
                //conn.end()
                stream.destroy()
                
            })
            stream.on('data', (chunk:any) => {
                buf += chunk;
            })
            stream.on('end', async ()=> {
                resolve(Buffer.from(buf,'utf8'))
                stream.destroy()
                await me.exec( `rm ${tempFile}`)
            })
           
        })
    }
  

    sftpDirreader (path: string): Promise<Buffer > {
        const myssh = this.client;
        
        console.log(path);
        return new Promise<Buffer >((resolve: (arg0: Buffer) => void, _reject: any) => {
            myssh.sftp(function(err:any, sftp:any) {
                if (err) throw err;
                sftp.readdir('/home/nli', function(err:any, list:any) {
                    if (err) throw err;
                    resolve(Buffer.from(list,'utf8'));
                });
            })
        })
  
        /*
        myssh.get('/tmp/test.txt').then((chunk:any) => {
            console.log(chunk)
        }).catch((err:any) => {
            console.log('catch err:', err)
        })
        */

        /*
        return new Promise<Buffer >((resolve: (arg0: Buffer) => void, _reject: any) => {
            this.client.ascii ((error: any) => {
                if (error) throw error;
            //this.client.rawcmd("TYPE C 1208", (error: Error, responseText: string) => {
            //  if (error) throw error;
            
            //this.client.type (1208 , (_err: any) => {
            //    if (_err) throw _err;
                ;

                // const b = Buffer.from(fileName,'utf8')
                // const t = iconv.decode(b, 'ISO-8859-1')
                this.client.get( this.convertName(path), (_err, stream) => {
                
                    if (_err) throw _err;

                    stream.on('error', (chunk:any) => {
                        if (_err) throw _err;
                    });

                    stream.setEncoding('binary');

                    let buf = '';
                    
                    stream.on('data', (chunk:any) => {
                        buf += chunk;
                    });
                    stream.on('end', ()=> {
                        resolve(Buffer.from(buf,'utf8'));
                    });
                })
                //})
            })
        })
        */
    }

    /*
    readFile(uri: vscode.Uri): Uint8Array {
        console.log(".. read file .. " + uri.fsPath);

        const data = this._lookupAsFile(uri, false).data;
        if (data) {
            return data;
        }
        throw vscode.FileSystemError.FileNotFound();
    }
    */

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
        console.log ("WRITE!!!!" + uri.path);
        this.fileWriter(uri.path, content);
        /*
        let basename = path.posix.basename(uri.path);
        let parent = this._lookupParentDirectory(uri);
        let entry = parent.entries.get(basename);
        if (entry instanceof Directory) {
            throw vscode.FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !options.create) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        if (entry && options.create && !options.overwrite) {
            throw vscode.FileSystemError.FileExists(uri);
        }
        if (!entry) {
            entry = new File(basename);
            parent.entries.set(basename, entry);
            this._fireSoon({ type: vscode.FileChangeType.Created, uri });
        }
        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.data = content;
        */
        ///this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }

    async fileWriter (path: string,content: Uint8Array): Promise<void> {
        const me = this
        return new Promise<void>((resolve: (arg0: void) => void, _reject: any) => {
            
            const tempFile = `/tmp/vsCode-${Date.now()}.tmp`
            const obj = this.splitPath2object (path);

            me.sftp.writeFile(tempFile,content , async (err:any)=> {
                if (err) throw err;
                await me.runSQL  (`call qgpl.cpy_stmf_to_srcpfm ( '${obj.lib}' , '${obj.file}' , '${obj.mbr}' , '${tempFile}')`)
                await me.exec( `rm ${tempFile}`)
            })
        })
    }            

    

    // --- manage files/folders

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {

        console.log(oldUri);
        console.log(newUri);
        
    
    /*    if (!options.overwrite && this._lookup(newUri, true)) {
            throw vscode.FileSystemError.FileExists(newUri);
        }
    */
        this._fireSoon(
            { type: vscode.FileChangeType.Deleted, uri: oldUri },
            { type: vscode.FileChangeType.Created, uri: newUri }
        );
    }

    delete(uri: vscode.Uri): void {
        let dirname = uri.with({ path: path.posix.dirname(uri.path) });
        let basename = path.posix.basename(uri.path);
        let parent = this._lookupAsDirectory(dirname, false);
        if (!parent.entries.has(basename)) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        parent.entries.delete(basename);
        parent.mtime = Date.now();
        parent.size -= 1;
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { uri, type: vscode.FileChangeType.Deleted });
    }



    createDirectory(uri: vscode.Uri): void {
        console.log("MKDIR " + uri.fsPath)
        /* 
        let basename = path.posix.basename(uri.path);
        let dirname = uri.with({ path: path.posix.dirname(uri.path) });
        let parent = this._lookupAsDirectory(dirname, false);

      
        let entry = new Directory(basename);
        parent.entries.set(entry.name, entry);
        parent.mtime = Date.now();
        parent.size += 1;
        */
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri: uri }, { type: vscode.FileChangeType.Created, uri });
    }

    // --- lookup

    private _lookup(uri: vscode.Uri, silent: false): Entry;
    private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
    private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
        let parts = uri.path.split('/');
        let entry: Entry = this.root;
        for (const part of parts) {
            if (!part) {
                continue;
            }
            let child: Entry | undefined;
            if (entry instanceof Directory) {
                child = entry.entries.get(part);
            }
            if (!child) {
                if (!silent) {
                    throw vscode.FileSystemError.FileNotFound(uri);
                } else {
                    return undefined;
                }
            }
            entry = child;
        }
        return entry;
    }

    private _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Directory {
        let entry = this._lookup(uri, silent);
        if (entry instanceof Directory) {
            return entry;
        }
        throw vscode.FileSystemError.FileNotADirectory(uri);
    }

    private _lookupAsFile(uri: vscode.Uri, silent: boolean): File {
        let entry = this._lookup(uri, silent);
        if (entry instanceof File) {
            return entry;
        }
        throw vscode.FileSystemError.FileIsADirectory(uri);
    }

    private _lookupParentDirectory(uri: vscode.Uri): Directory {
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        return this._lookupAsDirectory(dirname, false);
    }

    // --- manage file events

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;

    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    watch(_resource: vscode.Uri): vscode.Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
        this._bufferedEvents.push(...events);

        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }

        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }

    async buildProcs (): Promise<void> {
        
        if (this.buildProcsDone) return;
        
        this.buildProcsDone = true;

        await this.runSQL('drop type qgpl.srcArr');
        await this.runSQL('drop type qgpl.smallintArr');
        await this.runSQL('create  type qgpl.srcArr as char(200) array[]');
        await this.runSQL('create  type qgpl.smallintArr as smallint array[]');

        await this.runSQL(`
            create or replace procedure qgpl.cpy_stmf_to_srcpfm(
                in toLib     char(10),
                in tofile    char(10),
                in toMbr     char(10),
                in fromStmf  varchar(256)
            ) 
            no external action
            set option dbgview = *source , output=*print , commit=*none, datfmt=*iso
            --set option commit=*none
            
            begin 
                declare arrNew      srcArr;
                declare arrOld      srcArr;
                declare arrLenNew   int;
                declare arrLenOld   int;
                declare relNew      smallintArr;
                declare relOld      smallintArr;
                declare ixNew       int;
                declare ixOld       int;
                declare ixCntNew    int;
                declare ixCntOld    int;
                declare cnt         int;
                declare topOld      int;
                declare topNew      int;
                declare maxcnt      int default 0;
                declare i int;
                declare j int;
                    
                call qcmdexc ('CPYF FROMFILE((' || tolib ||')/(' ||tofile ||')) TOFILE(QTEMP/XXORGSRC) CRTFILE(*YES) FROMMBR(' || toMbr || ') TOMBR(XXORGSRC) MBROPT(*REPLACE) FMTOPT(*MAP)');
                call qcmdexc ('OVRDBF FILE(XOLD) TOFILE(QTEMP/XXORGSRC) MBR(XXORGSRC) OVRSCOPE(*JOB)'); 
                call qcmdexc ('OVRDBF FILE(XNEW) TOFILE((' || tolib ||')/(' ||tofile ||')) MBR(' || toMbr || ') OVRSCOPE(*JOB)'); 
                call qcmdexc ('CPYFRMSTMF FROMSTMF('''  || fromStmf || ''')  TOMBR(''/QSYS.LIB/' || rtrim(tolib)  || '.LIB/' || rtrim(toFile) || '.FILE/' || rtrim(toMbr) || '.MBR'') MBROPT(*REPLACE) STMFCCSID(1208)');                                       
                                
                set arrNew  = (select array_agg(srcdta) from xnew );
                set arrOld  = (select array_agg(srcdta) from xold );
                
                set arrLenNew  = cardinality(arrNew);
                set arrLenOld  = cardinality(arrOld);
            
                set i =1;
                while i <= arrLenNew do
                    set relNew [i] = null;
                    set i = i + 1;
                end while; 
            
                set i =1;
                while i <= arrLenOld do
                    set relOld [i] = null;
                    set i = i + 1;
                end while; 
                    
                repeat 
                    set ixNew = 1;
                    set maxcnt =0;
                    while ixNew <= arrLenNew do
                        if relNew[ixNew] is null then 
                            set ixOld =1;
                            while ixOld <= arrLenOld do
                                if relOld[ixOld] is null and arrNew[ixNew] = arrOld[ixOld] then 
                                    set cnt = 0;
                                    repeat 
                                        set cnt = cnt + 1;
                                        set ixNew = ixNew +1;
                                        set ixOld = ixOld +1;
                                    until ixNew > arrLenNew or ixOld > arrLenOld or arrNew[ixNew] <> arrOld[ixOld] 
                                    end repeat;     
                                    if cnt > maxcnt then
                                        set maxcnt = cnt;
                                        set topNew = ixNew - cnt;
                                        set topOld = ixOld - cnt;
                                        --insert into trace (values('max ' || maxcnt));
                                    end if;
                                    set ixNew = ixNew -1;
                                    set ixOld = ixOld -1;
                                end if;
                                set ixOld = ixOld +1;
                            end while;
                        end if;  
                        set ixNew = ixNew +1;
                    end while;
                    -- 
                    set i = 0;
                    while i < maxcnt do
                        set relNew [topNew + i] = topOld + i;
                        set relOld [topOld + i] = topNew + i;
                        set i = i + 1;
                    end while;
                    --insert into trace (text) select 'new' || t.n from unnest (relNew) as T(n);
                    --insert into trace (text) select 'old' || t.n from unnest (relOld) as T(n);
                until maxcnt =0
                end repeat;
            
                update xnew
                set    srcseq = rrn(xnew);
            
                update xnew 
                set srcdat = ifnull(
                    ( 
                        select srcdat 
                        from xold 
                        where rrn(xold) = relNew[xnew.srcseq]
                    ), dec(to_char(now(),'YYMMDD'))
                );
                
                    
                -- insert into trace (text) select t.n from unnest (relNew) as T(n);
            end; 

        })`);
    }
}
export class ibmiStat implements vscode.FileStat {

    type: vscode.FileType = vscode.FileType.File; // assume file
    ctime: number = 0;
    mtime: number = 0;
    size: number = 0;

    name: string;

    constructor(name: string) {

        this.name = name;
        if (name != '/' && name == name.toLowerCase()) {
            const fullName = "/Users/nli/workspace"  + name    // TODO !!!
            let f  :fs.Stats;
            //try {
                 f =  fs.statSync(fullName)
            //} catch(e) {
            //    console.log(e)
            //}

            this.type = f.isDirectory ? vscode.FileType.Directory :vscode.FileType.File 
            this.ctime = f.ctime.getDate();
            this.mtime = f.mtime.getDate();
            this.size =  f.size;
            console.dir(this)
            return;
        }
        
        // QSYS.LIB - stuff
        // this.type = name.endsWith("MBR") ?  vscode.FileType.File : vscode.FileType.Directory;
        //this.type = name.split('/').length <= 4  ? vscode.FileType.Directory :vscode.FileType.File
        this.type = name == '/' || name.endsWith("LIB") || name.endsWith("FILE") ? vscode.FileType.Directory :vscode.FileType.File
        this.ctime = Date.now()
        this.mtime = Date.now()
        this.size = 0
    }
}

