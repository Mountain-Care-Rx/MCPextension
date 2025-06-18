(()=>{function le(e){if(window.__crmConsoleMonitor)return;window.__crmConsoleMonitor=!0;let t=console.log,o=console.error,i=console.warn;console.log=function(...n){t.apply(console,n),!(typeof n[0]=="string"&&n[0].includes("[CRM Extension]"))&&Z(n,"log",e)},console.error=function(...n){o.apply(console,n),!(typeof n[0]=="string"&&n[0].includes("[CRM Extension]"))&&Z(n,"error",e)},console.warn=function(...n){i.apply(console,n),!(typeof n[0]=="string"&&n[0].includes("[CRM Extension]"))&&Z(n,"warn",e)}}function Z(e,t,o){let i=e.join(" ");["error","failed","unauthorized","critical"].some(r=>i.toLowerCase().includes(r))&&o(i)}var se=window.location.href,M="";function _(){if(!ce())return"";let e=document.querySelector('input[name="contact.phone"]');if(e&&e.value.trim()!=="")return e.value.trim();let t=document.querySelector(".phone-number .number");if(t&&t.textContent.trim()!=="")return t.textContent.trim();let o=['input[placeholder="Phone"]','input[placeholder="Phone Number"]',".patient-info .phone",".contact-info .phone","span.phone",'label[for*="phone"]',".phone-display",'div[data-field="phone"]','span[data-field="phone_number"]'];for(let i of o){let n=document.querySelector(i);if(n)if(n.tagName==="INPUT"){let r=n.value.trim();if(r)return r}else if(n.tagName==="LABEL"){let r=n.getAttribute("for");if(r){let l=document.getElementById(r);if(l&&l.value.trim())return l.value.trim()}let a=n.parentElement?.querySelector("input");if(a&&a.value.trim())return a.value.trim()}else{let r=n.textContent.trim();if(r)return r}}return""}function ce(){let e=window.location.href;return[/\/patient\/\d+/i,/\/contact\/\d+/i,/\/profile\/\d+/i,/[?&]patient_id=\d+/i,/[?&]contact_id=\d+/i].some(i=>i.test(e))?!0:['input[name="contact.phone"]','input[name="contact.first_name"]','input[name="contact.last_name"]','input[name="contact.date_of_birth"]',".patient-info",".contact-details",".patient-header",".patient-profile"].some(i=>document.querySelector(i)!==null)}function de(e){try{let t=e?et(e):"";if(typeof updateClickableDisplayValue=="function")updateClickableDisplayValue("phone",t);else{let o=document.getElementById("phone-text");if(o){o.textContent=t;let i=document.getElementById("phone-display");if(i){e?i.setAttribute("data-value",e):i.removeAttribute("data-value");let n=i.cloneNode(!0);i.parentNode.replaceChild(n,i),n.addEventListener("click",r=>{e&&(navigator.clipboard.writeText(t),typeof c=="function"?c("Phone number copied!"):alert("Phone number copied!"))}),n.addEventListener("contextmenu",r=>{if(r.preventDefault(),e){let a=e.replace(/\D/g,"");navigator.clipboard.writeText("@"+a),typeof c=="function"?c("Phone number copied with @!"):alert("Phone number copied with @!")}})}}}}catch(t){console.error("[CRM Extension] Error updating phone display:",t)}}function k(){M="",de("");try{let e=document.getElementById("phone-display");e&&e.removeAttribute("data-value")}catch(e){console.error("[CRM Extension] Error clearing phone display:",e)}}function et(e){if(!e)return"";let t=e.replace(/\D/g,"");if(t.length===0)return"";if(t.length===10)return`(${t.substring(0,3)}) ${t.substring(3,6)}-${t.substring(6)}`;if(t.length===11&&t.startsWith("1"))return`(${t.substring(1,4)}) ${t.substring(4,7)}-${t.substring(7)}`;if(t.length>4){let o="";for(let i=0;i<t.length;i+=3)if(i+4>=t.length&&t.length%3!==0){o+=" "+t.substring(i);break}else o+=" "+t.substring(i,i+3);return o.trim()}return t.replace(/(\d{3})/g,"$1 ").trim()}function H(){try{if(!ce())return M&&k(),!1;let e=_();return e?(e!==M&&(M=e,de(e)),!0):(M&&k(),!1)}catch(e){return console.error("[CRM Extension] Error detecting phone number:",e),!1}}function pe(){k(),H();let e=setInterval(()=>{let t=window.location.href;t!==se&&(console.log("[CRM Extension] URL changed, resetting phone detection"),se=t,k()),H()},200);try{let t=new MutationObserver(i=>{H()}),o=document.body;t.observe(o,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["value"]}),console.log("[CRM Extension] Phone number mutation observer active")}catch(t){console.error("[CRM Extension] Error setting up phone mutation observer:",t)}}function me(e){let t=_();if(!t){c("No phone number found");return}let o=ee(t);if(!o){c("Invalid phone number format");return}e.setAttribute("data-value",t),L(o).then(i=>{c(i?"Copied: "+o:"Failed to copy phone number")})}function ee(e){if(!e)return"";let t=e.replace(/\D/g,"");return t.length<7?"":"+1"+t}async function L(e){if(navigator.clipboard&&navigator.clipboard.writeText)try{return await navigator.clipboard.writeText(e),!0}catch(t){console.warn("Clipboard API failed, trying fallback method:",t)}try{let t=document.createElement("textarea");t.value=e,t.style.position="fixed",t.style.top="0",t.style.left="0",t.style.opacity="0",t.style.pointerEvents="none",document.body.appendChild(t),t.focus(),t.select();let o=document.execCommand("copy");return document.body.removeChild(t),o}catch(t){return console.error("All clipboard methods failed:",t),!1}}function c(e,t=2e3){let o=document.getElementById("crm-plus-toast-container");o||(o=document.createElement("div"),o.id="crm-plus-toast-container",o.style.position="fixed",o.style.bottom="20px",o.style.right="20px",o.style.zIndex="100000",document.body.appendChild(o));let i=document.createElement("div");i.textContent=e,i.style.background="#333",i.style.color="#fff",i.style.padding="10px",i.style.borderRadius="5px",i.style.marginTop="10px",i.style.boxShadow="0 2px 5px rgba(0,0,0,0.2)",i.style.transition="opacity 0.5s, transform 0.5s",i.style.opacity="0",i.style.transform="translateY(20px)",o.appendChild(i),i.offsetWidth,i.style.opacity="1",i.style.transform="translateY(0)",setTimeout(()=>{i.style.opacity="0",i.style.transform="translateY(20px)",setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i),o.childNodes.length===0&&document.body.removeChild(o)},500)},t)}var ue=window.location.href;function I(e){try{if(typeof updateClickableDisplayValue=="function")updateClickableDisplayValue("name",e);else{let t=document.getElementById("name-text");if(t){t.textContent=e;let o=document.getElementById("name-display");if(o){o.setAttribute("data-value",e);let i=o.cloneNode(!0);o.parentNode.replaceChild(i,o),i.addEventListener("click",n=>{e&&(navigator.clipboard.writeText(e),typeof c=="function"?c("Name copied!"):alert("Name copied!"))}),i.addEventListener("contextmenu",n=>{if(n.preventDefault(),e){let r=e.trim().split(/\s+/),a=e;if(r.length>=2){let l=r[0];a=`${r.slice(1).join(" ")}, ${l}`}navigator.clipboard.writeText(a),typeof c=="function"&&c("Name copied as LASTNAME, FIRSTNAME!")}})}}}}catch(t){console.error("[CRM Extension] Error updating name display:",t)}}function F(){try{let e=document.querySelector('input[name="contact.first_name"]'),t=document.querySelector('input[name="contact.last_name"]');if(e&&e.value&&t&&t.value){let n=`${e.value} ${t.value}`;return I(n),!0}let o=document.querySelectorAll(".patient-name, .contact-name, h1.name, .customer-name");for(let n of o)if(n&&n.textContent&&n.textContent.trim()!==""){let r=n.textContent.trim();return I(r),!0}let i=["span.name",".profile-name","h2.name",".contact-header .name",'div[data-field="name"]',".patient-info .name"];for(let n of i){let r=document.querySelector(n);if(r&&r.textContent&&r.textContent.trim()!==""){let a=r.textContent.trim();return I(a),!0}}return!1}catch(e){return console.error("[CRM Extension] Error detecting name:",e),!1}}function fe(){F();let e=setInterval(()=>{let t=window.location.href;t!==ue&&(console.log("[CRM Extension] URL changed, resetting name detection"),ue=t,I(""),F());let o=document.getElementById("name-text");o&&(o.textContent==="Loading..."||!o.textContent)&&F()},1e3);try{let t=new MutationObserver(i=>{i.some(r=>r.addedNodes.length>5||r.removedNodes.length>5)&&(console.log("[CRM Extension] Significant DOM changes detected, rechecking name"),I(""),F())}),o=document.querySelector("main")||document.body;t.observe(o,{childList:!0,subtree:!0})}catch(t){console.error("[CRM Extension] Error setting up navigation observer for name:",t)}}var ge=window.location.href;function V(e){try{if(typeof updateClickableDisplayValue=="function")updateClickableDisplayValue("dob",e);else{let t=document.getElementById("dob-text");if(t){t.textContent=e;let o=document.getElementById("dob-display");if(o){o.setAttribute("data-value",e);let i=o.cloneNode(!0);o.parentNode.replaceChild(i,o),i.addEventListener("click",n=>{e&&(navigator.clipboard.writeText(e),typeof c=="function"&&c("DOB copied!"))}),i.addEventListener("contextmenu",n=>{n.preventDefault(),e&&(navigator.clipboard.writeText("["+e),typeof c=="function"&&c("DOB copied with [!"))})}}}}catch(t){console.error("[CRM Extension] Error updating DOB display:",t)}}function he(e){if(!e)return"";if(e.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}$/))try{let t=e.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?\s+(\d{4})/);if(t){let o=t[1],i=t[2],n=t[4];return`${(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(o)+1).toString().padStart(2,"0")}/${i.toString().padStart(2,"0")}/${n}`}}catch(t){console.error("[CRM Extension] Error parsing date:",t)}try{let t=new Date(e);if(!isNaN(t.getTime()))return`${(t.getMonth()+1).toString().padStart(2,"0")}/${t.getDate().toString().padStart(2,"0")}/${t.getFullYear()}`}catch(t){console.error("[CRM Extension] Error parsing date as Date object:",t)}return e}function $(){try{let e=document.querySelector('input[name="contact.date_of_birth"]');if(e&&e.value){let o=he(e.value);return V(o),!0}let t=[".dob",".patient-dob",".contact-dob",'span[data-field="date_of_birth"]','div[data-field="dob"]',".patient-info .dob",".contact-info .dob"];for(let o of t){let i=document.querySelector(o);if(i&&i.textContent&&i.textContent.trim()!==""){let n=he(i.textContent.trim());return V(n),!0}}return!1}catch(e){return console.error("[CRM Extension] Error detecting DOB:",e),!1}}function ye(){$();let e=setInterval(()=>{let t=window.location.href;t!==ge&&(console.log("[CRM Extension] URL changed, resetting DOB detection"),ge=t,V(""),$());let o=document.getElementById("dob-text");o&&(o.textContent==="Loading..."||!o.textContent)&&$()},1e3);try{let t=new MutationObserver(i=>{i.some(r=>r.addedNodes.length>5||r.removedNodes.length>5)&&(console.log("[CRM Extension] Significant DOM changes detected, rechecking DOB"),V(""),$())}),o=document.querySelector("main")||document.body;t.observe(o,{childList:!0,subtree:!0})}catch(t){console.error("[CRM Extension] Error setting up navigation observer for DOB:",t)}}var be=window.location.href,O="";function xe(e){try{if(typeof updateClickableDisplayValue=="function")updateClickableDisplayValue("srxid",e);else{let t=document.getElementById("srxid-text");if(t){t.textContent=e;let o=document.getElementById("srxid-display");if(o){o.setAttribute("data-value",e||"");let i=o.cloneNode(!0);o.parentNode.replaceChild(i,o),i.addEventListener("click",n=>{e&&(navigator.clipboard.writeText(e),c("SRx ID copied!"))}),i.addEventListener("contextmenu",n=>{n.preventDefault(),e&&(navigator.clipboard.writeText("^"+e),c("SRx ID copied with ^!"))})}}}}catch(t){console.error("[CRM Extension] Error updating SRx ID display:",t)}}function N(){try{let e=document.querySelector('input[name="contact.srx_id"]');if(e&&e.value){let t=e.value.trim();if(t&&/^\d+$/.test(t))return t!==O&&(console.log("[CRM Extension] Found SRx ID from contact.srx_id input:",t),O=t,xe(t)),!0}return!!O}catch(e){return console.error("[CRM Extension] Error detecting SRx ID:",e),!1}}function ve(){N();let e=setInterval(()=>{let t=window.location.href;t!==be&&(console.log("[CRM Extension] URL changed, resetting SRx ID detection"),be=t,O="",xe(""),N()),N()},500);try{new MutationObserver(o=>{let i=!1;for(let n of o){if(n.target.tagName==="INPUT"&&n.target.name==="contact.srx_id"||n.target.querySelector&&n.target.querySelector('input[name="contact.srx_id"]')){i=!0;break}if(n.addedNodes.length>0){for(let r of n.addedNodes)if(r.nodeType===1&&r.querySelector&&(r.tagName==="INPUT"&&r.name==="contact.srx_id"||r.querySelector('input[name="contact.srx_id"]'))){i=!0;break}}}i&&N()}).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["value"]}),console.log("[CRM Extension] SRx ID mutation observer active")}catch(t){console.error("[CRM Extension] Error setting up observer for SRx ID:",t)}setTimeout(()=>{try{let t=document.querySelector('input[name="contact.srx_id"]');t&&(new MutationObserver(i=>{N()}).observe(t,{attributes:!0,attributeFilter:["value"]}),console.log("[CRM Extension] Direct input observer attached to contact.srx_id"))}catch(t){console.error("[CRM Extension] Error setting up direct input observer:",t)}},1e3)}var U=["np-tirz-1.5ml-inj","refill-sema-inj","refill-tirz-inj","vial-sema-b12","vial-sema-b6","vial-sema-lipo","vial-sema-nad+","vial-tirz-cyano","vial-tirz-nad+","vial-tirz-pyridoxine","np-sema-0.125ml-inj","np-sema-0.25ml-inj","np-sema-0.5ml-inj","np-sema-0.75ml-inj","np-sema-1.0ml-inj","np-sema-1.25ml-inj","np-sema-1.5ml-inj","np-sema-2.0ml-inj","np-tirz-0.25ml-inj","np-tirz-0.5ml-inj","np-tirz-0.75ml-inj","np-tirz-1.0ml-inj","np-tirz-1.25ml-inj","api-refill-patient-tirz","api-refill-patient-sema","api-tirz-b6-0.25ml-syringe","api-tirz-b6-0.5ml-syringe","api-tirz-b6-0.75ml-syringe","api-tirz-b6-1.0ml-syringe","api-tirz-b6-1.25ml-syringe","api-tirz-b6-1.5ml-syringe","api-tirz-b6-2.5ml-vial","api-tirz-b6-5.0ml-vial","api-tirz-b6-7.5ml-vial","api-tirz-b6-10.0ml-vial","api-tirz-b12-2.5ml-vial","api-tirz-b12-5.0ml-vial","api-tirz-b12-7.5ml-vial","api-tirz-b12-10.0ml-vial","api-tirz-nad+-2.5ml-vial","api-tirz-nad+-5.0ml-vial","api-tirz-nad+-7.5ml-vial","api-tirz-nad+-10.0ml-vial","api-sema-b6-2.5ml-vial","api-sema-b6-5.0ml-vial","api-sema-b6-7.5ml-vial","api-sema-b6-10.0ml-vial","api-sema-b12-0.125ml-syringe","api-sema-b12-0.25ml-syringe","api-sema-b12-0.5ml-syringe","api-sema-b12-0.75ml-syringe","api-sema-b12-1.0ml-syringe","api-sema-b12-1.25ml-syringe","api-sema-b12-1.5ml-syringe","api-sema-b12-1.75ml-syringe","api-sema-b12-2.0ml-syringe","api-sema-b12-2.5ml-vial","api-sema-b12-5.0ml-vial","api-sema-b12-7.5ml-vial","api-sema-b12-10.0ml-vial","api-sema-nad+-2.5ml-vial","api-sema-nad+-5.0ml-vial","api-sema-nad+-7.5ml-vial","api-sema-nad+-10.0ml-vial","api-sema-lipo-2.5ml-vial","api-sema-lipo-5.0ml-vial","api-sema-lipo-7.5ml-vial","api-sema-lipo-10.0ml-vial"],C=[];function we(){console.log("[CRM Extension] Tag removal system initialized")}function tt(){C=[];try{let e=document.querySelectorAll(".tag, .tag-label, .pill, .badge");for(let n of e){let r=n.textContent.trim().toLowerCase();U.some(a=>r.includes(a))&&C.push({element:n,text:r})}let t=document.querySelectorAll("[data-tag]");for(let n of t){let r=n.getAttribute("data-tag").toLowerCase();U.some(a=>r.includes(a))&&C.push({element:n,text:r})}let o=document.querySelectorAll(".tags-container, .tag-list, .tags");for(let n of o){let r=n.querySelectorAll("*");for(let a of r)if(a.nodeType===1){let l=a.textContent.trim().toLowerCase();U.some(s=>l.includes(s))&&(C.some(s=>s.element===a)||C.push({element:a,text:l}))}}let i=document.querySelectorAll("*[class]");for(let n of i){let r=String(n.className).toLowerCase();r&&typeof r=="string"&&U.some(a=>r.includes(a))&&(C.some(a=>a.element===n)||C.push({element:n,text:n.textContent.trim().toLowerCase()}))}return console.log(`[CRM Extension] Found ${C.length} removable tags`),C}catch(e){return console.error("[CRM Extension] Error detecting tags:",e),[]}}function ot(e){try{let t=e.querySelector('.close, .remove, .delete, .tag-remove, [aria-label="Remove"], .x-button');if(t)return console.log("[CRM Extension] Found close button in tag, clicking it"),t.click(),!0;let o=e.parentElement;if(o){let r=o.querySelector('.close, .remove, .delete, .tag-remove, [aria-label="Remove"], .x-button');if(r)return console.log("[CRM Extension] Found close button as sibling, clicking it"),r.click(),!0}let i=[...Array.from(e.querySelectorAll("*")),...Array.from(o?o.children:[])];for(let r of i){let a=r.textContent.trim();if(a==="\xD7"||a==="x"||a==="\u2715"||a==="\u2716"||a==="X")return console.log("[CRM Extension] Found X button by text content, clicking it"),r.click(),!0;if(r.className&&(r.className.includes("close")||r.className.includes("delete")||r.className.includes("remove")||r.className.includes("x-button")))return console.log("[CRM Extension] Found X button by class name, clicking it"),r.click(),!0;if(r.classList&&(r.classList.contains("fa-times")||r.classList.contains("fa-close")||r.classList.contains("icon-close")||r.classList.contains("icon-remove")))return console.log("[CRM Extension] Found X button by icon class, clicking it"),r.click(),!0}if(e.tagName==="BUTTON"||e.tagName==="A"||e.getAttribute("role")==="button"||window.getComputedStyle(e).cursor==="pointer")return console.log("[CRM Extension] Tag appears to be clickable, clicking it"),e.click(),!0;let n=o;for(let r=0;r<3&&n;r++){let a=n.querySelectorAll("button, span, i, div");for(let l of a){let s=l.textContent.trim();if(s==="\xD7"||s==="x"||s==="\u2715"||s==="\u2716"||s==="X"||l.classList.contains("fa-times")||l.classList.contains("fa-close")||l.classList.contains("close")||l.classList.contains("remove"))return console.log("[CRM Extension] Found X button in parent container, clicking it"),l.click(),!0}n=n.parentElement}return console.log("[CRM Extension] No method found to remove tag:",e),!1}catch(t){return console.error("[CRM Extension] Error removing tag:",t),!1}}function te(){return new Promise((e,t)=>{try{let n=function(r){if(r>=C.length){console.log(`[CRM Extension] Removed ${o}/${i} tags`),e({success:!0,message:`Removed ${o} of ${i} tags`,removed:o,total:i});return}let a=C[r];console.log(`[CRM Extension] Removing tag: ${a.text}`),ot(a.element)&&o++,setTimeout(()=>{n(r+1)},300)};tt();let o=0,i=C.length;if(i===0){console.log("[CRM Extension] No removable tags found"),e({success:!0,message:"No tags to remove",removed:0,total:0});return}console.log(`[CRM Extension] Attempting to remove ${i} tags`),n(0)}catch(o){console.error("[CRM Extension] Error in removeAllTags:",o),t(o)}})}function Ce(){console.log("[CRM Extension] Automation removal system initialized")}var u=[];var W="crmplus_history";function Te(){Re(),it(),rt(),window.addEventListener("storage",nt),console.log("[CRM Extension] History tracking initialized")}function Re(){try{let e=localStorage.getItem(W);if(e){u=JSON.parse(e);let t=Date.now();u=u.filter(o=>t-o.timestamp<144e5),oe()}}catch(e){console.error("[CRM Extension] Error loading history:",e),u=[]}}function oe(){try{localStorage.setItem(W,JSON.stringify(u))}catch(e){console.error("[CRM Extension] Error saving history:",e)}}function nt(e){if(e.key===W)try{e.newValue?(u=JSON.parse(e.newValue),console.log("[CRM Extension] History updated from another tab")):(u=[],console.log("[CRM Extension] History cleared from another tab"))}catch(t){console.error("[CRM Extension] Error processing cross-tab history update:",t)}}function it(){let e=window.location.href;setInterval(()=>{let i=window.location.href;i!==e&&(e=i,z(i))},500),z(window.location.href);let t=history.pushState;history.pushState=function(){t.apply(this,arguments),z(window.location.href)};let o=history.replaceState;history.replaceState=function(){o.apply(this,arguments),z(window.location.href)},window.addEventListener("popstate",()=>{z(window.location.href)})}function z(e){if(!e)return;let t=e.match(/\/detail\/([^/]+)/);if(t&&t[1]){let o=t[1];setTimeout(()=>{let i=Ee(),n=Se();i&&i!=="Unknown Patient"?ke(o,i,n,e):(console.log("[CRM Extension] Patient name not found yet, retrying in 3 seconds..."),setTimeout(()=>{let r=Ee(),a=Se();r&&r!=="Unknown Patient"?ke(o,r,a,e):console.log("[CRM Extension] Could not retrieve patient info after retry, not adding to history")},3e3))},5e3)}}function Ee(){let e=document.getElementById("name-text");if(e&&e.textContent&&e.textContent.trim()!=="")return e.textContent.trim();let t=document.querySelector('input[name="contact.first_name"]'),o=document.querySelector('input[name="contact.last_name"]');if(t&&t.value&&o&&o.value)return`${t.value} ${o.value}`.trim();let i=[".patient-name",".contact-name","h1.name",".customer-name","span.name",".profile-name","h2.name",".contact-header .name",'div[data-field="name"]',".patient-info .name"];for(let n of i){let r=document.querySelector(n);if(r&&r.textContent&&r.textContent.trim()!=="")return r.textContent.trim()}return"Unknown Patient"}function Se(){let e=document.getElementById("phone-text");if(e&&e.textContent&&e.textContent.trim()!=="")return e.textContent.trim();let t=document.querySelector('input[name="contact.phone"]');if(t&&t.value.trim()!=="")return t.value.trim();let o=[".phone-number .number",'input[placeholder="Phone"]','input[placeholder="Phone Number"]',".patient-info .phone",".contact-info .phone","span.phone",'div[data-field="phone"]','span[data-field="phone_number"]'];for(let i of o){let n=document.querySelector(i);if(n)if(n.tagName==="INPUT"){let r=n.value.trim();if(r)return r}else{let r=n.textContent.trim();if(r)return r}}return""}function ke(e,t,o,i){let r=Date.now(),a=u.findIndex(l=>l.patientId===e);if(a!==-1){let l=u[a];l.timestamp=r,l.patientName=t,l.phoneNumber=o,u.splice(a,1),u.unshift(l)}else u.unshift({patientId:e,patientName:t,phoneNumber:o,url:i,timestamp:r}),u.length>20&&u.pop();oe()}function rt(){setInterval(()=>{let e=Date.now(),t=0;u=u.filter(o=>{let i=e-o.timestamp<144e5;return i||t++,i}),t>0&&(console.log(`[CRM Extension] Removed ${t} expired history entries`),oe())},5*60*1e3)}function Ae(){Re();let e=Date.now();return u=u.filter(t=>e-t.timestamp<144e5),[...u]}function Me(){u=[],localStorage.removeItem(W),console.log("[CRM Extension] History cleared")}function Le(e){return new Date(e).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}function B(e,t,o={}){let i=document.createElement("div");i.className="group";let n=document.createElement("span");n.className="label",n.textContent=`${t}:`,i.appendChild(n);let r=document.createElement("span");if(r.id=`${e}-display`,r.className="clickable-value",o.initialValue&&r.setAttribute("data-value",o.initialValue),o.icon){let s=document.createElement("span");s.className="btn-icon",s.innerHTML=o.icon,r.appendChild(s)}let a=document.createElement("span");a.textContent=o.initialValue||"",a.id=`${e}-text`,r.appendChild(a);let l=async()=>{let s=r.getAttribute("data-value")||a.textContent.trim();s&&s!==""?await L(s)?c(`Copied ${t}: ${s}`):c(`Failed to copy ${t.toLowerCase()}`):c(`No ${t.toLowerCase()} available to copy`)};return r.addEventListener("click",()=>{o.onClick?o.onClick(r):l()}),r.title=`Click to copy ${t.toLowerCase()} to clipboard`,i.appendChild(r),i}function Ie(){let e=document.createElement("div");return e.className="group",e.id="crm-actions-group",e}var Ne=null,ze=null,Be=null;function De(){let e=document.createElement("div");e.id="crm-api-bar",e.style.display="flex",e.style.flexDirection="row",e.style.alignItems="center",e.style.gap="8px",e.style.background="#23272e",e.style.borderRadius="4px",e.style.padding="4px 8px",e.style.margin="0 0 4px 0",e.style.minWidth="0",e.style.boxShadow="0px 4px 8px 0px rgba(0,0,0,0.10)",e.style.border="1px solid rgba(255,255,255,0.06)";let t=document.createElement("label");t.textContent="Medication:",t.style.marginRight="2px",t.style.fontSize="12px",t.style.color="#e6e6e6";let o=document.createElement("select");o.style.marginRight="4px",o.style.background="#23272e",o.style.color="#a0e0ff",o.style.border="1px solid #444",o.style.borderRadius="2px",o.style.padding="2px 6px",o.style.fontWeight="bold",o.style.fontSize="12px",o.style.height="24px",o.innerHTML=`
    <option value="">Select</option>
    <option value="Tirzepatide">Tirzepatide</option>
    <option value="Semaglutide">Semaglutide</option>
  `;let i=document.createElement("label");i.textContent="Compound:",i.style.marginRight="2px",i.style.fontSize="12px",i.style.color="#e6e6e6";let n=document.createElement("select");n.style.marginRight="4px",n.style.background="#23272e",n.style.color="#a0e0ff",n.style.border="1px solid #444",n.style.borderRadius="2px",n.style.padding="2px 6px",n.style.fontWeight="bold",n.style.fontSize="12px",n.style.height="24px",i.style.display="none",n.style.display="none";let r=document.createElement("label");r.textContent="Dosage (ml):",r.style.marginRight="2px",r.style.fontSize="12px",r.style.color="#e6e6e6";let a=document.createElement("select");a.style.marginRight="4px",a.style.background="#23272e",a.style.color="#a0e0ff",a.style.border="1px solid #444",a.style.borderRadius="2px",a.style.padding="2px 6px",a.style.fontWeight="bold",a.style.fontSize="12px",a.style.height="24px",r.style.display="none",a.style.display="none";let l=document.createElement("button");l.textContent="Refill",l.style.marginLeft="6px",l.style.padding="2px 12px",l.style.background="#1e90ff",l.style.color="#fff",l.style.border="none",l.style.borderRadius="3px",l.style.fontWeight="bold",l.style.fontSize="12px",l.style.cursor="pointer",l.style.height="24px",l.addEventListener("mouseenter",()=>l.style.background="#0074d9"),l.addEventListener("mouseleave",()=>l.style.background="#1e90ff");let s=document.createElement("button");s.textContent="Name",s.style.marginLeft="6px",s.style.padding="2px 12px",s.style.background="#6c63ff",s.style.color="#fff",s.style.border="none",s.style.borderRadius="3px",s.style.fontWeight="bold",s.style.fontSize="12px",s.style.cursor="pointer",s.style.height="24px",s.style.display="none",s.addEventListener("mouseenter",()=>s.style.background="#4b47b7"),s.addEventListener("mouseleave",()=>s.style.background="#6c63ff");function d(){o.value&&l.textContent==="Refill"?s.style.display="inline-block":s.style.display="none"}o.addEventListener("change",d),n.addEventListener("change",d),a.addEventListener("change",d),l.addEventListener("click",d),s.addEventListener("click",async()=>{let h=null,m=null;o.value==="Tirzepatide"?(h="api-refill-patient-tirz-name",n.value==="B6 syringe"?m="api-refill-tirz-b6-syringe":n.value==="B6 vial"?m="api-refill-tirz-b6-vial":n.value==="B12 vial"?m="api-refill-tirz-b12-vial":n.value==="NAD+ vial"&&(m="api-refill-tirz-nad-vial")):o.value==="Semaglutide"&&(h="api-refill-patient-sema-name",n.value==="B12 syringe"?m="api-refill-sema-b12-syringe":n.value==="B12 vial"?m="api-refill-sema-b12-vial":n.value==="B6 vial"?m="api-refill-sema-b6-vial":n.value==="Lipo vial"?m="api-refill-sema-lipo-vial":n.value==="NAD+ vial"&&(m="api-refill-sema-nad-vial")),h&&!m?await S(h):h&&m?(await S(h),await S(m)):c("Please select a medication.")}),o.addEventListener("change",()=>{Ne=o.value,Ne?(i.style.display="inline-block",n.style.display="inline-block",l.textContent="Refill"):(i.style.display="none",n.style.display="none",r.style.display="none",a.style.display="none",l.textContent="Refill"),y()}),n.addEventListener("change",()=>{ze=n.value,ze?(r.style.display="inline-block",a.style.display="inline-block",l.textContent="Form"):(r.style.display="none",a.style.display="none",l.textContent="Refill"),A()}),a.addEventListener("change",()=>{Be=a.value,Be?l.textContent="Invoice":l.textContent="Form"});let p=(h,m,v)=>[h,m,v].map(E=>(E||"").trim()).join("|"),f=(h,m,v)=>[h,m,v].map(E=>(E||"").trim()).join("|"),g={"Tirzepatide|B6 syringe|QTY: 1 - 0.25 ml":"api-tirz-b6-0.25ml-syringe","Tirzepatide|B6 syringe|QTY: 2 - 0.5 ml":"api-tirz-b6-0.5ml-syringe","Tirzepatide|B6 syringe|QTY: 3 - 0.75 ml":"api-tirz-b6-0.75ml-syringe","Tirzepatide|B6 syringe|QTY: 4 - 1.0 ml":"api-tirz-b6-1.0ml-syringe","Tirzepatide|B6 syringe|QTY: 5 - 1.25 ml":"api-tirz-b6-1.25ml-syringe","Tirzepatide|B6 syringe|QTY: 6 - 1.5 ml":"api-tirz-b6-1.5ml-syringe","Semaglutide|B12 syringe|QTY: 0.5 - 0.125 ml":"api-sema-b12-0.125ml-syringe","Semaglutide|B12 syringe|QTY: 1 - 0.25 ml":"api-sema-b12-0.25ml-syringe","Semaglutide|B12 syringe|QTY: 2 - 0.5 ml":"api-sema-b12-0.5ml-syringe","Semaglutide|B12 syringe|QTY: 3 - 0.75 ml":"api-sema-b12-0.75ml-syringe","Semaglutide|B12 syringe|QTY: 4 - 1.0 ml":"api-sema-b12-1.0ml-syringe","Semaglutide|B12 syringe|QTY: 5 - 1.25 ml":"api-sema-b12-1.25ml-syringe","Semaglutide|B12 syringe|QTY: 6 - 1.5 ml":"api-sema-b12-1.5ml-syringe","Semaglutide|B12 syringe|QTY: 7 - 1.75 ml":"api-sema-b12-1.75ml-syringe","Semaglutide|B12 syringe|QTY: 8 - 2.0 ml":"api-sema-b12-2.0ml-syringe","Tirzepatide|NAD+ vial|2.5 ml":"api-tirz-nad+-2.5ml-vial","Tirzepatide|NAD+ vial|5 ml":"api-tirz-nad+-5.0ml-vial","Tirzepatide|NAD+ vial|7.5 ml":"api-tirz-nad+-7.5ml-vial","Tirzepatide|NAD+ vial|10 ml":"api-tirz-nad+-10.0ml-vial","Tirzepatide|B6 vial|2.5 ml":"api-tirz-b6-2.5ml-vial","Tirzepatide|B6 vial|5 ml":"api-tirz-b6-5.0ml-vial","Tirzepatide|B6 vial|7.5 ml":"api-tirz-b6-7.5ml-vial","Tirzepatide|B6 vial|10 ml":"api-tirz-b6-10.0ml-vial","Tirzepatide|B12 vial|2.5 ml":"api-tirz-b12-2.5ml-vial","Tirzepatide|B12 vial|5 ml":"api-tirz-b12-5.0ml-vial","Tirzepatide|B12 vial|7.5 ml":"api-tirz-b12-7.5ml-vial","Tirzepatide|B12 vial|10 ml":"api-tirz-b12-10.0ml-vial","Semaglutide|NAD+ vial|2.5 ml":"api-sema-nad+-2.5ml-vial","Semaglutide|NAD+ vial|5 ml":"api-sema-nad+-5.0ml-vial","Semaglutide|NAD+ vial|7.5 ml":"api-sema-nad+-7.5ml-vial","Semaglutide|NAD+ vial|10 ml":"api-sema-nad+-10.0ml-vial","Semaglutide|B6 vial|2.5 ml":"api-sema-b6-2.5ml-vial","Semaglutide|B6 vial|5 ml":"api-sema-b6-5.0ml-vial","Semaglutide|B6 vial|7.5 ml":"api-sema-b6-7.5ml-vial","Semaglutide|B6 vial|10 ml":"api-sema-b6-10.0ml-vial","Semaglutide|B12 vial|2.5 ml":"api-sema-b12-2.5ml-vial","Semaglutide|B12 vial|5 ml":"api-sema-b12-5.0ml-vial","Semaglutide|B12 vial|7.5 ml":"api-sema-b12-7.5ml-vial","Semaglutide|B12 vial|10 ml":"api-sema-b12-10.0ml-vial","Semaglutide|Lipo vial|2.5 ml":"api-sema-lipo-2.5ml-vial","Semaglutide|Lipo vial|5 ml":"api-sema-lipo-5.0ml-vial","Semaglutide|Lipo vial|7.5 ml":"api-sema-lipo-7.5ml-vial","Semaglutide|Lipo vial|10 ml":"api-sema-lipo-10.0ml-vial"},x={"Tirzepatide|B6 syringe|Step 1: Start Refill":"api-refill-patient-tirz","Tirzepatide|NAD+ vial|Step 1: Start Refill":"api-refill-patient-tirz","Tirzepatide|Lipo vial|Step 1: Start Refill":"api-refill-patient-tirz","Tirzepatide|B6 vial|Step 1: Start Refill":"api-refill-patient-tirz","Tirzepatide|B12 vial|Step 1: Start Refill":"api-refill-patient-tirz","Tirzepatide|B6 syringe|Step 1.5: Verify first name":"api-refill-patient-tirz-name","Tirzepatide|NAD+ vial|Step 1.5: Verify first name":"api-refill-patient-tirz-name","Tirzepatide|Lipo vial|Step 1.5: Verify first name":"api-refill-patient-tirz-name","Tirzepatide|B6 vial|Step 1.5: Verify first name":"api-refill-patient-tirz-name","Tirzepatide|B12 vial|Step 1.5: Verify first name":"api-refill-patient-tirz-name","Tirzepatide|B6 syringe|Step 2: Verify form":"api-refill-patient-tirz-form","Tirzepatide|NAD+ vial|Step 2: Verify form":"api-refill-patient-tirz-form","Tirzepatide|Lipo vial|Step 2: Verify form":"api-refill-patient-tirz-form","Tirzepatide|B6 vial|Step 2: Verify form":"api-refill-patient-tirz-form","Tirzepatide|B12 vial|Step 2: Verify form":"api-refill-patient-tirz-form","Tirzepatide|B6 syringe|Step 3: Waiting on payment":"API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)","Tirzepatide|NAD+ vial|Step 3: Waiting on payment":"API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)","Tirzepatide|Lipo vial|Step 3: Waiting on payment":"API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)","Tirzepatide|B6 vial|Step 3: Waiting on payment":"API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)","Tirzepatide|B12 vial|Step 3: Waiting on payment":"API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)","Tirzepatide|B6 syringe|Step 4: Sending payment":"api-tirz-refill-invoice","Tirzepatide|NAD+ vial|Step 4: Sending payment":"api-tirz-refill-invoice","Tirzepatide|Lipo vial|Step 4: Sending payment":"api-tirz-refill-invoice","Tirzepatide|B6 vial|Step 4: Sending payment":"api-tirz-refill-invoice","Tirzepatide|B12 vial|Step 4: Sending payment":"api-tirz-refill-invoice","Semaglutide|B12 syringe|Step 1: Start Refill":"api-refill-patient-sema","Semaglutide|NAD+ vial|Step 1: Start Refill":"api-refill-patient-sema","Semaglutide|Lipo vial|Step 1: Start Refill":"api-refill-patient-sema","Semaglutide|B6 vial|Step 1: Start Refill":"api-refill-patient-sema","Semaglutide|B12 vial|Step 1: Start Refill":"api-refill-patient-sema","Semaglutide|B12 syringe|Step 1.5: Verify first name":"api-refill-patient-sema-name","Semaglutide|NAD+ vial|Step 1.5: Verify first name":"api-refill-patient-sema-name","Semaglutide|Lipo vial|Step 1.5: Verify first name":"api-refill-patient-sema-name","Semaglutide|B6 vial|Step 1.5: Verify first name":"api-refill-patient-sema-name","Semaglutide|B12 vial|Step 1.5: Verify first name":"api-refill-patient-sema-name","Semaglutide|B12 syringe|Step 2: Verify form":"api-refill-patient-sema-form","Semaglutide|NAD+ vial|Step 2: Verify form":"api-refill-patient-sema-form","Semaglutide|Lipo vial|Step 2: Verify form":"api-refill-patient-sema-form","Semaglutide|B6 vial|Step 2: Verify form":"api-refill-patient-sema-form","Semaglutide|B12 vial|Step 2: Verify form":"api-refill-patient-sema-form","Semaglutide|B12 syringe|Step 3: Waiting on payment":"API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)","Semaglutide|NAD+ vial|Step 3: Waiting on payment":"API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)","Semaglutide|Lipo vial|Step 3: Waiting on payment":"API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)","Semaglutide|B6 vial|Step 3: Waiting on payment":"API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)","Semaglutide|B12 vial|Step 3: Waiting on payment":"API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)","Semaglutide|B12 syringe|Step 4: Sending payment":"api-sema-refill-invoice","Semaglutide|NAD+ vial|Step 4: Sending payment":"api-sema-refill-invoice","Semaglutide|Lipo vial|Step 4: Sending payment":"api-sema-refill-invoice","Semaglutide|B6 vial|Step 4: Sending payment":"api-sema-refill-invoice","Semaglutide|B12 vial|Step 4: Sending payment":"api-sema-refill-invoice"};l.addEventListener("click",async()=>{let h=null;if(l.textContent==="Refill"){if(h="Step 1: Start Refill",o.value==="Tirzepatide"){S("api-refill-patient-tirz");return}else if(o.value==="Semaglutide"){S("api-refill-patient-sema");return}}else if(l.textContent==="Form"){h="Step 2: Verify form";let b=null,w=null;o.value==="Tirzepatide"?(n.value==="B6 syringe"?b="api-refill-tirz-b6-syringe":n.value==="B6 vial"?b="api-refill-tirz-b6-vial":n.value==="B12 vial"?b="api-refill-tirz-b12-vial":n.value==="NAD+ vial"&&(b="api-refill-tirz-nad-vial"),w="api-refill-patient-tirz-form"):o.value==="Semaglutide"&&(n.value==="B12 syringe"?b="api-refill-sema-b12-syringe":n.value==="B12 vial"?b="api-refill-sema-b12-vial":n.value==="B6 vial"?b="api-refill-sema-b6-vial":n.value==="Lipo vial"?b="api-refill-sema-lipo-vial":n.value==="NAD+ vial"&&(b="api-refill-sema-nad-vial"),w="api-refill-patient-sema-form"),b&&w?(await S(b),await S(w)):b?await S(b):c("No tag found for this medication/compound combination.");return}else if(l.textContent==="Invoice")h="Step 4: Sending payment";else{c("Unknown step. Please check your selections.");return}let m=p(o.value,n.value,h),v=f(o.value,n.value,a.value),E=x[m],q=g[v];if(!E){c("No tag found for this selection."),console.error("No tag found for key:",m);return}if(l.textContent==="Invoice"){if(!q){c("No dosage found for this selection."),console.error("No dosage found for key:",v);return}await S(E,q)}else await S(E)}),e.appendChild(t),e.appendChild(o),e.appendChild(i),e.appendChild(n),e.appendChild(r),e.appendChild(a),e.appendChild(l),e.appendChild(s),y(),i.style.display="none",n.style.display="none",r.style.display="none",a.style.display="none",l.style.display="inline-block";function y(){n.innerHTML='<option value="">Select</option>',a.innerHTML='<option value="">Select</option>',o.value==="Tirzepatide"?n.innerHTML+=`
        <option value="B6 syringe">B6 syringe</option>
        <option value="NAD+ vial">NAD+ vial</option>
        <option value="Lipo vial">Lipo vial</option>
        <option value="B6 vial">B6 vial</option>
        <option value="B12 vial">B12 vial</option>
      `:o.value==="Semaglutide"&&(n.innerHTML+=`
        <option value="B12 syringe">B12 syringe</option>
        <option value="NAD+ vial">NAD+ vial</option>
        <option value="Lipo vial">Lipo vial</option>
        <option value="B6 vial">B6 vial</option>
        <option value="B12 vial">B12 vial</option>
      `)}function A(){a.innerHTML='<option value="">Select</option>',o.value==="Tirzepatide"&&n.value==="B6 syringe"?a.innerHTML+=`
        <option value="QTY: 1 - 0.25 ml">QTY: 1 - 0.25 ml</option>
        <option value="QTY: 2 - 0.5 ml">QTY: 2 - 0.5 ml</option>
        <option value="QTY: 3 - 0.75 ml">QTY: 3 - 0.75 ml</option>
        <option value="QTY: 4 - 1.0 ml">QTY: 4 - 1.0 ml</option>
        <option value="QTY: 5 - 1.25 ml">QTY: 5 - 1.25 ml</option>
        <option value="QTY: 6 - 1.5 ml">QTY: 6 - 1.5 ml</option>
      `:o.value==="Semaglutide"&&n.value==="B12 syringe"?a.innerHTML+=`
        <option value="QTY: 0.5 - 0.125 ml">QTY: 0.5 - 0.125 ml</option>
        <option value="QTY: 1 - 0.25 ml">QTY: 1 - 0.25 ml</option>
        <option value="QTY: 2 - 0.5 ml">QTY: 2 - 0.5 ml</option>
        <option value="QTY: 3 - 0.75 ml">QTY: 3 - 0.75 ml</option>
        <option value="QTY: 4 - 1.0 ml">QTY: 4 - 1.0 ml</option>
        <option value="QTY: 5 - 1.25 ml">QTY: 5 - 1.25 ml</option>
        <option value="QTY: 6 - 1.5 ml">QTY: 6 - 1.5 ml</option>
        <option value="QTY: 7 - 1.75 ml">QTY: 7 - 1.75 ml</option>
        <option value="QTY: 8 - 2.0 ml">QTY: 8 - 2.0 ml</option>
      `:n.value.endsWith("vial")&&(a.innerHTML+=`
        <option value="2.5 ml">2.5 ml</option>
        <option value="5 ml">5 ml</option>
        <option value="7.5 ml">7.5 ml</option>
        <option value="10 ml">10 ml</option>
      `)}return e}async function S(e,t){try{let o=await te();console.log("[CRM Extension] Cleanup completed:"),console.log(`- Tags: ${o.removed}/${o.total} removed`),t?(await ne(t),await ne(e)):await ne(e)}catch(o){console.error("[CRM Extension] Error during cleanup:",o),c("Error during cleanup. Please try again.")}}function at(){let e=document.querySelector('input[placeholder="Add Tags"]');if(e)return e;let t=Array.from(document.querySelectorAll("input[placeholder]")).filter(r=>r.placeholder.toLowerCase().includes("tag"));if(t.length>0)return t[0];let o=document.querySelectorAll(".tag-input, .tags-input, .tag-container");for(let r of o){let a=r.querySelector("input");if(a)return a}if(e=document.querySelector('input[placeholder="smartList.bulkTags.addTags"]'),e)return e;let i=document.querySelectorAll(".hl-text-input");if(i.length>0)return i[0];console.error("[CRM Extension] Could not find tag input field with any strategy");let n=document.querySelectorAll("input");return console.log("[CRM Extension] All inputs on page:",n),null}function ne(e){return new Promise(t=>{let o=at();o?(o.focus(),setTimeout(()=>{o.value=e,o.dispatchEvent(new Event("input",{bubbles:!0})),setTimeout(()=>{let i=document.querySelectorAll(".v-list-item, .dropdown-item, .select-option, li"),n=!1;for(let r of i)if(r.textContent.toLowerCase().includes(e)){r.click(),n=!0,c(`Selected tag: ${e}`);break}if(!n){let r=document.querySelectorAll("*");for(let a of r)if(a.textContent.trim().toLowerCase()===e){a.click(),n=!0,c(`Selected tag: ${e}`);break}n||o.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:!0}))}setTimeout(t,400)},300)},300)):(c("Tags field not found"),t())})}var lt=["wait","warm","provider-wait","tirz-vial-price","tirz-syringe-price","sema-vial-price","sema-syringe-price","ship-duration","no-refill","no-titration","pickup-msg","call","fda","glp","states","video","talk-to-crm"];function Pe(){let e=document.createElement("div");e.id="crm-frequent-tags-bar",e.style.display="flex",e.style.flexDirection="row",e.style.alignItems="center",e.style.gap="8px",e.style.background="#23272e",e.style.borderRadius="4px",e.style.padding="4px 8px",e.style.margin="0 0 4px 0",e.style.minWidth="0",e.style.boxShadow="0px 4px 8px 0px rgba(0,0,0,0.10)",e.style.border="1px solid rgba(255,255,255,0.06)";let t=document.createElement("label");t.textContent="\u{1F4CE}Hi I'm Snippy:",t.style.fontSize="12px",t.style.color="#e6e6e6",t.style.marginRight="2px";let o=document.createElement("input");o.type="text",o.placeholder="Type or select a tag",o.autocomplete="off",o.style.background="#23272e",o.style.color="#a0e0ff",o.style.border="1px solid #444",o.style.borderRadius="2px",o.style.padding="2px 6px",o.style.fontWeight="normal",o.style.fontSize="12px",o.style.height="24px",o.style.minWidth="160px",o.style.boxSizing="border-box",o.style.verticalAlign="middle";let i=document.createElement("div");i.style.position="absolute",i.style.background="#23272e",i.style.color="#a0e0ff",i.style.border="1px solid #444",i.style.borderRadius="2px",i.style.boxShadow="0px 4px 8px 0px rgba(0,0,0,0.10)",i.style.fontSize="12px",i.style.marginTop="2px",i.style.zIndex="10000",i.style.display="none",i.style.maxHeight="180px",i.style.overflowY="auto";let n=document.createElement("div");n.style.position="relative",n.appendChild(o),n.appendChild(i);let r=[],a=-1;function l(){let p=o.value.trim().toLowerCase(),f=pt();if(!p&&document.activeElement===o?r=[...f]:r=f.filter(g=>g.toLowerCase().includes(p)),i.innerHTML="",a=-1,r.length===0){i.style.display="none";return}r.forEach((g,x)=>{let y=document.createElement("div");y.textContent=g,y.style.padding="4px 8px",y.style.cursor="pointer",y.style.borderRadius="2px",y.addEventListener("mouseenter",()=>{a=x,d()}),y.addEventListener("mouseleave",()=>{a=-1,d()}),y.addEventListener("mousedown",async A=>{A.preventDefault(),await s(g)}),x===a&&(y.style.background="#1e90ff",y.style.color="#fff"),i.appendChild(y)}),i.style.display="block"}async function s(p){o.blur(),setTimeout(async()=>{await st(p),dt(p),o.value="",i.style.display="none"},120)}o.addEventListener("input",l),o.addEventListener("focus",l),o.addEventListener("blur",()=>{setTimeout(()=>i.style.display="none",100)}),o.addEventListener("keydown",p=>{i.style.display==="block"&&r.length>0&&(p.key==="ArrowDown"?(p.preventDefault(),a=(a+1)%r.length,d()):p.key==="ArrowUp"?(p.preventDefault(),a=(a-1+r.length)%r.length,d()):p.key==="Enter"?(p.preventDefault(),a>=0&&a<r.length?s(r[a]):r.length===1&&s(r[0])):p.key==="Escape"&&(i.style.display="none"))});function d(){Array.from(i.children).forEach((p,f)=>{f===a?(p.style.background="#1e90ff",p.style.color="#fff"):(p.style.background="#23272e",p.style.color="#a0e0ff")})}return e.appendChild(t),e.appendChild(n),e}function st(e){return new Promise(t=>{let o=ct();o?(o.focus(),setTimeout(()=>{o.value=e,o.dispatchEvent(new Event("input",{bubbles:!0}));let i=0,n=5;function r(){let a=document.querySelectorAll(".v-list-item, .dropdown-item, .select-option, li"),l=!1;for(let s of a)if(s.textContent.toLowerCase().includes(e)){s.click(),l=!0,c(`Selected tag: ${e}`),setTimeout(t,600);return}if(!l){let s=document.querySelectorAll("*");for(let d of s)if(d.textContent.trim().toLowerCase()===e){d.click(),l=!0,c(`Selected tag: ${e}`),setTimeout(t,600);return}}!l&&i<n?(i++,setTimeout(r,200)):l||(o.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:!0})),setTimeout(t,600))}setTimeout(r,400)},400)):(c("Tags field not found"),t())})}function ct(){let e=document.querySelector('input[placeholder="Add Tags"]');if(e)return e;let t=Array.from(document.querySelectorAll("input[placeholder]")).filter(r=>r.placeholder.toLowerCase().includes("tag"));if(t.length>0)return t[0];let o=document.querySelectorAll(".tag-input, .tags-input, .tag-container");for(let r of o){let a=r.querySelector("input");if(a)return a}if(e=document.querySelector('input[placeholder="smartList.bulkTags.addTags"]'),e)return e;let i=document.querySelectorAll(".hl-text-input");if(i.length>0)return i[0];console.error("[CRM Extension] Could not find tag input field with any strategy");let n=document.querySelectorAll("input");return console.log("[CRM Extension] All inputs on page:",n),null}function qe(){try{return JSON.parse(localStorage.getItem("crm_frequent_tag_usage")||"{}")}catch{return{}}}function dt(e){let t=qe();t[e]=(t[e]||0)+1,localStorage.setItem("crm_frequent_tag_usage",JSON.stringify(t))}function pt(){let e=qe();return[...lt].sort((t,o)=>{let i=e[t]||0,n=e[o]||0;return i!==n?n-i:t.localeCompare(o)})}function He(){let e=document.createElement("div");e.className="group",e.id="crm-dropdowns-group",e.style.display="flex",e.style.flexDirection="row",e.style.justifyContent="space-between",e.style.alignItems="center",e.style.width="100%";let t=document.createElement("div");t.style.display="flex",t.style.flexDirection="row",t.style.alignItems="center",t.appendChild(De());let o=document.createElement("div");return o.style.display="flex",o.style.flexDirection="row",o.style.alignItems="center",o.style.marginLeft="auto",o.appendChild(Pe()),e.appendChild(t),e.appendChild(o),document.addEventListener("click",i=>{document.querySelectorAll(".dropdown").forEach(r=>{r.contains(i.target)||(r.classList.remove("show"),r.querySelectorAll(".nested-dropdown").forEach(l=>{l.classList.remove("open")}))})}),mt(),e}function mt(){if(document.getElementById("custom-dropdown-styles"))return;let e=document.createElement("style");e.id="custom-dropdown-styles",e.textContent=`
    /* Improved dropdown positioning */
    .dropdown {
      position: relative !important;
      margin-right: 8px !important; /* Ensure space between dropdowns, reduced for tighter layout */
    }

    .dropdown:last-child {
      margin-right: 0 !important; /* Remove margin from the last dropdown */
    }

    .dropdown-content {
      position: absolute !important;
      background-color: #2F3A4B; /* Match toolbar background color */
      min-width: 220px !important; /* Increased width */
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
      z-index: 999;
      border-radius: 4px;
      margin-top: 5px !important; /* Add space between button and dropdown */
      left: 0;
      top: 100% !important; /* Position below the button */
      display: none;
      border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
    }

    /* Ensure right-aligned dropdowns don't overflow */
    #crm-tags-dropdown .dropdown-content {
      right: 0;
      left: auto; /* Override left positioning for Tags dropdown */
    }

    .dropdown.show .dropdown-content {
      display: block;
    }

    /* Improved nested dropdown positioning */
    .nested-dropdown-content {
      margin-top: 3px !important;
      background-color: #2F3A4B; /* Match toolbar background color */
      border-radius: 4px;
      padding: 5px !important;
    }

    /* Style dropdown items */
    .dropdown-item {
      color: #e6e6e6; /* White text for visibility */
      padding: 10px 14px !important; /* Increased padding */
      text-decoration: none;
      display: block;
      font-size: 14px;
      cursor: pointer;
      border-radius: 3px;
      font-weight: normal;
    }

    .dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    /* Fix for Vial-Sema and Vial-Tirz nested dropdowns */
    .nested-dropdown-btn {
      text-align: left !important;
      padding: 8px 12px !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      color: #e6e6e6 !important;
      font-weight: bold !important;
    }

    .nested-dropdown-btn:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }

    /* Force visibility for Tags dropdown */
    #crm-tags-dropdown {
      display: flex !important;
    }

    #crm-tags-dropdown .dropdown-content {
      min-width: 220px !important;
    }
  `,document.head.appendChild(e)}function _e(){let e=document.createElement("div");e.className="group",e.id="crm-settings-group",e.style.position="relative";let t=document.createElement("button");t.className="btn",t.id="crm-settings-btn";let o=document.createElement("span");o.className="btn-icon",o.innerHTML="\u2699\uFE0F",t.appendChild(o);let i=document.createElement("span");i.textContent="Settings",t.appendChild(i);let n=ft();if(t.addEventListener("click",r=>{r.stopPropagation(),n.classList.toggle("show")}),document.addEventListener("click",r=>{r.target!==t&&!t.contains(r.target)&&r.target!==n&&!n.contains(r.target)&&n.classList.remove("show")}),!document.getElementById("settings-dropdown-styles")){let r=document.createElement("style");r.id="settings-dropdown-styles",r.textContent=`
      #mcp-crm-settings-dropdown {
        display: none;
        position: absolute;
        top: calc(100% + 5px); /* Position below the button with 5px gap */
        right: 0;
        z-index: 1000;
        min-width: 230px;
        background-color: #2F3A4B;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }
      
      #mcp-crm-settings-dropdown.show {
        display: block;
      }
      
      .settings-header {
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: bold;
        color: #e6e6e6;
      }
      
      .settings-body {
        padding: 10px;
        color: #e6e6e6;
      }
      
      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 13px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
      }
      
      .setting-item:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .setting-label {
        color: #e6e6e6;
        font-weight: normal;
      }
      
      /* Toggle switch styles */
      .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #555;
        transition: .4s;
        border-radius: 34px;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .slider {
        background-color: #2196F3;
      }
      
      input:focus + .slider {
        box-shadow: 0 0 1px #2196F3;
      }
      
      input:checked + .slider:before {
        transform: translateX(20px);
      }
      
      /* Version info styles */
      .version-info {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 10px;
        padding-top: 10px;
        font-size: 12px;
        color: #e6e6e6;
      }
      
      .version-info p {
        margin: 5px 0;
        color: #e6e6e6;
      }
      
      .version-number {
        font-weight: 600;
        color: #e6e6e6;
      }
      
      .check-updates-btn {
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 4px 8px;
        margin-top: 5px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
        text-align: center;
        color: #e6e6e6;
      }
      
      .check-updates-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .check-updates-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      #crm-update-status {
        margin: 5px 0 0 0;
        padding: 3px 6px;
        font-size: 11px;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.05);
        text-align: center;
        transition: all 0.3s ease;
        color: #e6e6e6;
      }
      
      #last-update-check {
        font-size: 11px;
        margin: 5px 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        color: #e6e6e6;
      }
      
      .check-status {
        font-size: 10px;
        margin-left: 5px;
        padding: 1px 4px;
        border-radius: 3px;
        font-weight: normal;
      }
      
      .loading-text {
        font-style: italic;
        color: #aaa;
      }
      
      /* Section styles */
      .setting-section {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .setting-section-title {
        font-size: 12px;
        font-weight: bold;
        color: #e6e6e6;
        margin-bottom: 10px;
      }
    `,document.head.appendChild(r)}return e.appendChild(t),e.appendChild(n),e}function ut(e){try{(typeof browser<"u"?browser:chrome).runtime.sendMessage({action:"getLastUpdateCheck"}).then(o=>{if(o&&o.success&&o.lastUpdateCheck){let i=o.lastUpdateCheck,n="",r="";i.success?i.status==="update_available"?(n="Update available",r="#4CAF50"):i.status==="no_update"?(n="No updates needed",r="#2196F3"):i.status==="throttled"?(n="Check throttled",r="#FF9800"):(n="Completed",r="#2196F3"):(n="Failed",r="#F44336"),e.innerHTML=`Last Check: <span class="version-number">${i.formattedTime}</span> <span class="check-status" style="color:${r};font-size:10px;margin-left:5px;">${n}</span>`}else e.innerHTML='Last Check: <span class="version-number">No checks recorded</span>'}).catch(o=>{console.error("[CRM Extension] Error fetching last update check:",o),e.innerHTML='Last Check: <span class="version-number">Unknown</span>'})}catch(t){console.error("[CRM Extension] Error in fetchLastUpdateCheckInfo:",t),e.innerHTML='Last Check: <span class="version-number">Error</span>'}}function ft(){let e=document.createElement("div");e.id="mcp-crm-settings-dropdown";let t=document.createElement("div");t.className="settings-header",t.textContent="CRM+ Settings",e.appendChild(t);let o=document.createElement("div");if(o.className="settings-body",e.appendChild(o),!document.getElementById("collapsible-settings-styles")){let l=document.createElement("style");l.id="collapsible-settings-styles",l.textContent=`
      .setting-section {
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 0; /* No bottom padding when collapsed */
      }
      
      .setting-section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: bold;
        color: #e6e6e6;
        padding: 8px 0;
        cursor: pointer;
        user-select: none;
      }
      
      .setting-section-title:after {
        content: "\u25BC";
        font-size: 8px;
        color: #e6e6e6;
        transition: transform 0.2s ease;
      }
      
      .setting-section.collapsed .setting-section-title:after {
        transform: rotate(-90deg);
      }
      
      .setting-section-content {
        max-height: 500px;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.2s ease, margin-bottom 0.3s ease;
        opacity: 1;
        margin-bottom: 10px;
      }
      
      .setting-section.collapsed .setting-section-content {
        max-height: 0;
        opacity: 0;
        margin-bottom: 0;
      }
    `,document.head.appendChild(l)}let i=ie("General Settings");i.content.appendChild(T("Show Header Bar","crmplus_headerBarVisible",l=>{let s=document.getElementById("mcp-crm-header");s&&(s.style.display=l?"flex":"none",document.body.style.paddingTop=l?"32px":"0"),c(`Header bar: ${l?"Visible":"Hidden"}`)},!0)),i.content.appendChild(T("Show Provider-Paid Alerts","crmplus_showProviderPaidAlerts",l=>{c(`Provider-Paid alerts: ${l?"Enabled":"Disabled"}`)},!0)),o.appendChild(i.section);let n=ie("External Links");n.content.appendChild(T("Show ShipStation Link","crmplus_showShipStation",l=>{let s=document.querySelector(".shipstation-link");s&&(s.style.display=l?"flex":"none"),c(`ShipStation link: ${l?"Visible":"Hidden"}`)},!0)),n.content.appendChild(T("Show Stripe Link","crmplus_showStripe",l=>{let s=document.querySelector(".stripe-link");s&&(s.style.display=l?"flex":"none"),c(`Stripe link: ${l?"Visible":"Hidden"}`)},!0)),n.content.appendChild(T("Show Webmail Link","crmplus_showWebmail",l=>{let s=document.querySelector(".webmail-link");s&&(s.style.display=l?"flex":"none"),c(`Webmail link: ${l?"Visible":"Hidden"}`)},!0)),o.appendChild(n.section);let r=ie("Features");r.content.appendChild(T("Auto-copy phone number on page load","crmplus_autoCopyPhone",l=>{c(`Auto-copy phone: ${l?"Enabled":"Disabled"}`)},!1)),r.content.appendChild(T("CRM Automation","crmplus_automationEnabled",l=>{[document.getElementById("crm-automation-dropdown"),document.getElementById("crm-tags-dropdown")].forEach(d=>{d?(d.style.display=l?"flex":"none",console.log(`[CRM Extension] Changed visibility for ${d.id}: ${l?"visible":"hidden"}`)):console.error("[CRM Extension] Could not find automation element to toggle")}),c(`CRM Automation: ${l?"Enabled":"Disabled"}`)},!0)),o.appendChild(r.section);let a=gt();return o.appendChild(a),e}function ie(e,t=!1){let o=document.createElement("div");o.className="setting-section"+(t?" collapsed":"");let i=document.createElement("div");i.className="setting-section-title",i.textContent=e,i.addEventListener("click",()=>{o.classList.toggle("collapsed")}),o.appendChild(i);let n=document.createElement("div");return n.className="setting-section-content",o.appendChild(n),{section:o,content:n}}function gt(){let e=document.createElement("div");e.className="version-info";let t="Loading...",o="Loading...";try{let s=(typeof browser<"u"?browser:chrome).runtime.getManifest();if(s&&s.version&&(t=s.version,t.includes("."))){let d=t.split(".");if(d.length===3&&d[0].length===4){let p=d[0],f=d[1],g=d[2];o=`${f}/${g}/${p}`}}}catch(l){console.error("[CRM Extension] Error fetching version:",l),t="Unknown",o="Unknown"}let i=document.createElement("p");i.innerHTML=`Version: <span class="version-number">${t}</span>`,e.appendChild(i);let n=document.createElement("p");n.innerHTML=`Last Updated: <span class="version-number">${o}</span>`,e.appendChild(n);let r=document.createElement("p");r.id="last-update-check",r.innerHTML='Last Check: <span class="loading-text">Loading...</span>',e.appendChild(r),ut(r);let a=document.createElement("button");return a.className="check-updates-btn",a.textContent="Check for Updates",a.addEventListener("click",()=>{let l=typeof browser<"u"?browser:chrome;a.disabled=!0,a.textContent="Checking...",c("Checking for updates...");let s=document.getElementById("crm-update-status");s||(s=document.createElement("p"),s.id="crm-update-status",s.style.fontSize="11px",s.style.marginTop="5px",s.style.color="#e6e6e6",s.textContent="",e.appendChild(s)),l.runtime.sendMessage({action:"checkForUpdates"}).then(d=>{if(d&&d.success){c("Update check completed"),d.updateStatus==="update_available"?(s.textContent=`Update available (${d.updateVersion})`,s.style.color="#4CAF50"):d.updateStatus==="no_update"?(s.textContent="You have the latest version",s.style.color="#2196F3"):d.updateStatus==="throttled"?(s.textContent="Update check throttled, try again later",s.style.color="#FF9800"):d.updateStatus==="error"?(s.textContent="Error checking for updates",s.style.color="#F44336"):(s.textContent="Update check initiated",s.style.color="#e6e6e6");let p=document.getElementById("last-update-check");if(p&&d.lastCheck){let f=d.lastCheck,g="",x="";f.success?f.status==="update_available"?(g="Update available",x="#4CAF50"):f.status==="no_update"?(g="No updates needed",x="#2196F3"):f.status==="throttled"?(g="Check throttled",x="#FF9800"):(g="Completed",x="#2196F3"):(g="Failed",x="#F44336"),p.innerHTML=`Last Check: <span class="version-number">${f.formattedTime}</span> <span class="check-status" style="color:${x};font-size:10px;margin-left:5px;">${g}</span>`}}else c("Error checking for updates"),s.textContent="Update check failed",s.style.color="#F44336";a.disabled=!1,a.textContent="Check for Updates"}).catch(d=>{console.error("[CRM Extension] Error sending update check message:",d),c("Error checking for updates"),s.textContent="Connection failed",s.style.color="#F44336",a.disabled=!1,a.textContent="Check for Updates"})}),e.appendChild(a),e}function T(e,t,o,i=!1){let n=document.createElement("div");n.className="setting-item";let r=document.createElement("div");r.className="setting-label",r.textContent=e,n.appendChild(r);let a=document.createElement("label");a.className="switch";let l=document.createElement("input");l.type="checkbox";let s=localStorage.getItem(t),d=s!==null?s==="true":i;s===null&&localStorage.setItem(t,i.toString()),l.checked=d,l.addEventListener("change",()=>{let f=l.checked;localStorage.setItem(t,f.toString()),o&&typeof o=="function"&&o(f)});let p=document.createElement("span");return p.className="slider",a.appendChild(l),a.appendChild(p),n.appendChild(a),n}function Fe(){if(document.getElementById("mcp-crm-header-styles"))return;let e=document.createElement("style");e.id="mcp-crm-header-styles",e.textContent=`
    #mcp-crm-header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 32px;
      background-color: #2F3A4B;
      display: flex;
      align-items: center;
      padding: 0 15px;
      font-family: 'Segoe UI', 'Roboto', sans-serif;
      font-size: 12px;
      z-index: 999999;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    #mcp-crm-header .group {
      display: flex;
      align-items: center;
      margin-right: 15px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding-right: 15px;
    }
    
    #mcp-crm-header .group:last-child {
      border-right: none;
      margin-right: 0; /* Remove margin from the last group (Settings) */
    }
    
    /* Special styling for dropdowns group to match other elements' spacing */
    #crm-dropdowns-group {
      margin-right: 15px; /* Same spacing as other elements */
      padding-right: 15px; /* Same padding as other elements */
    }
    
    /* Ensure settings is positioned at the far right */
    #crm-settings-btn {
      margin-right: 0;
    }
    
    #mcp-crm-header .spacer {
      flex-grow: 1;
    }
    
    #mcp-crm-header .label {
      color: #8a9cad;
      margin-right: 6px;
      font-weight: 500;
    }
    
    #mcp-crm-header .value {
      color: #e6e6e6;
      font-weight: 600;
    }
    
    #mcp-crm-header .clickable-value {
      color: #e6e6e6;
      font-weight: 600;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 3px;
      transition: background-color 0.2s;
      display: inline-flex;
      align-items: center;
    }
    
    #mcp-crm-header .clickable-value:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
    
    #mcp-crm-header .btn-icon {
      margin-right: 4px;
      font-size: 10px;
    }
    
    /* Logo link styling */
    #mcp-crm-header .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    #mcp-crm-header .logo-link:hover {
      opacity: 0.85;
    }
    
    #mcp-crm-header .logo-icon {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
    
    #mcp-crm-header .logo {
      font-weight: bold;
      color: white;
      font-size: 14px;
    }
    
    #mcp-crm-header .external-link {
      text-decoration: none;
      color: #e6e6e6;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
      margin-right: 10px;
    }
    
    #mcp-crm-header .external-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    
    #mcp-crm-header .ext-link-icon {
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Styling for text links with icons */
    #mcp-crm-header .text-link {
      text-decoration: none;
      margin-right: 4px; /* Reduced margin between buttons */
      font-size: 12px;
      padding: 3px 6px; /* Reduced horizontal padding to make buttons skinnier */
      border-radius: 3px;
      color: #e6e6e6;
      display: flex;
      align-items: center;
      justify-content: center; /* Center content horizontally */
      white-space: nowrap; /* Prevent text wrapping */
      min-width: 68px; /* Set minimum width to keep consistency */
    }
    
    #mcp-crm-header .text-link:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
    
    #mcp-crm-header .text-link .link-icon {
      margin-right: 4px; /* Slightly reduced margin for tighter look */
      width: 16px;
      height: 16px;
      vertical-align: middle;
      flex-shrink: 0; /* Prevent icon from shrinking */
    }
    
    /* Add a specific class for each button to fine-tune widths if needed */
    #mcp-crm-header .shipstation-link {
      min-width: 92px;
    }
    
    #mcp-crm-header .stripe-link {
      min-width: 65px;
    }
    
    #mcp-crm-header .webmail-link {
      min-width: 78px;
    }
    
    #mcp-crm-header .btn {
      color: #e6e6e6;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      margin-right: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }
    
    #mcp-crm-header .btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    #mcp-crm-header .btn:active {
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    #mcp-crm-header .btn:last-child {
      margin-right: 0;
    }
    
    /* Dropdown styling */
    .dropdown {
      position: relative;
      display: inline-block;
      margin-right: 8px;
    }
    
    .dropdown-btn {
      color: #e6e6e6;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 100px;
    }
    
    .dropdown-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .dropdown-btn:after {
      content: "\u25BC";
      font-size: 8px;
      margin-left: 5px;
    }
    
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #2F3A4B;
      min-width: 180px;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
      z-index: 1000000;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 2px;
      left: 0;
    }
    
    .dropdown.show .dropdown-content {
      display: block;
    }
    
    .dropdown-item {
      color: #e6e6e6;
      padding: 8px 12px;
      text-decoration: none;
      display: block;
      font-size: 12px;
      cursor: pointer;
      font-weight: normal;
    }
    
    .dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    /* Nested Dropdown styling */
    .nested-dropdown {
      margin-bottom: 5px;
      width: 100%;
    }
    
    .nested-dropdown-btn {
      width: 100%;
      text-align: left;
      padding: 6px 10px;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      color: #e6e6e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .nested-dropdown-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .nested-dropdown-btn:after {
      content: "\u25BC";
      font-size: 8px;
      color: #e6e6e6;
    }
    
    .nested-dropdown-content {
      display: none;
      padding: 5px 0 5px 10px;
      background-color: #2F3A4B;
    }
    
    .nested-dropdown.open .nested-dropdown-content {
      display: block;
    }
    
    .nested-dropdown-item {
      display: block;
      padding: 5px 10px;
      color: #e6e6e6;
      text-decoration: none;
      font-size: 12px;
      cursor: pointer;
      border-radius: 3px;
      font-weight: normal;
    }
    
    .nested-dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    /* Settings dropdown styling */
    #mcp-crm-settings-dropdown {
      position: absolute;
      top: 32px;
      right: 15px;
      background-color: #2F3A4B;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      min-width: 200px;
      z-index: 1000000;
      display: none;
      color: #e6e6e6;
    }
    
    #mcp-crm-settings-dropdown.show {
      display: block;
    }
    
    #mcp-crm-settings-dropdown .settings-header {
      background-color: rgba(255, 255, 255, 0.1);
      color: #e6e6e6;
      padding: 8px 12px;
      font-weight: bold;
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
    }
    
    #mcp-crm-settings-dropdown .settings-body {
      padding: 10px;
    }
    
    #mcp-crm-settings-dropdown .setting-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    #mcp-crm-settings-dropdown .setting-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    #mcp-crm-settings-dropdown .setting-label {
      flex-grow: 1;
      font-size: 13px;
      color: #e6e6e6;
    }
    
    /* Toggle switch styling */
    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
    }
    
    .switch input { 
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #555;
      transition: .4s;
      border-radius: 34px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: #2196F3;
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    
    /* Version info section in settings */
    .version-info {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 10px;
      padding-top: 10px;
      font-size: 12px;
      color: #e6e6e6;
    }
    
    .version-info p {
      margin: 5px 0;
    }
    
    .version-number {
      font-weight: 600;
      color: #e6e6e6;
    }
    
    .check-updates-btn {
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      padding: 4px 8px;
      margin-top: 5px;
      font-size: 11px;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
      text-align: center;
      color: #e6e6e6;
    }
    
    .check-updates-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .check-updates-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `,document.head.appendChild(e)}function Ve(){let e=document.createElement("div");e.className="dropdown",e.id="crm-history-dropdown";let t=document.createElement("button");t.className="dropdown-btn",t.textContent="History",t.addEventListener("click",l=>{l.stopPropagation(),document.querySelectorAll(".dropdown.show").forEach(s=>{s!==e&&s.classList.remove("show")}),e.classList.toggle("show"),e.classList.contains("show")&&$e(e)});let o=document.createElement("div");if(o.className="dropdown-content",o.id="crm-history-content",o.style.width="300px",o.style.maxHeight="400px",o.style.overflowY="auto",o.style.right="0",o.style.left="auto",!document.getElementById("history-dropdown-styles")){let l=document.createElement("style");l.id="history-dropdown-styles",l.textContent=`
      #crm-history-dropdown .dropdown-content {
        padding: 0;
        right: 0;
        left: auto;
      }
      
      /* For small screens, make sure the dropdown doesn't extend beyond viewport */
      @media screen and (max-width: 768px) {
        #crm-history-dropdown .dropdown-content {
          right: 0;
          left: auto;
          max-width: 100vw;
          width: 280px; /* Slightly smaller on small screens */
        }
      }
      
      .history-header {
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .history-title {
        font-weight: bold;
        color: #e6e6e6;
        font-size: 14px;
      }
      
      .history-clear-btn {
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 11px;
        cursor: pointer;
        color: #e6e6e6;
        transition: background-color 0.2s;
      }
      
      .history-clear-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .history-empty {
        padding: 20px;
        text-align: center;
        color: #aaa;
        font-style: italic;
        font-size: 13px;
      }
      
      .history-item {
        padding: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .history-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .history-item:last-child {
        border-bottom: none;
      }
      
      .history-item-row {
        display: flex;
        margin-bottom: 3px;
        width: 100%;
      }
      
      .history-item-time {
        color: #aaa;
        font-size: 11px;
        width: 60px;
        flex-shrink: 0;
        margin-right: 5px;
      }
      
      .history-item-name {
        font-weight: bold;
        color: #e6e6e6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1;
      }
      
      .history-item-phone {
        color: #ccc;
        font-size: 12px;
        margin-left: 65px; /* Align with name (time width + margin) */
      }
    `,document.head.appendChild(l)}let i=document.createElement("div");i.className="history-header";let n=document.createElement("div");n.className="history-title",n.textContent="Recent Patients",i.appendChild(n);let r=document.createElement("button");r.className="history-clear-btn",r.textContent="Clear All",r.addEventListener("click",l=>{l.stopPropagation(),Me(),$e(e),c("History cleared")}),i.appendChild(r),o.appendChild(i);let a=document.createElement("div");return a.className="history-empty",a.textContent="No patient history yet",o.appendChild(a),e.appendChild(t),e.appendChild(o),e}function $e(e){let t=e.querySelector("#crm-history-content");if(!t)return;let o=Ae(),i=t.querySelector(".history-header");if(t.innerHTML="",i&&t.appendChild(i),o.length===0){let n=document.createElement("div");n.className="history-empty",n.textContent="No patient history yet",t.appendChild(n);return}o.forEach(n=>{let r=document.createElement("div");r.className="history-item",r.addEventListener("click",()=>{window.location.href=n.url,e.classList.remove("show")});let a=document.createElement("div");a.className="history-item-row";let l=document.createElement("div");l.className="history-item-time",l.textContent=Le(n.timestamp);let s=document.createElement("div");if(s.className="history-item-name",s.textContent=n.patientName||"Unknown Patient",a.appendChild(l),a.appendChild(s),r.appendChild(a),n.phoneNumber){let d=document.createElement("div");d.className="history-item-phone",d.textContent=n.phoneNumber,r.appendChild(d)}t.appendChild(r)})}var Ue=!1;function Y(){if(!(window.location.hostname!=="app.mtncarerx.com"||!window.location.href.includes("contacts")&&!window.location.href.includes("conversations")))try{if(document.getElementById("mcp-crm-header")){console.log("[uiHeaderBar] Toolbar already exists.");return}Fe();let e=document.createElement("div");e.id="mcp-crm-header";let t=localStorage.getItem("crmplus_headerBarVisible")!=="false";console.log("[CRM Extension] Header visibility setting:",t),e.style.display=t?"flex":"none";let o=typeof browser<"u"?browser:chrome,i=w=>o.runtime.getURL(w),n=document.createElement("div");n.className="group";let r=document.createElement("a");r.href="https://app.mtncarerx.com/",r.className="logo-link";let a=document.createElement("img");a.src=i("assets/mcp-favicon.ico"),a.alt="",a.className="logo-icon",r.appendChild(a);let l=document.createElement("span");l.className="logo",l.textContent="CRM+",r.appendChild(l),n.appendChild(r);let s=document.createElement("div");s.className="group external-links";let d=Oe("ShipStation","https://ship15.shipstation.com/onboard","shipstation-link",i("assets/shipstation-favicon.ico"));s.appendChild(d);let p=Oe("Messenger","https://messenger.mtncarerx.com/","messenger-link",i("assets/mcp-favicon.ico"));s.appendChild(p);let f=B("name","Name"),g=B("phone","Phone",{icon:"\u{1F4DE}",initialValue:"",onClick:async w=>{me(w)}}),x=B("dob","DOB"),y=B("srxid","SRx ID"),A=Ie(),h=He(),m=document.createElement("div");m.className="spacer";let v=document.createElement("div");v.className="group right-buttons",v.style.borderRight="none",v.style.display="flex",v.style.marginRight="0";let E=document.createElement("div");E.style.display="flex",E.style.alignItems="center",E.style.justifyContent="center";let q=Ve();v.appendChild(q);let b=_e();e.appendChild(n),e.appendChild(s),e.appendChild(f),e.appendChild(g),e.appendChild(x),e.appendChild(y),e.appendChild(h),e.appendChild(A),e.appendChild(m),e.appendChild(v),e.appendChild(b),document.body.insertBefore(e,document.body.firstChild),e.style.position="fixed",e.style.top="0",e.style.left="0",e.style.right="0",e.style.zIndex="9999",e.style.width="100%",e.style.boxSizing="border-box",e.style.height="32px",setTimeout(()=>{try{let w=localStorage.getItem("crmplus_automationEnabled")==="true";[document.getElementById("crm-automation-dropdown"),document.getElementById("crm-tags-dropdown")].forEach(K=>{K&&(K.style.display=w?"flex":"none",console.log(`[CRM Extension] Initial visibility for ${K.id}: ${w?"visible":"hidden"}`))})}catch(w){console.error("[CRM Extension] Error setting initial automation visibility:",w)}},100),k(),fe(),ye(),pe(),ve(),Te(),Ue=!0,console.log("[CRM Extension] Header successfully initialized")}catch(e){console.error("[CRM Extension] Critical error creating toolbar:",e);try{let t=document.getElementById("mcp-crm-header");t&&(t.style.display="flex")}catch(t){console.error("[CRM Extension] Failed to recover toolbar:",t)}}}function Oe(e,t,o="",i=""){let n=document.createElement("a");n.href=t,n.target="_blank",n.className=`text-link btn ${o}`,n.rel="noopener noreferrer";let r=document.createElement("div");if(r.style.display="flex",r.style.alignItems="center",r.style.justifyContent="center",r.style.width="100%",i){let l=document.createElement("img");l.src=i,l.alt="",l.className="link-icon",l.style.width="16px",l.style.height="16px",l.style.marginRight="4px",r.appendChild(l)}let a=document.createElement("span");return a.textContent=e,r.appendChild(a),n.appendChild(r),n}function Q(e){try{let t=document.getElementById("mcp-crm-header");return t?(console.log(`[CRM Extension] Setting header visibility to: ${e}`),t.style.display=e?"flex":"none",localStorage.setItem("crmplus_headerBarVisible",e.toString()),!0):e?(console.log("[CRM Extension] Header not found but should be visible, creating it"),Y(),!0):!1}catch(t){return console.error("[CRM Extension] Error toggling header visibility:",t),!1}}function We(){let e=document.getElementById("mcp-crm-header");e&&(e.remove(),document.body.classList.add("no-header"),Ue=!1,console.log("[CRM Extension] Header removed due to navigation"))}function Ye(){if(!(localStorage.getItem("crmplus_autoCopyPhone")==="true")){console.log("[CRM Extension] Auto-copy phone is disabled");return}let t=()=>{let i=_();if(i){let n=ee(i);n&&L(n).then(r=>{if(r)return c("Phone number auto-copied: "+n),!0})}return!1};if(t())return;let o=new MutationObserver((i,n)=>{t()&&n.disconnect()});o.observe(document.body,{childList:!0,subtree:!0,attributes:!0,characterData:!0}),setTimeout(()=>{o.disconnect(),t()},5e3)}var Qe=!1,D=new Set,j="",ae=!1,G=null,re=null;function Ge(){Qe||(ht(),yt(),Qe=!0,console.log("[CRM Extension] Alert system initialized"))}function ht(){if(document.getElementById("crm-alert-styles"))return;let e=document.createElement("style");e.id="crm-alert-styles",e.textContent=`
    .crm-alert-banner {
      position: fixed;
      top: 32px; /* Positioned right below the header bar */
      left: 0;
      right: 0;
      width: 100%;
      padding: 4px 15px; /* Reduced vertical padding for smaller height */
      font-size: 13px;
      font-weight: 500;
      z-index: 999990;
      display: flex;
      align-items: center;
      justify-content: center; /* Center contents horizontally */
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transform: translateY(-100%);
      opacity: 0;
      height: 25px; /* Fixed height at 3/4 of original (approx) */
    }
    
    .crm-alert-banner.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    .crm-alert-banner .alert-icon {
      margin-right: 8px;
      font-size: 16px;
    }
    
    .crm-alert-banner .alert-message {
      text-align: center; /* Center the text */
      margin: 0 auto; /* Center with auto margins */
      flex-grow: 0; /* Don't grow to fill space */
    }
    
    /* Provider Paid specific alert styling */
    .crm-alert-banner.provider-paid {
      background-color: #FFAB40; /* Orange */
      color: #5F4200;
      border-bottom: 1px solid #FF9100;
    }
    
    /* Adjust body padding to accommodate the alert banner */
    body.has-alert {
      padding-top: 72px !important; /* 32px (header) + approx alert height */
    }
    
    /* When header is hidden but alert is visible */
    body.no-header.has-alert {
      padding-top: 25px !important; /* Just the alert height */
    }
    
    /* Multiple alerts stacking */
    .crm-alert-banner.second-alert {
      top: 57px;
    }
    
    .crm-alert-banner.third-alert {
      top: 82px;
    }
    
    /* Countdown timer styling */
    .countdown-timer {
      margin-left: 5px;
      font-size: 11px;
      opacity: 0.75;
      background-color: rgba(0, 0, 0, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
      min-width: 30px;
      text-align: center;
    }
  `,document.head.appendChild(e)}function je(){let e=window.location.href,t=[/\/patient\/(\d+)/i,/\/contact\/(\d+)/i,/\/profile\/(\d+)/i,/[?&]patient_id=(\d+)/i,/[?&]contact_id=(\d+)/i];for(let o of t){let i=e.match(o);if(i&&i[1])return i[1]}return""}function yt(){j=je(),J(),G&&G.disconnect(),G=new MutationObserver(e=>{for(let t of e)t.type==="childList"&&J(),t.type==="attributes"&&(t.target.classList.contains("tag")||t.target.classList.contains("tag-label")||t.target.classList.contains("provider-paid"))&&J()}),G.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","data-tag"]}),re&&clearInterval(re),re=setInterval(()=>{let e=je();e!==j&&(console.log("[CRM Extension] Navigation detected, patient changed from",j,"to",e),j=e,ae=!1,X("provider-paid"),setTimeout(J,1e3))},1e3)}function J(){if(!(localStorage.getItem("crmplus_showProviderPaidAlerts")!=="false")){X("provider-paid");return}bt()?ae||xt():X("provider-paid")}function bt(){let e=document.querySelectorAll(".tag, .tag-label, .pill, .badge");for(let n of e)if(n.textContent.toLowerCase().includes("provider-paid"))return n;let t=document.querySelectorAll(".provider-paid");if(t.length>0)return t[0];let o=document.querySelectorAll('[data-tag="provider-paid"], [data-tag-name="provider-paid"]');if(o.length>0)return o[0];let i=document.querySelectorAll(".tags-container, .tag-list, .tags");for(let n of i)if(n.textContent.toLowerCase().includes("provider-paid"))return n;return null}function xt(){if(D.has("provider-paid"))return;ae=!0;let e=document.createElement("div");e.className="crm-alert-banner provider-paid",e.id="provider-paid-alert",e.setAttribute("data-alert-type","provider-paid");let t=document.createElement("span");t.className="alert-icon",t.innerHTML="\u26A0\uFE0F",e.appendChild(t);let o=document.createElement("span");o.className="alert-message",o.textContent="This patient has Provider Paid status. Special billing rules apply.";let i=document.createElement("span");i.className="countdown-timer",i.textContent="30",o.appendChild(i),e.appendChild(o),document.body.appendChild(e),vt(e),setTimeout(()=>{e.classList.add("show"),document.body.classList.add("has-alert")},10),D.add("provider-paid");let n=document.getElementById("mcp-crm-header");n&&n.style.display==="none"?document.body.classList.add("no-header"):document.body.classList.remove("no-header"),console.log("[CRM Extension] Provider Paid alert shown");let r=15,a=setInterval(()=>{r--,i&&(i.textContent=r),r<=0&&(clearInterval(a),X("provider-paid"))},1e3)}function vt(e){let t=D.size;t===1?e.classList.add("second-alert"):t===2&&e.classList.add("third-alert")}function X(e){let t=document.querySelector(`.crm-alert-banner[data-alert-type="${e}"]`);t&&(t.classList.remove("show"),D.delete(e),setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t),D.size===0&&document.body.classList.remove("has-alert"),wt()},300))}function wt(){document.querySelectorAll(".crm-alert-banner").forEach((t,o)=>{t.classList.remove("second-alert","third-alert"),o===1?t.classList.add("second-alert"):o===2&&t.classList.add("third-alert")})}console.log("[CRM Extension] Content script injected.");var P=typeof browser<"u"?browser:chrome;P.runtime.sendMessage({action:"loadSettings"}).then(e=>{e&&e.success&&(console.log("[CRM Extension] Settings loaded from browser storage on startup:",e.settings),document.getElementById("mcp-crm-header")||R())}).catch(e=>{console.error("[CRM Extension] Error requesting settings on startup:",e)});localStorage.getItem("crmplus_headerBarVisible")===null?(console.log("[CRM Extension] No local toolbar visibility setting, requesting from browser storage"),P.runtime.sendMessage({action:"loadSettings"}).then(e=>{e&&e.success?(console.log("[CRM Extension] Settings loaded from browser storage:",e.settings),R()):(console.error("[CRM Extension] Failed to load settings, using defaults"),localStorage.setItem("crmplus_headerBarVisible","true"),R())}).catch(e=>{console.error("[CRM Extension] Error requesting settings:",e),localStorage.setItem("crmplus_headerBarVisible","true"),R()})):(console.log("[CRM Extension] Using existing localStorage settings"),R());function R(){let e=localStorage.getItem("crmplus_headerBarVisible")!=="false";console.log("[CRM Extension] Header visibility setting on init:",e);try{console.log("[CRM Extension] Creating fixed header..."),Y(),Q(e)}catch(t){console.error("[CRM Extension] Error creating fixed header:",t)}try{le(t=>{console.log(`[CRM Extension] Intercepted console message: ${t}`)})}catch(t){console.error("[CRM Extension] Error initializing console monitor:",t)}try{Ye()}catch(t){console.error("[CRM Extension] Error initializing auto phone copy:",t)}try{Ge()}catch(t){console.error("[CRM Extension] Error initializing alert system:",t)}try{we()}catch(t){console.error("[CRM Extension] Error initializing tag removal system:",t)}try{Ce()}catch(t){console.error("[CRM Extension] Error initializing automation removal system:",t)}k()}var Je=32;function Xe(){return document.querySelector("#app > div > div:last-child")||document.querySelector(".main-content")||document.querySelector("#app")||document.body}function Ct(){let e=Xe();if(e){e.style.paddingTop=Je+"px",console.log("[CRM Extension] addHeaderPadding: applying to",e,e.outerHTML);let t=e.parentElement;for(;t&&t!==document.body;)t.style.paddingTop=Je+"px",t=t.parentElement}else console.warn("[CRM Extension] addHeaderPadding: no main content element found")}function Et(){let e=Xe();if(e){e.style.paddingTop="";let t=e.parentElement;for(;t&&t!==document.body;)t.style.paddingTop="",t=t.parentElement;console.log("[CRM Extension] removeHeaderPadding: removed from",e,e.outerHTML)}}var St=Y,kt=We;function Ke(){St(),Ct()}function Ze(){kt(),Et()}window.createFixedHeader=Ke;window.removeHeaderBar=Ze;P.runtime.onMessage.addListener((e,t,o)=>{if(console.log("[CRM Extension] Received message:",e),e.action==="toggleHeaderVisibility"){console.log("[CRM Extension] Toggling header visibility to:",e.isVisible);try{let i=Q(e.isVisible);localStorage.setItem("crmplus_headerBarVisible",e.isVisible.toString()),P.runtime.sendMessage({action:"syncSettings"}).catch(n=>console.error("[CRM Extension] Error syncing settings:",n)),o({success:i})}catch(i){console.error("[CRM Extension] Error toggling header visibility:",i),o({success:!1,error:i.message})}return!0}return!1});document.addEventListener("DOMContentLoaded",()=>{console.log("[CRM Extension] DOM fully loaded, checking visibility setting"),document.getElementById("mcp-crm-header")||P.runtime.sendMessage({action:"loadSettings"}).then(e=>{e&&e.success&&R()}).catch(()=>{localStorage.setItem("crmplus_headerBarVisible","true"),R()})});(function(){let t=location.href,o=null;function i(a){try{let l=new URL(a,location.origin);return l.hostname==="app.mtncarerx.com"&&(l.href.includes("contacts")||l.href.includes("conversations"))}catch{return!1}}function n(){let a=location.href;a!==t&&(t=a,o&&clearTimeout(o),o=setTimeout(()=>{if(i(a)){if(!document.getElementById("mcp-crm-header")){Ke();let l=localStorage.getItem("crmplus_headerBarVisible")!=="false";Q(l)}}else document.getElementById("mcp-crm-header")&&Ze()},100))}new MutationObserver(n).observe(document.body,{childList:!0,subtree:!0}),setInterval(n,500)})();})();
