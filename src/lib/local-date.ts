/**
 * The server renders "today" on its own clock; a phone in another time zone says
 * otherwise. This records the visitor's local date once in a cookie and reloads a
 * single time, so the day matches where the patient actually is.
 *
 * The cookie holds a date only — never health data, never anything a patient
 * typed. Plain string, no server imports, so any page can drop it in.
 */
export const LOCAL_DATE_SCRIPT = `(function(){try{
if(!navigator.cookieEnabled)return;
function p(n){return String(n).padStart(2,"0")}
var d=new Date();
var local=d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
var m=document.cookie.match(/(?:^|;\\s*)rw_local_date=([0-9]{4}-[0-9]{2}-[0-9]{2})/);
if(m&&m[1]===local)return;
if(sessionStorage.getItem("rw_local_date_tried")==="1")return;
sessionStorage.setItem("rw_local_date_tried","1");
document.cookie="rw_local_date="+local+";path=/;max-age=31536000;samesite=lax";
location.reload();
}catch(e){}})();`;
