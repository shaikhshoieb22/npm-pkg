var colors = require('colors'),
    AWS = require('aws-sdk'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;
require('dotenv').config()


function SQSLogger(config){
    config = config || {};
    if(!config.QueueUrl){
        var e = new Error('queueURL'.yellow + ' must be defined in the config');
        throw e;
        return e;
    }

    if(!config.awsSecretKey || !config.awsSecretId){
        var e = new Error('awsSecretKey'.yellow + ' and awskSecretId '.yellow+' must be defined in the config');
        throw e;
        return e;
    }
    this.queueURL = config.QueueUrl;
    this.apiVersion = config.apiVersion || 'latest';
    this.region = config.region || 'ap-south-1';
    this.delay = config.delaySeconds || 0;
    this.verbose = config.verbose || false;
    this.awsSecretKey = config.awsSecretKey || false;
    this.awsSecretId = config.awsSecretId || false;
    if(this.awsSecretId && this.awsSecretKey) {
        AWS.config.update({accessKeyId: this.awsSecretId, secretAccessKey: this.awsSecretKey});
    }
    this.SQS = new AWS.SQS({apiVersion: this.apiVersion,region:this.region});
    this.AWS = AWS;

    if(this.verbose) console.log('Creating Logger');
    if(this.verbose) console.log('QueuUrl'.green,this.queueURL);
    if(this.verbose) console.log('region'.green,this.region);
    if(this.verbose) console.log('delaySeconds'.green,this.delay);
    if(this.verbose) console.log('verbose'.green,this.verbose);

    this.gparams = {
        MessageBody: '',
        QueueUrl: this.queueURL,
        DelaySeconds: 0
    };

    //sendMessage function
    //Send a message to the Queue
    //Accepts a message string and a funcion callback
    //message can't be null, undefined or an empty string. But can be zero, and any object with toString
    this.sendMessage = function sendMessage(message,callback){
        if((message == null || message == undefined || message === '') || (message.toString == null || message.toString == undefined)){
            var e = new Error('bad message');
            throw e;
            return e;
        }
        var params = Object.create(this.gparams);
        params.MessageBody = message.toString();
        if(this.verbose) console.info('Sending Message',message);

        this.SQS.sendMessage(params, function SQSSendMessage(err, data) {
            //if there is an error emits it
            if(err) {
                if(this.verbose) console.error('There was an error'.red,err);

                if (callback) return callback(err, null);
                return this.emit('error',err);
            }

            //if the message was sent succesfully emits the sent with the data
            if(this.verbose) console.log('Message succesfully sent'.green);

            if(callback) return callback(null, data);
            this.emit('sent',data);
        }.bind(this));
    }
}
//Inerits forom the EventEmitter
inherits(SQSLogger,EventEmitter);

module.exports = SQSLogger;