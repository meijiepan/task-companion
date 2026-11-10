// The build inserts page.html at __PAGE__.
const PAGE = __PAGE__;
const PANEL = __PANEL__;
const URI = 'ui://task-companion/panel-v4.html';
const UI_MIME = 'text/html;profile=mcp-app';
const CAPABILITIES = {tools:{},resources:{},extensions:{'io.modelcontextprotocol/ui':{}}};
const legalPage = kind => {
  const privacy = kind==='privacy', support=kind==='support';
  const heading=privacy?'Privacy / 隐私':support?'Support / 支持':'Terms / 使用条款';
  const content=privacy
    ? '<p>Task Companion stores your project titles, task titles, completion times, and selected tasks in its hosted database. Records are linked to a Site-scoped ChatGPT user ID. The service does not intentionally store your ChatGPT conversation transcript or an OpenAI API key.</p><p>Task tools read or change tasks only when you or your assistant invoke them. Task content may be sent through ChatGPT when you use the plugin. Export and permanent deletion are available in the app. Hosting and platform providers process data to operate the service.</p><p>Task Companion 保存项目名称、任务名称、完成时间和当前选中的任务，并使用此站点专属的 ChatGPT 用户 ID 区分账号。本服务不主动保存聊天全文或 OpenAI API 密钥。你可以在应用中导出或永久删除任务数据。</p>'
    : support
    ? '<p>For a bug or account question, open an issue at <a href="https://github.com/meijiepan/task-companion/issues">github.com/meijiepan/task-companion/issues</a>. Include the steps and visible error, without posting task contents, keys, or private chat text.</p><p>如需帮助，请到 GitHub Issues 提交问题和复现步骤，不要公开任务内容、密钥或私人聊天。</p>'
    : '<p>Task Companion is an open-source task organizer provided as-is. You remain responsible for the content you enter and for checking task results. Do not store sensitive information you are unwilling to share with the hosting and ChatGPT platforms. You may stop using the service and delete your data at any time.</p><p>本工具按现状提供。请自行核对任务内容与结果；不要输入你不愿与托管平台及 ChatGPT 平台分享的敏感信息。你可以随时删除自己的数据。</p>';
  return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+heading+' · Task Companion</title><body style="font:16px/1.7 system-ui;max-width:720px;margin:40px auto;padding:20px;color:#244533"><a href="/">← Task Companion</a><h1>'+heading+'</h1>'+content+'<p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a></p></body></html>';
};
const stamp = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const check = (x, max=160) => { if(typeof x!=='string'||!x.trim()||x.trim().length>max) throw Error('Text must be 1–'+max+' characters'); return x.trim(); };
const title = (x, fallback) => x ? check(x) : fallback;
const response = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const user = req => req.headers.get('oai-authenticated-user-id');
const query = (env,sql,...values) => env.DB.prepare(sql).bind(...values);
async function project(env,u,id) {
  const p=await query(env,'SELECT * FROM projects WHERE id=? AND user_id=?',id,u).first();
  if(!p) throw Error('Project not found'); return p;
}
async function task(env,u,p,id) {
  const t=await query(env,'SELECT * FROM tasks WHERE id=? AND project_id=? AND user_id=?',id,p,u).first();
  if(!t) throw Error('Task not found'); return t;
}
async function state(env,u,id) {
  const projects=(await query(env,'SELECT id,title_zh,title_en,updated_at FROM projects WHERE user_id=? ORDER BY updated_at DESC',u).all()).results;
  id=id||projects[0]?.id;
  if(!id) return {projects,project:null,tasks:[],progress:{done:0,total:0}};
  const p=await project(env,u,id);
  const rows=(await query(env,'SELECT id,parent_id,title_zh,title_en,sort_order,completed_at FROM tasks WHERE project_id=? AND user_id=? ORDER BY sort_order,created_at',id,u).all()).results;
  const groups=new Map();
  for(const t of rows){const key=t.parent_id||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
  const ordered=[];function visit(parent,depth=0){if(depth>20)return;for(const t of groups.get(parent)||[]){ordered.push(t);visit(t.id,depth+1);}}visit('');
  const leaves=ordered.filter(t=>!groups.has(t.id));
  return {projects,project:{id:p.id,title_zh:p.title_zh,title_en:p.title_en,selected_task_id:p.selected_task_id},tasks:ordered,progress:{done:leaves.filter(t=>!!t.completed_at).length,total:leaves.length}};
}
const DEMO=[
  [null,'准备阶段','Preparation'],[0,'确认 Mac 芯片类型','Check your Mac chip'],[0,'下载对应 Mac 安装包','Download the matching Mac installer'],
  [null,'安装阶段','Installation'],[3,'打开下载的磁盘映像','Open the disk image'],[3,'将 GanttProject 移至“应用程序”','Move GanttProject to Applications'],
  [3,'首次启动并确认正常运行','Launch and verify'],[3,'删除安装包','Delete the installer'],
  [null,'验证阶段','Verification'],[8,'创建一个示例项目','Create a sample project'],[8,'保存项目并重新打开','Save and reopen the project']
];
async function action(env,u,name,a={}) {
  if(!u) throw Error('Sign in required');
  if(name==='get_projects'||name==='get_tasks'||name==='open_task_panel') return state(env,u,a.project_id);
  if(name==='export_data') return {schema_version:1,exported_at:stamp(),projects:(await query(env,'SELECT id,title_zh,title_en,selected_task_id,created_at,updated_at FROM projects WHERE user_id=?',u).all()).results,tasks:(await query(env,'SELECT id,project_id,parent_id,title_zh,title_en,sort_order,completed_at,created_at,updated_at FROM tasks WHERE user_id=?',u).all()).results};
  if(name==='delete_my_data') {
    if(a.confirm!=='DELETE') throw Error('Confirmation required');
    await env.DB.batch([query(env,'DELETE FROM tasks WHERE user_id=?',u),query(env,'DELETE FROM projects WHERE user_id=?',u)]);
    return {deleted:true};
  }
  if(name==='create_project'||name==='create_demo_project') {
    const id=uuid(),ts=stamp(),zh=name==='create_demo_project'?'GanttProject 安装':check(a.title_zh),en=name==='create_demo_project'?'GanttProject setup':title(a.title_en,zh);
    const writes=[query(env,'INSERT INTO projects(id,user_id,title_zh,title_en,created_at,updated_at) VALUES(?,?,?,?,?,?)',id,u,zh,en,ts,ts)];
    if(name==='create_demo_project') {
      const ids=DEMO.map(uuid);
      DEMO.forEach(([parent,z,e],i)=>writes.push(query(env,'INSERT INTO tasks(id,user_id,project_id,parent_id,title_zh,title_en,sort_order,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',ids[i],u,id,parent===null?null:ids[parent],z,e,i,ts,ts)));
      writes.push(query(env,'UPDATE projects SET selected_task_id=? WHERE id=? AND user_id=?',ids[1],id,u));
    }
    await env.DB.batch(writes);return state(env,u,id);
  }
  const p=check(a.project_id,80);await project(env,u,p);
  if(name==='delete_project') {
    await env.DB.batch([query(env,'DELETE FROM tasks WHERE project_id=? AND user_id=?',p,u),query(env,'DELETE FROM projects WHERE id=? AND user_id=?',p,u)]);
    return state(env,u);
  }
  if(name==='rename_project') {
    const zh=check(a.title_zh);await query(env,'UPDATE projects SET title_zh=?,title_en=?,updated_at=? WHERE id=? AND user_id=?',zh,title(a.title_en,zh),stamp(),p,u).run();return state(env,u,p);
  }
  if(name==='add_subtask') {
    const parent=a.parent_id||null;if(parent)await task(env,u,p,check(parent,80));
    const id=uuid(),ts=stamp(),zh=check(a.title_zh);
    const max=await query(env,'SELECT COALESCE(MAX(sort_order),-1) AS n FROM tasks WHERE project_id=? AND user_id=?',p,u).first();
    const writes=[query(env,'INSERT INTO tasks(id,user_id,project_id,parent_id,title_zh,title_en,sort_order,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',id,u,p,parent,zh,title(a.title_en,zh),max.n+1,ts,ts),query(env,'UPDATE projects SET selected_task_id=?,updated_at=? WHERE id=? AND user_id=?',id,ts,p,u)];
    if(parent)writes.push(query(env,'UPDATE tasks SET completed_at=NULL,updated_at=? WHERE id=? AND project_id=? AND user_id=?',ts,parent,p,u));
    await env.DB.batch(writes);return state(env,u,p);
  }
  const t=check(a.task_id,80);await task(env,u,p,t);
  if(name==='select_task') await query(env,'UPDATE projects SET selected_task_id=?,updated_at=? WHERE id=? AND user_id=?',t,stamp(),p,u).run();
  else if(name==='set_task_status') {
    if(typeof a.completed!=='boolean')throw Error('completed must be boolean');
    if(await query(env,'SELECT id FROM tasks WHERE parent_id=? AND project_id=? AND user_id=? LIMIT 1',t,p,u).first())throw Error('Only leaf tasks can be checked');
    await query(env,'UPDATE tasks SET completed_at=?,updated_at=? WHERE id=? AND project_id=? AND user_id=?',a.completed?stamp():null,stamp(),t,p,u).run();
  } else if(name==='rename_task') {
    const zh=check(a.title_zh);await query(env,'UPDATE tasks SET title_zh=?,title_en=?,updated_at=? WHERE id=? AND project_id=? AND user_id=?',zh,title(a.title_en,zh),stamp(),t,p,u).run();
  } else if(name==='delete_task') {
    const rows=(await query(env,'SELECT id,parent_id FROM tasks WHERE project_id=? AND user_id=?',p,u).all()).results,ids=new Set([t]);
    for(let i=0;i<rows.length;i++)for(const row of rows)if(ids.has(row.parent_id))ids.add(row.id);
    await env.DB.batch([...ids].map(id=>query(env,'DELETE FROM tasks WHERE id=? AND project_id=? AND user_id=?',id,p,u)));
    const selected=(await project(env,u,p)).selected_task_id;
    if(ids.has(selected))await query(env,'UPDATE projects SET selected_task_id=NULL,updated_at=? WHERE id=? AND user_id=?',stamp(),p,u).run();
  } else throw Error('Unknown action');
  return state(env,u,p);
}
const str={type:'string'},obj=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false}),pid={project_id:str},tid={...pid,task_id:str};
const defs=[
 ['open_task_panel','Open the task panel beside this conversation.',obj(pid)],
 ['get_projects','Read my project list.',obj()],
 ['get_tasks','Read a project task tree and progress.',obj(pid)],
 ['create_project','Create a blank project when requested.',obj({title_zh:str,title_en:str},['title_zh'])],
 ['create_demo_project','Create the GanttProject example project when requested.',obj()],
 ['add_subtask','Add a task when requested; parent_id is optional.',obj({...pid,parent_id:str,title_zh:str,title_en:str},['project_id','title_zh'])],
 ['select_task','Select a task to discuss, without completing it.',obj(tid,['project_id','task_id'])],
 ['set_task_status','Check or uncheck a leaf task only when requested.',obj({...tid,completed:{type:'boolean'}},['project_id','task_id','completed'])],
 ['rename_task','Rename a task when requested.',obj({...tid,title_zh:str,title_en:str},['project_id','task_id','title_zh'])],
 ['delete_task','Delete a task and descendants when requested.',obj(tid,['project_id','task_id'])],
 ['rename_project','Rename a project when requested.',obj({...pid,title_zh:str,title_en:str},['project_id','title_zh'])],
 ['delete_project','Delete a project and its tasks when requested.',obj(pid,['project_id'])],
 ['export_data','Export my data.',obj()],
 ['delete_my_data','Delete all my data after explicit confirmation.',obj({confirm:{type:'string',enum:['DELETE']}},['confirm'])]
];
const tools=defs.map(([name,description,inputSchema])=>({name,description,inputSchema,...(name==='open_task_panel'?{_meta:{ui:{resourceUri:URI},'openai/outputTemplate':URI,'openai/ui':{entrypoints:[{type:'thread'}]}}}:{})}));
const rpc=(id,result)=>response({jsonrpc:'2.0',id,result}),err=(id,code,message)=>response({jsonrpc:'2.0',id,error:{code,message}});
async function mcp(req,env){
  let body;try{body=await req.json()}catch{return err(null,-32700,'Parse error')}
  const {id,method,params={}}=body||{};if(!method)return err(id??null,-32600,'Invalid request');
  if(method==='notifications/initialized')return new Response(null,{status:204});
  if(method==='server/discover')return rpc(id,{supportedVersions:['2026-07-28'],capabilities:CAPABILITIES});
  if(method==='initialize')return rpc(id,{protocolVersion:params.protocolVersion||'2026-07-28',capabilities:CAPABILITIES,serverInfo:{name:'task-companion',version:'1.0.0'}});
  if(method==='ping')return rpc(id,{});
  if(method==='tools/list')return rpc(id,{tools});
  if(method==='resources/list')return rpc(id,{resources:[{uri:URI,name:'task-companion-panel',title:'Task Companion',mimeType:UI_MIME}]});
  if(method==='resources/read')return params.uri===URI?rpc(id,{contents:[{uri:URI,mimeType:UI_MIME,text:PANEL,_meta:{ui:{prefersBorder:true},'openai/widgetDescription':'Bilingual task tree and progress beside this conversation.'}}]}):err(id,-32602,'Unknown resource');
  if(method==='tools/call'){
    if(!defs.some(x=>x[0]===params.name))return err(id,-32602,'Unknown tool');
    try{const data=await action(env,user(req),params.name,params.arguments||{});return rpc(id,{content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data})}
    catch(e){return rpc(id,{content:[{type:'text',text:String(e.message||e)}],isError:true})}
  }
  return err(id,-32601,'Method not found');
}
export default {async fetch(req,env){
  const url=new URL(req.url),path=url.pathname;
  try{
    if(path==='/mcp'&&req.method==='POST')return mcp(req,env);
    if(path==='/'&&req.method==='GET')return new Response(PAGE,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
    if((path==='/privacy'||path==='/terms'||path==='/support')&&req.method==='GET')return new Response(legalPage(path.slice(1)),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
    if(path==='/health'&&req.method==='GET')return response({ok:true});
    if(path==='/api/state'&&req.method==='GET')return user(req)?response(await state(env,user(req),url.searchParams.get('project_id'))):response({error:'Sign in required'},401);
    if(path==='/api/action'&&req.method==='POST'){
      if(req.headers.get('origin')&&req.headers.get('origin')!==url.origin)return response({error:'Origin not allowed'},403);
      if(!req.headers.get('content-type')?.startsWith('application/json'))return response({error:'JSON required'},415);
      if(Number(req.headers.get('content-length')||0)>32768)return response({error:'Request too large'},413);
      const body=await req.json();if(!body||typeof body.name!=='string'||typeof body.args!=='object'||body.args===null)return response({error:'Invalid request'},400);
      if(!defs.some(x=>x[0]===body.name))return response({error:'Unknown action'},404);
      return response(await action(env,user(req),body.name,body.args));
    }
    return response({error:'Not found'},404);
  }catch(e){const message=String(e.message||e);return response({error:message},/not found/i.test(message)?404:/sign in/i.test(message)?401:400)}
}};
