const express = require('express');
const { Op } = require('sequelize');
const { Subscription, UtilityBill, SyncspherePayment } = require('../models');
const { requireAuth } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(requireAuth);

// Demo-only payment challenge store. In production use a durable, rate-limited challenge store
// and deliver OTP through a verified SMS/email provider. Never store payment passwords/CVV.
const paymentChallenges = new Map();
const asyncRoute = (fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const clean = (v) => String(v ?? '').trim();
const amount = (v) => Number(v);
router.get('/overview', asyncRoute(async (req,res) => {
 const [subscriptions,bills,payments] = await Promise.all([Subscription.findAll({order:[['nextBillingDate','ASC']]}), UtilityBill.findAll({order:[['dueDate','ASC']]}), SyncspherePayment.findAll({order:[['paidAt','DESC'],['id','DESC'],], limit:8})]);
 const active = subscriptions.filter(s=>s.status==='Active');
 res.json({subscriptions,bills,payments,summary:{monthlySubscriptions:active.reduce((n,s)=>n+Number(s.amount)*(s.billingCycle==='Yearly'?1/12:s.billingCycle==='Weekly'?52/12:1),0),activeSubscriptions:active.length,pendingBills:bills.filter(b=>b.status!=='Paid').length,pendingAmount:bills.filter(b=>b.status!=='Paid').reduce((n,b)=>n+Number(b.amount),0)}});
}));
router.get('/subscriptions', asyncRoute(async(req,res)=>res.json(await Subscription.findAll({order:[['nextBillingDate','ASC']]}))));
router.post('/subscriptions', asyncRoute(async(req,res)=>{const {name,category,amount:amt,billingCycle,nextBillingDate,color}=req.body;if(!clean(name)||!clean(nextBillingDate)||!Number.isFinite(amount(amt))||amount(amt)<=0)return res.status(400).json({error:'Enter a name, valid amount, and next billing date.'});const row=await Subscription.create({name:clean(name),category:clean(category)||'Other',amount:amount(amt),billingCycle:clean(billingCycle)||'Monthly',nextBillingDate,color:clean(color)||'#6c63ff'});res.status(201).json(row)}));
router.patch('/subscriptions/:id', asyncRoute(async(req,res)=>{const row=await Subscription.findByPk(req.params.id);if(!row)return res.status(404).json({error:'Subscription not found.'});const allowed=['name','category','amount','billingCycle','nextBillingDate','status','color'];const data={};for(const k of allowed)if(req.body[k]!==undefined)data[k]=req.body[k];await row.update(data);res.json(row)}));
router.delete('/subscriptions/:id', asyncRoute(async(req,res)=>{const row=await Subscription.findByPk(req.params.id);if(!row)return res.status(404).json({error:'Subscription not found.'});await row.destroy();res.json({ok:true})}));
router.get('/bills', asyncRoute(async(req,res)=>res.json(await UtilityBill.findAll({order:[['dueDate','ASC']]}))));
router.post('/bills', asyncRoute(async(req,res)=>{const {provider,utilityType,accountReference,amount:amt,dueDate}=req.body;if(!clean(provider)||!clean(accountReference)||!clean(dueDate)||!Number.isFinite(amount(amt))||amount(amt)<=0)return res.status(400).json({error:'Enter provider, account reference, valid amount, and due date.'});const row=await UtilityBill.create({provider:clean(provider),utilityType:clean(utilityType)||'Other',accountReference:clean(accountReference),amount:amount(amt),dueDate});res.status(201).json(row)}));
async function recordPayment(type, id) {
 const item = type === 'bill' ? await UtilityBill.findByPk(id) : await Subscription.findByPk(id);
 if (!item) throw Object.assign(new Error(type === 'bill' ? 'Bill not found.' : 'Subscription not found.'), { status: 404 });
 if (type === 'bill' && item.status === 'Paid') throw Object.assign(new Error('This bill has already been paid.'), { status: 400 });
 const reference='SS-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
 const payment=await SyncspherePayment.create({itemType:type === 'bill' ? 'Utility' : 'Subscription',itemName:type === 'bill' ? item.provider : item.name,amount:item.amount,reference});
 if(type==='bill') await item.update({status:'Paid'}); else { const d=new Date(item.nextBillingDate+'T00:00:00'); if(item.billingCycle==='Yearly')d.setFullYear(d.getFullYear()+1);else if(item.billingCycle==='Weekly')d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+1); await item.update({nextBillingDate:d.toISOString().slice(0,10)}); }
 return { payment };
}
router.post('/payment-challenges', asyncRoute(async(req,res)=>{
 const { type, id, method, credential } = req.body || {};
 if(!['bill','subscription'].includes(type) || !id || !['UPI','Debit card','Credit card','Net banking','Wallet'].includes(method) || !String(credential||'').trim()) return res.status(400).json({error:'Choose a payment method and enter the requested payment identifier.'});
 const item = type==='bill' ? await UtilityBill.findByPk(id) : await Subscription.findByPk(id);
 if(!item) return res.status(404).json({error:'Payment item not found.'});
 if(type==='bill' && item.status==='Paid') return res.status(400).json({error:'This bill has already been paid.'});
 // The credential is deliberately not stored. This is a simulated payment flow only.
 const otp=String(Math.floor(100000+Math.random()*900000)); const challengeId=require('crypto').randomUUID();
 paymentChallenges.set(challengeId,{ userId:req.user.id, type, id:Number(id), method, otp, expiresAt:Date.now()+5*60*1000, attempts:0 });
 res.status(201).json({challengeId,method,message:'Demo OTP generated. No real payment is initiated.',devOtp:process.env.NODE_ENV==='production'?undefined:otp,otpExpiresInSeconds:300});
}));
router.post('/payment-challenges/:challengeId/verify', asyncRoute(async(req,res)=>{
 const challenge=paymentChallenges.get(req.params.challengeId);
 if(!challenge || challenge.userId!==req.user.id) return res.status(400).json({error:'Payment verification session not found. Start again.'});
 if(Date.now()>challenge.expiresAt){paymentChallenges.delete(req.params.challengeId);return res.status(400).json({error:'OTP expired. Start the payment again.'});}
 if(String(req.body.otp||'')!==challenge.otp){challenge.attempts++;if(challenge.attempts>=3)paymentChallenges.delete(req.params.challengeId);return res.status(400).json({error:challenge.attempts>=3?'Too many incorrect OTP attempts. Start again.':'Incorrect OTP.'});}
 paymentChallenges.delete(req.params.challengeId);
 const result=await recordPayment(challenge.type,challenge.id);res.status(201).json({...result,method:challenge.method});
}));
// Legacy direct payment endpoints intentionally disabled: all payments must pass method + OTP verification.
router.post('/bills/:id/pay', (req,res)=>res.status(400).json({error:'Choose a payment method and verify OTP to record this payment.'}));
router.post('/subscriptions/:id/pay', (req,res)=>res.status(400).json({error:'Choose a payment method and verify OTP to record this payment.'}));
router.get('/payments', asyncRoute(async(req,res)=>res.json(await SyncspherePayment.findAll({order:[['paidAt','DESC']]}))));
module.exports=router;
