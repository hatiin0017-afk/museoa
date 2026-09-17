'use strict';
(() => {
  const categories = [
    ['소통','#c5e8c7'],['게임','#ffe5a3'],['노래','#d9d0ef'],['이벤트','#f4cfdf'],['휴방','#d6dcda'],['합방','#cce6f0'],['기타','#eedbc0']
  ].map(([name,color])=>({id:name,name,color}));
  function normalize(data) {
    data.settings ||= {}; data.seasons ||= [];
    for(const row of data.upbo)if(row.season&&!data.seasons.includes(row.season))data.seasons.push(row.season);
    data.members ||= []; data.taskTypes ||= []; data.history ||= []; data.categories ||= structuredClone(categories);
    data.upbo.forEach(row=>{
      let member=data.members.find(m=>m.viewerId===row.viewerId);
      if(!member){member={id:'member:'+row.viewerId,nickname:row.nickname,viewerId:row.viewerId};data.members.push(member);}
      let type=data.taskTypes.find(t=>t.name===row.item);
      if(!type){type={id:'type:'+row.item,name:row.item,active:true};data.taskTypes.push(type);}
      row.memberId ||= member.id; row.typeId ||= type.id; row.completed ||= 0;
      row.quantity=Math.max(0,Number(row.quantity)||0); row.allocated=row.quantity+row.completed;
    });
    data.schedules.forEach(row=>{if(!data.categories.some(c=>c.name===row.type))data.categories.push({id:row.type,name:row.type,color:row.color||'#c5e8c7'});});
    data.taskTypes.forEach(t=>{if(!/^#[0-9a-f]{6}$/i.test(t.color||''))t.color=data.settings?.upboColors?.[t.name]||'#c5e8c7';});
    data.settings.upboColors=Object.fromEntries(data.taskTypes.map(t=>[t.name,t.color]));
    return data;
  }
  function record(data,row,action,delta){data.history.push({id:crypto.randomUUID(),at:new Date().toISOString(),taskId:row.id,nickname:row.nickname,item:row.item,season:row.season,action,delta,remaining:row.quantity});}
  function assign(data,memberId,typeId,season,quantity=1) {
    if(!Number.isInteger(quantity)||quantity<1||quantity>9999)throw new Error('추가 수량은 1~9999 정수로 입력해 주세요.');
    const member=data.members.find(m=>m.id===memberId),type=data.taskTypes.find(t=>t.id===typeId&&t.active!==false&&!t.deleted);
    if(!member||!type||!season.trim())throw new Error('시청자·시즌·업보 종류를 선택해 주세요.');
    let row=data.upbo.find(r=>r.memberId===memberId&&r.typeId===typeId&&r.season===season.trim());
    if(!row){row={id:crypto.randomUUID(),memberId,typeId,nickname:member.nickname,viewerId:member.viewerId,item:type.name,season:season.trim(),quantity:0,completed:0,allocated:0,status:'대기',sample:false};data.upbo.push(row);}
    if(row.quantity+quantity>9999)throw new Error('남은 수량이 9999개를 넘을 수 없습니다.');
    row.quantity+=quantity;row.allocated=row.quantity+row.completed;row.status='대기';record(data,row,'추가',quantity);return row;
  }
  function finish(data,id,quantity=1){const row=data.upbo.find(r=>r.id===id);if(!row||!Number.isInteger(quantity)||quantity<1||quantity>row.quantity)throw new Error('처리할 남은 수량이 부족합니다.');row.quantity-=quantity;row.completed+=quantity;row.status=row.quantity?'대기':'전달 완료';record(data,row,'처리',-quantity);}
  function unassign(data,id){const row=data.upbo.find(r=>r.id===id);if(!row||row.quantity<1)throw new Error('취소할 남은 수량이 없습니다.');row.quantity--;row.allocated=row.quantity+row.completed;record(data,row,'배정 취소',-1);if(!row.quantity&&!row.completed)data.upbo=data.upbo.filter(r=>r.id!==id);else row.status=row.quantity?'대기':'전달 완료';}
  function manual(data,input){
    if(!Number.isInteger(input.quantity)||input.quantity<0||input.quantity>9999)throw new Error('수량은 0~9999 정수로 입력해 주세요.');
    if(input.status==='전달 완료'&&input.quantity>0)throw new Error('남은 수량이 있으면 전달 완료로 저장할 수 없습니다. 처리 버튼을 사용해 주세요.');
    const row=data.upbo.find(r=>r.id===input.id);
    if(row){if(row.viewerId!==input.viewerId||row.item!==input.item||row.season!==input.season)throw new Error('기존 배정의 시청자·항목·시즌은 변경할 수 없습니다. 새 배정으로 추가해 주세요.');const delta=input.quantity-row.quantity;Object.assign(row,input);row.allocated=row.quantity+row.completed;record(data,row,'수량 수정',delta);return;}
    let member=data.members.find(m=>m.viewerId===input.viewerId);if(!member){member={id:crypto.randomUUID(),nickname:input.nickname,viewerId:input.viewerId};data.members.push(member);}
    let type=data.taskTypes.find(t=>t.name===input.item);if(!type){type={id:crypto.randomUUID(),name:input.item,active:true};data.taskTypes.push(type);}
    if(input.quantity<1)throw new Error('새 배정은 1개 이상 입력해 주세요.');
    const assigned=assign(data,member.id,type.id,input.season,input.quantity);assigned.sample=!!input.sample;assigned.status=input.status==='전달 완료'?'대기':input.status;
  }
  function assignProfiles(data,profiles,typeId,season){
    if(!season||!data.seasons.includes(season))throw new Error('배정할 시즌을 선택해 주세요.');
    if(!data.taskTypes.some(t=>t.id===typeId&&t.active!==false&&!t.deleted))throw new Error('사용 중인 업보 종류를 선택해 주세요.');
    const unique=new Map();for(const profile of profiles){const id=String(profile.viewerId||'').trim().toLowerCase(),nickname=String(profile.nickname||'').trim();if(!/^[a-z0-9_-]{2,40}$/.test(id)||!nickname)throw new Error('조회된 프로필 정보가 올바르지 않습니다.');unique.set(id,{viewerId:id,nickname});}
    for(const profile of unique.values()){
      let member=data.members.find(m=>m.viewerId.trim().toLowerCase()===profile.viewerId);
      if(!member){member={id:crypto.randomUUID(),...profile};data.members.push(member);}else{member.nickname=profile.nickname;data.upbo.filter(r=>r.memberId===member.id).forEach(r=>r.nickname=profile.nickname);}
      assign(data,member.id,typeId,season,1);
    }
    return unique.size;
  }
  window.CHOGEUMBI_MODEL={normalize,assign,finish,unassign,manual,categories,assignProfiles};
})();
