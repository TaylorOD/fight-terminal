#!/usr/bin/env node
import {getEvents,rangeFor,localZone} from './schedule.js';
import {readFileSync} from 'node:fs';
const version=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
const help=`Fight Terminal · UFC schedule\n\n  ufc schedule                  Upcoming events\n  ufc next                      Next event and fight card\n  ufc this weekend              This Friday through Sunday\n  ufc next weekend              Following Friday through Sunday\n  ufc card <ID or name>          Announced fights\n\nOptions: --search NAME, --days 180, --from YYYY-MM-DD,\n         --tz America/Denver, --utc, --json, --help, --version, --list\n\nQuoted weekend phrases work too. Weekends use your local timezone,\nincluding the current weekend on Saturday/Sunday. --tz overrides it.\nTimes are event starts, not main-event walkouts. Source: ESPN.\n`;
export async function main(args=process.argv.slice(2)) {
  const options={}; const words=[];
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(['--help','-h','help','--list','-list','list'].includes(arg)){console.log(help);return;}
    if(['--version','-v','-V'].includes(arg)){console.log(version);return;}
    if(['--json','--utc'].includes(arg)){options[arg.slice(2)]=true;continue;}
    if(['--search','--days','--from','--tz'].includes(arg)) {
      if(!args[i+1]||args[i+1].startsWith('--'))throw new Error(`Missing value for ${arg}.`);
      options[arg.slice(2)]=args[++i];continue;
    }
    if(arg.startsWith('-'))throw new Error(`Unknown option: ${arg}`);
    words.push(arg);
  }
  const phrase=words.join(' ').toLowerCase();
  let command=words[0]||'schedule';
  if(['this weekend','next weekend'].includes(phrase))command=phrase;
  if(!['schedule','next','card','this weekend','next weekend'].includes(command))throw new Error('Unknown command. Run ufc --help.');
  if(['schedule','next'].includes(command)&&words.length>1)throw new Error('Unexpected arguments. Run ufc --help.');
  const zone=options.utc?'UTC':options.tz||localZone();
  const range=rangeFor(command,{zone,days:Number(options.days??180),from:options.from});
  let events=await getEvents(range,options.search);
  if(command==='card' && words.length>1) {
    const query=words.slice(1).join(' ').toLowerCase();
    events=events.filter(e=>e.id===query||e.name.toLowerCase().includes(query));
    if(events.length>1)throw new Error('Multiple events match. Use an ID from ufc schedule.');
  }else if(command==='next'||command==='card')events=events.slice(0,1);
  if(options.json){console.log(JSON.stringify(events,null,2));return;}
  console.log(`\nFIGHT TERMINAL / ${command.toUpperCase()} / ${zone}\n`);
  if(!events.length)console.log('No matching upcoming events announced in this date range.');
  for(const e of events){
    console.log(`${e.name}  [${e.id}]`);
    console.log(`  ${new Intl.DateTimeFormat('en-US',{timeZone:zone,dateStyle:'full',timeStyle:'short'}).format(new Date(e.date))}`);
    console.log(`  ${e.venue} · ${e.location}`);
    if(command!=='schedule')for(const f of e.fights)console.log(`  ${f.fighters.join(' vs. ')} (${f.division}) [${f.status}]`);
    if(command!=='schedule'&&!e.fights.length)console.log('  Fight card not announced yet.');
    console.log();
  }
  console.log('Source: ESPN. Cards and event start times may change.');
}
import {pathToFileURL} from 'node:url';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(`ufc: ${e.message}`);process.exitCode=1;});
