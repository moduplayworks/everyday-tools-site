import{i as e,n as t,t as n}from"./general-tool.WdThzhYN.js";import{a as r,c as i}from"./shared.BJ72sHGW.js";function a(n,a){e(n,a);let o=Number(a.a),s=(a.text??``).replace(/\r\n?/g,`
`),c=i(s);switch(n.id){case`letter-case`:return a.mode===`대문자`?s.toUpperCase():a.mode===`소문자`?s.toLowerCase():s.toLowerCase().replace(/\b[a-z]/g,e=>e.toUpperCase());case`trim-lines`:return c.map(e=>e.trim()).join(`
`);case`remove-blank-lines`:return c.filter(e=>e.trim()).join(`
`);case`deduplicate-lines`:return[...new Set(c)].join(`
`);case`sort-lines`:if(a.mode===`숫자 오름차순`){if(c.some(e=>!e.trim()||!Number.isFinite(Number(e))))throw new t(`text`,`각 줄에 숫자 하나씩 입력하세요.`);return c.sort((e,t)=>Number(e)-Number(t)).join(`
`)}return c.sort((e,t)=>e.localeCompare(t,`ko`)*(a.mode===`내림차순`?-1:1)).join(`
`);case`reverse-lines`:return c.reverse().join(`
`);case`number-lines`:return c.map((e,t)=>`${o+t}${a.sep}${e}`).join(`
`);case`prefix-suffix`:return c.map(e=>a.prefix+e+a.suffix).join(`
`);case`find-replace`:return s.split(a.find).join(a.replace);case`extract-lines`:return c.filter(e=>e.includes(a.find)===(a.mode===`포함`)).join(`
`);case`line-frequency`:case`word-frequency`:{let e=n.id===`word-frequency`?s.trim().split(/\s+/u):c,t=new Map;return e.forEach(e=>t.set(e,(t.get(e)||0)+1)),[...t].sort((e,t)=>t[1]-e[1]).map(([e,t])=>`${t}회\t${e}`).join(`
`)}case`split-join`:{let e=a.from.replaceAll(`\\n`,`
`),t=a.to.replaceAll(`\\n`,`
`);return s.split(e).join(t)}case`unicode-normalize`:return s.normalize(a.mode);case`fullwidth-halfwidth`:return a.mode===`반각으로`?s.replace(/[！-～]/g,e=>String.fromCharCode(e.charCodeAt(0)-65248)).replaceAll(`　`,` `):s.replace(/[!-~]/g,e=>String.fromCharCode(e.charCodeAt(0)+65248)).replaceAll(` `,`　`);case`slug-generator`:return s.normalize(`NFKC`).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-|-$/g,``);case`text-compare`:{let e=i(a.other),t=[];for(let n=0;n<Math.max(c.length,e.length);n++)c[n]!==e[n]&&t.push(`${n+1}행\n− ${c[n]??`(줄 없음)`}\n+ ${e[n]??`(줄 없음)`}`);return t.join(`

`)||`두 텍스트가 같습니다.`}case`wrap-text`:return c.map(e=>{let t=r(e),n=[];for(let e=0;e<t.length;e+=o)n.push(t.slice(e,e+o).join(``));return n.join(`
`)}).join(`
`);case`truncate-text`:{let e=r(s);return e.slice(0,o).join(``)+(e.length>o?a.suffix:``)}case`remove-invisible`:return s.replace(/[\u200b\ufeff\u00ad]/g,``);case`reading-time`:{let e=s.trim().split(/\s+/u).length,t=Math.ceil(e/o*60);return`어절 수: ${e}\n예상 시간: ${Math.floor(t/60)}분 ${t%60}초`}case`korean-initials`:return s.replace(/[가-힣]/g,e=>`ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ`[Math.floor((e.charCodeAt(0)-44032)/588)]);default:throw Error(`등록되지 않은 도구입니다.`)}}n(a);