(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function o(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(n){if(n.ep)return;n.ep=!0;const a=o(n);fetch(n.href,a)}})();const d="2026-06-24",u="City Council",_=document.getElementById("root"),r=e=>String(e||"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);function v(e){if(!e)return"—";const t=new Date(e+"T12:00:00");return Number.isNaN(t.getTime())?e:t.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}async function y(e,t){const o=await fetch(e,t),s=await o.json().catch(()=>({}));if(!o.ok)throw new Error(s.detail||o.statusText||"Request failed");return s}function w(e){var o,s;if(!e)return"";const t=[];return e.favor_count!=null&&t.push(`<span class="mr-vote-chip yes">${e.favor_count} in favor</span>`),e.oppose_count&&t.push(`<span class="mr-vote-chip no">${e.oppose_count} opposed</span>`),(o=e.yes)!=null&&o.length&&t.push(`<span class="mr-vote-chip yes">Yes: ${r(e.yes.join(", "))}</span>`),(s=e.no)!=null&&s.length&&t.push(`<span class="mr-vote-chip no">No: ${r(e.no.join(", "))}</span>`),t.length?`<div class="mr-vote">${t.join("")}</div>`:""}function I(e){const t=(e.bullets||[]).map(s=>`<li>${r(s)}</li>`).join(""),o=e.public_speaker_count?`<p class="mr-speakers">${e.public_speaker_count} residents signed up to speak on this item.</p>`:"";return`
    <article class="mr-item-card">
      <div class="mr-item-head">
        <span class="mr-item-num">Item ${r(e.item_number)}</span>
        <span class="mr-item-num">${r(e.matter_id||"")}</span>
      </div>
      <h3 class="mr-item-title">${r(e.title)}</h3>
      <p class="mr-item-summary">${r(e.summary)}</p>
      ${t?`<ul class="mr-bullets">${t}</ul>`:""}
      ${w(e.vote)}
      ${o}
    </article>
  `}function E(e){const t=e.duration||{},o=(e.highlights||[]).map(l=>`<li>${r(l)}</li>`).join(""),s=(e.attendees||[]).map(l=>`<span class="mr-pill">${r(l)}</span>`).join(""),n=(e.consent_pulls||[]).slice(0,12).map(l=>`<div>Item ${r(l.item_number)} pulled by ${r(l.pulled_by)}</div>`).join(""),a=(e.featured_items||[]).map(I).join("");return`
    <section class="mr-meta-grid">
      <div class="mr-meta-card"><span>Duration</span><strong>${t.hours?`${t.hours}h`:"—"}</strong></div>
      <div class="mr-meta-card"><span>Start</span><strong>${r(e.start_time||t.start||"—")}</strong></div>
      <div class="mr-meta-card"><span>Agenda items parsed</span><strong>${e.agenda_item_count??"—"}</strong></div>
      <div class="mr-meta-card"><span>Record votes</span><strong>${e.record_vote_count??"—"}</strong></div>
    </section>

    ${o?`<section class="mr-section"><h2>Worth knowing</h2><ul class="mr-highlights">${o}</ul></section>`:""}

    <section class="mr-section">
      <h2>Who was there</h2>
      <div class="mr-attendees">${s||"<span class='mr-pill'>Attendance not parsed</span>"}</div>
    </section>

    ${n?`<section class="mr-section"><h2>Consent agenda changes</h2><div class="mr-pulls">${n}${e.consent_pulls.length>12?`<div>…and ${e.consent_pulls.length-12} more pulls</div>`:""}</div></section>`:""}

    <section class="mr-section">
      <h2>Key agenda items</h2>
      ${a||"<p>No featured items summarized yet.</p>"}
    </section>

    <p class="mr-footer-note">
      Summaries are generated from the official meeting transcript.
      Method: <strong>${r(e.summary_method||"extractive")}</strong>.
      Set <code>ANTHROPIC_API_KEY</code> on the server for Claude summaries
      (or <code>OPENAI_API_KEY</code> as fallback).
      Cross-check votes on <a href="/council-accountability">Council Watch</a>.
    </p>
  `}function p({meetings:e,recap:t,status:o,error:s,loading:n,date:a,body:l}){var f,$;const b=(e||[]).map(i=>{const m=i.date===a&&i.body===l?"selected":"";return`<option value="${r(i.date)}|${r(i.body)}" ${m}>${v(i.date)} — ${r(i.body)}</option>`}).join("");_.innerHTML=`
    <div class="mr-app">
      <header class="mr-hero">
        <p class="mr-kicker">Dallas civic briefing</p>
        <h1>Meeting Recap</h1>
        <p class="mr-lede">What happened at City Council — who showed up, what was debated, and how members voted — without sitting through the full video.</p>
      </header>

      <div class="mr-toolbar">
        <div class="mr-field">
          <label for="meeting-select">Meeting</label>
          <select id="meeting-select">${b||`<option value="${d}|${u}">${v(d)}</option>`}</select>
        </div>
        <button type="button" class="mr-btn" id="btn-load" ${n?"disabled":""}>Load recap</button>
        <button type="button" class="mr-btn mr-btn-ghost" id="btn-refresh" ${n?"disabled":""}>Regenerate</button>
      </div>

      ${s?`<div class="mr-error">${r(s)}</div>`:""}
      
      ${n?'<div class="mr-status">Loading…</div>':""}
      ${t?E(t):""}
    </div>
  `,(f=document.getElementById("btn-load"))==null||f.addEventListener("click",()=>{const i=document.getElementById("meeting-select"),[m,g]=((i==null?void 0:i.value)||`${d}|${u}`).split("|");h(m,g,!1)}),($=document.getElementById("btn-refresh"))==null||$.addEventListener("click",()=>{const i=document.getElementById("meeting-select"),[m,g]=((i==null?void 0:i.value)||`${d}|${u}`).split("|");h(m,g,!0)})}let L=null;async function h(e,t,o){clearInterval(L),p({meetings:c.meetings,recap:o?null:c.recap,status:c.status,error:"",loading:!0,date:e,body:t});try{const s=await y(`/api/meeting-recap/recap?date=${encodeURIComponent(e)}&body=${encodeURIComponent(t)}${o?"&refresh=true":""}`);c.recap=s,c.error="",p({meetings:c.meetings,recap:s,status:c.status,error:"",loading:!1,date:e,body:t})}catch(s){c.error=s.message,p({meetings:c.meetings,recap:null,status:c.status,error:s.message,loading:!1,date:e,body:t})}}const c={meetings:[],recap:null,status:null,error:""};async function C(){p({meetings:[],recap:null,status:null,error:"",loading:!0,date:d,body:u});try{const{meetings:e}=await y("/api/meeting-recap/meetings");c.meetings=e||[];const t=c.meetings[0],o=(t==null?void 0:t.date)||d,s=(t==null?void 0:t.body)||u;await h(o,s,!1)}catch(e){c.error=e.message,p({meetings:[],recap:null,status:null,error:e.message,loading:!1,date:d,body:u})}}C();
