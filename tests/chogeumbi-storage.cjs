const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const id='00000000-0000-0000-0000-000000000001';
const key=id+'/chogeumbi/'+id+'.png';
const url='https://example.supabase.co/storage/v1/object/public/chogeumbi/'+key;
function node(){return {textContent:'',disabled:false,append(){},replaceChildren(){},addEventListener(){}};}
const nodes=new Map();const find=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);};
let removes=0,uploads=0,deny=false,failUpload=false,assigned=false;
const state={outfits:[],imageCleanup:[{id:'q',image:url,name:'test'}]};
const primary=node(),form={elements:{file:{files:[{type:'image/png',size:100}],disabled:false},image:{value:'',dispatchEvent(){assigned=true;}}},querySelector:()=>primary};nodes.set('#outfit-form',form);
const bucket={async remove(paths){removes++;return deny?{error:{message:'denied'}}:{data:paths.map(name=>({name}))};},async upload(){uploads++;return {error:failUpload?{}:null};},getPublicUrl:()=>({data:{publicUrl:url}})};
const context={window:{},document:{querySelector:find,createElement:node},URL,Event,setTimeout,clearTimeout,crypto:{randomUUID:()=>id},Image:class{set src(value){queueMicrotask(()=>this.onload());}},addEventListener(){},GEUMBI:{local:false},GEUMBI_ADMIN:{data:state,feedback(){},async commit(change){change(state);return true;}},GEUMBI_CLOUD:{config:{url:'https://example.supabase.co',bucket:'chogeumbi'},async read(){return {payload:structuredClone(state)};},async client(){return {auth:{getUser:async()=>({data:{user:{id}}})},storage:{from:()=>bucket}}}}};
context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync('p/chogeumbi/admin/storage.js','utf8'),context);
(async()=>{
 const api=context.GEUMBI_STORAGE;
 assert.equal(api.path(url),key);assert.equal(api.path('https://outside.invalid/'+key),null);assert.equal(api.path('https://example.supabase.co/storage/v1/object/public/other/'+key),null);
 assert.equal(await api.upload(),true);assert.equal(form.elements.image.value,url);assert.equal(assigned,true);assert.equal(primary.disabled,false);
 failUpload=true;assert.equal(await api.upload(),false);assert.equal(primary.disabled,false);assert.equal(uploads,2);
 state.outfits=[{image:url}];await api.clean(url);assert.equal(removes,0);assert.equal(state.imageCleanup.length,1);
 state.outfits=[];deny=true;await api.clean(url);assert.equal(state.imageCleanup.length,1);
 state.settings={introImage:url};const before=removes;await api.clean(url);assert.equal(removes,before);state.settings={};
 failUpload=false;assert.equal(await api.uploadFile({type:'image/png',size:100}),url);
 await assert.rejects(()=>api.uploadFile({type:'text/html',size:100}));
 deny=false;await api.clean(url);assert.equal(state.imageCleanup.length,0);assert.equal(removes,2);
 console.log('PASS: managed path restriction, upload URL assignment, upload failure recovery, shared image preservation, cleanup retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
