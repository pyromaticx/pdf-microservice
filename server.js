var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var fs = require('fs');
var pdf = require('html-pdf');
var uuid = require('uuid');
var path = require('path');
var aws = require('aws-sdk');
var s3 = new aws.S3();
var nodemailer = require('nodemailer');
var port = process.env.PORT || 8080;
var app = express();
var request = require('request');
var serverURL = 'https://uxpass-server.herokuapp.com/';
var transporter = nodemailer.createTransport('smtps://apps%40golivelabs.io:Pass1110@smtp.gmail.com');
var JSONBody = bodyParser.json({ type: 'application/json'});
app.use(cors());
app.use('/public', express.static(__dirname + '../tmp'));
var textBody = bodyParser.text({ type: 'text/html', limit: '1mb'});

app.post('/signup', JSONBody, function(req, res) {

        var mailOptions = {
            from: '"UXPass Invitation" <apps@golivelabs.io>', // sender address
            to: 'kg@golivelabs.io', // list of receivers
            subject: req.body.name + ' is requesting access to UxPass', // Subject line
            text: req.body.name + ' requested access to UxPass. Here is their information: \n' + ' Name: ' + req.body.name + ' \nCompany: ' + req.body.company + ' \nEmail: ' + req.body.email, // plaintext body
            html: req.body.name + ' requested access to UxPass. Here is their information: \n' + ' Name: ' + req.body.name + ' \nCompany: ' + req.body.company + ' \nEmail: ' + req.body.email,
        };

        request.post(serverURL + 'user/invitations').form({
          name: req.body.name,
          email: req.body.email,
          company: req.body.company
        }, function(err, resp, body) {
          if(err) {
            console.error(err);
            return;
          }
          console.info(resp);
          // send mail with defined transport object
          transporter.sendMail(mailOptions, function(error, info){
              if(error){
                  return console.log(error);
              }
              console.log('Message sent: ' + info.response);
              res.sendStatus(200);
          });
        });
});


app.post('/html2pdf', JSONBody, function(req, res) {
    var uid = uuid.v1();
    var pdfOptions = {
        format: 'letter',
        orientation: 'portrait',
        border: '0.5in'
    };

    try {
        pdf.create(req.body.htmlString, pdfOptions).toStream(function(err, stream) {
            if(err) {
                console.log('there was an error:', err);
                return;
            }
            var s3Params = {Bucket: 'uxppdf', Key: req.body.fileName, ACL: 'public-read', Body: stream};
            s3.upload(s3Params, function(err, data) {
              console.log(err, data);
              res.send(data.Location);
            })
        });
    } catch(e) {
        console.error(e);
    }
});

app.listen(port);
