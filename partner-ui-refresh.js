/* Progressive enhancement: make the shift controls a tidy tap-to-expand dropdown. */
(function(){
  function enhanceShiftDropdown(){
    var panel=document.querySelector("#homePage .shift-panel");
    if(!panel || panel.dataset.zzDropdownReady==="true") return;
    var head=panel.querySelector(".shift-panel-head");
    var actions=panel.querySelector(".shift-panel-actions");
    var feedback=panel.querySelector("#shiftFeedback");
    if(!head || !actions) return;
    var details=document.createElement("details");
    details.className="shift-panel zz-shift-accordion";
    details.dataset.zzDropdownReady="true";
    var summary=document.createElement("summary");
    summary.className="zz-accordion-summary";
    summary.appendChild(head);
    var content=document.createElement("div");
    content.className="zz-accordion-content";
    content.appendChild(actions);
    if(feedback) content.appendChild(feedback);
    details.appendChild(summary);
    details.appendChild(content);
    panel.replaceWith(details);
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",enhanceShiftDropdown,{once:true});
  }else enhanceShiftDropdown();
})();

/* Small-screen and accessibility polish; keeps existing app actions and DOM intact. */
(function(){
  function addRiderUiPolish(){
    if(document.getElementById("zzRiderUiPolish")) return;
    var style=document.createElement("style");
    style.id="zzRiderUiPolish";
    style.textContent=`
      #homePage{--zz-ink:#14231d;--zz-muted:#66766f;--zz-line:#e2ebe6;--zz-accent:#087f5b;--zz-soft:#f3faf6;color:var(--zz-ink)}
      #homePage .shift-panel,#homePage .zz-shift-accordion,#homePage .shift-panel-head,#homePage .shift-panel-actions{box-sizing:border-box}
      #homePage .zz-shift-accordion{border:1px solid var(--zz-line);border-radius:18px;background:#fff;box-shadow:0 8px 26px rgba(18,48,34,.07);overflow:hidden}
      #homePage .zz-accordion-summary{list-style:none;cursor:pointer;padding:14px 16px;min-height:52px;display:flex;align-items:center;gap:12px}
      #homePage .zz-accordion-summary::-webkit-details-marker{display:none}
      #homePage .zz-accordion-summary:after{content:"⌄";margin-left:auto;color:var(--zz-accent);font-size:20px;transition:transform .18s ease}
      #homePage .zz-shift-accordion[open] .zz-accordion-summary:after{transform:rotate(180deg)}
      #homePage .zz-accordion-summary:focus-visible{outline:3px solid rgba(8,127,91,.3);outline-offset:-3px}
      #homePage .zz-accordion-content{padding:0 16px 16px}
      #homePage .zz-accordion-content .shift-panel-actions{display:flex;flex-wrap:wrap;gap:10px}
      #homePage button,#homePage [role=button]{min-height:44px;border-radius:12px;transition:transform .15s ease,box-shadow .15s ease}
      #homePage button:focus-visible,#homePage a:focus-visible,#homePage input:focus-visible,#homePage select:focus-visible,#homePage textarea:focus-visible{outline:3px solid rgba(8,127,91,.28);outline-offset:2px}
      #homePage input,#homePage select,#homePage textarea{max-width:100%;box-sizing:border-box}
      #homePage #shiftFeedback{border-radius:12px;line-height:1.45}
      @media(max-width:640px){#homePage .zz-accordion-summary{padding:12px 14px}#homePage .zz-accordion-content{padding:0 14px 14px}#homePage .zz-accordion-content .shift-panel-actions>*{flex:1 1 100%}#homePage button{min-height:46px}}
      @media(prefers-reduced-motion:reduce){#homePage *,#homePage *:before,#homePage *:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",addRiderUiPolish,{once:true});
  else addRiderUiPolish();
})();
