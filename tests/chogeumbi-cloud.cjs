const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function environment(hostname='museoa.pages.dev',search=''){
  const storage=new Map();let calls=0,fail=false,version=4;
  const context={window:{},location:{hostname,search,href:`https://${hostname}/p/chogeumbi/`},document:{currentScript:{src:`https://${hostname}/p/chogeumbi/data.js`}},structuredClone,URL,URLSearchParams,Intl,Date,Event,crypto:require('node:crypto').webcrypto,
    dispatchEvent(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    GEUMBI_CLOUD:{async read(){return {payload:{settings:{greeting:'서버 인사말'},schedules:[],outfits:[],upbo:[]},revision:version};},async save(data,revision){calls++;assert.equal(revision,version);if(fail)throw Error('conflict');return ++version;}}};
  context.window=context;vm.createContext(context);
  for(const file of ['model.js','data.js'])vm.runInContext(fs.readFileSync('p/chogeumbi/'+file,'utf8'),context);
  return {api:context.GEUMBI,storage,calls:()=>calls,fail:()=>fail=true};
}
(async()=>{
  const remote=environment();assert.equal(remote.api.local,false);assert.equal(remote.api.load().schedules.length,0);
  await remote.api.sync(true);assert.equal(remote.api.load().settings.greeting,'서버 인사말');
  let next=remote.api.load();next.settings.greeting='저장 성공';await remote.api.save(next);
  assert.equal(remote.api.load().settings.greeting,'저장 성공');assert.equal(remote.storage.size,0);
  remote.fail();next=remote.api.load();next.settings.greeting='실패한 저장';await assert.rejects(remote.api.save(next),/conflict/);
  assert.equal(remote.api.load().settings.greeting,'저장 성공');
  assert.equal(environment('127.0.0.1').api.local,false);
  const local=environment('127.0.0.1','?preview=sample&saved=1');assert.equal(local.api.local,true);
  next=local.api.load();next.settings.greeting='로컬 예시';await local.api.save(next);
  assert.equal(local.api.load().settings.greeting,'로컬 예시');assert.equal(local.calls(),0);
  assert.equal(environment('museoa.pages.dev','?preview=sample').api.local,false);
  console.log('PASS: remote/local isolation, server hydration, revision handoff, failed save preserves state, sample persistence');
})().catch(e=>{console.error(e);process.exitCode=1;});
