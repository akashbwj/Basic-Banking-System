require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const ejs=require('ejs');
const mongoose=require('mongoose');
const bodyParser=require("body-parser");
const flash=require("connect-flash");
const session=require('express-session');
const MongoDbStore=require('connect-mongo')(session);
const PORT=process.env.PORT||3000;
const dbUrl=process.env.DB_URL;
const Customer=require('./models/customer');
const Transfer=require('./models/transfer');

//Database connection
mongoose.connect(dbUrl,{
    useNewUrlParser:true,
	useUnifiedTopology:true,
	useFindAndModify:false,
	useCreateIndex:true
})
.then(()=>console.log("connected to DB!"))
.catch(error=>console.log(error.message));

const connection=mongoose.connection;



//Session store
let mongoStore=new MongoDbStore({
    mongooseConnection: connection,
    collection: "sessions"
})

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine','ejs');

app.use(session({
    secret: process.env.SECRET,
    resave:false,
    store: mongoStore,
    saveUninitialized:false,
    cookie:{maxAge: 1000*60*60*24} //24 hours in milliseconds
}))

app.use(flash());


app.use(function(req,res,next){
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
})

//Routes
app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/customers',(req,res)=>{
    Customer.find({},(err,allCustomers)=>{
        if(err){
            console.log(err);
        } else{
            return res.render('index',{customers:allCustomers});
        }
    })
})

app.get('/customer/:id',(req,res)=>{
    Customer.findById(req.params.id,(err,foundCustomer)=>{
        if(err){
            console.log(err);
        } else{
            return res.render('show',{customer:foundCustomer});
        }
    })
})

app.get('/customer/:senderid/transfer',(req,res)=>{
    Customer.find({},(err,allCustomers)=>{
        if(err){
            console.log(err);
        } else{
            return res.render('transferShow',{customers:allCustomers,senderid:req.params.senderid});
        }
    })
})

app.get('/customer/:senderid/transfer/:receiverid',async (req,res)=>{
    const sender=await Customer.findById(req.params.senderid);
    const receiver=await Customer.findById(req.params.receiverid);
    return res.render('transferForm',{sender,receiver});
})

app.post('/customer/:senderid/transfer/:receiverid',async (req,res)=>{
    const sender=await Customer.findById(req.params.senderid);
    const receiver=await Customer.findById(req.params.receiverid);
    let amount=req.body.amount;
    if(isNaN(amount)){
        req.flash("error", "The amount should be a number!");
        return res.redirect(`/customer/${req.params.senderid}/transfer/${req.params.receiverid}`)
    } else {
        amount=Number(amount);
        if(amount<=0){
            req.flash("error", "The amount should be greater than zero!");
            return res.redirect(`/customer/${req.params.senderid}/transfer/${req.params.receiverid}`)
        } else if(amount>0 && amount>sender.balance){
            req.flash("error", "The amount is greater than your account balance!");
            return res.redirect(`/customer/${req.params.senderid}/transfer/${req.params.receiverid}`)
        } else if(amount>0 && amount<=sender.balance){
            Transfer.create({
                senderId:req.params.senderid,
                receiverId:req.params.receiverid,
                amount:amount
            },async (err,newTransfer)=>{
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect(`/customer/${req.params.senderid}/transfer/${req.params.receiverid}`);
                  }
                  sender.balance-=amount;
                  await sender.save();
                  receiver.balance+=amount;
                  await receiver.save();
                  req.flash('success', 'Transaction Successful!');
                  return res.redirect('/customers');
            })
        }
    }
})
app.get('/transfers',(req,res)=>{
    // Transfer.find({},(err,allTransfers)=>{
    //     if(err){
    //         req.flash('error', err.message);
    //         return res.redirect('/');
    //     } else{
    //         res.render('transferIndex',{transfers:allTransfers});
    //     }
    // })
    Transfer.find({},
        null,
        {sort:{'createdAt':-1}}).populate("senderId").populate("receiverId").exec((err, allTransfers)=>{
		if(err || !allTransfers){
			req.flash('error','No transfers have been made yet!');
			return res.redirect('/');
		}else {
			res.render('transferIndex',{transfers:allTransfers});
		}
	})
})

app.use((req,res)=>{
    res.status(404).send('<h1>Error 404! Page not found</h1>')
})

app.listen(PORT,()=>console.log(`Server listening on port ${PORT}`));
