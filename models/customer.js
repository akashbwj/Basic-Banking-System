const mongoose=require("mongoose");

const customerSchema=new mongoose.Schema({
    name: {type:String,required:true},
    gender: {type:String,required:true},
    dob: {type:String,required:true},
    balance: {type:Number,required:true},
    email: {type:String,unique: true,required:true}
});

module.exports=mongoose.model("Customer", customerSchema);