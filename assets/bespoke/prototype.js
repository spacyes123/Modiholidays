'use strict';
document.getElementById('year').textContent=new Date().getFullYear();
let activeDialog=null, returnFocus=null;
function showDialog(id){returnFocus=document.activeElement;activeDialog=document.getElementById(id);activeDialog.classList.add('open');document.body.style.overflow='hidden';activeDialog.querySelector('button,input,a').focus();}
function hideDialog(){if(!activeDialog)return;activeDialog.classList.remove('open');activeDialog=null;document.body.style.overflow='';returnFocus?.focus();}
function toggleMenu(open){open?showDialog('menu'):hideDialog();}
function openEnquiry(){showDialog('enquiry');}
function closeEnquiry(){hideDialog();}
document.addEventListener('keydown',e=>{if(!activeDialog)return;if(e.key==='Escape')hideDialog();if(e.key==='Tab'){const items=[...activeDialog.querySelectorAll('button,a[href],input,select,textarea,summary')].filter(x=>x.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
document.getElementById('enquiry').addEventListener('click',e=>{if(e.target.id==='enquiry')hideDialog();});
document.getElementById('tripform').addEventListener('submit',e=>{e.preventDefault();const value=id=>document.getElementById(id).value;const message='Hello Modi Holidays, I would like to plan a journey.\nTravel style: '+value('kind')+'\nDestination: '+value('where')+'\nDates: '+value('when')+'\nNotes: '+value('details');const link=document.getElementById('send-enquiry');link.href='https://wa.me/917666018401?text='+encodeURIComponent(message);link.hidden=false;const copy=document.getElementById('message-copy');copy.value=message;copy.hidden=false;document.getElementById('status').textContent='Your enquiry is ready. Open WhatsApp to review and send, or copy the message below. Nothing has been sent or saved.';link.focus();});
