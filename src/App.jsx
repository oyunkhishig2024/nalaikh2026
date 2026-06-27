import { useState, useRef, useEffect } from "react";
import {
  loginOrCreateUser, registerHorse, markHorsesPaid, getMyHorses,
  getAllHorses, approveHorse, deleteHorse,
  saveDeadline, getDeadline, clearDeadline,
} from "./firebase/db";


// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "naadam2026";
const EXPLAINER_CODE = "tailbar2026";

// Sequential number counter — first paid horse gets #1, next #2, etc.
let nextHorseNumber = { value: 1 };
function getNextNumber() { return nextHorseNumber.value++; }


const AGE_GROUPS = [
  { id: 1, name: "Даага" },
  { id: 2, name: "Шүдлэн" },
  { id: 3, name: "Хязаалан" },
  { id: 4, name: "Соёолон" },
  { id: 5, name: "Их нас" },
  { id: 6, name: "Азарга" },
  { id: 7, name: "Сонгомол дээд" },
  { id: 8, name: "Сонгомол дунд" },
  { id: 9, name: "Сонгомол бага" },
];






// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Nunito:wght@400;500;600;700&display=swap');
:root{
  --navy:#0f2170;--navy2:#0a1a5e;--navy3:#1a2f85;--navy4:#0d1c6e;
  --gold:#e8c060;--gold2:#f5d882;--gold3:#b8922a;--gold-bg:rgba(232,192,96,.12);
  --red:#c0392b;--red2:#e74c3c;
  --white:#fff;--white-dim:rgba(255,255,255,.75);--white-faint:rgba(255,255,255,.15);
  --border-gold:rgba(232,192,96,.35);--border-white:rgba(255,255,255,.15);
  --green:rgba(39,174,96,.15);--green-b:rgba(39,174,96,.35);--green-t:#2ecc71;
}
*{box-sizing:border-box;margin:0;padding:0;}
body,#root{font-family:'Nunito',sans-serif;background:var(--navy2);color:var(--white);min-height:100vh;}
.app{min-height:100vh;background:linear-gradient(160deg,var(--navy2) 0%,var(--navy4) 50%,#060e3a 100%);position:relative;overflow-x:hidden;}
.app::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(232,192,96,.08) 0%,transparent 70%);pointer-events:none;}

/* HEADER */
.hdr{background:rgba(10,26,94,.92);border-bottom:1px solid var(--border-gold);padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
.logo-text{font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:var(--gold);letter-spacing:2px;}
.logo-sub{font-size:10px;color:var(--white-dim);letter-spacing:1px;margin-top:-2px;}
.nav-tabs{display:flex;gap:4px;}
.ntab{padding:8px 14px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--white-dim);font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
.ntab.active{background:var(--gold-bg);border-color:var(--border-gold);color:var(--gold);}
.ntab:hover:not(.active){background:var(--white-faint);color:var(--white);}
.user-badge{background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:20px;padding:6px 14px;font-size:13px;color:var(--gold2);font-weight:600;cursor:pointer;transition:all .2s;}
.user-badge:hover{background:rgba(232,192,96,.2);}
.role-chip{display:inline-block;border-radius:12px;padding:3px 10px;font-size:11px;font-weight:700;letter-spacing:.5px;margin-left:6px;}
.role-admin{background:rgba(192,57,43,.2);border:1px solid rgba(192,57,43,.4);color:#ff8a80;}
.role-explainer{background:rgba(52,152,219,.2);border:1px solid rgba(52,152,219,.4);color:#7ec8f5;}
.role-user{background:var(--gold-bg);border:1px solid var(--border-gold);color:var(--gold2);}

/* AUTH */
.auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.auth-card{background:rgba(15,33,112,.6);border:1px solid var(--border-gold);border-radius:20px;padding:40px 36px;width:100%;max-width:420px;text-align:center;backdrop-filter:blur(20px);}
.auth-emblem{font-size:48px;margin-bottom:8px;}
.auth-title{font-family:'Cinzel',serif;font-size:22px;color:var(--gold);margin-bottom:4px;letter-spacing:2px;}
.auth-subtitle{font-size:13px;color:var(--white-dim);margin-bottom:24px;line-height:1.6;}
.tab-row{display:flex;gap:6px;margin-bottom:20px;}
.tab-btn{flex:1;padding:10px;border-radius:10px;border:1px solid var(--border-white);background:var(--white-faint);color:var(--white-dim);font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;}
.tab-btn.active{background:var(--gold-bg);border-color:var(--border-gold);color:var(--gold);}

label{display:block;text-align:left;font-size:13px;font-weight:600;color:var(--white-dim);margin-bottom:6px;margin-top:14px;}
input[type="text"],input[type="number"],input[type="password"],input[type="number"],select,textarea{width:100%;background:var(--white-faint);border:1px solid var(--border-white);border-radius:10px;padding:12px 14px;color:var(--white);font-family:'Nunito',sans-serif;font-size:15px;transition:all .2s;outline:none;}
input::placeholder{color:rgba(255,255,255,.3);}
input:focus,select:focus,textarea:focus{border-color:var(--gold);background:rgba(232,192,96,.08);}
select option{background:var(--navy);color:var(--white);}
textarea{resize:vertical;min-height:72px;}

/* BUTTONS */
.btn-gold{width:100%;background:linear-gradient(135deg,var(--gold3),var(--gold));border:none;border-radius:10px;padding:14px;color:var(--navy2);font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:18px;letter-spacing:.3px;}
.btn-gold:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btn-gold:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.btn-outline{background:transparent;border:1px solid var(--border-gold);border-radius:10px;padding:11px 20px;color:var(--gold);font-family:'Nunito',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-outline:hover{background:var(--gold-bg);}
.btn-ghost{background:var(--white-faint);border:1px solid var(--border-white);border-radius:10px;padding:10px 16px;color:var(--white-dim);font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-ghost:hover{background:rgba(255,255,255,.2);color:var(--white);}
.btn-red{background:rgba(192,57,43,.2);border:1px solid rgba(192,57,43,.4);border-radius:8px;padding:7px 14px;color:#ff8a80;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-red:hover{background:rgba(192,57,43,.35);}

/* OTP */

/* PAGE WRAPPER */
.page{padding:24px 20px 48px;max-width:920px;margin:0 auto;}
.page-sm{padding:24px 20px 48px;max-width:640px;margin:0 auto;}

/* BACK */
.back-btn{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--white-dim);font-family:'Nunito',sans-serif;font-size:14px;cursor:pointer;padding:0;margin-bottom:20px;transition:color .2s;}
.back-btn:hover{color:var(--gold);}

/* SECTION TITLE */
.sec-title{font-family:'Cinzel',serif;font-size:15px;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border-gold);}

/* BANNER */
.banner{background:rgba(15,33,112,.5);border:1px solid var(--border-gold);border-radius:16px;padding:20px 24px;margin-bottom:22px;position:relative;overflow:hidden;}
.banner::after{content:'';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:70px;opacity:.1;}
.banner h2{font-family:'Cinzel',serif;font-size:20px;color:var(--gold);margin-bottom:6px;}
.banner p{color:var(--white-dim);font-size:13px;line-height:1.6;max-width:480px;}

/* STATS */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px;}
.stat-card{background:var(--white-faint);border:1px solid var(--border-white);border-radius:12px;padding:14px;text-align:center;}
.stat-val{font-family:'Cinzel',serif;font-size:22px;color:var(--gold);font-weight:700;}
.stat-label{font-size:11px;color:var(--white-dim);margin-top:3px;text-transform:uppercase;letter-spacing:.5px;}

/* AGE GRID */
.age-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.age-card{background:rgba(15,33,112,.5);border:1px solid var(--border-white);border-radius:14px;padding:18px 14px;transition:all .25s;text-align:center;}
.age-card.has{border-color:var(--border-gold);}
.age-label{font-family:'Cinzel',serif;font-size:14px;color:var(--white);font-weight:700;margin-bottom:4px;}
.badge{display:inline-block;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
.badge-gold{background:var(--gold-bg);border:1px solid var(--border-gold);color:var(--gold2);}
.badge-dim{background:var(--white-faint);border:1px solid var(--border-white);color:var(--white-dim);}
.age-reg-btn{margin-top:10px;width:100%;background:linear-gradient(135deg,var(--gold3),var(--gold));border:none;border-radius:8px;padding:9px 0;color:var(--navy2);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;}
.age-reg-btn:hover{filter:brightness(1.1);}

/* FORM CARD */
.fcard{background:rgba(15,33,112,.5);border:1px solid var(--border-white);border-radius:16px;padding:22px;margin-bottom:14px;}
.fcard h3{font-family:'Cinzel',serif;font-size:14px;color:var(--gold);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-gold);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.err-msg{color:var(--red2);font-size:12px;margin-top:4px;}

/* UPLOAD */
.upload-zone{border:2px dashed var(--border-gold);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;margin-top:4px;position:relative;overflow:hidden;}
.upload-zone:hover,.upload-zone.filled{background:var(--gold-bg);}
.upload-zone.filled{border-color:var(--gold);}
.upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;background:none;border:none;}
.upload-preview{width:100%;max-height:200px;object-fit:contain;border-radius:7px;margin-top:6px;background:rgba(0,0,0,0.15);}
.upload-icon{font-size:24px;margin-bottom:4px;}
.upload-lbl{font-size:12px;color:var(--white-dim);font-weight:600;}
.upload-hint{font-size:11px;color:rgba(255,255,255,.35);margin-top:2px;}

/* COUNT GRID */

/* STEP DOTS */

/* NUMBER REVEAL */
.num-circle{width:130px;height:130px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold));display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 0 40px rgba(232,192,96,.3);}
.num-big{font-family:'Cinzel',serif;font-size:44px;font-weight:700;color:var(--navy2);line-height:1;}
.num-lbl{font-size:11px;color:var(--navy3);font-weight:700;letter-spacing:1px;text-transform:uppercase;}

/* PAYMENT */
.pay-summary{background:rgba(15,33,112,.5);border:1px solid var(--border-gold);border-radius:14px;padding:18px;margin-bottom:18px;}
.pay-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-white);font-size:14px;}
.pay-row:last-child{border-bottom:none;}
.pay-total{font-size:16px;font-weight:700;color:var(--gold);margin-top:4px;}
.bank-info-box{background:rgba(15,33,112,.7);border:2px solid var(--border-gold);border-radius:14px;padding:22px;margin-bottom:18px;}
.bank-info-title{font-family:'Cinzel',serif;font-size:14px;color:var(--gold2);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-gold);display:flex;align-items:center;gap:8px;}
.bank-info-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border-white);}
.bank-info-row:last-child{border-bottom:none;}
.bank-info-label{font-size:12px;color:var(--white-dim);font-weight:600;}
.bank-info-val{font-size:14px;color:var(--white);font-weight:700;font-family:'Cinzel',serif;letter-spacing:.5px;}
.bank-info-val.highlight{color:var(--gold);font-size:18px;letter-spacing:2px;}
.copy-btn{background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:6px;padding:4px 10px;color:var(--gold2);font-size:11px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .2s;margin-left:8px;}
.copy-btn:hover{background:rgba(232,192,96,.25);}
.txn-input-box{background:rgba(15,33,112,.5);border:1px solid var(--border-gold);border-radius:14px;padding:20px;margin-bottom:16px;}
.txn-input-box h4{font-family:'Cinzel',serif;font-size:13px;color:var(--gold);margin-bottom:12px;}
.txn-id-display{background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:8px;padding:10px 14px;font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:var(--gold);text-align:center;letter-spacing:3px;margin-bottom:12px;}

/* WARNING */
.warn-box{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.35);border-radius:10px;padding:12px 14px;font-size:13px;color:#ff8a80;line-height:1.5;margin-bottom:14px;display:flex;gap:8px;align-items:flex-start;}

