const mongoose=require("mongoose");

const transferSchema=new mongoose.Schema({
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required:true
    },
    receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required:true
    },
    amount: {type:Number,required:true},
    status: {type:String, default:'Successful'},
} , {timestamps:true});

module.exports=mongoose.model("Transfer", transferSchema);