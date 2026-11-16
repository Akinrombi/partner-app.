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