/* HORSE LIST ITEM */
.horse-item{background:rgba(15,33,112,.5);border:1px solid var(--border-white);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px;cursor:pointer;transition:all .2s;}
.horse-item:hover{border-color:var(--border-gold);}
.horse-num{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold));display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:var(--navy2);flex-shrink:0;}
.horse-name{font-weight:700;font-size:14px;}
.horse-meta{font-size:12px;color:var(--white-dim);margin-top:2px;}
.status-paid{margin-left:auto;background:var(--green);border:1px solid var(--green-b);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--green-t);font-weight:700;white-space:nowrap;flex-shrink:0;}
.status-pend{margin-left:auto;background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--red2);font-weight:700;white-space:nowrap;flex-shrink:0;}

/* EXPLAINER */
.live-dot{width:11px;height:11px;border-radius:50%;background:var(--red2);animation:pulse 1.5s infinite;flex-shrink:0;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}
.filter-bar{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;}
.chip{padding:6px 14px;border-radius:20px;border:1px solid var(--border-white);background:var(--white-faint);color:var(--white-dim);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Nunito',sans-serif;}
.chip.active,.chip:hover{border-color:var(--gold);background:var(--gold-bg);color:var(--gold);}
.horse-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
.exp-card{background:rgba(15,33,112,.5);border:1px solid var(--border-white);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .25s;}
.exp-card:hover{border-color:var(--border-gold);transform:translateY(-2px);}
.exp-img{width:100%;height:90px;background:linear-gradient(135deg,var(--navy3),var(--navy4));display:flex;align-items:center;justify-content:center;font-size:36px;position:relative;}
.exp-img img{width:100%;height:100%;object-fit:cover;}
.num-badge{position:absolute;top:7px;left:7px;background:linear-gradient(135deg,var(--gold3),var(--gold));border-radius:7px;padding:2px 9px;font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:var(--navy2);}
.exp-body{padding:12px;}
.exp-name{font-weight:700;font-size:14px;margin-bottom:3px;}
.exp-meta{font-size:12px;color:var(--white-dim);line-height:1.5;}
.tag{display:inline-block;background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:5px;padding:1px 7px;font-size:11px;color:var(--gold2);font-weight:700;}

/* ADMIN */
.admin-tabs{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
.adm-tab{padding:9px 18px;border-radius:10px;border:1px solid var(--border-white);background:var(--white-faint);color:var(--white-dim);font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;}
.adm-tab.active{background:rgba(192,57,43,.15);border-color:rgba(192,57,43,.4);color:#ff8a80;}
.adm-tab:hover:not(.active){background:rgba(255,255,255,.1);color:var(--white);}
.adm-card{background:rgba(15,33,112,.5);border:1px solid var(--border-white);border-radius:14px;padding:18px;margin-bottom:10px;}
.adm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-white);font-size:14px;}
.adm-row:last-child{border-bottom:none;}
.adm-label{color:var(--white-dim);font-size:13px;min-width:100px;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(6,14,58,.85);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(8px);}
.modal{background:var(--navy);border:1px solid var(--border-gold);border-radius:18px;padding:26px;width:100%;max-width:500px;max-height:82vh;overflow-y:auto;}
.modal-title{font-family:'Cinzel',serif;font-size:17px;color:var(--gold);margin-bottom:14px;padding-bottom:11px;border-bottom:1px solid var(--border-gold);display:flex;justify-content:space-between;align-items:center;}
.modal-close{background:none;border:none;color:var(--white-dim);font-size:22px;cursor:pointer;line-height:1;padding:0 4px;}
.detail-row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-white);font-size:14px;}
.detail-row:last-child{border-bottom:none;}
.detail-lbl{color:var(--white-dim);min-width:110px;font-weight:600;font-size:13px;flex-shrink:0;}

/* MISC */
.spinner{width:30px;height:30px;border:3px solid var(--border-gold);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px;}
@keyframes spin{to{transform:rotate(360deg);}}
.pass-wrap{position:relative;}
.pass-wrap input{padding-right:42px;}
.eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,.45);font-size:18px;cursor:pointer;padding:0;line-height:1;transition:color .2s;}
.eye-btn:hover{color:var(--gold);}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--gold3),var(--gold));color:var(--navy2);padding:12px 20px;border-radius:16px;font-weight:700;font-size:14px;z-index:300;box-shadow:0 6px 28px rgba(232,192,96,.4);animation:toastIn .3s ease;white-space:normal;max-width:calc(100vw - 32px);width:max-content;text-align:center;line-height:1.5;word-break:keep-all;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px);}}
@media(max-width:480px){.toast{bottom:16px;font-size:13px;padding:10px 16px;border-radius:12px;}}
.empty-state{text-align:center;padding:56px 20px;color:var(--white-dim);}
.empty-state .big{font-size:44px;margin-bottom:10px;}
.info-row{background:rgba(15,33,112,.4);border:1px solid var(--border-gold);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:20px;}

@media(max-width:620px){
  .age-grid{grid-template-columns:repeat(3,1fr);}
  .stats-row{grid-template-columns:repeat(2,1fr);}
  .form-row{grid-template-columns:1fr;}
  .bank-grid{grid-template-columns:1fr 1fr;}
  .ntab span{display:none;}
  .hdr{padding:0 12px;}
}
`;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [role, setRole] = useState(null);        // null | "user" | "admin" | "explainer"
  const [authTab, setAuthTab] = useState("user"); // user | admin | explainer
  const [user, setUser] = useState(null);

  // Registration deadline — admin sets this, stored in localStorage
  const [regDeadline, setRegDeadline] = useState(()=>{
    const saved = localStorage.getItem("naadam_reg_deadline");
    return saved || null;
  });
  const isRegClosed = regDeadline && new Date() > new Date(regDeadline);

  // Navigation
  const [screen, setScreen] = useState("login"); // login|otp|dashboard|ageGroup|horseForm|numReveal|payment|success|explainer|admin
  const [activeNav, setActiveNav] = useState("dashboard");

  // Horse registration state
  const [selectedAge, setSelectedAge] = useState(null);
  const [horseCount, setHorseCount] = useState(0);
  const [curIdx, setCurIdx] = useState(0);
  const [hForm, setHForm] = useState({});
  const [hFormErr, setHFormErr] = useState({});
  const [pendingHorses, setPendingHorses] = useState([]);

  // Global horse store (simulates DB)
  const [allReg, setAllReg] = useState({}); // { ageGroupId: [horse,...] }

  // Payment
  const [payLoading, setPayLoading] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [adminPendingCount, setAdminPendingCount] = useState(0);
  const [approvalPollInterval, setApprovalPollInterval] = useState(null);

  // Real-time listener — when waiting for approval, poll Firebase every 5 seconds
  useEffect(()=>{
    if(!waitingApproval || !user?.phone) return;
    const interval = setInterval(async()=>{
      try {
        const horses = await getMyHorses(user.phone);
        const allApproved = horses.filter(h=>h.paid).every(h=>h.approved);
        if(allApproved && horses.filter(h=>h.paid).length > 0){
          const byAge = {};
          horses.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
          setAllReg(byAge);
          setWaitingApproval(false);
          setScreen("success");
          showToast("Бүртгэл баталгаажлаа! 🎉");
          clearInterval(interval);
        }
      } catch(e){ console.error(e); }
    }, 5000);
    setApprovalPollInterval(interval);
    return ()=>clearInterval(interval);
  },[waitingApproval, user?.phone]);

  // Explainer / Admin UI
  const [expFilter, setExpFilter] = useState("all");
  const [expSearch, setExpSearch] = useState("");
  const [expHorse, setExpHorse] = useState(null);
  const [adminTab, setAdminTab] = useState("overview");
  const [adminHorse, setAdminHorse] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(null),3000); };

  // Derived
  const flatHorses = Object.values(allReg).flat();

  // Countdown timer display
  const [timeLeft, setTimeLeft] = useState("");
  useState(()=>{
    const tick = () => {
      if (!regDeadline) { setTimeLeft(""); return; }
      const diff = new Date(regDeadline) - new Date();
      if (diff <= 0) { setTimeLeft("Бүртгэл хаагдсан"); return; }
      const d = Math.floor(diff/86400000);
      const h = Math.floor((diff%86400000)/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setTimeLeft(`${d>0?d+"өдөр ":""}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return ()=>clearInterval(id);
  });
  const paidHorses = flatHorses.filter(h=>h.paid);
  const pendCount = flatHorses.filter(h=>!h.paid).length;
  const myHorses = flatHorses.filter(h=>h.ownerPhone === user?.phone);
  const lastPending = pendingHorses[pendingHorses.length-1];

  // ── AUTH HANDLERS ────────────────────────────────────────────────────────
  const doRegister = async () => {
    const surname = document.getElementById("rs")?.value?.trim();
    const name = document.getElementById("rn")?.value?.trim();
    const el_rp = document.getElementById("rp"); const phone = (el_rp?.dataset?.val || el_rp?.value || "").trim();
    if(!surname||!name){showToast("Овог нэрээ оруулна уу");return;}
    if(!phone||phone.replace(/\D/g,"").length!==8){showToast("Гар утасны дугаар 8 оронтой байх ёстой");return;}
    try {
      const fbUser = await loginOrCreateUser({surname, givenName:name, phone});
      setUser({...fbUser, givenName:name, surname, phone});
      setRole("user"); setScreen("dashboard"); setActiveNav("dashboard");
      const horses = await getMyHorses(phone);
      const byAge = {};
      horses.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
      setAllReg(byAge);
      showToast("Тавтай морилно уу!");
    } catch(e){ showToast("Алдаа: "+e.message); }
  };
  const doLogin = async () => {
    const el_lp = document.getElementById("lp"); const phone = (el_lp?.dataset?.val || el_lp?.value || "").trim();
    if(!phone||phone.replace(/\D/g,"").length!==8){showToast("Гар утасны дугаар 8 оронтой байх ёстой");return;}
    try {
      const fbUser = await loginOrCreateUser({surname:"", givenName:"", phone});
      if(!fbUser || !fbUser.givenName){ showToast("Ийм утасны дугаартай хэрэглэгч олдсонгүй. Дугаараа зөв бичсэн эсэхээ шалгана уу, эсвэл бүртгүүлнэ үү."); return; }
      setUser({...fbUser, phone});
      setRole("user"); setScreen("dashboard"); setActiveNav("dashboard");
      const horses = await getMyHorses(phone);
      const byAge = {};
      horses.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
      setAllReg(byAge);
      showToast("Тавтай морилно уу!");
    } catch(e){ showToast("Ийм утасны дугаартай хэрэглэгч олдсонгүй."); }
  };
  const doAdminLogin = async () => {
    const u = document.getElementById("au")?.value?.trim();
    const p = document.getElementById("ap")?.value?.trim();
    if(u===ADMIN_USER && p===ADMIN_PASS){
      setUser({name:"Админ"}); setRole("admin"); setScreen("admin"); setActiveNav("admin");
      try {
        const allH = await getAllHorses();
        const byAge = {};
        allH.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
        setAllReg(byAge);
        setAdminPendingCount(allH.filter(h=>h.paid&&!h.approved).length);
        const dl = await getDeadline();
        if(dl){ setRegDeadline(dl); localStorage.setItem("naadam_reg_deadline",dl); }
      } catch(e){ console.error("Firebase load ERROR:", e); showToast("Firebase алдаа: "+e.message); }
    } else { showToast("Нэвтрэх нэр эсвэл нууц үг буруу байна"); }
  };
  const doExplainerLogin = () => {
    const code = document.getElementById("ec")?.value?.trim();
    if(code===EXPLAINER_CODE){
      setUser({name:"Тайлбарлагч"}); setRole("explainer"); setScreen("explainer"); setActiveNav("explainer");
    } else { showToast("Код буруу байна"); }
  };
  const doOtp = () => {
    if(otp.join("").length<4){showToast("4 оронтой OTP код оруулна уу");return;}
    setScreen("dashboard"); setActiveNav("dashboard"); showToast("Амжилттай нэвтэрлээ!");
  };
  const logout=()=>{setRole(null);setUser(null);setScreen("login");setActiveNav("dashboard");};

  // ── REGISTRATION FLOW ────────────────────────────────────────────────────
  const openAge=(ag)=>{setSelectedAge(ag);setHorseCount(1);setCurIdx(0);setHForm({});setScreen("horseForm");};

  const setField=(k,v)=>{
    setHForm(f=>({...f,[k]:v}));
    if(hFormErr[k])setHFormErr(e=>{const n={...e};delete n[k];return n;});
  };

  // Allow only Cyrillic letters, spaces, digits, punctuation — block Latin letters
  const cyrilOnly = (v) => {
    if (/[A-Za-z]/.test(v)) showToast("⚠ Та зөвхөн Монголоор бичнэ үү");
    return v.replace(/[A-Za-z]/g, "");
  };
  // For registration number: allow Cyrillic letters + digits only, warn on Latin
  const regOnly = (v) => {
    if (/[A-Za-z]/.test(v)) showToast("⚠ Та зөвхөн Монголоор бичнэ үү");
    return v.replace(/[^А-ЯҮӨЁа-яүөё0-9]/gu, "").toUpperCase();
  };

  // Parse Mongolian national registration number: 2 letters + YYMMDD (6 digits)
  // Returns { valid, dob: Date, age, tooYoung } or { valid: false, reason }
  const parseRegNum = (reg) => {
    if (!reg) return { valid: false, reason: "Регистрийн дугаар оруулна уу" };
    const clean = reg.trim().toUpperCase();
    // Format: 2 Cyrillic letters + YY (birth year) + 6 random digits = 10 chars
    // e.g. АА19123456
    const valid10 = /^[А-ЯҮӨЁ]{2}[0-9]{8}$/u;
    if (!valid10.test(clean)) {
      return { valid: false, reason: "Регистрийн дугаар буруу байна (Жишээ: УШ16080752 — 2 кирилл үсэг + ОН + 6 тоо, нийт 10 тэмдэгт)" };
    }
    // Extract birth year from positions 2-3
    const yy = parseInt(clean.slice(2, 4), 10);
    // Century: 00–26 → 2000s, 27–99 → 1900s
    const birthYear = yy <= 26 ? 2000 + yy : 1900 + yy;
    const today = new Date(2026, 5, 6);
    const currentYear = today.getFullYear();
    // Minimum age: 7 years → born in 2019 or earlier (2026 - 7 = 2019)
    const maxBirthYear = currentYear - 8; // 2018
    if (birthYear > maxBirthYear) {
      return { valid: false, tooYoung: true, birthYear, approxAge: currentYear - birthYear };
    }
    const approxAge = currentYear - birthYear;
    return { valid: true, birthYear, approxAge };
  };

  const validateForm=(f)=>{
    const e={};
    if(!f.horseName)e.horseName="Морины нэр оруулна уу";
    if(!f.ownerName)e.ownerName="Эзний нэр оруулна уу";
    if(!f.uyaachName)e.uyaachName="Уяачийн нэр оруулна уу";
    if(!f.riderName)e.riderName="Уралдаанч хүүхдийн нэр оруулна уу";
    // Validate rider registration number and minimum age
    if(!f.riderReg){
      e.riderReg="Уралдаанч хүүхдийн регистрийн дугаар оруулна уу";
    } else {
      const parsed = parseRegNum(f.riderReg);
      if(!parsed.valid) {
        if(parsed.tooYoung) e.riderReg = "Үндэсний их баяр наадмын үндэсний хурдан морины уралдаанд уралдах морийг 8 ба түүнээс дээш насны хүүхэд унаж уралдана.";
        else e.riderReg = parsed.reason;
      }
    }
    if(!f.riderConsent)e.riderConsent="Зөвшөөрлийн баримт шаардлагатай";
    if(!f.insurance||f.insurance.length!==5)e.insurance="Даатгалын баримтын сүүлийн 5 оронтой дугаар оруулна уу";
    return e;
  };

  const saveHorse=async()=>{
    const errs=validateForm(hForm);
    if(Object.keys(errs).length){setHFormErr(errs);showToast("Заавал талбаруудыг бөглөнө үү");return;}
    setHFormErr({});
    // Number sharing logic:
    // - User's FIRST horse ever → new number, pay
    // - Different age group, user already has a number → reuse number, FREE
    // - Same age group again (2nd horse in same category) → new number, pay
    const myAllHorses = [
      ...pendingHorses.filter(h=>h.ownerPhone===user?.phone),
      ...Object.values(allReg).flat().filter(h=>h.ownerPhone===user?.phone&&h.paid)
    ];
    // First number this user ever received
    const myFirstNumber = myAllHorses.length > 0 ? myAllHorses[0].number : null;
    // How many horses does user already have in THIS age group?
    const myHorsesInThisAge = myAllHorses.filter(h=>h.ageGroupId===selectedAge.id).length;
    // Reuse number only if: user has a number AND this is first horse in this age group
    const reuseNumber = myFirstNumber && myHorsesInThisAge === 0;
    const num = reuseNumber ? myFirstNumber : getNextNumber();
    const needsPayment = !reuseNumber; // free only when reusing number in new age group
    const horse={...hForm,number:num,needsPayment,ageGroupId:selectedAge.id,ageGroupName:selectedAge.name,
      ownerPhone:user?.phone,paid:false,id:Date.now()+Math.random()};
    setPendingHorses(p=>[...p,horse]);
    try {
      const fbHorse = await registerHorse(user?.id, user?.phone, selectedAge.id, selectedAge.name, {...hForm,number:num,needsPayment});
      setPendingHorses(p=>p.map(h=>h.id===horse.id?{...h,fbId:fbHorse.id}:h));
    } catch(e){ console.error("Firebase save:", e); }
    setScreen("numReveal");
  };

  const afterReveal=()=>{
    // Go back to dashboard so user can register more horses in other age categories
    setPendingHorses(prev=>[...prev]); // keep accumulated pending horses
    setScreen("dashboard");
    setActiveNav("dashboard");
    showToast("Морь бүртгэгдлээ! Дараагийн морио бүртгэнэ үү эсвэл төлбөр хийнэ үү.");
  };

  // Generate a unique transaction reference ID shown to user
  const doSubmitPayment=async()=>{
    setPayLoading(true);
    try {
      // Mark as paid (pending admin approval)
      const paid=pendingHorses.map(h=>({...h,paid:true,approved:false}));
      setAllReg(prev=>{
        const n={...prev};
        paid.forEach(h=>{if(!n[h.ageGroupId])n[h.ageGroupId]=[];n[h.ageGroupId]=[...n[h.ageGroupId],h];});
        return n;
      });
      const fbIds = pendingHorses.map(h=>h.fbId).filter(Boolean);
      if(fbIds.length) await markHorsesPaid(fbIds);
    } catch(e){ console.error("markPaid:", e); }
    setPendingHorses([]);
    setPayLoading(false);
    setWaitingApproval(true);
    setScreen("waiting");
  };

  // ── EXPORT CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      "Дугаар","Морины нэр","Зүс","Насны ангилал",
      "Эзний нэр","Эзний цол","Эзний регистр",
      "Уяачийн нэр","Уяачийн цол",
      "Уралдаанч","Уралдаанчийн хүйс","Уралдаанчийн нас","Уралдаанчийн регистр",
      "Даатгалын дугаар","Өмнөх амжилт",
      "Төлбөр","Зөвшөөрөл","Бүртгэсэн огноо"
    ];
    const rows = flatHorses.map(h=>[
      h.number, h.horseName, h.horseColor||"",
      h.ageGroupName,
      h.ownerName, h.ownerTitle||"", h.ownerReg||"",
      h.uyaachName||"", h.uyaachTitle||"",
      h.riderName, h.riderGender||"", h.riderAge||"", h.riderReg||"",
      h.insurance||"", (h.history||"").replace(/,/g,"；").replace(/\n/g," "),
      h.paid?"Төлсөн":"Хүлээгдэж буй",
      h.approved?"Зөвшөөрсөн":"Үгүй",
      h.id ? new Date(h.id).toLocaleDateString("mn-MN") : ""
    ].map(v=>
      typeof v==="string" && (v.includes(",") || v.includes('"') || v.includes("\n"))
        ? `"${v.replace(/"/g,'""')}"`
        : v
    ));
    const BOM = "﻿"; // UTF-8 BOM for Excel
    const csv = BOM + [headers, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `нааdam2026_бүртгэл_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${flatHorses.length} бүртгэл экспортлогдлоо ✓`);
  };

  const exportByAge = (ageId) => {
    const horses = ageId === "all" ? flatHorses : flatHorses.filter(h=>h.ageGroupId===ageId);
    const ageName = ageId === "all" ? "бүгд" : AGE_GROUPS.find(a=>a.id===ageId)?.name || ageId;
    const headers = [
      "Дугаар","Морины нэр","Зүс",
      "Эзний нэр","Уяачийн нэр",
      "Уралдаанч","Уралдаанчийн нас","Уралдаанчийн хүйс",
      "Даатгалын дугаар","Төлбөр","Зөвшөөрөл"
    ];
    const rows = horses.map(h=>[
      h.number, h.horseName, h.horseColor||"",
      h.ownerName, h.uyaachName||"",
      h.riderName, h.riderAge||"", h.riderGender||"",
      h.insurance||"",
      h.paid?"Төлсөн":"Хүлээгдэж буй",
      h.approved?"Зөвшөөрсөн":"Үгүй"
    ]);
    const BOM = "﻿";
    const csv = BOM + [headers, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `нааdam2026_${ageName}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${horses.length} морь экспортлогдлоо ✓`);
  };

  // Admin actions
  const adminApprove=async(h)=>{
    try { await approveHorse(h.fbId||h.id); } catch(e){ console.error(e); }
    setAllReg(prev=>{
      const n={...prev};
      n[h.ageGroupId]=n[h.ageGroupId].map(x=>x.id===h.id?{...x,approved:true}:x);
      return n;
    });
    if(waitingApproval && h.ownerPhone===user?.phone){
      setWaitingApproval(false);
      setScreen("success");
      showToast("Бүртгэл баталгаажлаа! 🎉");
    } else {
      showToast("Бүртгэл зөвшөөрөгдлөө");
    }
  };
  const adminReject=async(h)=>{
    try { await deleteHorse(h.fbId||h.id); } catch(e){ console.error(e); }
    setAllReg(prev=>{
      const n={...prev};
      n[h.ageGroupId]=n[h.ageGroupId].filter(x=>x.id!==h.id);
      return n;
    });
    showToast("Бүртгэл цуцлагдлаа");
  };

  // Nav helper
  const goNav=(tab,sc)=>{setActiveNav(tab);setScreen(sc);};

  // Clipboard copy with textarea fallback for sandboxed environments
  const copyText = (text, label) => {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); showToast(`${label} хуулагдлаа ✓`); }
      catch { showToast(`${label}: ${text}`); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(()=>showToast(`${label} хуулагдлаа ✓`)).catch(fallback);
    } else { fallback(); }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── HEADER ── */}
        {role && (
          <header className="hdr">
            <div>
              <div className="logo-text">НААДАМ</div>
                          </div>

            <nav className="nav-tabs">
              {role==="user" && <>
                <button className={`ntab ${activeNav==="dashboard"?"active":""}`} onClick={()=>goNav("dashboard","dashboard")}>🏠 <span>Нүүр</span></button>
                <button className={`ntab ${activeNav==="myhorses"?"active":""}`} onClick={()=>goNav("myhorses","myhorses")}> <span>Морьд</span></button>
              </>}
              {role==="explainer" && (
                <button className={`ntab ${activeNav==="explainer"?"active":""}`} onClick={()=>goNav("explainer","explainer")}>📢 <span>Тайлбарлагч</span></button>
              )}
              {role==="admin" && <>
                <button className={`ntab ${activeNav==="admin"?"active":""}`} onClick={()=>goNav("admin","admin")}>🔐 <span>Удирдлага</span></button>
                <button className={`ntab ${activeNav==="explainer"?"active":""}`} onClick={()=>goNav("explainer","explainer")}>📢 <span>Тайлбарлагч</span></button>
              </>}
            </nav>

            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div className="user-badge" style={{cursor:"default"}}>
                {role==="admin"&&<span className="role-chip role-admin">Админ</span>}
                {role==="explainer"&&<span className="role-chip role-explainer">Тайлбарлагч</span>}
                {role==="user"&&<span className="role-chip role-user">Хэрэглэгч</span>}
                {" "}{user?.givenName||user?.name?.split(" ")[1]||user?.name}
              </div>
              <button onClick={logout}
                style={{background:"rgba(192,57,43,.15)",border:"1px solid rgba(192,57,43,.4)",borderRadius:"20px",padding:"6px 14px",color:"#ff8a80",fontFamily:"'Nunito',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer",transition:"all .2s"}}
                onMouseOver={e=>e.target.style.background="rgba(192,57,43,.3)"}
                onMouseOut={e=>e.target.style.background="rgba(192,57,43,.15)"}>
                Гарах
              </button>
            </div>
          </header>
        )}

        <main>

          {/* ══ LOGIN ══ */}
          {screen==="login" && (
            <div className="auth-screen">
              <div className="auth-card">
                
                <div className="auth-title">НАЛАЙХ ДҮҮРГИЙН НААДАМ</div>
                <div className="auth-subtitle">Хурдан морины бүртгэл</div>

                <div className="tab-row">
                  <button className={`tab-btn ${authTab==="user"?"active":""}`} onClick={()=>setAuthTab("user")}>👤 Хэрэглэгч</button>
                  <button className={`tab-btn ${authTab==="explainer"?"active":""}`} onClick={()=>setAuthTab("explainer")}>📢 Тайлбарлагч</button>
                  <button className={`tab-btn ${authTab==="admin"?"active":""}`} onClick={()=>setAuthTab("admin")}>🔐 Админ</button>
                </div>

                {/* USER */}
                {authTab==="user" && <UserAuth doRegister={doRegister} doLogin={doLogin}/>}

                {/* EXPLAINER */}
                {authTab==="explainer" && (
                  <>
                    <div className="info-row" style={{marginBottom:"4px"}}>
                      <span style={{fontSize:"20px"}}>📢</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:"14px",color:"var(--gold)"}}>Тайлбарлагчийн нэвтрэх</div>
                        <div style={{fontSize:"12px",color:"var(--white-dim)"}}>Зохион байгуулагчаас олгосон нэвтрэх кодоо оруулна уу</div>
                      </div>
                    </div>
                    <label>Нэвтрэх код</label>
                    <EyeInput id="ec" placeholder="Нэвтрэх код"/>
                    <button className="btn-gold" onClick={doExplainerLogin}>Нэвтрэх →</button>
                  </>
                )}

                {/* ADMIN */}
                {authTab==="admin" && (
                  <>
                    <div className="info-row" style={{marginBottom:"4px"}}>
                      <span style={{fontSize:"20px"}}>🔐</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:"14px",color:"#ff8a80"}}>Админы нэвтрэх</div>
                        <div style={{fontSize:"12px",color:"var(--white-dim)"}}>Зөвхөн зохион байгуулагчдад зориулагдсан</div>
                      </div>
                    </div>
                    <label>Нэвтрэх нэр</label>
                    <input id="au" type="text" placeholder="Нэвтрэх нэр"/>
                    <label>Нууц үг</label>
                    <EyeInput id="ap" placeholder="Нууц үг"/>
                    <button className="btn-gold" onClick={doAdminLogin} style={{background:"linear-gradient(135deg,#7b1010,var(--red2))"}}>Нэвтрэх →</button>
                  </>
                )}
              </div>
            </div>
          )}



          {/* ══ USER DASHBOARD ══ */}
          {screen==="dashboard" && role==="user" && (
            <div className="page">
              <div className="banner">
                <h2>Тавтай морилно уу, {user?.givenName}!</h2>
                <p>Мориныхоо насны ангиллыг сонгоод бүртгэлийг эхлүүлнэ үү. Бүртгэлийн хураамж морь тутамд 30,000₮ байна.</p>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-val">{myHorses.length}</div><div className="stat-label">Нийт морь</div></div>
                  <div className="stat-card"><div className="stat-val">{myHorses.filter(h=>h.paid).length}</div><div className="stat-label">Төлбөр хийсэн</div></div>
                  <div className="stat-card"><div className="stat-val">{flatHorses.length}</div><div className="stat-label">Нийт бүртгэл</div></div>
                  <div className="stat-card"><div className="stat-val">{AGE_GROUPS.length}</div><div className="stat-label">Насны ангилал</div></div>
                </div>
              </div>

              {/* Registration status banner */}
              {regDeadline && (
                <div style={{
                  background: isRegClosed ? "rgba(192,57,43,.15)" : "rgba(39,174,96,.1)",
                  border: `1px solid ${isRegClosed ? "rgba(192,57,43,.4)" : "rgba(39,174,96,.3)"}`,
                  borderRadius:"12px", padding:"12px 16px", marginBottom:"16px",
                  display:"flex", alignItems:"center", gap:"12px"
                }}>
                  <span style={{fontSize:"20px"}}>{isRegClosed ? "🔒" : "⏰"}</span>
                  <div>
                    <div style={{fontWeight:700, fontSize:"14px", color: isRegClosed ? "#ff8a80" : "#2ecc71"}}>
                      {isRegClosed ? "Бүртгэл хаагдсан" : `Бүртгэл хаагдах хүртэл: ${timeLeft}`}
                    </div>
                    <div style={{fontSize:"12px", color:"var(--white-dim)", marginTop:"2px"}}>
                      {isRegClosed
                        ? "Бүртгэлийн хугацаа дууссан байна"
                        : `Хаагдах огноо: ${new Date(regDeadline).toLocaleString("mn-MN")}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Registration status banner */}
              {regDeadline && (
                <div style={{
                  background: isRegClosed ? "rgba(192,57,43,.15)" : "rgba(39,174,96,.1)",
                  border: `1px solid ${isRegClosed ? "rgba(192,57,43,.4)" : "rgba(39,174,96,.3)"}`,
                  borderRadius:"12px", padding:"12px 16px", marginBottom:"16px",
                  display:"flex", alignItems:"center", gap:"12px"
                }}>
                  <span style={{fontSize:"20px"}}>{isRegClosed ? "🔒" : "⏰"}</span>
                  <div>
                    <div style={{fontWeight:700, fontSize:"14px", color: isRegClosed ? "#ff8a80" : "#2ecc71"}}>
                      {isRegClosed ? "Бүртгэл хаагдсан" : `Бүртгэл хаагдах хүртэл: ${timeLeft}`}
                    </div>
                    <div style={{fontSize:"12px", color:"var(--white-dim)", marginTop:"2px"}}>
                      {isRegClosed
                        ? "Бүртгэлийн хугацаа дууссан байна"
                        : `Хаагдах огноо: ${new Date(regDeadline).toLocaleString("mn-MN")}`}
                    </div>
                  </div>
                </div>
              )}
              <div className="sec-title">Насны Ангилал — Морь Бүртгэх</div>
              <div className="age-grid">
                {AGE_GROUPS.map(ag=>{
                  const cnt=(allReg[ag.id]||[]).filter(h=>h.ownerPhone===user?.phone).length;
                  return (
                    <div key={ag.id} className={`age-card ${cnt>0?"has":""}`}>
                      <div className="age-label">{ag.name}</div>

                      {cnt>0 && <span className="badge badge-gold" style={{display:"block",marginBottom:"8px"}}>{cnt} морь бүртгэлтэй</span>}
                      {isRegClosed
                      ? <div className="age-reg-btn" style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.4)",cursor:"not-allowed"}}>🔒 Хаагдсан</div>
                      : <button className="age-reg-btn" onClick={()=>openAge(ag)}>{cnt>0?"+ Дахин бүртгэх":"+ Морь бүртгэх"}</button>
                    }
                    </div>
                  );
                })}
              </div>

              {myHorses.length>0 && <>
                <div className="sec-title">Миний Бүртгэлтэй Морьд</div>
                {myHorses.map(h=>(
                  <div key={h.id} className="horse-item">
                    <div className="horse-num">{h.number}</div>
                    <div><div className="horse-name">{h.horseName}</div><div className="horse-meta">{h.ageGroupName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div></div>
                    {h.paid?<span className="status-paid">✓ Төлсөн</span>:<span className="status-pend">⏳ Хүлээгдэж буй</span>}
                  </div>
                ))}
              </>}
            </div>
          )}

          {/* ══ MY HORSES ══ */}
          {screen==="myhorses" && role==="user" && (
            <div className="page-sm">
              <div className="sec-title">Миний Морьд</div>
              {myHorses.length===0
                ? <div className="empty-state"><div className="big">📋</div><div>Одоохондоо бүртгэлтэй морь байхгүй</div></div>
                : myHorses.map(h=>(
                  <div key={h.id} className="horse-item">
                    <div className="horse-num">{h.number}</div>
                    <div>
                      <div className="horse-name">{h.horseName}</div>
                      <div className="horse-meta">{h.ageGroupName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div>
                    </div>
                    {h.paid?<span className="status-paid">✓ Төлсөн</span>:<span className="status-pend">⏳ Хүлээгдэж буй</span>}
                  </div>
                ))
              }
            </div>
          )}

          {/* ══ AGE GROUP ══ */}
          {/* ══ HORSE FORM ══ */}
          {screen==="horseForm" && selectedAge && (
            <div className="page-sm">
              <button className="back-btn" onClick={()=>setScreen("dashboard")}>← Буцах</button>
              <div style={{marginBottom:"14px"}}>
                <div style={{fontFamily:"'Cinzel',serif",color:"var(--gold)",fontSize:"16px",marginBottom:"3px"}}>{selectedAge.name} — {curIdx+1}-р морь</div>
                <div style={{color:"var(--white-dim)",fontSize:"13px"}}>{selectedAge?.name} ангилал — морины мэдээлэл</div>
              </div>
              

              {/* Horse */}
              <div className="fcard">
                <h3>Морины мэдээлэл</h3>
                <label>Морины нэр *</label>
                <input type="text" placeholder="Морины нэр" value={hForm.horseName||""} onChange={e=>setField("horseName",cyrilOnly(e.target.value))}/>
                {hFormErr.horseName&&<p className="err-msg">⚠ {hFormErr.horseName}</p>}
                <div>
                  <label>Морины зүс</label>
                  <input type="text" placeholder="Жишээ: Хүрэн, Шарга, Бор, Хар..." value={hForm.horseColor||""} onChange={e=>setField("horseColor",cyrilOnly(e.target.value))}/>
                </div>
                <label>Морины зураг (9×12) *</label>
                <div className={`upload-zone ${hForm.horseImage?"filled":""}`}>
                  <input type="file" accept="image/*" onChange={e=>{
                    const f=e.target.files[0];
                    if(f){
                      setField("horseImageName",f.name);
                      const reader=new FileReader();
                      reader.onload=ev=>setField("horseImage",ev.target.result);
                      reader.readAsDataURL(f);
                    }
                  }}/>
                  {hForm.horseImage
                    ? <><img src={hForm.horseImage} className="upload-preview" style={{objectFit:"contain",background:"rgba(0,0,0,0.2)"}} alt="horse"/><div style={{color:"var(--gold)",fontSize:"12px",marginTop:"6px"}}>✓ {hForm.horseImageName}</div></>
                    : <><div className="upload-icon">📷</div><div className="upload-lbl">Зураг оруулах</div><div className="upload-hint">9×12 см · JPG, PNG</div></>
                  }
                </div>
                <label>Тамга / Тэмдэг</label>
                <input type="text" placeholder="Тамгын дугаар эсвэл тайлбар" value={hForm.horseStamp||""} onChange={e=>setField("horseStamp",cyrilOnly(e.target.value))}/>
                <label>Өмнөх амжилт/ түүх</label>
                <textarea placeholder="Өмнөх амжилт, уралдааны дүн, байр..." value={hForm.history||""} onChange={e=>setField("history",e.target.value)}/>


              </div>

              {/* Owner */}
              <div className="fcard">
                <h3>👤 Эзний мэдээлэл</h3>
                <label>Эзний овог нэр *</label>
                <input type="text" placeholder="Бүтэн нэр" value={hForm.ownerName||""} onChange={e=>setField("ownerName",cyrilOnly(e.target.value))}/>
                {hFormErr.ownerName&&<p className="err-msg">⚠ {hFormErr.ownerName}</p>}
                <div className="form-row">
                  <div>
                    <label>Цол / Зэрэг</label>
                    <input type="text" placeholder="" value={hForm.ownerTitle||""} onChange={e=>setField("ownerTitle",cyrilOnly(e.target.value))}/>
                  </div>
                  <div>
                    <label>Регистрийн дугаар</label>
                    <input type="text" placeholder="АА12345678" value={hForm.ownerReg||""} onChange={e=>setField("ownerReg",e.target.value)}/>
                  </div>
                </div>
              </div>

              {/* Rider */}
              <div className="fcard">
                <h3>Уяач болон уралдаанч хүүхдийн мэдээлэл</h3>
                <label>Уяачийн овог нэр *</label>
                <input type="text" placeholder="Бүтэн нэр" value={hForm.uyaachName||""} onChange={e=>setField("uyaachName",cyrilOnly(e.target.value))}/>
                {hFormErr.uyaachName&&<p className="err-msg">⚠ {hFormErr.uyaachName}</p>}
                <label>Цол / Зэрэг</label>
                <input type="text" placeholder="" value={hForm.uyaachTitle||""} onChange={e=>setField("uyaachTitle",cyrilOnly(e.target.value))}/>
                <label>Уралдаанч хүүхдийн овог нэр *</label>
                <input type="text" placeholder="Бүтэн нэр" value={hForm.riderName||""} onChange={e=>setField("riderName",cyrilOnly(e.target.value))}/>
                {hFormErr.riderName&&<p className="err-msg">⚠ {hFormErr.riderName}</p>}
                <label>Уралдаанч хүүхдийн хүйс</label>
                <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
                  {["Эрэгтэй","Эмэгтэй"].map(g=>(
                    <button key={g} type="button"
                      onClick={()=>setField("riderGender",g)}
                      style={{flex:1,padding:"10px",borderRadius:"10px",border:`2px solid ${hForm.riderGender===g?"var(--gold)":"var(--border-white)"}`,background:hForm.riderGender===g?"var(--gold-bg)":"var(--white-faint)",color:hForm.riderGender===g?"var(--gold)":"var(--white-dim)",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:"14px",cursor:"pointer",transition:"all .2s"}}>
                      {g==="Эрэгтэй"?"👦 Эрэгтэй":"👧 Эмэгтэй"}
                    </button>
                  ))}
                </div>
                <label>Уралдаанч хүүхдийн регистрийн дугаар *</label>
                <input
                  type="text"
                  placeholder="Жишээ нь: УШ16080752"
                  value={hForm.riderReg||""}
                  maxLength={10}
                  style={{textTransform:"uppercase",letterSpacing:"2px"}}
                  onChange={e=>setField("riderReg", regOnly(e.target.value))}
                />
                {hFormErr.riderReg && <p className="err-msg">⚠ {hFormErr.riderReg}</p>}
                {hForm.riderReg && hForm.riderReg.length >= 4 && (()=>{
                  const yy = parseInt(hForm.riderReg.slice(2,4), 10);
                  if (isNaN(yy)) return null;
                  const birthYear = yy <= 26 ? 2000 + yy : 1900 + yy;
                  const age = 2026 - birthYear;
                  const tooYoung = birthYear > (2026 - 8);
                  // Auto-fill riderAge if valid
                  if (!tooYoung && hForm.riderAge !== String(age)) {
                    setTimeout(()=>setField("riderAge", String(age)), 0);
                  }
                  if (tooYoung) return (
                    <div style={{background:"rgba(192,57,43,.12)",border:"1px solid rgba(192,57,43,.35)",borderRadius:"8px",padding:"12px 14px",marginTop:"8px",fontSize:"13px",lineHeight:1.6,color:"#ff8a80"}}>
                      Үндэсний их баяр наадмын үндэсний хурдан морины уралдаанд уралдах морийг 8 ба түүнээс дээш насны хүүхэд унаж уралдана.
                    </div>
                  );
                  return (
                    <div style={{background:"rgba(39,174,96,.12)",border:"1px solid rgba(39,174,96,.3)",borderRadius:"8px",padding:"9px 14px",marginTop:"8px",fontSize:"13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"#2ecc71",fontWeight:700}}>{birthYear} онд төрсөн</span>
                      <span style={{background:"rgba(39,174,96,.2)",border:"1px solid rgba(39,174,96,.4)",borderRadius:"20px",padding:"2px 12px",color:"#2ecc71",fontWeight:800,fontSize:"15px"}}>{age} нас</span>
                    </div>
                  );
                })()}
                <label>Уралдаанч хүүхдийн нас</label>
                <input type="number" placeholder="Регистрээс автоматаар бөглөгдөнө" min={8} max={18}
                  value={hForm.riderAge||""}
                  onChange={e=>setField("riderAge",e.target.value)}
                  style={{background: hForm.riderAge ? "rgba(39,174,96,.1)" : "var(--white-faint)",
                    border: hForm.riderAge ? "1px solid rgba(39,174,96,.4)" : "1px solid var(--border-white)",
                    color: hForm.riderAge ? "#2ecc71" : "var(--white)", fontWeight: hForm.riderAge ? 700 : 400}}
                />

                <label>Зөвшөөрлийн бичиг *</label>
                <div className={`upload-zone ${hForm.riderConsent?"filled":""}`}>
                  <input type="file" accept="image/*,.pdf" onChange={e=>{
                    const f=e.target.files[0];
                    if(f){
                      setField("riderConsentName",f.name);
                      if(f.type.startsWith("image/")){
                        const r=new FileReader();
                        r.onload=ev=>setField("riderConsent",ev.target.result);
                        r.readAsDataURL(f);
                      } else { setField("riderConsent","pdf:"+f.name); }
                    }
                  }}/>
                  {hForm.riderConsent
                    ? hForm.riderConsent.startsWith("pdf:")
                      ? <div style={{color:"var(--gold)",fontSize:"12px"}}>📄 {hForm.riderConsentName}</div>
                      : <><img src={hForm.riderConsent} style={{width:"100%",maxHeight:"220px",objectFit:"contain",borderRadius:"7px",marginTop:"6px",background:"rgba(0,0,0,0.15)"}} alt="consent"/><div style={{color:"var(--gold)",fontSize:"11px",marginTop:"6px"}}>✓ {hForm.riderConsentName}</div></>
                    : <><div style={{fontSize:"24px"}}>📄</div><div className="upload-lbl">Зураг / PDF оруулах</div></>
                  }
                </div>
                {hFormErr.riderConsent&&<p className="err-msg">⚠ {hFormErr.riderConsent}</p>}

                <label>Даатгалын баримтын сүүлийн 5 оронтой дугаар *</label>
                <p style={{fontSize:"12px",color:"var(--white-dim)",margin:"4px 0 8px",lineHeight:1.5}}>Хүүхдийн даатгалын баримтын дугаарын сүүлийн 5 оронтой тоог оруулна уу.</p>
                <input
                  type="text"
                  placeholder="Жишээ: 12345"
                  maxLength={5}
                  value={hForm.insurance||""}
                  onChange={e=>{
                    const v=e.target.value.replace(/[^0-9]/g,"").slice(0,5);
                    setField("insurance",v);
                  }}
                  style={{letterSpacing:"4px",fontSize:"20px",textAlign:"center",fontFamily:"'Cinzel',serif"}}
                />
                {hForm.insurance && hForm.insurance.length===5 && (
                  <div style={{background:"rgba(39,174,96,.12)",border:"1px solid rgba(39,174,96,.3)",borderRadius:"8px",padding:"9px 14px",marginTop:"8px",fontSize:"13px",color:"#2ecc71",fontWeight:700}}>
                    ✓ Даатгалын дугаар: ***{hForm.insurance}
                  </div>
                )}
                {hFormErr.insurance&&<p className="err-msg">⚠ {hFormErr.insurance}</p>}
              </div>

              <button className="btn-gold" onClick={saveHorse}>
                "Хадгалаад дугаар авах ✓"
              </button>
            </div>
          )}

          {/* ══ NUMBER REVEAL ══ */}
          {screen==="numReveal" && lastPending && (
            <div className="auth-screen">
              <div className="auth-card" style={{maxWidth:"460px"}}>
                <div style={{fontSize:"34px",marginBottom:"6px"}}>🎉</div>
                <div className="auth-title">Дугаар олгогдлоо!</div>
                {!lastPending.needsPayment && (
                  <div className="auth-subtitle">
                    Ижил дугаарыг ашиглана — нэмэлт төлбөргүй
                  </div>
                )}
                <div className="num-circle"><span className="num-big">{lastPending.number}</span><span className="num-lbl">Дугаар</span></div>

                <div style={{background:"var(--white-faint)",borderRadius:"10px",padding:"12px",marginBottom:"8px",fontSize:"14px"}}>
                  {[
                    ["Морь", lastPending.horseName],
                    ["Ангилал", lastPending.ageGroupName],
                    ["Эзэн", lastPending.ownerName],
                    ["Уяач", lastPending.uyaachName||"—"],
                    ["Уралдаанч хүүхэд", lastPending.riderName],
                    ["Регистр", lastPending.riderReg||"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
                      <span style={{color:"var(--white-dim)",fontSize:"12px"}}>{l}</span>
                      <span style={{fontWeight:700,fontSize:"13px"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="warn-box">⚠️ Энэ дугаар төлбөр хийгдсэний дараа баталгаажна. 15 минутын дотор төлбөр хийгдээгүй тохиолдолд дугаар өөр хэрэглэгчид шилжинэ.</div>
                <div style={{background:"rgba(15,33,112,.6)",border:"1px solid var(--border-gold)",borderRadius:"14px",padding:"18px",textAlign:"center"}}>
                  <div style={{fontSize:"15px",fontWeight:700,color:"var(--gold)",marginBottom:"6px"}}>
                    Өөр насны ангилалд морь бүртгүүлэх үү?
                  </div>
                  <div style={{fontSize:"13px",color:"var(--white-dim)",marginBottom:"16px",lineHeight:1.5}}>
                    Тийм бол насны ангилал сонгох хуудас руу буцна.<br/>
                    Үгүй бол одоо төлбөр хийнэ.
                  </div>
                  <div style={{display:"flex",gap:"10px"}}>
                    <button className="btn-gold" style={{marginTop:0,flex:1}} onClick={afterReveal}>
                      ✓ Тийм
                    </button>
                    <button className="btn-outline" style={{flex:1}} onClick={()=>{afterReveal();setTimeout(()=>setScreen("payment"),100);}}>
                      💳 Үгүй, төлбөр хийх
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PAYMENT ══ */}
          {screen==="payment" && (
            <div className="page-sm">
              <button className="back-btn" onClick={()=>setScreen("dashboard")}>← Буцах (Морь нэмэх)</button>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"20px",color:"var(--gold)",marginBottom:"18px"}}>💳 Нэгдсэн Бүртгэлийн Хураамж</div>

              {/* Summary */}
              <div className="pay-summary">
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"13px",color:"var(--gold2)",marginBottom:"10px"}}>Тооцооны дэлгэрэнгүй</div>
                {pendingHorses.map(h=>(
                  <div key={h.id} className="pay-row">
                    <span>#{h.number} {h.horseName} <span className="tag">{h.ageGroupName}</span></span>
                    {h.needsPayment
                      ? <span style={{color:"var(--gold)"}}>30,000₮</span>
                      : <span style={{color:"#2ecc71",fontSize:"12px"}}>✓ Дугаар ашигласан — үнэгүй</span>
                    }
                  </div>
                ))}
                <div className="pay-row pay-total">
                  <span>Нийт дүн</span>
                  <span>{(pendingHorses.filter(h=>h.needsPayment).length*30000).toLocaleString()}₮</span>
                </div>
                {pendingHorses.some(h=>!h.needsPayment) && (
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)",marginTop:"8px",padding:"8px 0",borderTop:"1px solid var(--border-white)",lineHeight:1.6}}>
                    ℹ️ #{pendingHorses.find(h=>!h.needsPayment)?.number} дугаарыг өмнө нь авсан тул нэмэлт төлбөргүй. Ижил дугаартай цамцаа ашиглана уу.
                  </div>
                )}
              </div>

              {/* Bank account info */}
              <div className="sec-title">Дансны мэдээлэл</div>
              <div className="bank-info-box">
                <div className="bank-info-title">🏦Худалдаа Хөгжлийн Банк — Шилжүүлэх данс</div>
                {/* Данс эзэмшигч — no copy button */}
                <div className="bank-info-row">
                  <span className="bank-info-label">Данс эзэмшигч</span>
                  <span className="bank-info-val">Гэндэн оюу ХХК</span>
                </div>
                {/* Дансны дугаар — copy button */}
                <div className="bank-info-row">
                  <span className="bank-info-label">Дансны дугаар</span>
                  <span style={{display:"flex",alignItems:"center"}}>
                    <span className="bank-info-val">860004000447007682</span>
                    <button className="copy-btn" onClick={()=>copyText("860004000447007682","Дансны дугаар")}>Хуулах</button>
                  </span>
                </div>
                {/* Банк — no copy button */}
                <div className="bank-info-row">
                  <span className="bank-info-label">Банк</span>
                  <span className="bank-info-val">Худалдаа Хөгжлийн Банк</span>
                </div>
                <div className="bank-info-row">
                  <span className="bank-info-label">Шилжүүлэх дүн</span>
                  <span className="bank-info-val highlight">{(pendingHorses.filter(h=>h.needsPayment).length*30000).toLocaleString()}₮</span>
                </div>
              </div>

              {/* Horse numbers auto-filled as transaction description */}
              <div className="txn-input-box">
                <h4>📋 Гүйлгээний утга</h4>
                <p style={{fontSize:"13px",color:"var(--white-dim)",marginBottom:"12px",lineHeight:1.6}}>
                  Гүйлгээний утга хэсэгт та авсан дугааруудаа хуулаад бичээрэй.
                </p>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div className="txn-id-display" style={{fontSize:"22px",letterSpacing:"3px",flex:1,margin:0}}>
                    {[...new Set(pendingHorses.filter(h=>h.needsPayment).map(h=>h.number))].join(", ")||pendingHorses[0]?.number}
                  </div>
                  <button
                    onClick={()=>copyText([...new Set(pendingHorses.filter(h=>h.needsPayment).map(h=>h.number))].join(", ")||String(pendingHorses[0]?.number||""),"Дугаарууд")}
                    style={{background:"linear-gradient(135deg,var(--gold3),var(--gold))",border:"none",borderRadius:"10px",
                      padding:"12px 16px",color:"var(--navy2)",fontFamily:"'Nunito',sans-serif",
                      fontWeight:700,fontSize:"13px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    📋 Хуулах
                  </button>
                </div>
              </div>


              {payLoading ? (
                <div style={{textAlign:"center",padding:"20px"}}><div className="spinner"/><div style={{color:"var(--gold2)",fontSize:"13px"}}>Хүсэлт илгээж байна...</div></div>
              ) : (
                <button className="btn-gold" onClick={doSubmitPayment}>Бүртгэл илгээх ✓</button>
              )}
            </div>
          )}

          {/* ══ SUCCESS ══ */}
          {/* ══ WAITING FOR APPROVAL ══ */}
          {screen==="waiting" && (
            <div className="auth-screen">
              <div className="auth-card" style={{maxWidth:"420px",textAlign:"center"}}>
                <div style={{fontSize:"48px",marginBottom:"16px"}}>⏳</div>
                <div className="auth-title" style={{marginBottom:"12px"}}>Төлбөр шалгаж байна...</div>
                <div className="auth-subtitle" style={{marginBottom:"24px",lineHeight:1.7}}>
                  Таны гүйлгээг баталгаажуулж байна.<br/>
                  Баталгаажуулах хуудас гарч иртэл түр хүлээнэ үү.
                </div>
                {/* Animated dots */}
                <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"28px"}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{
                      width:"12px",height:"12px",borderRadius:"50%",
                      background:"var(--gold)",
                      animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`
                    }}/>
                  ))}
                </div>
                <style>{`
                  @keyframes bounce {
                    0%,80%,100%{transform:scale(0.6);opacity:0.4;}
                    40%{transform:scale(1);opacity:1;}
                  }
                `}</style>
                {/* Show registered horses */}
                <div style={{background:"rgba(255,255,255,.06)",borderRadius:"12px",padding:"14px",marginBottom:"16px",textAlign:"left"}}>
                  <div style={{fontSize:"12px",color:"var(--white-dim)",marginBottom:"8px",fontWeight:600}}>БҮРТГЭСЭН МОРЬД:</div>
                  {flatHorses.filter(h=>h.paid&&h.ownerPhone===user?.phone).map(h=>(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"6px 0",borderBottom:"1px solid var(--border-white)"}}>
                      <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,var(--gold3),var(--gold))",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cinzel',serif",fontWeight:700,color:"var(--navy2)",fontSize:"13px",flexShrink:0}}>{h.number}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:"13px"}}>{h.horseName}</div>
                        <div style={{fontSize:"11px",color:"var(--white-dim)"}}>{h.ageGroupName}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,.4)",lineHeight:1.6}}>
                  Гүйлгээний утгад бичсэн дугаараа банкны баримтаас шалгана уу
                </div>
              </div>
            </div>
          )}

          {screen==="success" && (
            <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1a5e 0%,#060e3a 60%,#030820 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"20px 16px 40px"}}>

              {/* ── CONFIRMATION CARD ── */}
              <div id="success-card" style={{
                maxWidth:"400px",width:"100%",
                background:"linear-gradient(160deg,#0a1a5e 0%,#0d1c6e 100%)",
                border:"2px solid #e8c060",borderRadius:"24px",
                padding:"0 0 20px",overflow:"hidden",
                fontFamily:"Arial,sans-serif",color:"#fff",
                boxShadow:"0 8px 40px rgba(0,0,0,.5)"
              }}>
                {/* Gold header band */}
                <div style={{background:"linear-gradient(135deg,#b8922a,#e8c060)",padding:"16px 20px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:"11px",color:"#0a1a5e",letterSpacing:"2px",marginBottom:"2px",fontWeight:700}}>
                    НАЛАЙХ ДҮҮРГИЙН НААДАМ 2026
                  </div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:"#0a1a5e",fontWeight:700}}>
                    БҮРТГЭЛ БАТАЛГААЖЛАА ✓
                  </div>
                </div>

                {/* Owner info */}
                <div style={{padding:"14px 20px 0",textAlign:"center"}}>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)",marginBottom:"2px"}}>ЭЗЭН</div>
                  <div style={{fontSize:"16px",fontWeight:700,color:"#fff"}}>{user?.name}</div>
                </div>

                {/* Horse cards */}
                <div style={{padding:"12px 16px 0"}}>
                  {flatHorses.filter(h=>h.paid&&h.ownerPhone===user?.phone).map((h,idx)=>(
                    <div key={h.id} style={{
                      background:"rgba(255,255,255,.07)",
                      border:"1px solid rgba(232,192,96,.35)",
                      borderRadius:"16px",padding:"14px 16px",
                      marginBottom:"10px"
                    }}>
                      {/* Big number */}
                      <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                        <div style={{
                          width:"72px",height:"72px",borderRadius:"50%",flexShrink:0,
                          background:"linear-gradient(135deg,#b8922a,#e8c060)",
                          display:"flex",flexDirection:"column",
                          alignItems:"center",justifyContent:"center",
                          boxShadow:"0 0 20px rgba(232,192,96,.4)"
                        }}>
                          <span style={{fontFamily:"'Cinzel',serif",fontSize:h.number>99?"20px":"26px",fontWeight:700,color:"#0a1a5e",lineHeight:1}}>{h.number}</span>
                          <span style={{fontSize:"8px",color:"#0a1a5e",fontWeight:700,letterSpacing:"1px",marginTop:"2px"}}>ДУГААР</span>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:"16px",marginBottom:"4px"}}>{h.horseName}</div>
                          <div style={{display:"inline-block",background:"rgba(232,192,96,.15)",border:"1px solid rgba(232,192,96,.3)",borderRadius:"6px",padding:"2px 8px",fontSize:"11px",color:"#f5d882",marginBottom:"6px"}}>{h.ageGroupName}</div>
                          <div style={{fontSize:"12px",color:"rgba(255,255,255,.6)",lineHeight:1.6}}>
                            Уяач: {h.uyaachName||"—"}<br/>
                            Уралдаанч: {h.riderName}{h.riderAge?` · ${h.riderAge} нас`:""}
                          </div>
                        </div>
                      </div>
                      {/* Same number reuse note */}
                      {!h.needsPayment && (
                        <div style={{marginTop:"8px",fontSize:"11px",color:"#2ecc71",padding:"4px 8px",background:"rgba(39,174,96,.1)",borderRadius:"6px",textAlign:"center"}}>
                          ✓ Ижил дугаар — нэмэлт төлбөргүй
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Important instruction */}
                <div style={{margin:"4px 16px 0",background:"rgba(232,192,96,.1)",border:"1px solid rgba(232,192,96,.3)",borderRadius:"12px",padding:"12px 14px",textAlign:"center"}}>
                  <div style={{fontSize:"13px",fontWeight:700,color:"#e8c060",marginBottom:"4px"}}>⚠️ ЧУХАЛ МЭДЭЭЛЭЛ</div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,.75)",lineHeight:1.6}}>
                    Энэ баримтыг цамц/хантааз авахдаа үзүүлнэ үү.<br/>
                    Дугаартай цамцаа авахдаа дээрх <strong style={{color:"#e8c060"}}>дугаараа</strong> заана уу.
                  </div>
                </div>
              </div>

              {/* ── SAVE BUTTON ── */}
              <div style={{maxWidth:"400px",width:"100%",marginTop:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
                <button style={{
                  width:"100%",background:"linear-gradient(135deg,#b8922a,#e8c060)",
                  border:"none",borderRadius:"14px",padding:"16px",
                  color:"#0a1a5e",fontFamily:"'Nunito',sans-serif",fontSize:"16px",
                  fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",
                  justifyContent:"center",gap:"10px",boxShadow:"0 4px 20px rgba(232,192,96,.3)"
                }}
                  onClick={async()=>{
                    const el=document.getElementById("success-card");
                    if(!el) return;
                    if(!window.html2canvas){
                      await new Promise((res,rej)=>{
                        const s=document.createElement("script");
                        s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                        s.onload=res; s.onerror=rej;
                        document.head.appendChild(s);
                      });
                    }
                    try {
                      showToast("Зураг хадгалж байна...");
                      const canvas = await window.html2canvas(el,{
                        backgroundColor:"#0a1a5e",scale:3,useCORS:true,logging:false
                      });
                      const link=document.createElement("a");
                      const nums=flatHorses.filter(h=>h.paid&&h.ownerPhone===user?.phone).map(h=>h.number).join("-");
                      link.download=`Налайх_наадам_${nums}.png`;
                      link.href=canvas.toDataURL("image/png");
                      link.click();
                      showToast("✓ Галерейд хадгалагдлаа!");
                    } catch(e){ window.print(); }
                  }}>
                  📥 Утасны галерейд хадгалах
                </button>
                <button style={{
                  width:"100%",background:"transparent",
                  border:"1px solid rgba(255,255,255,.2)",borderRadius:"14px",padding:"13px",
                  color:"rgba(255,255,255,.6)",fontFamily:"'Nunito',sans-serif",
                  fontSize:"14px",fontWeight:600,cursor:"pointer"
                }} onClick={()=>goNav("dashboard","dashboard")}>
                  Нүүр хуудас руу →
                </button>
              </div>
            </div>
          )}

          {/* ══ EXPLAINER ══ */}
          {screen==="explainer" && (
            <div className="page">
              <div style={{background:"rgba(15,33,112,.5)",border:"1px solid var(--border-gold)",borderRadius:"14px",padding:"16px 20px",marginBottom:"18px",display:"flex",alignItems:"center",gap:"12px"}}>
                <div className="live-dot"/>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",color:"var(--gold)",fontSize:"15px",marginBottom:"2px"}}>🎙 Тайлбарлагчийн Самбар</div>
                  <div style={{fontSize:"12px",color:"var(--white-dim)"}}>Бүртгэлтэй морьдын мэдээлэл · Дугаар · Насны ангилал</div>
                </div>
                <div style={{marginLeft:"auto",fontFamily:"'Cinzel',serif",fontSize:"20px",color:"var(--gold)"}}>{flatHorses.length}</div>
              </div>

              {/* Search box */}
              <div style={{position:"relative",marginBottom:"14px"}}>
                <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",pointerEvents:"none"}}>🔍</span>
                <input
                  type="text"
                  placeholder="Дугаар, морины нэр, уяач, уралдаанч хайх..."
                  value={expSearch}
                  onChange={e=>setExpSearch(e.target.value)}
                  style={{paddingLeft:"40px",background:"rgba(15,33,112,.6)",border:"1px solid var(--border-gold)"}}
                />
                {expSearch && (
                  <button onClick={()=>setExpSearch("")}
                    style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--white-dim)",fontSize:"18px",cursor:"pointer",lineHeight:1}}>×</button>
                )}
              </div>

              <div className="filter-bar">
                <button className={`chip ${expFilter==="all"?"active":""}`} onClick={()=>setExpFilter("all")}>Бүгд ({flatHorses.length})</button>
                {AGE_GROUPS.filter(ag=>(allReg[ag.id]||[]).length>0).map(ag=>(
                  <button key={ag.id} className={`chip ${expFilter===ag.id?"active":""}`} onClick={()=>setExpFilter(ag.id)}>
                    {ag.name} ({(allReg[ag.id]||[]).length})
                  </button>
                ))}
              </div>

              {flatHorses.length===0
                ? <div className="empty-state"><div className="big">📋</div><div>Одоохондоо бүртгэлтэй морь байхгүй байна</div></div>
                : <div className="horse-grid">
                    {flatHorses
                      .filter(h=>{
                        const ageOk = expFilter==="all" || h.ageGroupId===expFilter;
                        if (!expSearch.trim()) return ageOk;
                        const q = expSearch.trim().toLowerCase();
                        return ageOk && (
                          String(h.number).includes(q) ||
                          (h.horseName||"").toLowerCase().includes(q) ||
                          (h.uyaachName||"").toLowerCase().includes(q) ||
                          (h.riderName||"").toLowerCase().includes(q) ||
                          (h.ownerName||"").toLowerCase().includes(q) ||
                          (h.ageGroupName||"").toLowerCase().includes(q)
                        );
                      })
                      .sort((a,b)=>a.number-b.number)
                      .map(h=>(
                        <div key={h.id} className="exp-card" onClick={()=>setExpHorse(h)}>
                          <div className="exp-img">
                            {h.horseImage?<img src={h.horseImage} alt={h.horseName} style={{width:"100%",height:"100%",objectFit:"contain",background:"rgba(0,0,0,0.2)"}}/>:<span style={{fontSize:'32px',opacity:.5}}>🐴</span>}
                            <span className="num-badge">{h.number}</span>
                          </div>
                          <div className="exp-body">
                            <div className="exp-name">{h.horseName}</div>
                            <div className="exp-meta">
                              <span className="tag">{h.ageGroupName}</span><br/>
                              Эзэн: {h.ownerName}<br/>
                              Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
              }
              {flatHorses.length>0 && expSearch.trim() && flatHorses.filter(h=>{
                const ageOk=expFilter==="all"||h.ageGroupId===expFilter;
                const q=expSearch.trim().toLowerCase();
                return ageOk&&(String(h.number).includes(q)||(h.horseName||"").toLowerCase().includes(q)||(h.uyaachName||"").toLowerCase().includes(q)||(h.riderName||"").toLowerCase().includes(q)||(h.ownerName||"").toLowerCase().includes(q));
              }).length===0 && (
                <div className="empty-state" style={{padding:"30px"}}>
                  <div style={{fontSize:"32px",marginBottom:"8px"}}>🔍</div>
                  <div>"{expSearch}" хайлтад тохирох морь олдсонгүй</div>
                </div>
              )}
            </div>
          )}

          {/* ══ ADMIN ══ */}
          {screen==="admin" && role==="admin" && (
            <div className="page">
              <div className="banner" style={{marginBottom:"18px"}}>
                <h2>🔐 Админы Самбар</h2>
                <p>Бүх бүртгэл, төлбөр, хэрэглэгчдийн мэдээллийг энд удирдана уу.</p>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-val">{flatHorses.length}</div><div className="stat-label">Нийт бүртгэл</div></div>
                  <div className="stat-card"><div className="stat-val">{paidHorses.length}</div><div className="stat-label">Төлбөр хийсэн</div></div>
                  <div className="stat-card"><div className="stat-val">{pendCount}</div><div className="stat-label">Хүлээгдэж буй</div></div>
                  <div className="stat-card"><div className="stat-val">{(paidHorses.length*30000).toLocaleString()}₮</div><div className="stat-label">Нийт орлого</div></div>
                </div>
              </div>

              <div className="admin-tabs">
                {[["overview","📊 Ерөнхий"],["horses"," Бүртгэлүүд"],["byage","📋 Насны ангилал"],["export","📥 Экспорт"],["settings","⚙️ Тохиргоо"]].map(([k,l])=>(
                  <button key={k} className={`adm-tab ${adminTab===k?"active":""}`} onClick={()=>setAdminTab(k)}>{l}</button>
                ))}
              </div>

              {/* Overview */}
              {adminTab==="overview" && (
                <>
                  <div className="sec-title">Насны ангиллаар</div>
                  {AGE_GROUPS.map(ag=>{
                    const cnt=(allReg[ag.id]||[]).length;
                    const paid=(allReg[ag.id]||[]).filter(h=>h.paid).length;
                    return (
                      <div key={ag.id} className="adm-card" style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"8px"}}>
                        <span style={{fontFamily:"'Cinzel',serif",fontSize:"20px",color:"var(--gold)",minWidth:"28px"}}>#{ag.id}</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:"14px",color:"var(--gold)"}}>{ag.name}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:"var(--gold)"}}>{cnt}</div>
                          <div style={{fontSize:"11px",color:"var(--white-dim)"}}>{paid} төлсөн</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* All Horses */}
              {adminTab==="horses" && (
                <>
                  <div className="sec-title">Бүх Бүртгэлүүд ({flatHorses.length})</div>
                  {flatHorses.length===0
                    ? <div className="empty-state"><div className="big">📋</div><div>Бүртгэл байхгүй байна</div></div>
                    : flatHorses.sort((a,b)=>a.number-b.number).map(h=>(
                      <div key={h.id} className="horse-item" onClick={()=>setAdminHorse(h)}>
                        <div className="horse-num">{h.number}</div>
                        <div>
                          <div className="horse-name">{h.horseName} <span className="tag">{h.ageGroupName}</span></div>
                          <div className="horse-meta">Эзэн: {h.ownerName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div>
                        </div>
                        {h.paid?<span className="status-paid">✓ Төлсөн</span>:<span className="status-pend">⏳ Хүлээгдэж буй</span>}
                      </div>
                    ))
                  }
                </>
              )}

              {/* By Age Group */}
              {adminTab==="byage" && (
                <>
                  {AGE_GROUPS.map(ag=>{
                    const horses=allReg[ag.id]||[];
                    if(horses.length===0)return null;
                    return (
                      <div key={ag.id} style={{marginBottom:"20px"}}>
                        <div className="sec-title">{ag.name}</div>
                        {horses.map(h=>(
                          <div key={h.id} className="horse-item" onClick={()=>setAdminHorse(h)}>
                            <div className="horse-num">{h.number}</div>
                            <div><div className="horse-name">{h.horseName}</div><div className="horse-meta">Эзэн: {h.ownerName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div></div>
                            <div style={{display:"flex",flexDirection:"column",gap:"4px",alignItems:"flex-end",marginLeft:"auto"}}>
                              {h.paid?<span className="status-paid">✓ Төлсөн</span>:<span className="status-pend">⏳ Хүлээгдэж буй</span>}
                              {h.paid&&h.approved!==true&&<button className="btn-gold" style={{padding:"4px 10px",fontSize:"11px",marginTop:"0",width:"auto"}} onClick={e=>{e.stopPropagation();adminApprove(h);}}>Зөвшөөрөх</button>}
                              {h.approved&&<span style={{fontSize:"11px",color:"var(--green-t)"}}>✓ Зөвшөөрсөн</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {flatHorses.length===0&&<div className="empty-state"><div className="big">📋</div><div>Бүртгэл байхгүй байна</div></div>}
                </>
              )}

              {/* Export */}
              {adminTab==="export" && (
                <div>
                  <div className="sec-title">CSV / Excel экспорт</div>

                  {/* Full export */}
                  <div className="adm-card" style={{marginBottom:"12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:"15px",marginBottom:"4px"}}>📥 Бүх бүртгэл</div>
                        <div style={{fontSize:"13px",color:"var(--white-dim)"}}>Нийт {flatHorses.length} морь · Бүх насны ангилал</div>
                      </div>
                      <button onClick={exportCSV}
                        style={{background:"linear-gradient(135deg,var(--gold3),var(--gold))",border:"none",borderRadius:"10px",padding:"11px 22px",color:"var(--navy2)",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                        📥 CSV татаж авах
                      </button>
                    </div>
                  </div>

                  {/* Export by age group */}
                  <div className="sec-title">Насны ангиллаар тусад нь</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {AGE_GROUPS.map(ag=>{
                      const cnt = flatHorses.filter(h=>h.ageGroupId===ag.id).length;
                      return (
                        <div key={ag.id} className="adm-card" style={{padding:"12px 16px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
                            <div>
                              <span style={{fontWeight:700,fontSize:"14px"}}>{ag.name}</span>
                              <span style={{fontSize:"12px",color:"var(--white-dim)",marginLeft:"10px"}}>{cnt} морь</span>
                            </div>
                            {cnt > 0 ? (
                              <button onClick={()=>exportByAge(ag.id)}
                                style={{background:"var(--gold-bg)",border:"1px solid var(--border-gold)",borderRadius:"8px",padding:"7px 16px",color:"var(--gold)",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:"12px",cursor:"pointer"}}>
                                📥 CSV
                              </button>
                            ) : (
                              <span style={{fontSize:"12px",color:"rgba(255,255,255,.3)"}}>Бүртгэл байхгүй</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{marginTop:"16px",padding:"12px 14px",background:"rgba(232,192,96,.06)",border:"1px solid var(--border-gold)",borderRadius:"10px",fontSize:"12px",color:"var(--white-dim)",lineHeight:1.6}}>
                    💡 CSV файлыг Excel-д нээхдээ: Excel → Data → From Text/CSV → UTF-8 encoding сонгоно уу. Эсвэл Google Sheets-д шууд upload хийж болно.
                  </div>
                </div>
              )}

              {/* Settings */}
              {adminTab==="settings" && (
                <div className="adm-card">
                  <h3 style={{fontFamily:"'Cinzel',serif",color:"var(--gold)",marginBottom:"14px",paddingBottom:"10px",borderBottom:"1px solid var(--border-gold)"}}>Системийн тохиргоо</h3>
                  {[
                    ["Тайлбарлагчийн нэвтрэх код","tailbar2026"],
                    ["Төлбөрийн систем","Банкны шилжүүлэг (ХХБ)"],
                    ["Нийт боломжит дугаар","1 – 1,500"],
                    ["Бүртгэлийн хураамж","30,000₮ / морь"],
                    ["Системийн хувилбар","Налайх дүүргийн наадам v1.0"],
                  ].map(([l,v])=>(
                    <div key={l} className="adm-row">
                      <span className="adm-label">{l}</span>
                      <span style={{fontFamily:"'Cinzel',serif",color:"var(--gold)",fontSize:"14px"}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* ── EXPLAINER HORSE MODAL ── */}
        {expHorse && (
          <div className="overlay" onClick={()=>setExpHorse(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-title">
                <span> #{expHorse.number} · {expHorse.horseName}</span>
                <button className="modal-close" onClick={()=>setExpHorse(null)}>×</button>
              </div>
              {expHorse.horseImage&&<img src={expHorse.horseImage} style={{width:"100%",maxHeight:"260px",objectFit:"contain",background:"rgba(0,0,0,0.2)",borderRadius:"9px",marginBottom:"14px"}} alt="horse"/>}
              {[
                ["Дугаар",expHorse.number],
                ["Насны ангилал",expHorse.ageGroupName],
                ["Морины нэр",expHorse.horseName],
                ["Өнгө",expHorse.horseColor||"—"],
                ["Эзний нэр",expHorse.ownerName],
                ["Эзний цол",expHorse.ownerTitle||"—"],
                ["Уяачийн нэр",expHorse.uyaachName||"—"],

                ["Уралдаанч хүүхдийн нэр",expHorse.riderName],
                ["Уралдаанч хүүхдийн нас",expHorse.riderAge||(expHorse.riderReg&&expHorse.riderReg.length===10?`~${2026-parseInt(expHorse.riderReg.slice(2,4)<=26?2000+parseInt(expHorse.riderReg.slice(2,4)):1900+parseInt(expHorse.riderReg.slice(2,4)))} нас`:"—")||"—"],
                ["Өмнөх амжилт/ түүх",expHorse.history||"—"],
              ].map(([l,v])=>(
                <div key={l} className="detail-row"><span className="detail-lbl">{l}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN HORSE MODAL ── */}
        {adminHorse && (
          <div className="overlay" onClick={()=>setAdminHorse(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-title">
                <span> #{adminHorse.number} · {adminHorse.horseName}</span>
                <button className="modal-close" onClick={()=>setAdminHorse(null)}>×</button>
              </div>
              {adminHorse.horseImage&&<img src={adminHorse.horseImage} style={{width:"100%",maxHeight:"260px",objectFit:"contain",background:"rgba(0,0,0,0.2)",borderRadius:"9px",marginBottom:"14px"}} alt="horse"/>}
              {/* Payment verification box */}
              <div style={{
                background: adminHorse.approved
                  ? "rgba(39,174,96,.12)"
                  : adminHorse.paid
                    ? "rgba(232,192,96,.1)"
                    : "rgba(192,57,43,.1)",
                border: `1px solid ${adminHorse.approved ? "rgba(39,174,96,.4)" : adminHorse.paid ? "var(--border-gold)" : "rgba(192,57,43,.35)"}`,
                borderRadius:"12px", padding:"14px 16px", marginBottom:"16px"
              }}>
                <div style={{fontSize:"12px",color:"var(--white-dim)",marginBottom:"8px",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px"}}>
                  {adminHorse.approved ? "✅ Баталгаажсан" : adminHorse.paid ? "⏳ Баталгаажуулах хүлээгдэж байна" : "❌ Төлбөр хийгдээгүй"}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  <div>
                    <div style={{fontSize:"11px",color:"var(--white-dim)"}}>Бүртгэлийн дугаар</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:"24px",color:"var(--gold)",fontWeight:700}}>{adminHorse.number}</div>
                  </div>
                  <div>
                    <div style={{fontSize:"11px",color:"var(--white-dim)"}}>Төлбөрийн дүн</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:adminHorse.needsPayment===false?"#2ecc71":"var(--gold)",fontWeight:700}}>
                      {adminHorse.needsPayment===false ? "Үнэгүй" : "30,000₮"}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:"11px",color:"var(--white-dim)"}}>Эзний утас</div>
                    <div style={{fontSize:"14px",fontWeight:700}}>{adminHorse.ownerPhone||"—"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:"11px",color:"var(--white-dim)"}}>Даатгалын дугаар</div>
                    <div style={{fontSize:"14px",fontWeight:700}}>***{adminHorse.insurance||"—"}</div>
                  </div>
                </div>
                {!adminHorse.approved && adminHorse.paid && (
                  <div style={{marginTop:"10px",fontSize:"12px",color:"#f5d882",lineHeight:1.6,padding:"8px 10px",background:"rgba(232,192,96,.08)",borderRadius:"8px"}}>
                    💡 Банкны апп дээр гүйлгээний утгад <strong>{adminHorse.number}</strong> гэж байвал зөвшөөрнө үү.
                  </div>
                )}
              </div>

              {[
                ["Морины нэр",adminHorse.horseName],
                ["Насны ангилал",adminHorse.ageGroupName],
                ["Өнгө",adminHorse.horseColor||"—"],
                ["Эзний нэр",adminHorse.ownerName],
                ["Эзний цол",adminHorse.ownerTitle||"—"],
                ["Уяачийн нэр",adminHorse.uyaachName||"—"],
                ["Уралдаанч хүүхдийн нэр",adminHorse.riderName],
                ["Уралдаанчийн нас",adminHorse.riderAge||"—"],
                ["Уралдаанч регистр",adminHorse.riderReg||"—"],
                ["Өмнөх амжилт/ түүх",adminHorse.history||"—"],
              ].map(([l,v])=>(
                <div key={l} className="detail-row"><span className="detail-lbl">{l}</span><span>{v}</span></div>
              ))}

              <div style={{display:"flex",gap:"8px",marginTop:"16px"}}>
                {!adminHorse.approved&&adminHorse.paid&&(
                  <button className="btn-gold" style={{flex:1,marginTop:0}} onClick={()=>{adminApprove(adminHorse);setAdminHorse(h=>({...h,approved:true}));}}>
                    ✓ Зөвшөөрөх
                  </button>
                )}
                {adminHorse.approved&&(
                  <div style={{flex:1,textAlign:"center",padding:"12px",background:"rgba(39,174,96,.12)",border:"1px solid rgba(39,174,96,.3)",borderRadius:"10px",color:"#2ecc71",fontWeight:700,fontSize:"14px"}}>
                    ✅ Баталгаажсан
                  </div>
                )}
                <button style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"10px",padding:"12px",color:"rgba(255,255,255,.4)",fontFamily:"'Nunito',sans-serif",fontSize:"13px",cursor:"pointer"}} onClick={()=>setAdminHorse(null)}>Хаах</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

// ── EYE TOGGLE PASSWORD INPUT ───────────────────────────────────────────────
function EyeInput({id, placeholder, style={}}) {
  const [show, setShow] = useState(false);
  return (
    <div className="pass-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        style={{letterSpacing: show ? "normal" : "4px", ...style}}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={()=>setShow(s=>!s)}
        tabIndex={-1}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

// ── PHONE INPUT GRID COMPONENT ──────────────────────────────────────────────
function PhoneGrid({id}){
  const [digits, setDigits] = useState(["","","","","","","",""]);
  const refs = Array.from({length:8},()=>useRef());

  const handleChange=(i,v)=>{
    const d=v.replace(/\D/g,"").slice(0,1);
    const next=[...digits]; next[i]=d; setDigits(next);
    // Write combined value to hidden input
    const combined=next.join("");
    const hidden=document.getElementById(id);
    if(hidden) hidden.value=combined;
    if(d && i<7) refs[i+1].current?.focus();
  };

  const handleKey=(i,e)=>{
    if(e.key==="Backspace"&&!digits[i]&&i>0){
      const next=[...digits]; next[i-1]=""; setDigits(next);
      const combined=next.join("");
      const hidden=document.getElementById(id);
      if(hidden) hidden.value=combined;
      refs[i-1].current?.focus();
    }
    if(e.key==="Enter"){
      // trigger the nearest button
      const btn=e.target.closest("form,div")?.querySelector(".btn-gold");
      btn?.click();
    }
  };

  const handlePaste=(e)=>{
    e.preventDefault();
    const pasted=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,8);
    const next=Array.from({length:8},(_,i)=>pasted[i]||"");
    setDigits(next);
    const hidden=document.getElementById(id);
    if(hidden) hidden.value=next.join("");
    const lastFilled=Math.min(pasted.length,7);
    refs[lastFilled].current?.focus();
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:"6px",margin:"4px 0 2px"}}>
      {digits.map((d,i)=>(
        <input key={i} ref={refs[i]}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e=>handleChange(i,e.target.value)}
          onKeyDown={e=>handleKey(i,e)}
          onPaste={handlePaste}
          style={{
            height:"48px",textAlign:"center",fontSize:"20px",fontWeight:700,
            background:d?"rgba(232,192,96,.15)":"var(--white-faint)",
            border:`2px solid ${d?"var(--gold)":"var(--border-white)"}`,
            borderRadius:"10px",color:"var(--white)",outline:"none",
            fontFamily:"'Cinzel',serif",transition:"all .2s",padding:0,width:"100%"
          }}
        />
      ))}
    </div>
  );
}

// ── PHONE INPUT GRID COMPONENT ──────────────────────────────────────────────

// ── USER AUTH SUB-COMPONENT ─────────────────────────────────────────────────
function UserAuth({doRegister,doLogin}){
  const [mode,setMode]=useState("register");
  const [rs,setRs]=useState(""); const [rn,setRn]=useState("");
  const [ls,setLs]=useState(""); const [ln,setLn]=useState("");
  const [latinWarn,setLatinWarn]=useState(false);
  const warnTimer=useState(null);

  const filterCyril=(v,setter)=>{
    if(/[A-Za-zÀ-ɏ]/.test(v)){
      setLatinWarn(true);
      clearTimeout(warnTimer[0]);
      warnTimer[0]=setTimeout(()=>setLatinWarn(false),3000);
    }
    return v.replace(/[^\u0400-\u04FF\s]/gu,"");
  };

  return (
    <>
      <div style={{display:"flex",gap:"6px",marginBottom:"16px"}}>
        <button className={`tab-btn ${mode==="register"?"active":""}`} style={{fontSize:"12px"}} onClick={()=>setMode("register")}>Бүртгүүлэх</button>
        <button className={`tab-btn ${mode==="login"?"active":""}`} style={{fontSize:"12px"}} onClick={()=>setMode("login")}>Нэвтрэх</button>
      </div>

      {latinWarn && (
        <div style={{background:"rgba(192,57,43,.15)",border:"1px solid rgba(192,57,43,.4)",
          borderRadius:"10px",padding:"10px 14px",marginBottom:"10px",
          fontSize:"13px",color:"#ff8a80",display:"flex",gap:"8px",alignItems:"center"}}>
          <span>⚠️</span> Та зөвхөн Монгол кирилл үсгээр бичнэ үү
        </div>
      )}

      {mode==="register" ? <>
        <label>Овог:</label>
        <input type="text" placeholder="Овог" maxLength={40} value={rs}
          onChange={e=>{const v=filterCyril(e.target.value,setRs);setRs(v);}}/>
        <input id="rs" type="hidden" value={rs} readOnly/>
        <label>Нэр:</label>
        <input type="text" placeholder="Нэр" maxLength={40} value={rn}
          onChange={e=>{const v=filterCyril(e.target.value,setRn);setRn(v);}}/>
        <input id="rn" type="hidden" value={rn} readOnly/>
        <label>Гар утасны дугаар:</label>
        <PhoneGrid id="rp"/>
        <input id="rp" type="hidden"/>
        <button className="btn-gold" onClick={doRegister}>Нэвтрэх →</button>
      </> : <>
        <div style={{background:"rgba(232,192,96,.08)",border:"1px solid var(--border-gold)",borderRadius:"10px",padding:"12px 14px",marginBottom:"4px",fontSize:"13px",color:"rgba(255,255,255,.7)",lineHeight:1.6}}>
          📱 Бүртгүүлэхдээ ашигласан <strong style={{color:"var(--gold)"}}>утасны дугаараа</strong> оруулна уу
        </div>
        <label>Гар утасны дугаар:</label>
        <PhoneGrid id="lp"/>
        <input id="lp" type="hidden"/>
        <button className="btn-gold" onClick={doLogin}>Нэвтрэх →</button>
      </>}
    </>
  );
}
